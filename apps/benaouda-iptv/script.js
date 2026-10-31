const channels = [
  { id: 1, name: 'Benaouda News', category: 'News', stream: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', badge: 'Live' },
  { id: 2, name: 'Canal+ Sport', category: 'Sports', stream: 'https://test-streams.mux.dev/ksf/ksf.m3u8', badge: 'HD' },
  { id: 3, name: 'Cinema Max', category: 'Movies', stream: 'https://test-streams.mux.dev/bbb/bbb.m3u8', badge: '4K' },
  { id: 4, name: 'World TV', category: 'News', stream: 'https://test-streams.mux.dev/poe/poe.m3u8', badge: 'Live' },
  { id: 5, name: 'Kids Zone', category: 'Kids', stream: 'https://test-streams.mux.dev/vid/vid.m3u8', badge: 'Kids' },
  { id: 6, name: 'Drama Prime', category: 'Series', stream: 'https://test-streams.mux.dev/sintel/sintel.m3u8', badge: 'New' },
  { id: 7, name: 'Football Arena', category: 'Sports', stream: 'https://test-streams.mux.dev/ahr/ahr.m3u8', badge: 'HD' },
  { id: 8, name: 'Cine World', category: 'Movies', stream: 'https://test-streams.mux.dev/vid/vid.m3u8', badge: '4K' },
  { id: 9, name: 'Morning Daily', category: 'News', stream: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', badge: 'Live' },
  { id: 10, name: 'Cartoon Club', category: 'Kids', stream: 'https://test-streams.mux.dev/ksf/ksf.m3u8', badge: 'Kids' },
  { id: 11, name: 'Prime Series', category: 'Series', stream: 'https://test-streams.mux.dev/bbb/bbb.m3u8', badge: 'New' },
  { id: 12, name: 'Al Bayen Sports', category: 'Sports', stream: 'https://test-streams.mux.dev/poe/poe.m3u8', badge: 'Live' }
];

const guideItems = [
  { start: '08:00', end: '09:00', channel: 'Benaouda News', title: 'Morning briefing', category: 'News' },
  { start: '09:30', end: '11:00', channel: 'Canal+ Sport', title: 'Champions round-up', category: 'Sports' },
  { start: '12:00', end: '13:00', channel: 'Cinema Max', title: 'Movie special: Night City', category: 'Movies' },
  { start: '15:00', end: '16:00', channel: 'Kids Zone', title: 'Cartoon club', category: 'Kids' },
  { start: '18:30', end: '20:00', channel: 'Drama Prime', title: 'Prime series live', category: 'Series' },
  { start: '20:30', end: '21:30', channel: 'Football Arena', title: 'Match highlights', category: 'Sports' }
];

const storageKey = 'benaouda-iptv-state';
const state = {
  activeCategory: 'All',
  query: '',
  favorites: new Set([1, 3, 6]),
  recent: [1, 2, 3]
};

const player = document.getElementById('player');
const channelList = document.getElementById('channelList');
const channelCount = document.getElementById('channelCount');
const nowPlaying = document.getElementById('nowPlaying');
const searchInput = document.getElementById('searchInput');
const favoritesCount = document.getElementById('favoritesCount');
const favoriteList = document.getElementById('favoriteList');
const recentList = document.getElementById('recentList');
const guideList = document.getElementById('guideList');
const navButtons = [...document.querySelectorAll('.nav-item')];
const pageButtons = [...document.querySelectorAll('.page-tab')];
const viewSections = [...document.querySelectorAll('.view-section')];

let currentChannel = channels[0];

function hydrateState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (Array.isArray(saved.favorites)) {
      state.favorites = new Set(saved.favorites.map(Number));
    }
    if (Array.isArray(saved.recent)) {
      state.recent = saved.recent.map(Number).filter((value) => channels.some((channel) => channel.id === value));
    }
  } catch (error) {
    console.warn('Unable to parse saved IPTV state', error);
  }
}

function persistState() {
  localStorage.setItem(storageKey, JSON.stringify({
    favorites: [...state.favorites],
    recent: state.recent
  }));
}

function getChannelById(id) {
  return channels.find((channel) => channel.id === Number(id)) || channels[0];
}

function syncFavoritesCount() {
  favoritesCount.textContent = String(state.favorites.size);
}

function toggleFavorite(channelId) {
  if (state.favorites.has(channelId)) {
    state.favorites.delete(channelId);
  } else {
    state.favorites.add(channelId);
  }
  persistState();
  syncFavoritesCount();
  renderFavoriteList();
  renderChannels();
}

function pushRecent(channelId) {
  state.recent = [Number(channelId), ...state.recent.filter((id) => id !== Number(channelId))].slice(0, 5);
  persistState();
  renderRecentList();
}

function setActiveChannel(channel) {
  currentChannel = channel;
  player.src = channel.stream;
  player.load();
  nowPlaying.textContent = channel.name;
  pushRecent(channel.id);

  [...channelList.children].forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.id) === channel.id);
  });
}

function renderGuide() {
  guideList.innerHTML = guideItems
    .map(
      (item) => `
        <div class="guide-row">
          <div class="guide-time">${item.start} - ${item.end}</div>
          <div class="guide-main">
            <div class="guide-title">${item.title}</div>
            <div class="guide-channel">${item.channel}</div>
          </div>
          <span class="guide-tag">${item.category}</span>
        </div>
      `
    )
    .join('');
}

function renderFavoriteList() {
  const favorites = [...state.favorites].map((id) => getChannelById(id));

  if (!favorites.length) {
    favoriteList.innerHTML = '<p class="quick-empty">No favorites saved yet.</p>';
    return;
  }

  favoriteList.innerHTML = favorites
    .map(
      (channel) => `
        <button class="quick-item" type="button" data-channel-id="${channel.id}">
          <span class="quick-name">${channel.name}</span>
          <span class="quick-badge">${channel.category}</span>
        </button>
      `
    )
    .join('');

  favoriteList.querySelectorAll('.quick-item').forEach((button) => {
    button.addEventListener('click', () => setActiveChannel(getChannelById(button.dataset.channelId)));
  });
}

function renderRecentList() {
  const recent = state.recent.map((id) => getChannelById(id));

  if (!recent.length) {
    recentList.innerHTML = '<p class="quick-empty">No recent channels yet.</p>';
    return;
  }

  recentList.innerHTML = recent
    .map(
      (channel) => `
        <button class="quick-item" type="button" data-channel-id="${channel.id}">
          <span class="quick-name">${channel.name}</span>
          <span class="quick-badge">${channel.badge}</span>
        </button>
      `
    )
    .join('');

  recentList.querySelectorAll('.quick-item').forEach((button) => {
    button.addEventListener('click', () => setActiveChannel(getChannelById(button.dataset.channelId)));
  });
}

function renderChannels() {
  const matching = channels.filter((channel) => {
    const matchesCategory = state.activeCategory === 'All' || channel.category === state.activeCategory;
    const query = state.query.trim().toLowerCase();
    const matchesQuery = !query || channel.name.toLowerCase().includes(query) || channel.category.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  channelCount.textContent = matching.length;
  channelList.innerHTML = '';

  matching.forEach((channel, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'channel-item';
    button.dataset.id = channel.id;
    button.setAttribute('aria-label', `Watch ${channel.name}`);
    if (channel.id === currentChannel.id) {
      button.classList.add('active');
    }

    const isFavorite = state.favorites.has(channel.id);

    button.innerHTML = `
      <span class="channel-number">${String(index + 1).padStart(2, '0')}</span>
      <span class="channel-meta">
        <span class="channel-name">${channel.name}</span>
        <span class="channel-category">${channel.category}</span>
      </span>
      <span class="channel-actions">
        <span class="channel-badge">${channel.badge}</span>
        <span class="channel-favorite ${isFavorite ? 'active' : ''}" aria-label="Toggle favorite">★</span>
      </span>
    `;

    button.addEventListener('click', (event) => {
      const favoriteNode = event.target.closest('.channel-favorite');
      if (favoriteNode) {
        event.stopPropagation();
        toggleFavorite(channel.id);
        return;
      }
      setActiveChannel(channel);
    });
    channelList.appendChild(button);
  });
}

function setCategory(category) {
  state.activeCategory = category;
  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === category);
  });
  renderChannels();
}

function setPage(page) {
  document.body.dataset.activePage = page;
  document.getElementById('appStatusLabel').textContent = page === 'jellyfin' ? 'Your library' : 'Free live';
  pageButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.page === page);
  });

  viewSections.forEach((section) => {
    const visible = section.dataset.view === page;
    section.hidden = !visible;
  });
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => setCategory(button.dataset.filter));
});

pageButtons.forEach((button) => {
  button.addEventListener('click', () => setPage(button.dataset.page));
});

searchInput.addEventListener('input', (event) => {
  state.query = event.target.value;
  renderChannels();
});

hydrateState();
syncFavoritesCount();
renderGuide();
renderFavoriteList();
renderRecentList();
renderChannels();
setPage('home');
setActiveChannel(currentChannel);

const jellyfinStorageKey = 'benaouda-jellyfin-session';
const jellyfinConnectForm = document.getElementById('jellyfinConnectForm');
const jellyfinConnectButton = document.getElementById('jellyfinConnectButton');
const jellyfinServerInput = document.getElementById('jellyfinServer');
const jellyfinUsernameInput = document.getElementById('jellyfinUsername');
const jellyfinPasswordInput = document.getElementById('jellyfinPassword');
const jellyfinAccount = document.getElementById('jellyfinAccount');
const jellyfinAccountLabel = document.getElementById('jellyfinAccountLabel');
const jellyfinDisconnectButton = document.getElementById('jellyfinDisconnectButton');
const jellyfinStatus = document.getElementById('jellyfinStatus');
const jellyfinLibrary = document.getElementById('jellyfinLibrary');
const jellyfinItemsNode = document.getElementById('jellyfinItems');
const jellyfinSearchInput = document.getElementById('jellyfinSearch');
const jellyfinPlayerWrap = document.getElementById('jellyfinPlayerWrap');
const jellyfinPlayer = document.getElementById('jellyfinPlayer');
const jellyfinNowPlaying = document.getElementById('jellyfinNowPlaying');
const jellyfinClosePlayer = document.getElementById('jellyfinClosePlayer');
const jellyfinBackButton = document.getElementById('jellyfinBackButton');
const jellyfinFilterButtons = [...document.querySelectorAll('[data-jellyfin-filter]')];
const jellyfinBridge = window.JellyfinBridge;
const jellyfinPendingRequests = new Map();
let jellyfinRequestId = 0;
let jellyfinSession = null;
let jellyfinItems = [];
let jellyfinCurrentFilter = 'All';
let jellyfinCurrentSeries = null;

function setJellyfinStatus(message, status = '') {
  jellyfinStatus.textContent = message;
  jellyfinStatus.dataset.state = status;
}

function jellyfinErrorMessage(error) {
  const message = error?.message || 'Jellyfin request failed.';
  if (!jellyfinBridge && error?.name === 'TypeError') {
    return `${message} In browser preview, allow this page's origin in Jellyfin CORS settings.`;
  }
  return message;
}

function getSavedJellyfinSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(jellyfinStorageKey) || 'null');
    if (
      saved &&
      typeof saved.serverUrl === 'string' &&
      typeof saved.accessToken === 'string' &&
      typeof saved.userId === 'string'
    ) {
      return saved;
    }
  } catch (error) {
    console.warn('Unable to parse saved Jellyfin session', error);
  }
  return null;
}

function saveJellyfinSession() {
  if (jellyfinSession) {
    localStorage.setItem(jellyfinStorageKey, JSON.stringify(jellyfinSession));
  } else {
    localStorage.removeItem(jellyfinStorageKey);
  }
}

function normalizeJellyfinServerUrl(value) {
  const parsed = new URL(value.trim());
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
    throw new Error('Enter a valid HTTP or HTTPS Jellyfin server address.');
  }
  if (parsed.search || parsed.hash) {
    throw new Error('The server address must not include a query string or fragment.');
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  return parsed.toString().replace(/\/+$/, '');
}

function jellyfinUrl(path) {
  const base = `${jellyfinSession.serverUrl.replace(/\/+$/, '')}/`;
  const url = new URL(path.replace(/^\/+/, ''), base);
  const server = new URL(base);
  if (url.origin !== server.origin || !url.pathname.startsWith(`${server.pathname.replace(/\/+$/, '')}/`)) {
    throw new Error('Jellyfin returned a link outside the configured server.');
  }
  return url;
}

function jellyfinAuthorization() {
  const token = jellyfinSession?.accessToken;
  const tokenPart = token ? `, Token="${token}"` : '';
  return `MediaBrowser Client="BENAOUDA TV", Device="Android TV", DeviceId="com.benaouda.tv", Version="1.1.0"${tokenPart}`;
}

function requestJellyfinThroughAndroid(url, options) {
  return new Promise((resolve, reject) => {
    const id = String(++jellyfinRequestId);
    const timeout = window.setTimeout(() => {
      jellyfinPendingRequests.delete(id);
      reject(new Error('The Jellyfin server request timed out.'));
    }, 35000);

    jellyfinPendingRequests.set(id, { resolve, reject, timeout });
    jellyfinBridge.postMessage(JSON.stringify({
      id,
      url: url.toString(),
      serverUrl: jellyfinSession.serverUrl,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null
    }));
  });
}

if (jellyfinBridge?.addEventListener) {
  jellyfinBridge.addEventListener('message', (event) => {
    let response;
    try {
      response = JSON.parse(event.data);
    } catch (error) {
      console.error('Unable to read Jellyfin response from Android', error);
      return;
    }

    const pending = jellyfinPendingRequests.get(String(response.id));
    if (!pending) return;

    window.clearTimeout(pending.timeout);
    jellyfinPendingRequests.delete(String(response.id));
    if (response.error) {
      pending.reject(new Error(response.error));
    } else {
      pending.resolve({ status: response.status, text: response.body });
    }
  });
}

async function jellyfinRequest(path, { method = 'GET', body = null, authenticate = true } = {}) {
  const url = jellyfinUrl(path);
  const headers = {
    Accept: 'application/json',
    Authorization: jellyfinAuthorization()
  };
  if (body !== null) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body !== null) options.body = JSON.stringify(body);

  let response;
  if (jellyfinBridge?.postMessage && jellyfinBridge?.addEventListener) {
    response = await requestJellyfinThroughAndroid(url, options);
  } else {
    const browserResponse = await fetch(url, options);
    response = { status: browserResponse.status, text: await browserResponse.text() };
  }

  let data = null;
  if (response.text) {
    try {
      data = JSON.parse(response.text);
    } catch {
      data = { Message: response.text };
    }
  }
  if (response.status < 200 || response.status >= 300) {
    if (!authenticate && response.status === 401) {
      throw new Error('Your Jellyfin session expired. Disconnect and sign in again.');
    }
    if (authenticate && response.status === 401) {
      throw new Error('Sign-in failed. Check your username and password.');
    }
    throw new Error(data?.Message || data?.message || `Jellyfin returned HTTP ${response.status}.`);
  }
  return data;
}

function makeJellyfinImageUrl(item) {
  const path = `Items/${encodeURIComponent(item.Id)}/Images/Primary?maxWidth=480`;
  const url = jellyfinUrl(path);
  url.searchParams.set('api_key', jellyfinSession.accessToken);
  return url.toString();
}

function renderJellyfinItems() {
  const query = jellyfinSearchInput.value.trim().toLowerCase();
  const visibleItems = jellyfinItems.filter((item) => {
    const matchesType = jellyfinCurrentFilter === 'All' || item.Type === jellyfinCurrentFilter;
    const matchesQuery = !query || (item.Name || '').toLowerCase().includes(query);
    return matchesType && matchesQuery;
  });

  jellyfinItemsNode.replaceChildren();
  if (!visibleItems.length) {
    const empty = document.createElement('p');
    empty.className = 'jellyfin-empty';
    empty.textContent = jellyfinItems.length
      ? 'No titles match this search or filter.'
      : 'No movies or series were found in this library.';
    jellyfinItemsNode.appendChild(empty);
    return;
  }

  visibleItems.forEach((item) => {
    const button = document.createElement('button');
    button.className = 'jellyfin-item';
    button.type = 'button';
    button.setAttribute('aria-label', `${item.Type === 'Series' ? 'Browse' : 'Play'} ${item.Name}`);

    const poster = document.createElement('img');
    poster.className = 'jellyfin-poster';
    poster.alt = '';
    poster.loading = 'lazy';
    poster.src = makeJellyfinImageUrl(item);
    poster.addEventListener('error', () => poster.removeAttribute('src'), { once: true });

    const copy = document.createElement('span');
    copy.className = 'jellyfin-item-copy';
    const title = document.createElement('span');
    title.className = 'jellyfin-item-title';
    title.textContent = item.Name || 'Untitled';
    const meta = document.createElement('span');
    meta.className = 'jellyfin-item-meta';
    meta.textContent = item.Type === 'Series' ? 'Series' : item.ProductionYear || 'Movie';
    copy.append(title, meta);
    button.append(poster, copy);
    button.addEventListener('click', () => openJellyfinItem(item));
    jellyfinItemsNode.appendChild(button);
  });
}

function setJellyfinAccountView(connected) {
  jellyfinConnectForm.hidden = connected;
  jellyfinAccount.hidden = !connected;
  jellyfinLibrary.hidden = !connected;
  if (connected) {
    jellyfinAccountLabel.textContent = `Connected as ${jellyfinSession.username} • ${jellyfinSession.serverUrl}`;
  }
}

async function loadJellyfinLibrary() {
  setJellyfinStatus('Loading your Jellyfin library…');
  const query = new URLSearchParams({
    Recursive: 'true',
    IncludeItemTypes: 'Movie,Series',
    SortBy: 'DateCreated,SortName',
    SortOrder: 'Descending',
    Fields: 'Overview,Genres,RunTimeTicks,UserData',
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary',
    Limit: '100'
  });

  try {
    const result = await jellyfinRequest(`Users/${encodeURIComponent(jellyfinSession.userId)}/Items?${query}`, { authenticate: false });
    jellyfinItems = Array.isArray(result?.Items) ? result.Items : [];
    jellyfinCurrentSeries = null;
    jellyfinBackButton.hidden = true;
    jellyfinFilterButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.jellyfinFilter === 'All');
    });
    jellyfinCurrentFilter = 'All';
    renderJellyfinItems();
    setJellyfinStatus(`Loaded ${jellyfinItems.length} movies and series.`, 'success');
  } catch (error) {
    setJellyfinStatus(jellyfinErrorMessage(error), 'error');
  }
}

async function browseJellyfinSeries(series) {
  setJellyfinStatus(`Loading episodes for ${series.Name}…`);
  try {
    const query = new URLSearchParams({
      UserId: jellyfinSession.userId,
      Fields: 'Overview,Genres,RunTimeTicks,UserData',
      IsMissing: 'false',
      SortBy: 'ParentIndexNumber,IndexNumber',
      SortOrder: 'Ascending'
    });
    const result = await jellyfinRequest(`Shows/${encodeURIComponent(series.Id)}/Episodes?${query}`, { authenticate: false });
    jellyfinItems = Array.isArray(result?.Items) ? result.Items : [];
    jellyfinCurrentSeries = series;
    jellyfinBackButton.hidden = false;
    jellyfinFilterButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.jellyfinFilter === 'All');
    });
    jellyfinCurrentFilter = 'All';
    renderJellyfinItems();
    setJellyfinStatus(`${jellyfinItems.length} episodes in ${series.Name}.`, 'success');
  } catch (error) {
    setJellyfinStatus(`Could not load episodes: ${jellyfinErrorMessage(error)}`, 'error');
  }
}

async function playJellyfinItem(item) {
  setJellyfinStatus(`Preparing ${item.Name}…`);
  try {
    const query = new URLSearchParams({ UserId: jellyfinSession.userId });
    const playbackInfo = await jellyfinRequest(`Items/${encodeURIComponent(item.Id)}/PlaybackInfo?${query}`, {
      method: 'POST',
      body: {
        DeviceProfile: {
          Name: 'BENAOUDA TV WebView',
          MaxStreamingBitrate: 120000000,
          DirectPlayProfiles: [{
            Container: 'mp4,m4v,mov',
            Type: 'Video',
            VideoCodec: 'h264,hevc,vp8,vp9',
            AudioCodec: 'aac,mp3,ac3,eac3,opus,vorbis'
          }],
          TranscodingProfiles: [{
            Container: 'mp4',
            Type: 'Video',
            VideoCodec: 'h264',
            AudioCodec: 'aac',
            Context: 'Streaming',
            Protocol: 'http',
            MaxAudioChannels: '2'
          }]
        }
      },
      authenticate: false
    });

    const mediaSource = playbackInfo?.MediaSources?.[0];
    const streamPath = mediaSource?.TranscodingUrl || mediaSource?.DirectStreamUrl;
    if (!streamPath) {
      throw new Error('Jellyfin did not provide a playable stream for this title.');
    }

    const streamUrl = jellyfinUrl(streamPath);
    const server = new URL(jellyfinSession.serverUrl);
    if (streamUrl.origin !== server.origin) {
      throw new Error('Jellyfin returned a stream outside the configured server.');
    }
    streamUrl.searchParams.set('api_key', jellyfinSession.accessToken);

    jellyfinNowPlaying.textContent = item.Name || 'Now playing';
    jellyfinPlayerWrap.hidden = false;
    jellyfinPlayer.src = streamUrl.toString();
    jellyfinPlayer.load();
    jellyfinPlayer.play().catch(() => {
      setJellyfinStatus('Press play on the video controls to start playback.', 'success');
    });
    setJellyfinStatus(`Playing ${item.Name}.`, 'success');
  } catch (error) {
    setJellyfinStatus(`Could not play this title: ${jellyfinErrorMessage(error)}`, 'error');
  }
}

async function openJellyfinItem(item) {
  if (item.Type === 'Series') {
    await browseJellyfinSeries(item);
  } else {
    await playJellyfinItem(item);
  }
}

jellyfinConnectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  jellyfinConnectButton.disabled = true;
  jellyfinConnectButton.textContent = 'Connecting…';
  setJellyfinStatus('Connecting to Jellyfin…');

  try {
    const serverUrl = normalizeJellyfinServerUrl(jellyfinServerInput.value);
    const username = jellyfinUsernameInput.value.trim();
    const password = jellyfinPasswordInput.value;
    jellyfinSession = { serverUrl, username, accessToken: '', userId: '' };
    const result = await jellyfinRequest('Users/AuthenticateByName', {
      method: 'POST',
      body: { Username: username, Pw: password }
    });
    if (!result?.AccessToken || !result?.User?.Id) {
      throw new Error('Jellyfin returned an incomplete sign-in response.');
    }

    jellyfinSession.accessToken = result.AccessToken;
    jellyfinSession.userId = result.User.Id;
    jellyfinSession.username = result.User.Name || username;
    saveJellyfinSession();
    jellyfinPasswordInput.value = '';
    jellyfinSearchInput.value = '';
    setJellyfinAccountView(true);
    await loadJellyfinLibrary();
  } catch (error) {
    jellyfinSession = null;
    setJellyfinStatus(`${jellyfinErrorMessage(error)} Check the server address and network connection.`, 'error');
  } finally {
    jellyfinConnectButton.disabled = false;
    jellyfinConnectButton.textContent = 'Connect';
  }
});

jellyfinDisconnectButton.addEventListener('click', () => {
  jellyfinPlayer.pause();
  jellyfinPlayer.removeAttribute('src');
  jellyfinPlayer.load();
  jellyfinPlayerWrap.hidden = true;
  jellyfinSession = null;
  jellyfinItems = [];
  jellyfinCurrentSeries = null;
  saveJellyfinSession();
  setJellyfinAccountView(false);
  jellyfinItemsNode.replaceChildren();
  setJellyfinStatus('Disconnected from Jellyfin.');
});

jellyfinSearchInput.addEventListener('input', renderJellyfinItems);

jellyfinFilterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    jellyfinCurrentFilter = button.dataset.jellyfinFilter;
    jellyfinFilterButtons.forEach((filterButton) => {
      filterButton.classList.toggle('active', filterButton === button);
    });
    renderJellyfinItems();
  });
});

jellyfinBackButton.addEventListener('click', () => {
  if (!jellyfinCurrentSeries) return;
  loadJellyfinLibrary();
});

jellyfinClosePlayer.addEventListener('click', () => {
  jellyfinPlayer.pause();
  jellyfinPlayer.removeAttribute('src');
  jellyfinPlayer.load();
  jellyfinPlayerWrap.hidden = true;
});

jellyfinSession = getSavedJellyfinSession();
if (jellyfinSession) {
  jellyfinServerInput.value = jellyfinSession.serverUrl;
  jellyfinUsernameInput.value = jellyfinSession.username || '';
  setJellyfinAccountView(true);
  loadJellyfinLibrary();
}
