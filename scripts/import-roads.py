"""Explicit snapshot refresh. Requires mapbox-vector-tile for importing only.
Reads OSM/OpenMapTiles roads from a pinned OpenFreeMap tile release.
"""
import concurrent.futures
import gzip
import json
import math
from pathlib import Path
import re
import time
import subprocess
import mapbox_vector_tile

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = '20260927_080001_pt'
TEMPLATE = f'https://tiles.openfreemap.org/planet/{SNAPSHOT}/{{z}}/{{x}}/{{y}}.pbf'
CACHE = Path('/private/tmp/madhood-tile-cache')
CACHE.mkdir(exist_ok=True)

def tile(lon, lat, zoom):
    n = 2 ** zoom
    return int((lon + 180) / 360 * n), int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)

west, south = tile(-9.6, 35.8, 9)
east, north = tile(3.4, 43.9, 9)
tiles = {(9, x, y) for x in range(west,east+1) for y in range(north,south+1)}
for city in json.loads((ROOT/'config/cities.json').read_text()):
    x, y = tile(city[1], city[2], 12)
    tiles.update((12,x+dx,y+dy) for dx in [-1,0,1] for dy in [-1,0,1])

def fetch(coordinates):
    z,x,y = coordinates
    filename = CACHE / f'{z}-{x}-{y}.pbf'
    if not filename.exists():
        for attempt in range(3):
            try:
                payload = subprocess.run(['curl','-sS','--fail','--max-time','30',TEMPLATE.format(z=z,x=x,y=y)],check=True,capture_output=True).stdout
                filename.write_bytes(payload)
                break
            except Exception:
                if attempt == 2: raise
                time.sleep(1)
    decoded = mapbox_vector_tile.decode(filename.read_bytes(),default_options={'y_coord_down':True})
    ways = []
    for layer_name in ['transportation','transportation_name']:
        layer = decoded.get(layer_name, {})
        extent = layer.get('extent',4096)
        for index,feature in enumerate(layer.get('features',[])):
            properties = feature['properties']
            road_class = properties.get('class')
            is_major = road_class in ['motorway','trunk']
            ref = properties.get('ref','')
            name = properties.get('name','')
            is_ring = road_class in ['primary','secondary','tertiary'] and (re.search(r'circunval|circumval|\bronda\b',name,re.I) or ref in ['VA-20','VA-30','Z-30','Z-40','M-30','M-40','M-50'])
            if not is_major and not (z == 12 and layer_name == 'transportation_name' and is_ring): continue
            if properties.get('ramp') == 1: continue
            if z == 12 and is_major: continue
            geometry = feature['geometry']
            if geometry['type'] not in ['LineString','MultiLineString']: continue
            lines = [geometry['coordinates']] if geometry['type']=='LineString' else geometry['coordinates']
            for line_index,line in enumerate(lines):
                points=[]
                for px,py in line:
                    lon=(x+px/extent)/(2**z)*360-180
                    lat=math.degrees(math.atan(math.sinh(math.pi*(1-2*(y+py/extent)/(2**z)))))
                    points.append({'lon':round(lon,6),'lat':round(lat,6)})
                ways.append({'id':f'{z}-{x}-{y}-{layer_name}-{index}-{line_index}', 'tags':{'ref':ref or (name if is_ring else 'Red principal'),'highway':road_class},'geometry':points,'labelOnly':layer_name=='transportation_name' and is_major})
    return ways

ways=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
    for index,result in enumerate(executor.map(fetch,sorted(tiles))):
        ways.extend(result)
        if index % 100 == 0: print(f'{index+1}/{len(tiles)} tiles',flush=True)
motorway_source = ROOT/'map/sources/osm-motorways.json.gz'
if motorway_source.exists():
    motorway_snapshot = json.loads(gzip.decompress(motorway_source.read_bytes()))
    ways = [way for way in ways if way['tags']['highway'] != 'motorway'] + motorway_snapshot['elements']
else:
    motorway_snapshot = None
output={'source':'OpenStreetMap via OpenFreeMap / OpenMapTiles','snapshot':SNAPSHOT,'elements':ways,'osm3s':{'timestamp_osm_base':'2026-09-27 tile release; individual feature update dates unavailable'}}
if motorway_snapshot:
    output['osm3s'] = motorway_snapshot['osm3s']
source_dir=ROOT/'map/sources';source_dir.mkdir(exist_ok=True)
(source_dir/'motorways.json.gz').write_bytes(gzip.compress(json.dumps(output,separators=(',',':')).encode(),mtime=0))
(source_dir/'provenance.json').write_text(json.dumps({'retrieved':time.strftime('%Y-%m-%d'),'tileRelease':SNAPSHOT,'tiles':TEMPLATE,'tileCount':len(tiles),'overviewZoom':9,'urbanDetailZoom':12,'coverage':[-9.6,35.8,3.4,43.9],'urbanDetail':'3 by 3 tiles around each configured city','sources':['https://www.openstreetmap.org/copyright','https://openfreemap.org/','https://openmaptiles.org/'],'licence':'OSM ODbL; OpenMapTiles attribution','classification':'Motorway and trunk overview, plus named primary/secondary/tertiary urban rondas and circunvalaciones. Ramps and construction excluded. Generalized snapshot, not an exhaustive official ring-road inventory.'},indent=2))
print(f'Saved {len(ways)} road geometries')
