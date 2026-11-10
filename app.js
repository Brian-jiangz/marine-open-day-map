const STORAGE = {
  locale: 'marine-map-locale',
  care: 'marine-map-care',
};

const I18N = {
  zh: {
    htmlLang: 'zh-CN',
    pageTitle: '2026 海洋科学开放日 · 场馆地图',
    siteTitle: '海洋科学开放日',
    siteSubtitle: '场馆地图与参观指引',
    heroLead: '欢迎来到',
    heroTitle: '海洋开放日',
    heroSub: '面向所有来宾的场馆地图与参观指引',
    loading: '地图加载中',
    searchPlaceholder: '搜索编号、名称、楼层或大类',
    searchLabel: '搜索点位',
    noResults: '没有找到匹配点位',
    mapHint: '地图上有标记的为活动点位，点击查看介绍',
    categories: '篇章大类',
    showAll: '显示全部',
    pointUnit: '个点位',
    location: '位置',
    close: '关闭',
    language: 'Switch to English',
    careOn: '开启关怀版',
    careOff: '关闭关怀版',
    loadFailed: '地图数据加载失败，请刷新重试',
    listEmpty: '当前分类暂无点位',
  },
  en: {
    htmlLang: 'en',
    pageTitle: '2026 Marine Science Open Day · Venue Map',
    siteTitle: 'Marine Science Open Day',
    siteSubtitle: 'Venue map and visitor guide',
    heroLead: 'Welcome to',
    heroTitle: 'Marine Open Day',
    heroSub: 'Venue maps and visitor guidance for all guests',
    loading: 'Loading map',
    searchPlaceholder: 'Search number, name, floor, or theme',
    searchLabel: 'Search locations',
    noResults: 'No matching locations',
    mapHint: 'Marked locations are open-day stations. Tap one for details.',
    categories: 'Themes',
    showAll: 'Show all',
    pointUnit: 'locations',
    location: 'Location',
    close: 'Close',
    language: '切换至中文',
    careOn: 'Turn on accessibility mode',
    careOff: 'Turn off accessibility mode',
    loadFailed: 'Unable to load the map data. Please refresh and try again.',
    listEmpty: 'No locations in this theme',
  },
};

const state = {
  data: null,
  locale: localStorage.getItem(STORAGE.locale) === 'en' ? 'en' : 'zh',
  care: localStorage.getItem(STORAGE.care) === '1',
  buildingKey: '',
  category: -1,
  searchDismissed: false,
  searchResults: [],
  activePoint: null,
};

const elements = {
  html: document.documentElement,
  hero: document.getElementById('hero'),
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
  mapFrame: document.getElementById('mapFrame'),
  mapImage: document.getElementById('mapImage'),
  mapHotspots: document.getElementById('mapHotspots'),
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
  elements.searchInput.placeholder = dict.searchPlaceholder;
  elements.searchInput.setAttribute('aria-label', dict.searchLabel);
  elements.languageButton.textContent = state.locale === 'zh' ? 'EN' : '中';
  elements.languageButton.setAttribute('aria-label', dict.language);
  renderCareButton();
  elements.clearFilter.textContent = dict.showAll;
}

function renderCareButton() {
  const pressed = state.care;
  elements.careButton.setAttribute('aria-pressed', String(pressed));
  elements.careButton.setAttribute('aria-label', pressed ? t('careOff') : t('careOn'));
  const chars = state.locale === 'zh'
    ? (pressed ? ['标', '准', '版'] : ['关', '怀', '版'])
    : (pressed ? ['S', 'T', 'D'] : ['C', 'A', 'R', 'E']);
  elements.careButton.replaceChildren(...chars.map((char) => {
    const span = document.createElement('span');
    span.textContent = char;
    return span;
  }));
}

function setCareMode(enabled) {
  state.care = !!enabled;
  document.body.classList.toggle('care-mode', state.care);
  localStorage.setItem(STORAGE.care, state.care ? '1' : '0');
  renderCareButton();
}

function setLocale(locale) {
  state.locale = locale === 'en' ? 'en' : 'zh';
  localStorage.setItem(STORAGE.locale, state.locale);
  applyStaticLanguage();
  renderBuildingTabs();
  renderMap();
  renderCategories();
  renderPointList();
  updateSearchResults();
  if (elements.spotDialog.open && state.activePoint) {
    openPoint(state.activePoint, { updateUrl: false, moveFocus: false });
  }
  updateUrl({});
}

function renderBuildingTabs() {
  elements.buildingTabs.replaceChildren(...state.data.buildings.map((building) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'building-tab';
    button.role = 'tab';
    button.dataset.building = building.key;
    button.setAttribute('aria-selected', String(building.key === state.buildingKey));
    button.textContent = building.shortName[state.locale];
    button.addEventListener('click', () => selectBuilding(building.key));
    return button;
  }));
}

function selectBuilding(key, options = {}) {
  if (!state.data.buildings.some((building) => building.key === key)) return;
  state.buildingKey = key;
  state.category = -1;
  renderBuildingTabs();
  renderMap();
  renderCategories();
  renderPointList();
  updateUrl({ spot: options.spotId || '' });
}

function renderMap() {
  const building = currentBuilding();
  const title = building.name[state.locale];
  elements.buildingKicker.textContent = building.name.en.toUpperCase();
  elements.buildingTitle.textContent = title;
  elements.pointCount.textContent = `${building.points.length} ${t('pointUnit')}`;
  elements.mapImage.alt = state.locale === 'zh'
    ? `${title}开放日点位地图`
    : `${title} open-day station map`;
  elements.mapFrame.classList.remove('is-ready');
  const expectedSrc = building.image[state.locale];
  const finish = () => {
    if (elements.mapImage.getAttribute('src') === expectedSrc) {
      elements.mapFrame.classList.add('is-ready');
    }
  };
  elements.mapImage.onload = finish;
  elements.mapImage.onerror = () => {
    elements.mapFrame.classList.remove('is-ready');
    showToast(t('loadFailed'));
  };
  elements.mapImage.src = expectedSrc;
  if (elements.mapImage.complete && elements.mapImage.naturalWidth) {
    requestAnimationFrame(finish);
  }
  renderHotspots();
}

function renderHotspots() {
  const building = currentBuilding();
  const filtering = state.category >= 0;
  elements.mapFrame.classList.toggle('is-filtering', filtering);
  elements.mapHotspots.replaceChildren(...building.points.map((point) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-hotspot';
    if (point.category === state.category) button.classList.add('is-match');
    button.style.left = `${point.x}%`;
    button.style.top = `${point.y}%`;
    button.style.setProperty('--spot-color', point.color);
    button.style.setProperty('--spot-text', point.textColor);
    button.dataset.pointId = point.id;
    button.setAttribute('aria-label', `${point.no || point.id} ${point.name[state.locale]}`);
    button.title = `${point.no || point.id} · ${point.name[state.locale]}`;
    const number = document.createElement('span');
    number.className = 'hotspot-number';
    number.textContent = point.no || '•';
    button.append(number);
    button.addEventListener('click', () => openPoint(point));
    return button;
  }));
}

function renderCategories() {
  const building = currentBuilding();
  elements.clearFilter.hidden = state.category < 0;
  elements.categoryChips.replaceChildren(...building.categories.map((categoryIndex) => {
    const category = currentCategory(categoryIndex);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category-chip';
    button.dataset.category = String(categoryIndex);
    button.setAttribute('aria-pressed', String(state.category === categoryIndex));
    const dot = document.createElement('span');
    dot.className = 'category-dot';
    dot.style.background = categoryColor(categoryIndex, building);
    const label = document.createElement('span');
    label.textContent = category ? category[state.locale] : String(categoryIndex);
    button.append(dot, label);
    button.addEventListener('click', () => {
      state.category = state.category === categoryIndex ? -1 : categoryIndex;
      renderCategories();
      renderHotspots();
      renderPointList();
    });
    return button;
  }));
}

function renderPointList() {
  const building = currentBuilding();
  const points = building.points.filter((point) => state.category < 0 || point.category === state.category);
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
    meta.textContent = [
      point.floor[state.locale],
      category ? category[state.locale] : '',
    ].filter(Boolean).join(' · ');
    main.append(name, meta);

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'icon');
    icon.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-chevron');
    icon.append(use);

    button.append(badge, main, icon);
    button.addEventListener('click', () => openPoint(point));
    return button;
  }));
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

      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('class', 'icon');
      icon.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#i-chevron');
      icon.append(use);

      button.append(number, main, icon);
      button.addEventListener('click', () => {
        if (building.key !== state.buildingKey) selectBuilding(building.key, { spotId: point.id });
        closeSearch();
        openPoint(point);
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

function openPoint(point, options = {}) {
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
  elements.spotAddress.textContent = point.space[state.locale] ? `${t('location')} · ${point.space[state.locale]}` : '';
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

function closePoint() {
  state.activePoint = null;
  if (typeof elements.spotDialog.close === 'function' && elements.spotDialog.open) {
    elements.spotDialog.close();
  } else {
    elements.spotDialog.removeAttribute('open');
  }
  updateUrl({ spot: '' });
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
  if (params.get('lang') === 'en' || params.get('lang') === 'zh') {
    state.locale = params.get('lang');
  }
  const requestedBuilding = params.get('building');
  state.buildingKey = state.data.buildings.some((building) => building.key === requestedBuilding)
    ? requestedBuilding
    : state.data.buildings[0].key;
  return params.get('spot');
}

function attachEvents() {
  elements.languageButton.addEventListener('click', () => {
    setLocale(state.locale === 'zh' ? 'en' : 'zh');
  });
  elements.careButton.addEventListener('click', () => {
    setCareMode(!state.care);
  });
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
  elements.clearFilter.addEventListener('click', () => {
    state.category = -1;
    renderCategories();
    renderHotspots();
    renderPointList();
  });
  elements.dialogClose.addEventListener('click', closePoint);
  elements.spotDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closePoint();
  });
  elements.spotDialog.addEventListener('click', (event) => {
    if (event.target === elements.spotDialog) closePoint();
  });
  window.addEventListener('scroll', () => {
    elements.hero.classList.toggle('is-away', window.scrollY > 90);
  }, { passive: true });
}

async function init() {
  document.body.classList.toggle('care-mode', state.care);
  attachEvents();
  try {
    const response = await fetch('data/map.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    const requestedSpot = readUrlState();
    applyStaticLanguage();
    renderBuildingTabs();
    renderMap();
    renderCategories();
    renderPointList();
    elements.hero.classList.toggle('is-away', window.scrollY > 90);
    if (requestedSpot) {
      const point = currentBuilding().points.find((item) => item.id === requestedSpot);
      if (point) openPoint(point, { updateUrl: false });
    }
  } catch (error) {
    console.error(error);
    elements.mapFrame.classList.remove('is-ready');
    document.querySelector('#mapLoading p').textContent = t('loadFailed');
    showToast(t('loadFailed'));
  }
}

init();
