#!/usr/bin/env bash
# Rebuilds public/geo/roads-fr-{1,2,3}.json and public/geo/rivers-fr.json.
#
# Sources:
#   - IGN ROUTE 500 v3.0 (2021, final edition) — Licence Ouverte 2.0, credit "IGN — ROUTE 500 éd. 2021".
#     The VOCATION field is IGN's own 4-tier importance hierarchy; we ship tiers 1-3 and skip
#     'Liaison locale' (400k km of noise at national scale).
#   - Natural Earth 10m rivers + Europe supplement — public domain.
#
# All attributes are stripped (roads) or reduced to a rank field r (rivers) so nothing in the
# payload can spoil a quiz answer. Geometry precision 0.001° ≈ 100 m, fine at national scale.
#
# Requires: 7z (brew install p7zip), node/npx (mapshaper fetched on demand), curl.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

ROUTE500_URL="https://files.opendatarchives.fr/professionnels.ign.fr/route500/ROUTE500_3-0__SHP_LAMB93_FXX_2021-11-03.7z"
NE_WORLD_URL="https://naciscdn.org/naturalearth/10m/physical/ne_10m_rivers_lake_centerlines.zip"
NE_EUROPE_URL="https://naciscdn.org/naturalearth/10m/physical/ne_10m_rivers_europe.zip"

echo "== ROUTE 500 (175 MB download) =="
curl -sL -o "$WORK/route500.7z" "$ROUTE500_URL"
7z x -o"$WORK/route500" "$WORK/route500.7z" -y > /dev/null
SHP="$(find "$WORK/route500" -name 'TRONCON_ROUTE.shp')"

mkdir -p "$ROOT/public/geo"

npx -y mapshaper -i "$SHP" -filter 'VOCATION=="Type autoroutier"' -proj wgs84 \
  -simplify 15% keep-shapes -clean -filter-fields -dissolve \
  -o "$ROOT/public/geo/roads-fr-1.json" format=geojson precision=0.001

npx -y mapshaper -i "$SHP" -filter '/principale/.test(VOCATION)' -proj wgs84 \
  -simplify 10% keep-shapes -clean -filter-fields -dissolve \
  -o "$ROOT/public/geo/roads-fr-2.json" format=geojson precision=0.001

npx -y mapshaper -i "$SHP" -filter '/gionale/.test(VOCATION)' -proj wgs84 \
  -simplify 4% keep-shapes -clean -filter-fields -dissolve \
  -o "$ROOT/public/geo/roads-fr-3.json" format=geojson precision=0.001

echo "== Natural Earth rivers =="
curl -sL -o "$WORK/ne_world.zip" "$NE_WORLD_URL"
curl -sL -o "$WORK/ne_europe.zip" "$NE_EUROPE_URL"
unzip -oq "$WORK/ne_world.zip" -d "$WORK/rivers_world"
unzip -oq "$WORK/ne_europe.zip" -d "$WORK/rivers_europe"

npx -y mapshaper \
  -i "$WORK/rivers_world/ne_10m_rivers_lake_centerlines.shp" name=w -each 'r=1' \
  -i "$WORK/rivers_europe/ne_10m_rivers_europe.shp" name=e -each 'r=2' \
  -merge-layers target=w,e force \
  -clip bbox=-5.5,41.2,9.9,51.3 \
  -simplify 40% keep-shapes -filter-fields r -dissolve r \
  -o "$ROOT/public/geo/rivers-fr.json" format=geojson precision=0.001

ls -lh "$ROOT/public/geo/"
