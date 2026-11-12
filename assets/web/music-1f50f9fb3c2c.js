const BOXES = [
  {
    "id": "music-01",
    "index": 1,
    "titleZh": "中西合鸣·海之声",
    "titleEn": "East Meets West: Voices of the Sea",
    "teamZh": "",
    "teamEn": "",
    "clueZh": "中西乐器与人声的碰撞；从奇幻深海、平湖月色，到鲸的温柔低吟。",
    "clueEn": "East meets West in a dialogue of instruments and voices, from a wondrous deep sea and moonlit waters to the gentle song of whales.",
    "venueZh": "周隆泉楼二楼（与科学家讲座同室）",
    "venueEn": "2F, Zhou Longquan Building (same room as the scientist talks)",
    "buildingZh": "周隆泉楼",
    "buildingEn": "Zhou Longquan Building",
    "timeZh": "11:00–11:25",
    "timeEn": "11:00–11:25",
    "start": "2026-11-14T11:00:00+08:00",
    "end": "2026-11-14T11:25:00+08:00",
    "bKey": "zlq",
    "marker": {
      "x": 49.8,
      "y": 58.8
    },
    "accent": "#3F8491"
  },
  {
    "id": "music-02",
    "index": 2,
    "titleZh": "厦门吉岛少儿合唱团",
    "titleEn": "Xiamen Jidao Children’s Choir",
    "teamZh": "厦门吉岛少儿合唱团",
    "teamEn": "Xiamen Jidao Children’s Choir",
    "clueZh": "歌声穿越海浪，是大海最深情的告白。",
    "clueEn": "Voices travel across the waves in the ocean’s most heartfelt confession.",
    "venueZh": "金泉楼大厅",
    "venueEn": "Main Hall, Jinquan Building",
    "buildingZh": "金泉楼",
    "buildingEn": "Jinquan Building",
    "timeZh": "14:30–14:50",
    "timeEn": "14:30–14:50",
    "start": "2026-11-14T14:30:00+08:00",
    "end": "2026-11-14T14:50:00+08:00",
    "bKey": "jq",
    "marker": {
      "x": 49,
      "y": 82
    },
    "accent": "#D56C5A"
  },
  {
    "id": "music-03",
    "index": 3,
    "titleZh": "厦门音乐学校交响乐团",
    "titleEn": "Xiamen Music School Symphony Orchestra",
    "teamZh": "厦门音乐学校交响乐团",
    "teamEn": "Xiamen Music School Symphony Orchestra",
    "clueZh": "热血史诗；破浪与激昂；勇敢者的冒险。",
    "clueEn": "A sweeping, fiery adventure of breaking waves, courage, and heroism.",
    "venueZh": "周隆泉楼中庭广场",
    "venueEn": "Courtyard Plaza, Zhou Longquan Building",
    "buildingZh": "周隆泉楼",
    "buildingEn": "Zhou Longquan Building",
    "timeZh": "15:45–16:00",
    "timeEn": "15:45–16:00",
    "start": "2026-11-14T15:45:00+08:00",
    "end": "2026-11-14T16:00:00+08:00",
    "bKey": "zlq",
    "marker": {
      "x": 50,
      "y": 94
    },
    "accent": "#D09A36"
  }
];
const SOON_LEAD_MS = 30 * 60 * 1000;
const ACTIVE_LEAD_MS = 5 * 60 * 1000;

const STATUS = {
  sealed: { zh: '未掉落', en: 'Hidden' },
  soon: { zh: '即将掉落', en: 'Dropping soon' },
  active: { zh: '正在掉落', en: 'Now appearing' },
  opened: { zh: '已开启', en: 'Opened' },
  ended: { zh: '已揭晓', en: 'Revealed' },
};

const PHASE_RANK = {
  sealed: 0,
  soon: 1,
  active: 2,
  opened: 3,
  ended: 4,
};

function boxTimes(box) {
  const start = new Date(box.start).getTime();
  const end = new Date(box.end).getTime();
  return {
    start,
    end,
    soonAt: start - SOON_LEAD_MS,
    activeAt: start - ACTIVE_LEAD_MS,
  };
}

function countdownText(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

function buildBoxViews(nowMs, openedIds, en) {
  const opened = new Set((openedIds || []).map(String));
  return BOXES.map((box) => {
    const times = boxTimes(box);
    let phase = 'sealed';
    if (nowMs >= times.end) phase = 'ended';
    else if (nowMs >= times.activeAt) phase = opened.has(box.id) ? 'opened' : 'active';
    else if (nowMs >= times.soonAt) phase = 'soon';
    const revealed = phase === 'opened' || phase === 'ended';
    const status = STATUS[phase];
    const countdownMs = phase === 'soon' ? times.activeAt - nowMs
      : phase === 'sealed' ? times.soonAt - nowMs
        : phase === 'active' ? times.end - nowMs : 0;
    const phaseLabel = en ? status.en : status.zh;
    return {
      ...box,
      title: en ? box.titleEn : box.titleZh,
      team: en ? box.teamEn : box.teamZh,
      clue: en ? box.clueEn : box.clueZh,
      venue: en ? box.venueEn : box.venueZh,
      building: en ? box.buildingEn : box.buildingZh,
      timeText: en ? box.timeEn : box.timeZh,
      phase,
      phaseClass: 'phase-' + phase,
      phaseRank: PHASE_RANK[phase],
      phaseLabel,
      statusLabel: phaseLabel,
      revealed,
      canOpen: phase === 'active',
      canLocate: phase === 'soon' || phase === 'active' || revealed,
      showMapWave: phase === 'soon' || phase === 'active',
      showMapMarker: phase === 'active',
      mapMarkerText: phase === 'active' ? '♪' : '',
      mapAriaLabel: en ? phaseLabel + ': ' + box.titleEn : phaseLabel + '：' + box.titleZh,
      cardTitle: revealed ? (en ? box.titleEn : box.titleZh)
        : (en ? 'Mystery Music Box' : '神秘音乐盲盒'),
      displayPlace: phase === 'sealed'
        ? (en ? box.timeEn : box.timeZh)
        : phase === 'soon'
          ? (en ? box.buildingEn : box.buildingZh)
          : revealed
            ? (en ? box.venueEn : box.venueZh)
            : (en ? 'Follow the music · ' + box.buildingEn : '循声寻找 · ' + box.buildingZh),
      countdownText: phase === 'soon' || phase === 'sealed' || phase === 'active'
        ? countdownText(countdownMs) : '',
      countdownLabel: phase === 'active'
        ? (en ? 'Ends in' : '距结束')
        : (en ? 'Drops in' : '距掉落'),
    };
  });
}

export { buildBoxViews };
