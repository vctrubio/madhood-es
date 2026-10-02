"""Build the Madrid map from the original geometry and checked-in additions."""
import gzip
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / 'components/map/sources'


def read_json(path):
    return json.loads(path.read_text())


def project(coordinates):
    longitude, latitude = coordinates
    return [round((longitude + 3.745) * 14000 * math.cos(math.radians(40.43)), 2),
            round((40.49 - latitude) * 14000, 2)]


def line_path(points):
    return 'M' + 'L'.join(f'{x},{y}' for x, y in points)


def bounds_for(points, padding=0):
    west, north = min(p[0] for p in points), min(p[1] for p in points)
    east, south = max(p[0] for p in points), max(p[1] for p in points)
    return [west - padding, north - padding, east - west + padding * 2, south - north + padding * 2]


def polygon_geometry(feature):
    geometry = feature['geometry']
    polygons = [geometry['coordinates']] if geometry['type'] == 'Polygon' else geometry['coordinates']
    rings = [[project(point[:2]) for point in ring] for polygon in polygons for ring in polygon]
    return ''.join(line_path(ring) + 'Z' for ring in rings), bounds_for([point for ring in rings for point in ring])


def road_segments(snapshot, reference):
    segments = []
    for way in snapshot['elements']:
        references = [ref.strip() for ref in way.get('tags', {}).get('ref', '').split(';')]
        if reference not in references:
            continue
        segment = []
        for point in way.get('geometry', []):
            inside = reference != 'A-4' or (-3.74 <= point['lon'] <= -3.62 and 40.33 <= point['lat'] <= 40.42)
            if inside:
                segment.append(project([point['lon'], point['lat']]))
            else:
                if len(segment) > 1:
                    segments.append(segment)
                segment = []
        if len(segment) > 1:
            segments.append(segment)
    if not segments:
        raise ValueError(f'No geometry found for {reference}')
    return segments


def add_roads(geography, snapshot):
    counts = {}
    for reference in ['M-40', 'A-4']:
        segments = road_segments(snapshot, reference)
        points = [point for segment in segments for point in segment]
        if reference == 'M-40':
            west, north, width, height = bounds_for(points)
            label = min(points, key=lambda p: abs(p[1] - (north + height / 2)) + abs(p[0] - west - width))
            geography['ringBounds'] = bounds_for(points, 120)
        else:
            target = project([-3.69, 40.385])
            label = min(points, key=lambda p: math.dist(p, target))
        geography['highways'].append({'name': reference, 'path': ''.join(line_path(segment) for segment in segments), 'label': label})
        counts[reference] = len(segments)
    return counts


def add_areas(geography, features):
    for area in read_json(ROOT / 'config/madrid-areas.json'):
        label = project(area['coordinates'])
        path, bounds = '', [label[0] - 180, label[1] - 180, 360, 360]
        if area['kind'] == 'area':
            path, bounds = polygon_geometry(features[area['geometryId']])
        geography['hoods'].append({'code': area['id'], 'name': area['name'], 'district': area['district'],
                                   'kind': area['kind'], 'territory': 'outer', 'path': path, 'bounds': bounds,
                                   'label': label, 'description': area['description'], 'source': area['source']})


def add_parks(geography, features):
    for park in read_json(ROOT / 'config/madrid-parks.json'):
        path, bounds = polygon_geometry(features[park['geometryId']])
        geography['landmarks'].append({**park, 'kind': 'park', 'path': path, 'bounds': bounds, 'point': project(park['coordinates'])})


def point_features(filename):
    return [{**entry, 'point': project(entry['coordinates'])} for entry in read_json(ROOT / 'config' / filename)]


def construction_projects(snapshot):
    configuration = read_json(ROOT / 'config/madrid-construction.json')
    features = {feature['properties']['id']: feature for feature in read_json(SOURCES / 'madrid/construction.geojson')['features']}
    projects = []
    for project_config in configuration['projects']:
        if project_config['kind'] == 'area':
            path, bounds = polygon_geometry(features[project_config['geometryId']])
        else:
            west, south, east, north = project_config['clip']
            segments = []
            for way in snapshot['elements']:
                references = way.get('tags', {}).get('ref', '').split(';')
                if project_config['roadReference'] not in [ref.strip() for ref in references]:
                    continue
                segment = []
                for coordinate in way.get('geometry', []):
                    inside = west <= coordinate['lon'] <= east and south <= coordinate['lat'] <= north
                    if inside:
                        segment.append(project([coordinate['lon'], coordinate['lat']]))
                    else:
                        if len(segment) > 1:
                            segments.append(segment)
                        segment = []
                if len(segment) > 1:
                    segments.append(segment)
            if not segments:
                raise ValueError(f"No construction corridor found: {project_config['id']}")
            path = ''.join(line_path(segment) for segment in segments)
            bounds = bounds_for([point for segment in segments for point in segment], project_config['width'] / 2)
        projects.append({**project_config, 'path': path, 'bounds': bounds, 'point': project(project_config['coordinates'])})
    return projects


def validate_registry(geography):
    registry = read_json(ROOT / 'config/hoods.json')
    slugs = [entry['slug'] for entry in registry]
    if len(slugs) != len(set(slugs)):
        raise ValueError('Duplicate hood slugs')
    stored = {hood['code'] for hood in geography['hoods']}
    for hood in registry:
        if hood['activo'] and hood['slug'] not in stored:
            raise ValueError(f"Missing geometry: {hood['slug']}")
    return sum(hood['activo'] for hood in registry)


def expand_world(geography):
    rectangles = [geography['worldBounds'], geography['ringBounds']] + [hood['bounds'] for hood in geography['hoods']]
    rectangles += [project['bounds'] for project in geography['construction']]
    corners = []
    for x, y, width, height in rectangles:
        corners.extend([[x, y], [x + width, y + height]])
    corners.append(project([-3.69, 40.33]))
    geography['worldBounds'] = bounds_for(corners, 120)


def main():
    geography = read_json(SOURCES / 'madrid/base.json')
    snapshot = json.loads(gzip.decompress((SOURCES / 'osm-motorways.json.gz').read_bytes()))
    features = {feature['properties']['id']: feature for feature in read_json(SOURCES / 'madrid/additions.geojson')['features']}
    counts = add_roads(geography, snapshot)
    add_areas(geography, features)
    add_parks(geography, features)
    geography['stations'] = point_features('madrid-stations.json')
    geography['monuments'] = point_features('madrid-monuments.json')
    geography['construction'] = construction_projects(snapshot)
    geography.pop('directionSigns', None)
    expand_world(geography)
    active_count = validate_registry(geography)
    (ROOT / 'public/data/madrid.json').write_text(json.dumps(geography, ensure_ascii=False, separators=(',', ':')))
    provenance = {
        'original': 'Original Madhood map/data/madrid.json; source commit 85093681b868a2e6bae1e8275a8180dfdb03fa5c',
        'projection': {'west': -3.745, 'north': 40.49, 'scale': 14000, 'latitudeCorrection': 40.43},
        'roads': {'source': 'OpenStreetMap / saved Overpass motorway snapshot', 'osmBaseTimestamp': snapshot['osm3s']['timestamp_osm_base'], 'segments': counts},
        'additions': {'retrieved': '2026-10-02', 'sources': 'OSM API and Nominatim snapshots in this directory; source URLs in config/madrid-*.json', 'geometry': 'additions.geojson'},
        'construction': {'reviewedAt': '2026-10-02', 'configuration': 'config/madrid-construction.json', 'geometry': 'construction.geojson and clipped OSM A-5 corridor', 'accuracy': 'Schematic project extents, not official construction or cadastral boundaries; phases differ.'},
        'scope': 'Registry controls active coverage. Soto is an OSM residential outline. Pozuelo and La Moraleja are location markers. Retiro is a park, not its district. No rail routes have been added.'
    }
    (SOURCES / 'madrid/provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
    print(f"Madrid: {active_count} active areas; road segments {counts}; {len(geography['stations'])} stations; {len(geography['monuments'])} monuments")


if __name__ == '__main__':
    main()
