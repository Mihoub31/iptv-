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
