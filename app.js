'use strict';

const storage = {
  read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
};
const saved = new Set(storage.read('travelbloom-saved', []));
let destinations;
let currentResults = [];
let currentFilter = 'beach';
let toastTimer;

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
}

function normalize(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function matchRecommendations(data, query) {
  const term = normalize(query);
  if (['beach', 'beaches'].includes(term)) return { label: 'Beach escapes', category: 'beach', items: data.beaches };
  if (['temple', 'temples'].includes(term)) return { label: 'Temple journeys', category: 'temple', items: data.temples };
  if (['country', 'countries'].includes(term)) return { label: 'Around the world', category: 'country', items: data.countries.flatMap(country => country.cities) };
  if (['all', 'destinations', 'explore'].includes(term)) return { label: 'All destinations', category: 'all', items: [...data.beaches, ...data.temples, ...data.countries.flatMap(country => country.cities)] };
  const country = data.countries.find(country => normalize(country.name) === term || country.aliases.some(alias => normalize(alias) === term));
  if (country) return { label: `Discover ${country.name}`, category: 'country', items: country.cities };
  const all = [...data.beaches, ...data.temples, ...data.countries.flatMap(country => country.cities)];
  return { label: 'Your search results', category: 'search', items: all.filter(place => normalize(`${place.name} ${place.country} ${place.tags.join(' ')}`).includes(term)) };
}

async function loadRecommendations() {
  if (destinations) return destinations;
  const response = await fetch('travel_recommendation_api.json');
  if (!response.ok) throw new Error('Recommendations could not be loaded.');
  destinations = await response.json();
  return destinations;
}

function createElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function heartIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z');
  svg.append(path);
  return svg;
}

function destinationCard(place) {
  const article = createElement('article', 'destination');
  const imageWrap = createElement('div', 'card-image-wrap');
  const image = createElement('img');
  image.src = place.imageUrl;
  image.alt = place.imageAlt;
  image.width = 700;
  image.height = 420;
  image.loading = 'lazy';
  const badge = createElement('span', 'card-category', place.categoryLabel);
  const save = createElement('button', 'save-button');
  save.type = 'button';
  save.setAttribute('aria-label', `Save ${place.name}`);
  save.setAttribute('aria-pressed', String(saved.has(place.id)));
  save.append(heartIcon());
  save.addEventListener('click', () => {
    if (saved.has(place.id)) saved.delete(place.id); else saved.add(place.id);
    const isSaved = saved.has(place.id);
    storage.write('travelbloom-saved', [...saved]);
    save.setAttribute('aria-pressed', String(isSaved));
    showToast(isSaved ? `${place.name} added to your saved places.` : `${place.name} removed from saved places.`);
    if (currentFilter === 'saved') renderRecommendations('saved');
  });
  imageWrap.append(image, badge, save);
  const content = createElement('div', 'card-content');
  const location = createElement('p', 'card-location', place.country);
  const title = createElement('h3', '', place.name);
  const description = createElement('p', 'card-description', place.description);
  const bottom = createElement('div', 'card-bottom');
  const mood = createElement('span', '', place.mood);
  const detail = createElement('button', 'text-button', 'Explore destination  ↗');
  detail.type = 'button';
  detail.setAttribute('aria-label', `Explore ${place.name}`);
  detail.addEventListener('click', () => openDestination(place, detail));
  bottom.append(mood, detail);
  content.append(location, title, description, bottom);
  article.append(imageWrap, content);
  return article;
}

async function renderRecommendations(query, scroll = false) {
  const grid = document.querySelector('#recommendation-results');
  if (!grid) return;
  const status = document.querySelector('#results-status');
  try {
    const data = await loadRecommendations();
    let result;
    if (query === 'saved') {
      const all = [...data.beaches, ...data.temples, ...data.countries.flatMap(country => country.cities)];
      result = { label: 'Your saved places', category: 'saved', items: all.filter(place => saved.has(place.id)) };
    } else {
      result = matchRecommendations(data, query);
    }
    currentResults = result.items;
    currentFilter = result.category;
    document.querySelector('#results-title').textContent = result.label;
    document.querySelectorAll('.filter').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === currentFilter)));
    grid.replaceChildren();
    status.textContent = `${currentResults.length} ${currentResults.length === 1 ? 'destination' : 'destinations'} to inspire your next journey`;
    if (currentResults.length) {
      grid.append(...currentResults.map(destinationCard));
    } else {
      const empty = createElement('div', 'empty-state');
      empty.append(createElement('h3', '', query === 'saved' ? 'Your next adventure starts here.' : 'A little off the map.'), createElement('p', '', query === 'saved' ? 'Tap the heart on a destination to save it here.' : 'Try beach, temple, Australia, Japan or Brazil. You can also search by city.'));
      grid.append(empty);
    }
    if (scroll) document.querySelector('#discover').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch {
    status.textContent = 'We could not load the destinations. Please refresh the page and try again.';
    grid.replaceChildren();
  }
}

function openDestination(place, trigger) {
  const dialog = document.querySelector('#destination-dialog');
  dialog.querySelector('img').src = place.imageUrl;
  dialog.querySelector('img').alt = place.imageAlt;
  dialog.querySelector('#dialog-title').textContent = place.name;
  dialog.querySelector('#dialog-location').textContent = place.country;
  dialog.querySelector('#dialog-description').textContent = place.details;
  dialog.querySelector('#dialog-mood').textContent = place.mood;
  dialog.querySelector('#dialog-activity').textContent = place.activity;
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone: place.timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date());
  dialog.querySelector('#dialog-time').textContent = `Local time: ${clock}`;
  dialog.querySelector('#dialog-source').href = place.sourceUrl;
  dialog.querySelector('#dialog-map').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.mapQuery)}`;
  dialog.showModal();
  dialog.addEventListener('close', () => trigger.focus(), { once: true });
}

document.querySelectorAll('[data-search-form]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const input = form.querySelector('input[name="q"]');
    if (!input.value.trim()) {
      input.setCustomValidity('Enter beach, temple, a country or a city.');
      input.reportValidity();
      input.setCustomValidity('');
      return;
    }
    if (document.querySelector('#recommendation-results')) {
      renderRecommendations(input.value, true);
      history.replaceState(null, '', `${location.pathname}?q=${encodeURIComponent(input.value.trim())}#discover`);
    } else {
      location.href = `index.html?q=${encodeURIComponent(input.value.trim())}#discover`;
    }
  });
  form.querySelector('[data-clear]').addEventListener('click', () => {
    form.reset();
    if (document.querySelector('#recommendation-results')) {
      history.replaceState(null, '', location.pathname);
      document.querySelector('#recommendation-results').replaceChildren();
      document.querySelector('#results-title').textContent = 'Find your kind of escape';
      document.querySelector('#results-status').textContent = 'Search for a destination or choose a category to begin.';
      document.querySelectorAll('.filter').forEach(button => button.setAttribute('aria-pressed', 'false'));
    }
    form.querySelector('input').focus();
  });
});

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  const input = document.querySelector('[data-search-form] input');
  if (input) input.value = filter === 'saved' ? '' : filter;
  renderRecommendations(filter);
  history.replaceState(null, '', `${location.pathname}?q=${encodeURIComponent(filter)}#discover`);
  const picker = button.closest('details');
  if (picker) picker.open = false;
}));

const contactForm = document.querySelector('#contact-form');
if (contactForm) contactForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const name = contactForm.elements.name.value.trim();
  const status = document.querySelector('#form-status');
  status.textContent = `Thank you, ${name}! Your inquiry has been received by this demo page. No email has been sent; this is a front-end student project.`;
  status.hidden = false;
  contactForm.reset();
});

const dialog = document.querySelector('#destination-dialog');
if (dialog) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right || event.clientY < dialog.getBoundingClientRect().top || event.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); });
}

if (document.querySelector('#recommendation-results')) {
  const query = new URLSearchParams(location.search).get('q') || 'beach';
  if (query !== 'beach') document.querySelector('[data-search-form] input').value = query === 'saved' ? '' : query;
  renderRecommendations(query);
}
