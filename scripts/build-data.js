#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.resolve(
  process.env.MINIPROGRAM_ROOT || path.join(root, '..', 'volunteer-miniprogram', 'miniprogram'),
);
const sourceData = path.join(sourceRoot, 'data');

const mapData = require(path.join(sourceData, 'map-data'));
const mapCoords = require(path.join(sourceData, 'map-coords'));
const mapFulls = require(path.join(sourceData, 'map-fulls'));
const mapEn = require(path.join(sourceData, 'map-en'));

const FLOOR_ORDER = {
  '五楼': 5,
  '四楼': 4,
  '三楼': 3,
  '二楼': 2,
  '一楼': 1,
};

function englishSpace(value) {
  return String(value || '')
    .replace(/周隆泉楼/g, 'Zhou Longquan Building')
    .replace(/周楼/g, 'Zhou Building')
    .replace(/希平楼/g, 'Xiping Building')
    .replace(/金泉楼/g, 'Jinquan Building')
    .replace(/一层/g, '1F')
    .replace(/二层/g, '2F')
    .replace(/三层/g, '3F')
    .replace(/四层/g, '4F')
    .replace(/五层/g, '5F')
    .replace(/多功能厅/g, 'Multipurpose Hall')
    .replace(/咖啡厅/g, 'Cafe')
    .replace(/中庭广场/g, 'Courtyard Plaza')
    .replace(/大厅/g, 'Main Hall')
    .replace(/(Building|Hall|Plaza)(?=[A-Z0-9])/g, '$1 ');
}

function pointOrder(point) {
  const numeric = Number(String(point.no || point.id || '').match(/\d+/)?.[0]);
  return Number.isFinite(numeric) ? numeric : 9999;
}

function buildBuilding(building) {
  const points = [];
  for (const plane of building.planes) {
    for (const spot of plane.spots) {
      const coord = mapCoords[spot.id];
      if (!coord || !Array.isArray(coord.ov)) continue;
      const baseId = String(spot.id).split('/')[0].split('–')[0];
      const full = mapFulls[spot.id] || mapFulls[baseId] || {};
      const en = mapEn.SPOTS[spot.id] || {};
      const categoryIndex = Number.isInteger(spot.catIdx) ? spot.catIdx : -1;
      const items = (spot.items || []).map((item) => {
        const itemEn = mapEn.SPOTS[item.no] || {};
        return {
          no: item.no || '',
          name: { zh: item.name || '', en: itemEn.n || item.name || '' },
          intro: { zh: item.intro || '', en: itemEn.i || item.intro || '' },
        };
      });
      points.push({
        id: spot.id,
        no: spot.no || spot.id,
        category: categoryIndex,
        name: {
          zh: spot.name || spot.id,
          en: en.n || spot.name || spot.id,
        },
        full: {
          zh: full.f || spot.name || spot.id,
          en: en.f || full.f || spot.name || spot.id,
        },
        intro: {
          zh: spot.intro || '',
          en: en.i || spot.intro || '',
        },
        space: {
          zh: full.s || '',
          en: englishSpace(en.s || full.s || ''),
        },
        floor: {
          zh: plane.floor,
          en: building.floors.find((floor) => floor.floor === plane.floor)?.floorEn || plane.floor,
        },
        x: Number(coord.ov[0]),
        y: Number(coord.ov[1]),
        color: coord.c || '#607D94',
        textColor: coord.t || '#FFFFFF',
        items,
      });
    }
  }

  points.sort((left, right) => {
    const floor = (FLOOR_ORDER[right.floor.zh] || 0) - (FLOOR_ORDER[left.floor.zh] || 0);
    return floor || pointOrder(left) - pointOrder(right) || left.id.localeCompare(right.id, 'zh-CN');
  });

  const categories = Array.from(new Set(points.map((point) => point.category)))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right);

  return {
    key: building.key,
    name: { zh: building.name, en: mapEn.BUILDINGS[building.key] || building.en },
    shortName: {
      zh: building.name.replace(/楼$/, ''),
      en: (mapEn.BUILDINGS[building.key] || building.en).replace(/ Building$/, ''),
    },
    image: {
      zh: `assets/map/ov_${building.key}.jpg`,
      en: `assets/map/ov_${building.key}_en.jpg`,
    },
    floors: building.floors.map((floor) => ({
      zh: floor.floor,
      en: floor.floorEn,
    })),
    categories,
    points,
  };
}

const buildings = mapData.BUILDINGS.map(buildBuilding);
const expectedIds = Object.keys(mapCoords);
const emittedIds = new Set(buildings.flatMap((building) => building.points.map((point) => point.id)));
const missing = expectedIds.filter((id) => !emittedIds.has(id));
if (missing.length) {
  throw new Error(`Map data is incomplete. Missing coordinates for: ${missing.join(', ')}`);
}

const output = {
  generatedAt: new Date().toISOString(),
  eventDate: '2026-11-14',
  title: {
    zh: '海洋科学开放日',
    en: 'Marine Science Open Day',
  },
  categories: mapData.CATS.map((zh, index) => ({
    index,
    zh,
    en: mapEn.CATS[index] || zh,
  })),
  buildings,
};

fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.mkdirSync(path.join(root, 'assets', 'map'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'data', 'map.json'),
  JSON.stringify(output, null, 2) + '\n',
  'utf8',
);

for (const building of mapData.BUILDINGS) {
  for (const suffix of ['', '_en']) {
    const file = `ov_${building.key}${suffix}.jpg`;
    fs.copyFileSync(
      path.join(sourceRoot, 'assets', 'map', file),
      path.join(root, 'assets', 'map', file),
    );
  }
}

console.log(JSON.stringify({
  buildings: buildings.length,
  points: buildings.reduce((sum, building) => sum + building.points.length, 0),
  categories: output.categories.length,
  output: path.join(root, 'data', 'map.json'),
}, null, 2));
