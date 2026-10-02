"""Extract natural features from the same pinned OpenFreeMap tiles as the roads.
Run import-roads.py first. Import-only dependencies: mapbox-vector-tile, shapely.
"""
import collections
import gzip
import json
import math
from pathlib import Path
import mapbox_vector_tile
from shapely.geometry import shape, mapping, Point
from shapely.ops import transform, unary_union

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path('/private/tmp/madhood-tile-cache')
source_dir = ROOT/'components/map/sources'
countries = json.loads(gzip.decompress((source_dir/'countries.geojson.gz').read_bytes()))
spain_feature = next(f for f in countries['features'] if f['properties']['ADM0_A3']=='ESP')
spain_parts = shape(spain_feature['geometry'])
mainland = next(p for p in spain_parts.geoms if p.contains(Point(-3.7,40.4)))
park_parts = collections.defaultdict(list)
water_parts = []
water_names = collections.defaultdict(list)
desert_parts = []
national_keys = {
 'picos de europa':'Picos de Europa', 'ordesa':'Ordesa y Monte Perdido',
 'aigüestortes':'Aigüestortes', 'cabañeros':'Cabañeros', 'tablas de daimiel':'Tablas de Daimiel',
 'doñana':'Doñana', 'monfragüe':'Monfragüe', 'sierra nevada':'Sierra Nevada',
 'guadarrama':'Sierra de Guadarrama', 'sierra de las nieves':'Sierra de las Nieves',
}

def unproject(z,x,y,extent):
    def convert(px,py,pz=None):
        return (x+px/extent)/(2**z)*360-180, math.degrees(math.atan(math.sinh(math.pi*(1-2*(y+py/extent)/(2**z)))))
    return convert

for filename in sorted(CACHE.glob('9-*.pbf')):
    z,x,y=map(int,filename.stem.split('-'))
    decoded=mapbox_vector_tile.decode(filename.read_bytes(),default_options={'y_coord_down':True})
    for layer_name in ['park','water','water_name']:
        layer=decoded.get(layer_name,{})
        for feature in layer.get('features',[]):
            properties=feature['properties']
            name=properties.get('name:es',properties.get('name',''))
            lowered=name.lower()
            kind=properties.get('class')
            is_national=layer_name=='park' and 'nacional' in lowered and any(key in lowered for key in national_keys)
            is_natural=layer_name=='park' and any(term in lowered for term in ['parque natural','parc natural','parque regional','parc regional'])
            is_desert=layer_name=='park' and 'paraje natural' in lowered and 'tabernas' in lowered
            is_water=layer_name=='water' and kind in ['lake','river','pond']
            is_water_name=layer_name=='water_name' and kind=='lake' and name
            if not (is_national or is_natural or is_desert or is_water or is_water_name):continue
            geometry=transform(unproject(z,x,y,layer.get('extent',4096)),shape(feature['geometry']))
            if not geometry.is_valid: geometry=geometry.buffer(0)
            geometry=geometry.intersection(mainland)
            if geometry.is_empty:continue
            if not is_water_name and geometry.area == 0:continue
            if is_water_name:
                water_names[name].append(geometry)
            elif is_water:water_parts.append(geometry)
            elif is_desert:desert_parts.append(geometry)
            else:
                if is_national:
                    short_name=next(label for key,label in national_keys.items() if key in lowered)
                    park_parts[('national',short_name)].append(geometry)
                else:
                    park_kind = 'regional' if 'regional' in lowered else 'natural'
                    park_parts[(park_kind,name)].append(geometry)

def projected_path(geometry):
    if geometry.is_empty:return ''
    if geometry.geom_type=='Polygon':
        rings=[geometry.exterior,*geometry.interiors]
        return ''.join('M'+'L'.join(f'{(lon+10)*85:.2f},{(44.8-lat)*111:.2f}' for lon,lat in ring.coords)+'Z' for ring in rings)
    if hasattr(geometry,'geoms'):return ''.join(projected_path(part) for part in geometry.geoms)
    return ''

features=[]
parks=[]
for (kind,name),parts in sorted(park_parts.items()):
    merged=unary_union(parts).simplify(.001,preserve_topology=True)
    marker=merged.representative_point()
    parks.append({'name':name,'kind':kind,'path':projected_path(merged),'x':round((marker.x+10)*85,2),'y':round((44.8-marker.y)*111,2)})
    features.append({'type':'Feature','properties':{'name':name,'kind':kind},'geometry':mapping(merged)})
water=unary_union(water_parts).simplify(.0004,preserve_topology=True)
desert=unary_union(desert_parts).simplify(.0004,preserve_topology=True)
labels=[]
for name,parts in water_names.items():
    geometry=unary_union(parts)
    anchor=geometry.representative_point()
    labels.append({'name':name,'x':round((anchor.x+10)*85,2),'y':round((44.8-anchor.y)*111,2)})
landscapes=[]
for item in json.loads((ROOT/'config/landscapes.json').read_text()):
    landscapes.append({**item,'x':round((item['longitude']+10)*85,2),'y':round((44.8-item['latitude'])*111,2)})
output={'parks':parks,'waterPath':projected_path(water),'desertPath':projected_path(desert),'waterLabels':labels,'landscapes':landscapes}
(ROOT/'public/data/nature.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')))
features.extend([{'type':'Feature','properties':{'kind':'water'},'geometry':mapping(water)},{'type':'Feature','properties':{'kind':'desert','name':'Paraje Natural del Desierto de Tabernas'},'geometry':mapping(desert)}])
(source_dir/'nature.geojson.gz').write_bytes(gzip.compress(json.dumps({'type':'FeatureCollection','features':features},separators=(',',':')).encode(),mtime=0))
(source_dir/'nature-provenance.json').write_text(json.dumps({'tileRelease':'20260927_080001_pt','layers':['park','water','water_name'],'zoom':9,'nationalParkReference':'https://www.miteco.gob.es/es/parques-nacionales-oapn/red-parques-nacionales/parques-nacionales-vistazo.html','limitations':'Generalized OSM park and water polygons. Mainland Spain only. Lake classification includes reservoirs; no current water-level claim. Landscape symbols and labels are illustrative anchors, not boundaries. Regional parks are included alongside natural parks; national parks retain separate styling.','landscapeSources':'config/landscapes.json'},indent=2))
print('National parks:',[p['name'] for p in parks if p['kind']=='national'])
print(f'{len(parks)} parks, {len(water_parts)} water fragments, {len(labels)} water labels, {len(landscapes)} landscapes')
