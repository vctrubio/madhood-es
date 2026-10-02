"""Build browser SVG paths from Natural Earth boundaries and OSM motorway geometry.
Usage: python3 scripts/build-map.py countries.geojson motorways.json
Inputs are source snapshots; no network requests or application dependencies.
"""
import collections
import gzip
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

def project(lon, lat):
    return [(lon + 10) * 85, (44.8 - lat) * 111]

def simplify(points, tolerance=0.08):
    if len(points) < 3:
        return points
    ax, ay = points[0]
    bx, by = points[-1]
    dx, dy = bx - ax, by - ay
    length = dx * dx + dy * dy
    distance, index = 0, 0
    for i, (x, y) in enumerate(points[1:-1], 1):
        t = max(0, min(1, ((x-ax)*dx + (y-ay)*dy) / length)) if length else 0
        squared = (x-ax-t*dx)**2 + (y-ay-t*dy)**2
        if squared > distance:
            distance, index = squared, i
    if distance <= tolerance * tolerance:
        return [points[0], points[-1]]
    return simplify(points[:index+1], tolerance)[:-1] + simplify(points[index:], tolerance)

def path(points, closed=False):
    points = simplify(points)
    return 'M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in points) + ('Z' if closed else '')

def load_source(filename):
    source = Path(filename)
    content = gzip.decompress(source.read_bytes()).decode() if source.suffix == '.gz' else source.read_text()
    return json.loads(content)

countries_source = load_source(sys.argv[1])
road_source = load_source(sys.argv[2])
if 'remark' in road_source or not road_source.get('elements'):
    raise ValueError('The motorway response is incomplete or empty.')
countries = []
for feature in countries_source['features']:
    properties = feature['properties']
    code = properties['ADM0_A3']
    if code not in ['ESP', 'PRT', 'FRA', 'MAR', 'AND']:
        continue
    geometry = feature['geometry']
    polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
    # Mainland only: exclude overseas territories and islands from this peninsula view.
    candidates = [polygon for polygon in polygons if any(-10 < p[0] < 5 and 33 < p[1] < 46 for p in polygon[0])]
    mainland = max(candidates, key=lambda polygon: len(polygon[0]))
    countries.append({'code': code, 'name': properties['NAME_ES'], 'path': ''.join(path([project(*point[:2]) for point in ring], True) for ring in mainland)})
roads = collections.defaultdict(list)
anchors = {}
for way in road_source['elements']:
    if len(way.get('geometry', [])) < 2:
        continue
    points = [project(point['lon'], point['lat']) for point in way['geometry']]
    ref = way.get('tags', {}).get('ref', 'Sin referencia')
    roads[ref].append('' if way.get('labelOnly') else path(points))
    length = sum(((b[0]-a[0])**2+(b[1]-a[1])**2)**0.5 for a,b in zip(points,points[1:]))
    if ref not in anchors or length > anchors[ref][0]:
        anchors[ref] = (length, points[len(points)//2])
cities = []
for name, lon, lat, major, dx, dy in json.loads((ROOT/'config/cities.json').read_text()):
    x, y = project(lon, lat)
    cities.append({'name': name, 'x': round(x, 2), 'y': round(y, 2), 'major': major, 'dx': dx, 'dy': dy})
output = {'countries': countries, 'highways': [{'ref': ref, 'path': ''.join(paths), 'x': round(anchors[ref][1][0],2), 'y': round(anchors[ref][1][1],2)} for ref, paths in sorted(roads.items())], 'cities': cities, 'sourceDate': road_source.get('osm3s', {}).get('timestamp_osm_base', '')}
(ROOT/'public/data/iberia.json').write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')))
print(f"Built {len(countries)} countries, {len(roads)} road groups, {len(cities)} cities from {len(road_source['elements'])} OSM ways")
