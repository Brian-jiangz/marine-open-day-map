import { buildBoxViews } from './music-1f50f9fb3c2c.js';

const I18N = {
  zh: {
    htmlLang: 'zh-CN',
    pageTitle: '2026 海洋科学开放日 · 场馆地图',
    siteTitle: '海洋科学开放日',
    siteSubtitle: '场馆地图与参观指引',
    careShort: '关怀版',
    safety: '安全保障 · 安保值班室',
    music: '音乐盲盒',
    openMusic: '开启盲盒',
    safetyNote: '请遵循现场工作人员与志愿者指引，注意脚下安全。',
    standardShort: '标准版',
    points: '点位目录',
    mapHint: '点击地图空白处放大查看',
    directory: '篇章大类',
    showAll: '显示全部',
    pointUnit: '个点位',
    noResults: '没有找到匹配点位',
    listEmpty: '当前分类暂无点位',
    locate: '在地图上定位',
    org: '海洋科普开放日组委会',
    credits: '开发：姜正 · 柴扉教授课题组',
    qrCode: '二维码',
    loadFailed: '地图数据加载失败，请刷新重试',
    language: 'Switch to English',
    careOn: '开启关怀版',
    careOff: '关闭关怀版',
    fullscreen: '全屏查看地图',
    exitFullscreen: '退出全屏',
  },
  en: {
    htmlLang: 'en',
    pageTitle: '2026 Marine Science Open Day · Venue Map',
    siteTitle: 'Marine Science Open Day',
    siteSubtitle: 'Venue map and visitor guide',
    careShort: 'Large text',
    safety: 'Safety & Security · Security Duty Room',
    music: 'Mystery Music Boxes',
    openMusic: 'Open music box',
    safetyNote: 'Follow staff guidance and watch your step.',
    standardShort: 'Standard',
    points: 'Points',
    mapHint: 'Tap a blank area of the map to zoom',
    directory: 'Explore by theme',
    showAll: 'Show all',
    pointUnit: 'locations',
    noResults: 'No matching locations',
    listEmpty: 'No locations in this theme',
    locate: 'Locate on map',
    org: 'Marine Science Open Day Committee',
    credits: 'Developed by Jiang Zheng · Prof. Chai Fei Research Group',
    qrCode: 'QR code',
    loadFailed: 'Unable to load the map data. Please refresh and try again.',
    language: '切换至中文',
    careOn: 'Turn on accessibility mode',
    careOff: 'Turn off accessibility mode',
    fullscreen: 'View map fullscreen',
    exitFullscreen: 'Exit fullscreen',
  },
};

const state = {
  data: null,
  locale: 'zh',
  care: false,
  buildingKey: '',
  category: -1,
  searchDismissed: false,
  searchResults: [],
  activePoint: null,
  pendingFocusId: '',
  pendingOpen: false,
  fullscreen: false,
  openedMusic: [],
  musicId: '',
  musicSignature: '',
};

const mapState = {
  naturalWidth: 0,
  naturalHeight: 0,
  baseWidth: 0,
  baseHeight: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
  pointers: new Map(),
  dragStartX: 0,
  dragStartY: 0,
  dragPanX: 0,
  dragPanY: 0,
  pinchDistance: 0,
  pinchZoom: 1,
  dragged: false,
};

const elements = {
  html: document.documentElement,
  body: document.body,
  languageButton: document.getElementById('languageButton'),
  careButton: document.getElementById('careButton'),
  searchWrap: document.querySelector('.search-wrap'),
  searchInput: document.getElementById('searchInput'),
  clearSearch: document.getElementById('clearSearch'),
  searchResults: document.getElementById('searchResults'),
  buildingTabs: document.getElementById('buildingTabs'),
  buildingKicker: document.getElementById('buildingKicker'),
  buildingTitle: document.getElementById('buildingTitle'),
  pointCount: document.getElementById('pointCount'),
  mapViewport: document.getElementById('mapViewport'),
  mapStage: document.getElementById('mapStage'),
  mapImage: document.getElementById('mapImage'),
  mapHotspots: document.getElementById('mapHotspots'),
  mapStatus: document.getElementById('mapStatus'),
  pointsToggle: document.getElementById('pointsToggle'),
  zoomIn: document.getElementById('zoomIn'),
  zoomOut: document.getElementById('zoomOut'),
  zoomReset: document.getElementById('zoomReset'),
  fullscreenButton: document.getElementById('fullscreenButton'),
  drawerBackdrop: document.getElementById('drawerBackdrop'),
  directoryPane: document.getElementById('directoryPane'),
  drawerClose: document.getElementById('drawerClose'),
  directoryTitle: document.getElementById('directoryTitle'),
  directoryCount: document.getElementById('directoryCount'),
  categoryChips: document.getElementById('categoryChips'),
  clearFilter: document.getElementById('clearFilter'),
  pointList: document.getElementById('pointList'),
  spotDialog: document.getElementById('spotDialog'),
  dialogClose: document.getElementById('dialogClose'),
  spotBadge: document.getElementById('spotBadge'),
  spotMeta: document.getElementById('spotMeta'),
  spotTitle: document.getElementById('spotTitle'),
  spotFull: document.getElementById('spotFull'),
  spotAddress: document.getElementById('spotAddress'),
  spotIntro: document.getElementById('spotIntro'),
  spotItems: document.getElementById('spotItems'),
  focusButton: document.getElementById('focusButton'),
  toast: document.getElementById('toast'),
};

function t(key) {
  return I18N[state.locale][key] || key;
}

function currentBuilding() {
  return state.data.buildings.find((building) => building.key === state.buildingKey)
    || state.data.buildings[0];
}

function currentCategory(index) {
  return state.data.categories.find((category) => category.index === Number(index));
}

function categoryColor(categoryIndex, building = currentBuilding()) {
  return building.points.find((point) => point.category === categoryIndex)?.color || '#607D94';
}

function pointNumber(point) {
  const match = String(point.no || point.id || '').match(/\d+/);
  return match ? Number(match[0]) : 9999;
}

function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase()
    .replace(/\s+/g, '')
    .replace(/[·•—–_/／:：,，.。'"“”‘’《》()（）[\]【】\-]/g, '');
}

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove('show'), 2200);
}

function applyStaticLanguage() {
  const dict = I18N[state.locale];
  elements.html.lang = dict.htmlLang;
  document.title = dict.pageTitle;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (dict[key]) node.textContent = dict[key];
  });
  elements.searchInput.placeholder = state.locale === 'zh'
    ? '搜索点位编号、名称或楼层'
    : 'Search number, name, floor, or theme';
  elements.searchInput.setAttribute('aria-label', state.locale === 'zh' ? '搜索点位' : 'Search locations');
  elements.clearSearch.setAttribute('aria-label', state.locale === 'zh' ? '清除搜索' : 'Clear search');
  elements.languageButton.textContent = state.locale === 'zh' ? 'EN' : '中';
  elements.languageButton.setAttribute('aria-label', t('language'));
  elements.fullscreenButton.setAttribute('aria-label', state.fullscreen ? t('exitFullscreen') : t('fullscreen'));
  renderCareButton();
  elements.clearFilter.textContent = t('showAll');
}

function renderCareButton() {
  elements.careButton.setAttribute('aria-pressed', String(state.care));
  elements.careButton.setAttribute('aria-label', state.care ? t('careOff') : t('careOn'));
  const label = elements.careButton.querySelector('span');
  if (label) label.textContent = state.care ? t('standardShort') : t('careShort');
}

function setCareMode(enabled) {
  state.care = !!enabled;
  elements.body.classList.toggle('care-mode', state.care);
  requestAnimationFrame(setupMapStage);
  renderCareButton();
}

function setLocale(locale) {
  state.locale = locale === 'en' ? 'en' : 'zh';
  state.musicSignature = '';
  applyStaticLanguage();
  renderBuildingTabs();
  renderMap();
  renderDirectory();
  updateSearchResults();
  renderMusic();
  if (elements.spotDialog.open && state.activePoint) {
    fillPointDialog(state.activePoint, { updateUrl: false, moveFocus: false });
  }
  updateUrl({});
}

function renderBuildingTabs() {
  elements.buildingTabs.replaceChildren(...state.data.buildings.map((building) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'building-tab';
    button.dataset.building = building.key;
    button.setAttribute('aria-selected', String(building.key === state.buildingKey));
    button.setAttribute('role', 'tab');
    button.textContent = building.name[state.locale];
    button.addEventListener('click', () => selectBuilding(building.key));
    return button;
  }));
}

function selectBuilding(key, options = {}) {
  if (!state.data.buildings.some((building) => building.key === key)) return;
  if (state.fullscreen) toggleFullscreen();
  state.buildingKey = key;
  elements.searchInput.value = '';
  updateSearchResults();
  closeDialog({ clearUrl: false });
  closeDrawer();
  state.musicSignature = '';
  state.category = -1;
  state.pendingFocusId = options.focusPoint ? options.focusPoint.id : '';
  state.pendingOpen = !!options.openPoint;
  renderBuildingTabs();
  renderMap();
  renderDirectory();
  updateUrl({ building: key, spot: options.openPoint ? options.focusPoint?.id || '' : '' });
}

function renderMap() {
  const building = currentBuilding();
  elements.buildingKicker.textContent = building.name.en.toUpperCase();
  elements.buildingTitle.textContent = building.name[state.locale];
  elements.pointCount.textContent = String(building.points.length);
  elements.pointsToggle.hidden = !building.points.length;
  elements.mapImage.alt = state.locale === 'zh'
    ? `${building.name.zh}开放日点位地图`
    : `${building.name.en} open-day location map`;
  renderHotspots();

  elements.mapViewport.style.aspectRatio = building.dimensions.join(' / ');
  document.getElementById('safetyLegend').hidden = !building.securityPosts.length;
  renderMusic();
  const src = building.image[state.locale];
  const finish = () => {
    if (elements.mapImage.getAttribute('src') !== src) return;
    setupMapStage();
    handlePendingFocus();
  };
  elements.mapImage.onload = finish;
  elements.mapImage.onerror = () => showToast(t('loadFailed'));
  elements.mapImage.src = src;
  if (elements.mapImage.complete && elements.mapImage.naturalWidth) requestAnimationFrame(finish);
}

function renderHotspots() {
  const building = currentBuilding();
  elements.mapViewport.classList.toggle('is-filtering', state.category >= 0);
  elements.mapHotspots.replaceChildren(...building.points.map((point) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-hotspot';
    if (point.id === '63' || point.id === '64') button.classList.add('label-fix');
    if (point.category === state.category) button.classList.add('is-match');
    button.style.left = `${point.x}%`;
    button.style.top = `${point.y}%`;
    button.style.setProperty('--spot-color', point.color);
    button.style.setProperty('--spot-text', point.textColor);
    button.dataset.pointId = point.id;
    button.setAttribute('aria-label', `${point.no || point.id} ${point.name[state.locale]}`);
    const number = document.createElement('span');
    number.className = 'hotspot-number';
    number.textContent = point.no || '•';
    button.append(number);
    button.addEventListener('pointerdown', (event) => event.stopPropagation());
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (mapState.dragged) return;
      fillPointDialog(point);
    });
    return button;
  }));
  renderMapExtras();
}

// All visitor state stays in memory. Only bundled public map resources are read.
function renderMapExtras() {
  const building = currentBuilding();
  elements.mapHotspots.querySelectorAll('.map-extra').forEach(node => node.remove());
  for (const hot of building.campusHotspots) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'map-extra campus-hot';
    Object.assign(button.style, { left: `${hot.x}%`, top: `${hot.y}%`, width: `${hot.w}%`, height: `${hot.h}%` });
    button.setAttribute('aria-label', state.locale === 'zh' ? hot.label : hot.labelEn);
    button.addEventListener('click', event => { event.stopPropagation(); selectBuilding(hot.key); });
    elements.mapHotspots.append(button);
  }
  for (const post of building.securityPosts) {
    const img = document.createElement('img');
    img.className = 'map-extra security-post'; img.src = 'assets/security-shield.svg'; img.alt = t('safety');
    img.style.left = `${post.x}%`; img.style.top = `${post.y}%`;
    elements.mapHotspots.append(img);
  }
  for (const facility of building.facilities) {
    const marker = document.createElement('div'); marker.className = 'map-extra medical';
    marker.style.left = `${facility.x}%`; marker.style.top = `${facility.y}%`;
    const label = document.createElement('span'); label.textContent = state.locale === 'zh' ? facility.label : 'First Aid Room';
    const cross = document.createElement('b'); cross.textContent = '✚';
    marker.append(label, cross); elements.mapHotspots.append(marker);
  }
  renderMusicMarkers();
}

function musicViews() { return buildBoxViews(Date.now(), state.openedMusic, state.locale === 'en'); }

function renderMusicMarkers() {
  elements.mapHotspots.querySelectorAll('.music-marker').forEach(node => node.remove());
  for (const box of musicViews().filter(box => box.bKey === state.buildingKey && box.phase !== 'sealed')) {
    const marker = document.createElement('button'); marker.type = 'button';
    marker.className = `music-marker ${box.showMapWave ? 'wave' : ''}`;
    marker.style.left = `${box.marker.x}%`; marker.style.top = `${box.marker.y}%`; marker.style.background = box.accent;
    marker.textContent = box.showMapMarker ? box.mapMarkerText : '·';
    marker.setAttribute('aria-label', box.mapAriaLabel);
    marker.addEventListener('click', event => { event.stopPropagation(); showMusic(box.id); });
    elements.mapHotspots.append(marker);
  }
}

function renderMusic() {
  const boxes = musicViews();
  const signature = [state.locale, state.buildingKey, ...boxes.map(box => box.id + box.phase)].join('|');
  if (signature !== state.musicSignature) {
    state.musicSignature = signature;
    document.getElementById('musicList').replaceChildren(...boxes.map(box => {
      const row = document.createElement('button'); row.type = 'button'; row.className = 'music-card'; row.dataset.musicId = box.id;
      const index = document.createElement('span'); index.className = 'music-index'; index.style.color = box.accent; index.textContent = `♪ ${box.index}`;
      const copy = document.createElement('span'); copy.className = 'music-copy';
      const title = document.createElement('span'); title.textContent = box.cardTitle;
      const description = document.createElement('span'); description.className = 'meta'; description.textContent = box.revealed ? box.venue : box.clue;
      const time = document.createElement('span'); time.className = 'meta'; time.textContent = box.timeText;
      const phase = document.createElement('span'); phase.className = 'music-phase'; phase.textContent = box.phaseLabel;
      copy.append(title, description, time); row.append(index, copy, phase);
      row.addEventListener('click', () => showMusic(box.id)); return row;
    }));
    renderMusicMarkers();
  }
  if (document.getElementById('musicDialog').open) fillMusic();
}

function showMusic(id) {
  state.musicId = id; fillMusic();
  document.getElementById('musicDialog').showModal();
}

function fillMusic() {
  const box = musicViews().find(box => box.id === state.musicId); if (!box) return;
  document.getElementById('musicMeta').textContent = `BOX ${box.index} · ${box.phaseLabel}`;
  document.getElementById('musicDetailTitle').textContent = box.cardTitle;
  document.getElementById('musicDescription').textContent = box.revealed ? [box.venue, box.team].filter(Boolean).join('\n') : box.clue;
  document.getElementById('musicTime').textContent = box.timeText;
  document.getElementById('musicCountdown').textContent = ['soon', 'active'].includes(box.phase) ? `${box.countdownLabel} ${box.countdownText}` : '';
  document.getElementById('musicOpen').hidden = !box.canOpen;
  document.getElementById('musicLocate').hidden = !box.canLocate;
}

function attachMusicEvents() {
  const dialog = document.getElementById('musicDialog');
  document.getElementById('musicClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.getElementById('musicOpen').addEventListener('click', () => {
    const box = musicViews().find(box => box.id === state.musicId); if (!box?.canOpen) return;
    state.openedMusic.push(box.id); renderMusic();
  });
  document.getElementById('musicLocate').addEventListener('click', () => {
    const box = musicViews().find(box => box.id === state.musicId); if (!box?.canLocate) return;
    dialog.close(); selectBuilding(box.bKey);
    const focus = () => { if (!state.fullscreen) toggleFullscreen(); requestAnimationFrame(() => centerPoint(box.marker, 2.5)); };
    if (elements.mapImage.complete) focus();
    else elements.mapImage.addEventListener('load', focus, { once: true });
  });
}

function renderDirectory() {
  const building = currentBuilding();
  const points = building.points.filter((point) => state.category < 0 || point.category === state.category);
  elements.directoryCount.textContent = `${points.length} ${t('pointUnit')}`;
  elements.clearFilter.hidden = state.category < 0;
  elements.directoryPane.classList.toggle('no-categories', !building.categories.length);
  elements.directoryPane.classList.toggle('has-category', state.category >= 0);
  elements.categoryChips.replaceChildren(...[-1, ...building.categories].map((categoryIndex) => {
    const category = currentCategory(categoryIndex);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category-chip';
    button.setAttribute('aria-pressed', String(state.category === categoryIndex));
    const dot = document.createElement('span');
    dot.className = 'category-dot';
    dot.style.background = categoryColor(categoryIndex, building);
    const label = document.createElement('span');
    label.textContent = category ? category[state.locale] : (state.locale === 'zh' ? '全部' : 'All');
    dot.hidden = categoryIndex < 0;
    button.append(dot, label);
    button.addEventListener('click', () => {
      state.category = state.category === categoryIndex ? -1 : categoryIndex;
      renderHotspots();
      renderDirectory();
      if (state.category >= 0) resetMapView();
    });
    return button;
  }));

  if (!points.length) {
    const empty = document.createElement('div');
    empty.className = 'list-empty';
    empty.textContent = t('listEmpty');
    elements.pointList.replaceChildren(empty);
    return;
  }

  elements.pointList.replaceChildren(...points.map((point) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'point-row';
    button.dataset.pointId = point.id;

    const badge = document.createElement('span');
    badge.className = 'spot-badge';
    badge.textContent = point.no || '•';
    badge.style.background = point.color;
    badge.style.color = point.textColor;

    const main = document.createElement('span');
    main.className = 'point-row-main';
    const name = document.createElement('span');
    name.className = 'point-row-name';
    name.textContent = point.name[state.locale];
    const meta = document.createElement('span');
    meta.className = 'point-row-meta';
    const category = currentCategory(point.category);
    meta.textContent = [point.floor[state.locale], category ? category[state.locale] : ''].filter(Boolean).join(' · ');
    main.append(name, meta);

    button.append(badge, main, icon('chevron'));
    button.addEventListener('click', () => {
      closeDrawer();
      centerPoint(point, 2.2);
      fillPointDialog(point);
    });
    return button;
  }));
}

function setupMapStage() {
  const viewport = elements.mapViewport.getBoundingClientRect();
  const width = elements.mapImage.naturalWidth;
  const height = elements.mapImage.naturalHeight;
  if (!width || !height || !viewport.width || !viewport.height) return;
  mapState.naturalWidth = width;
  mapState.naturalHeight = height;
  const scale = Math.min(viewport.width / width, viewport.height / height);
  mapState.baseWidth = width * scale;
  mapState.baseHeight = height * scale;
  elements.mapStage.style.width = `${mapState.baseWidth}px`;
  elements.mapStage.style.height = `${mapState.baseHeight}px`;
  resetMapView();
}

function resetMapView() {
  mapState.zoom = 1;
  mapState.panX = 0;
  mapState.panY = 0;
  applyMapTransform();
}

function clampPan() {
  const viewport = elements.mapViewport.getBoundingClientRect();
  const maxX = Math.max(0, (mapState.baseWidth * mapState.zoom - viewport.width) / 2);
  const maxY = Math.max(0, (mapState.baseHeight * mapState.zoom - viewport.height) / 2);
  mapState.panX = Math.max(-maxX, Math.min(maxX, mapState.panX));
  mapState.panY = Math.max(-maxY, Math.min(maxY, mapState.panY));
}

function applyMapTransform() {
  const viewport = elements.mapViewport.getBoundingClientRect();
  clampPan();
  elements.mapStage.style.left = `${(viewport.width - mapState.baseWidth) / 2 + mapState.panX}px`;
  elements.mapStage.style.top = `${(viewport.height - mapState.baseHeight) / 2 + mapState.panY}px`;
  elements.mapStage.style.transform = `scale(${mapState.zoom})`;
  elements.mapStage.style.setProperty('--hotspot-inverse', String(1 / mapState.zoom));
}

function setZoom(value) {
  mapState.zoom = Math.max(1, Math.min(4.5, Number(value) || 1));
  applyMapTransform();
}

function centerPoint(point, zoom = 2.2) {
  if (!mapState.baseWidth || !mapState.baseHeight) {
    state.pendingFocusId = point.id;
    return;
  }
  mapState.zoom = Math.max(1, Math.min(4.5, zoom));
  const offsetX = (point.x / 100 - 0.5) * mapState.baseWidth;
  const offsetY = (point.y / 100 - 0.5) * mapState.baseHeight;
  mapState.panX = -offsetX * mapState.zoom;
  mapState.panY = -offsetY * mapState.zoom;
  applyMapTransform();
}

function handlePendingFocus() {
  if (!state.pendingFocusId) return;
  const point = currentBuilding().points.find((item) => item.id === state.pendingFocusId);
  const shouldOpen = state.pendingOpen;
  state.pendingFocusId = '';
  state.pendingOpen = false;
  if (!point) return;
  centerPoint(point, 2.2);
  if (shouldOpen) fillPointDialog(point, { updateUrl: true, moveFocus: true });
}

function allSearchRows() {
  return state.data.buildings.flatMap((building) => building.points.map((point) => ({
    building,
    point,
    haystack: normalize([
      point.id,
      point.no,
      point.name.zh,
      point.name.en,
      point.full.zh,
      point.full.en,
      point.floor.zh,
      point.floor.en,
      currentCategory(point.category)?.zh,
      currentCategory(point.category)?.en,
      building.name.zh,
      building.name.en,
    ].join(' ')),
  })));
}

function updateSearchResults(forceOpen = false) {
  if (forceOpen) state.searchDismissed = false;
  const query = normalize(elements.searchInput.value);
  elements.searchWrap.classList.toggle('has-value', !!elements.searchInput.value);
  if (!query || state.searchDismissed) {
    elements.searchResults.hidden = true;
    elements.searchResults.replaceChildren();
    state.searchResults = [];
    return;
  }
  state.searchResults = allSearchRows()
    .filter((row) => row.haystack.includes(query))
    .sort((left, right) => {
      const leftStart = normalize(left.point.name[state.locale]).startsWith(query) ? 0 : 1;
      const rightStart = normalize(right.point.name[state.locale]).startsWith(query) ? 0 : 1;
      return leftStart - rightStart || pointNumber(left.point) - pointNumber(right.point);
    })
    .slice(0, 18);

  if (!state.searchResults.length) {
    const empty = document.createElement('p');
    empty.className = 'search-empty';
    empty.textContent = t('noResults');
    elements.searchResults.replaceChildren(empty);
  } else {
    elements.searchResults.replaceChildren(...state.searchResults.map(({ building, point }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'search-result';

      const number = document.createElement('span');
      number.className = 'result-no';
      number.textContent = point.no || '•';
      number.style.background = point.color;
      number.style.color = point.textColor;

      const main = document.createElement('span');
      main.className = 'result-main';
      const name = document.createElement('span');
      name.className = 'result-name';
      name.textContent = point.name[state.locale];
      const meta = document.createElement('span');
      meta.className = 'result-meta';
      const category = currentCategory(point.category);
      meta.textContent = [
        building.name[state.locale],
        point.floor[state.locale],
        category ? category[state.locale] : '',
      ].filter(Boolean).join(' · ');
      main.append(name, meta);

      button.append(number, main, icon('chevron'));
      button.addEventListener('click', () => {
        closeSearch();
        if (building.key !== state.buildingKey) {
          selectBuilding(building.key, { focusPoint: point, openPoint: true });
        } else {
          centerPoint(point, 2.2);
          fillPointDialog(point);
        }
      });
      return button;
    }));
  }
  elements.searchResults.hidden = false;
}

function closeSearch() {
  state.searchDismissed = true;
  elements.searchResults.hidden = true;
}

function fillPointDialog(point, options = {}) {
  if (!point) return;
  const building = state.data.buildings.find((item) => item.points.some((row) => row.id === point.id)) || currentBuilding();
  state.activePoint = point;
  const category = currentCategory(point.category);
  const name = point.name[state.locale];
  elements.spotBadge.textContent = point.no || '•';
  elements.spotBadge.style.background = point.color;
  elements.spotBadge.style.color = point.textColor;
  elements.spotMeta.textContent = [
    building.name[state.locale],
    point.floor[state.locale],
    category ? category[state.locale] : '',
  ].filter(Boolean).join(' · ');
  elements.spotTitle.textContent = name;
  elements.spotFull.textContent = point.full[state.locale] === name ? '' : point.full[state.locale];
  elements.spotFull.hidden = !elements.spotFull.textContent;
  elements.spotAddress.textContent = point.space[state.locale] ? `${point.space[state.locale]}` : '';
  elements.spotAddress.hidden = !elements.spotAddress.textContent;
  elements.spotIntro.textContent = point.intro[state.locale];
  elements.spotIntro.hidden = !elements.spotIntro.textContent;
  elements.spotItems.replaceChildren(...point.items.map((item) => {
    const row = document.createElement('div');
    row.className = 'spot-item';
    const number = document.createElement('span');
    number.className = 'spot-item-no';
    number.textContent = item.no || '•';
    const main = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = item.name[state.locale];
    const intro = document.createElement('p');
    intro.textContent = item.intro[state.locale];
    main.append(title);
    if (intro.textContent) main.append(intro);
    row.append(number, main);
    return row;
  }));

  if (typeof elements.spotDialog.showModal === 'function') {
    if (!elements.spotDialog.open) elements.spotDialog.showModal();
  } else {
    elements.spotDialog.setAttribute('open', '');
  }
  if (options.updateUrl !== false) updateUrl({ building: building.key, spot: point.id });
  if (options.moveFocus !== false) {
    requestAnimationFrame(() => elements.dialogClose.focus({ preventScroll: true }));
  }
}

function closeDialog(options = {}) {
  state.activePoint = null;
  if (typeof elements.spotDialog.close === 'function' && elements.spotDialog.open) {
    elements.spotDialog.close();
  } else {
    elements.spotDialog.removeAttribute('open');
  }
  if (options.clearUrl !== false) updateUrl({ spot: '' });
}

function openDrawer() {
  elements.body.classList.toggle('directory-expanded');
  elements.pointsToggle.setAttribute('aria-expanded', String(elements.body.classList.contains('directory-expanded')));
  if (elements.body.classList.contains('directory-expanded')) elements.directoryPane.scrollIntoView({ block: 'start', behavior: 'smooth' });

}

function closeDrawer() {
  elements.body.classList.remove('directory-expanded');
  elements.pointsToggle.setAttribute('aria-expanded', 'false');
}

function updateUrl(options = {}) {
  const url = new URL(window.location.href);
  const building = options.building || state.buildingKey;
  if (building) url.searchParams.set('building', building);
  if (Object.prototype.hasOwnProperty.call(options, 'spot')) {
    if (options.spot) url.searchParams.set('spot', options.spot);
    else url.searchParams.delete('spot');
  }
  if (state.locale === 'en') url.searchParams.set('lang', 'en');
  else url.searchParams.delete('lang');
  history.replaceState(null, '', url);
}

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  state.care = params.get('care') === '1';
  elements.body.classList.toggle('care-mode', state.care);
  if (params.get('lang') === 'en' || params.get('lang') === 'zh') {
    state.locale = params.get('lang');
  }
  const requestedBuilding = params.get('building');
  state.buildingKey = state.data.buildings.some((building) => building.key === requestedBuilding)
    ? requestedBuilding
    : state.data.buildings[0].key;
  const spotId = params.get('spot') || '';
  if (spotId) {
    state.pendingFocusId = spotId;
    state.pendingOpen = true;
  }
}

function toggleFullscreen() {
  state.fullscreen = !state.fullscreen;
  elements.mapViewport.classList.toggle('is-fullscreen', state.fullscreen);
  elements.fullscreenButton.querySelector('use').setAttribute('href', state.fullscreen ? '#i-close' : '#i-expand');
  elements.body.classList.toggle('map-fullscreen', state.fullscreen);
  elements.fullscreenButton.setAttribute('aria-label', state.fullscreen ? t('exitFullscreen') : t('fullscreen'));
  requestAnimationFrame(() => {
    setupMapStage();
    if (state.activePoint) centerPoint(state.activePoint, Math.max(2, mapState.zoom));
  });
}

function attachMapGestures() {
  elements.mapViewport.addEventListener('wheel', (event) => {
    if (!state.fullscreen && !event.ctrlKey) return;
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    setZoom(mapState.zoom * factor);
  }, { passive: false });

  elements.mapViewport.addEventListener('pointerdown', (event) => {
    if (!state.fullscreen && event.pointerType === 'touch') return;
    if (event.target.closest('.campus-hot, .music-marker')) return;
    if (event.target.closest('.zoom-controls, .points-toggle, .map-title-chip, .map-status')) return;
    if (event.button !== undefined && event.button !== 0) return;
    mapState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    elements.mapViewport.setPointerCapture(event.pointerId);
    mapState.dragged = false;
    if (mapState.pointers.size === 1) {
      mapState.dragStartX = event.clientX;
      mapState.dragStartY = event.clientY;
      mapState.dragPanX = mapState.panX;
      mapState.dragPanY = mapState.panY;
    } else if (mapState.pointers.size === 2) {
      const [a, b] = Array.from(mapState.pointers.values());
      mapState.pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
      mapState.pinchZoom = mapState.zoom;
    }
  });

  elements.mapViewport.addEventListener('pointermove', (event) => {
    if (!mapState.pointers.has(event.pointerId)) return;
    mapState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (mapState.pointers.size >= 2) {
      const [a, b] = Array.from(mapState.pointers.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (mapState.pinchDistance > 0) setZoom(mapState.pinchZoom * distance / mapState.pinchDistance);
      mapState.dragged = true;
      return;
    }
    const dx = event.clientX - mapState.dragStartX;
    const dy = event.clientY - mapState.dragStartY;
    if (Math.abs(dx) + Math.abs(dy) > 3) mapState.dragged = true;
    mapState.panX = mapState.dragPanX + dx;
    mapState.panY = mapState.dragPanY + dy;
    applyMapTransform();
  });

  const finishPointer = (event) => {
    mapState.pointers.delete(event.pointerId);
    if (elements.mapViewport.hasPointerCapture(event.pointerId)) {
      elements.mapViewport.releasePointerCapture(event.pointerId);
    }
    if (mapState.pointers.size === 1) {
      const point = Array.from(mapState.pointers.values())[0];
      mapState.dragStartX = point.x;
      mapState.dragStartY = point.y;
      mapState.dragPanX = mapState.panX;
      mapState.dragPanY = mapState.panY;
    }
  };
  elements.mapViewport.addEventListener('pointerup', finishPointer);
  elements.mapViewport.addEventListener('pointercancel', finishPointer);

  elements.mapViewport.addEventListener('click', event => {
    if (!event.target.closest('button') && !mapState.dragged && !state.fullscreen) toggleFullscreen();
  });
  elements.mapViewport.addEventListener('dblclick', () => {
    setZoom(mapState.zoom > 1.2 ? 1 : 2);
  });
}

function attachEvents() {
  elements.languageButton.addEventListener('click', () => setLocale(state.locale === 'zh' ? 'en' : 'zh'));
  elements.careButton.addEventListener('click', () => setCareMode(!state.care));
  elements.searchInput.addEventListener('input', () => updateSearchResults(true));
  elements.searchInput.addEventListener('focus', () => updateSearchResults(true));
  elements.searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSearch();
      elements.searchInput.blur();
    }
  });
  elements.clearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    updateSearchResults(true);
    elements.searchInput.focus();
  });
  document.addEventListener('click', (event) => {
    if (!elements.searchWrap.contains(event.target)) closeSearch();
  });
  elements.pointsToggle.addEventListener('click', openDrawer);
  elements.drawerClose.addEventListener('click', closeDrawer);
  elements.drawerBackdrop.addEventListener('click', closeDrawer);
  elements.clearFilter.addEventListener('click', () => {
    state.category = -1;
    renderHotspots();
    renderDirectory();
  });
  elements.zoomIn.addEventListener('click', () => {
    if (!state.fullscreen) { toggleFullscreen(); requestAnimationFrame(() => setZoom(1.5)); }
    else setZoom(mapState.zoom * 1.25);
  });
  elements.zoomOut.addEventListener('click', () => setZoom(mapState.zoom / 1.25));
  elements.zoomReset.addEventListener('click', resetMapView);
  elements.fullscreenButton.addEventListener('click', toggleFullscreen);
  elements.dialogClose.addEventListener('click', () => closeDialog());
  elements.spotDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });
  elements.spotDialog.addEventListener('click', (event) => {
    if (event.target === elements.spotDialog) closeDialog();
  });
  elements.focusButton.addEventListener('click', () => {
    const point = state.activePoint;
    if (!point) return;
    closeDialog({ clearUrl: false });
    closeDrawer();
    if (!state.fullscreen) toggleFullscreen();
    requestAnimationFrame(() => centerPoint(point, 2.5));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.fullscreen) toggleFullscreen();
  });
  window.addEventListener('resize', () => requestAnimationFrame(setupMapStage));
  attachMapGestures();
}

async function init() {
  elements.body.classList.toggle('care-mode', state.care);
  attachEvents();
  try {
    const response = await fetch('data/map.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    readUrlState();
    applyStaticLanguage();
    renderBuildingTabs();
    renderDirectory();
    renderMap();
    document.getElementById('eventDate').textContent = `2026 · ${state.data.eventDate}`;
    attachMusicEvents();
    setInterval(() => { if (!document.hidden) renderMusic(); }, 1000);
  } catch (error) {
    console.error(error);
    showToast(t('loadFailed'));
    elements.mapStatus.lastElementChild.textContent = t('loadFailed');
  }
}

init();
