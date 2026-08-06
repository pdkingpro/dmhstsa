// ══════════ PAGE NAVIGATION ══════════
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
  
  document.getElementById('page-' + name).classList.add('active');
  const navBtn = document.getElementById('nav-' + name);
  if(navBtn) navBtn.classList.add('active');
  
  document.getElementById('nav-links').classList.remove('mobile-nav-open');
  window.scrollTo(0,0);
}

// ══════════ HOME PAGE CONTENT ══════════
function initHomeCarousel() {
  const track = document.getElementById('carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');
  const slides = Array.from(document.querySelectorAll('.carousel-slide'));
  if (!track || !dotsContainer || !slides.length) return;

  let currentIndex = 0;
  let autoplay;

  function updateCarousel(index) {
    currentIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function createDots() {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => {
        updateCarousel(i);
        restartAutoplay();
      });
      dotsContainer.appendChild(dot);
    });
  }

  function restartAutoplay() {
    clearInterval(autoplay);
    autoplay = setInterval(() => updateCarousel(currentIndex + 1), 5000);
  }

  document.querySelector('.carousel-prev')?.addEventListener('click', () => {
    updateCarousel(currentIndex - 1);
    restartAutoplay();
  });
  document.querySelector('.carousel-next')?.addEventListener('click', () => {
    updateCarousel(currentIndex + 1);
    restartAutoplay();
  });

  createDots();
  updateCarousel(0);
  restartAutoplay();
}

function buildHomeAwardsList() {
  const list = document.getElementById('home-awards-list');
  if (!list) return;
  list.innerHTML = '';
  
  // Utilizes HOME_AWARDS from data.js
  HOME_AWARDS.forEach(award => {
    const item = document.createElement('div');
    item.className = 'event-list-item';
    item.innerHTML = `<span class="eli-emoji">🏅</span><div style="flex:1;min-width:0;"><div class="eli-name">${award.name}</div><div class="eli-tagline">${award.detail}</div></div><span class="eli-badge badge-chapter">State Award</span>`;
    list.appendChild(item);
  });
}

// ══════════ EVENT RENDERING ══════════
function renderEvents(filter) {
  const grid = document.getElementById('events-grid');
  if(!grid) return;
  grid.innerHTML = '';
  
  EVENTS.filter(e => filter === 'all' || e.type === filter)
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(e => {
      const label = {individual:'Individual',team:'Team',chapter:'Chapter'}[e.type];
      const card = document.createElement('div');
      card.className = 'event-card';
      card.setAttribute('data-type', e.type);
      card.innerHTML = `<span class="event-tag tag-${e.type}">${label}</span><div class="event-name">${e.emoji} ${e.name}</div><p class="event-desc">${e.desc}</p><div class="event-meta"><span>👤 ${e.participants}</span><span>⏱ ${e.duration}</span></div>`;
      card.onclick = () => openModal(e.id);
      grid.appendChild(card);
    });
}

function renderEventsFromArray(arr) {
  const grid = document.getElementById('events-grid');
  if(!grid) return;
  grid.innerHTML = '';
  arr.forEach(e => {
    const label = {individual:'Individual',team:'Team',chapter:'Chapter'}[e.type];
    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('data-type', e.type);
    card.innerHTML = `<span class="event-tag tag-${e.type}">${label}</span><div class="event-name">${e.emoji} ${e.name}</div><p class="event-desc">${e.desc}</p><div class="event-meta"><span>👤 ${e.participants}</span><span>⏱ ${e.duration}</span></div>`;
    card.onclick = () => openModal(e.id);
    grid.appendChild(card);
  });
}

// Search Logic
function debounce(fn, wait) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); }; }

function localSearch(query) {
  if (!query || !query.trim()) return EVENTS.slice().sort((a,b)=>a.name.localeCompare(b.name));
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = EVENTS.map(e => {
    const hay = [e.name, e.tagline, e.desc, (e.tips||[]).join(' ')].join(' ').toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 1 + (hay.indexOf(t)===0 ? 0.5 : 0);
    }
    return {...e, _score: score};
  }).filter(x => x._score > 0).sort((a,b)=>b._score - a._score || a.name.localeCompare(b.name));
  return scored;
}

function performSearch(query) {
  const q = (query || '').trim();
  if (!q) {
    renderEvents('all');
    return;
  }
  const results = localSearch(q);
  if (results.length) renderEventsFromArray(results);
  else document.getElementById('events-grid').innerHTML = '<div style="padding:18px;color:var(--muted);">No events match your search.</div>';
}

const debouncedSearch = debounce(q => performSearch(q), 300);

// ══════════ MODAL & UTILITY HANDLERS ══════════
function filterEvents(type, btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderEvents(type);
}

function openModal(id) {
  const e = EVENTS.find(ev => ev.id === id);
  if (!e) return;
  const label = {individual:'Individual',team:'Team',chapter:'Chapter'}[e.type];
  const resources = e.resources || EVENT_RESOURCES[e.id] || [];
  document.getElementById('modal-body').innerHTML = `
    <div style="margin-bottom:.6rem;"><span class="event-tag tag-${e.type}">${label}</span></div>
    <h2>${e.emoji} ${e.name}</h2>
    <p class="modal-overview">${e.desc}</p>
    <div class="modal-section"><h3>Key Rules</h3><ul>${e.rules.map(r=>`<li>${r}</li>`).join('')}</ul></div>
    <div class="modal-section modal-tips"><h3>💡 Prep Tips</h3><ul>${e.tips.map(t=>`<li>${t}</li>`).join('')}</ul></div>
    <div class="modal-section"><h3>Resources</h3>${renderResources(resources)}</div>
    <div style="margin-top:1rem;font-size:12.5px;color:#6b7280;">👤 ${e.participants} &nbsp;·&nbsp; ⏱ ${e.duration}</div>`;
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderResources(resources) {
  if (!resources.length) {
    return '<p class="resource-note">No resources have been added yet. Add helpful guides, links, or study materials to the event data under the <code>resources</code> field.</p>';
  }
  return `<ul class="resource-list">${resources.map(resource => `
      <li class="resource-item">
        <div class="resource-item-icon">📎</div>
        <div class="resource-item-content">
          <div class="resource-item-title">${resource.title}</div>
          <div class="resource-note">${resource.description || ''}</div>
          ${resource.url ? `<a class="resource-item-link" href="${resource.url}" target="_blank">Open resource</a>` : ''}
        </div>
      </li>`).join('')}</ul>`;
}

function closeModal(e) { if (e.target === document.getElementById('modal-overlay')) closeModalDirect(); }
function closeModalDirect() { document.getElementById('modal-overlay').classList.remove('open'); document.body.style.overflow=''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModalDirect(); });

function toggleNav() {
  const nav = document.getElementById('nav-links');
  const ham = document.getElementById('hamburger');
  const open = nav.classList.toggle('mobile-nav-open');
  ham.setAttribute('aria-expanded', open ? 'true' : 'false');
  nav.setAttribute('aria-hidden', open ? 'false' : 'true');
}

document.getElementById('hamburger')?.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleNav(); }
});

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('event-search');
  const clear = document.getElementById('search-clear');

  if(input && clear) {
      input.addEventListener('input', (e) => debouncedSearch(e.target.value));
      clear.addEventListener('click', () => { input.value = ''; performSearch(''); });
      performSearch('');
  }

  initHomeCarousel();
  buildHomeAwardsList();
});
