const fallbackData = {
  contact: {
    phone: '+91 00000 00000',
    email: 'sarangabjp@example.com',
    address: 'Saranga, Bankura, West Bengal',
    whatsapp: '910000000000',
    mapUrl: 'https://maps.google.com/?q=Saranga%20Bankura%20West%20Bengal'
  },
  social: {
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    youtube: 'https://youtube.com/'
  },
  donation: {
    upiId: 'sarangabjp@exampleupi',
    qrImage: '/assets/donation-qr-placeholder.svg'
  },
  leaders: [],
  updates: [{
    title: 'Membership and volunteer registration open',
    body: 'Submit details online and the admin team will review applications.',
    category: 'Announcement',
    event_date: new Date().toISOString(),
    image_url: '/assets/update-placeholder.svg'
  }],
  events: [{
    title: 'Saranga organizational meeting',
    description: 'Add upcoming meetings, rallies, and booth programs from the admin panel.',
    place: 'Saranga',
    event_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    event_time: '10:00 AM',
    image_url: '/assets/event-placeholder.svg'
  }],
  gallery: [{
    title: 'Community activity',
    image_url: '/assets/gallery-placeholder.svg',
    caption: 'Photos and videos appear here.'
  }],
  members: []
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function image(url, fallback = '/assets/gallery-placeholder.svg') {
  return esc(url || fallback);
}

function formatDate(value) {
  if (!value) return 'Recent';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function limit(items, count) {
  return (items || []).slice(0, count);
}

function shellHeader() {
  document.querySelectorAll('.shell-header').forEach((header) => {
    header.innerHTML = `
      <a class="brand" href="/">
  <img src="/assets/logo.jpeg" alt="Saranga BJP Logo" class="brand-logo">
  <span>
    <strong data-i18n="siteTitle">Saranga BJP Paribar</strong>
    <small data-i18n="siteSubtitle">Nation First. Development for All.</small>
  </span>
</a>

<div class="top-buttons">
  <button id="languageToggle" class="lang-btn">বাংলা</button>
  <button class="menu-button" type="button" aria-label="Open navigation" aria-expanded="false" data-i18n="menu">Menu</button>
</div>

<nav class="nav">
  <a href="/" data-i18n="home">Home</a>
  <a href="/about.html" data-i18n="about">About</a>
  <a href="/leadership.html" data-i18n="leadership">Leadership</a>
  <a href="/news.html" data-i18n="news">News</a>
  <a href="/events.html" data-i18n="events">Events</a>
  <a href="/gallery.html" data-i18n="gallery">Gallery</a>
  <a href="/contact.html" data-i18n="contact">Contact</a>
  <a href="/member-login.html">Member Login</a>
<a href="/admin-login.html">Admin Login</a>
<a href="/admin-apply.html">Apply Admin</a>
  <a class="nav-cta" href="/membership.html" data-i18n="joinUs">Join Us</a>
      </nav>
    `;
  });
}

function setupMenu() {

  const button = document.querySelector('.menu-button');

  const nav = document.querySelector('.nav');

  if (!button || !nav) return;

  button.addEventListener('click', () => {

    nav.classList.toggle('open');

  });

}

function setupSlider() {
  const slides = Array.from(document.querySelectorAll('.slider-image'));
  if (slides.length < 2) return;
  let index = 0;
  setInterval(() => {
    slides[index].classList.remove('active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('active');
  }, 4200);
}

function renderFooter(data) {
  document.querySelectorAll('.footer').forEach((footer) => {
    footer.innerHTML = `
      <div>
        <strong>Saranga BJP Paribar</strong>
        <p>${esc(data.contact.address)}</p>
        <p>${esc(data.contact.phone)} | ${esc(data.contact.email)}</p>
      </div>
      <div class="footer-links">
        <a href="/membership.html">Join Us</a>
        <a href="/contact.html">Contact</a>
        <a href="/admin.html">Admin</a>
      </div>
    `;
  });

  const whatsapp = document.querySelector('#whatsapp-float');
  if (whatsapp) {
    whatsapp.href = `https://wa.me/${encodeURIComponent(data.contact.whatsapp || '')}`;
  }
}

function renderPeople(target, items, emptyText) {
  if (!target) return;
  target.innerHTML = items.length ? items.map((item) => `
    <article class="person-card">
      <img src="${image(item.image_url, '/assets/leader-placeholder.svg')}" alt="${esc(item.full_name)}">
      <div class="card-body">
        <p class="designation">${esc(item.designation || 'Member')}</p>
        <h3>${esc(item.full_name)}</h3>
        <p>${esc(item.bio || item.village_or_ward || 'Saranga BJP Paribar')}</p>
        ${item.phone || item.social_url ? `<div class="mini-links">${item.phone ? `<span>${esc(item.phone)}</span>` : ''}${item.social_url ? `<a href="${esc(item.social_url)}" target="_blank" rel="noreferrer">Social</a>` : ''}</div>` : ''}
      </div>
    </article>
  `).join('') : `<p class="empty-state">${esc(emptyText)}</p>`;
}

function renderUpdates(target, items) {
  if (!target) return;
  target.innerHTML = items.length ? items.map((item) => `
    <article class="update-card">
      <img src="${image(item.image_url, '/assets/update-placeholder.svg')}" alt="${esc(item.title)}">
      <div class="card-body">
        <p class="meta">${esc(item.category || 'News')} | ${formatDate(item.event_date || item.created_at)}</p>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.body)}</p>
      </div>
    </article>
  `).join('') : '<p class="empty-state">News and updates will appear here.</p>';
}

function renderEvents(target, items) {
  if (!target) return;
  target.innerHTML = items.length ? items.map((item) => `
    <article class="event-card">
      <div class="event-date">
        <strong>${formatDate(item.event_date).split(' ')[0]}</strong>
        <span>${formatDate(item.event_date).replace(/^[^ ]+ /, '')}</span>
      </div>
      <div>
        <p class="meta">${esc(item.place)}${item.event_time ? ` | ${esc(item.event_time)}` : ''}</p>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.description)}</p>
      </div>
    </article>
  `).join('') : <p data-i18n="upcomingEventsEmpty">Upcoming events will appear here.</p>;
}

function renderGallery(target, items) {
  if (!target) return;
  target.innerHTML = items.length ? items.map((item) => `
    <article class="gallery-card" data-image="${image(item.image_url)}">
      <img src="${image(item.image_url)}" alt="${esc(item.title)}">
      <div class="card-body">
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.caption || 'Saranga BJP Paribar gallery')}</p>
        ${item.video_url ? `<a class="inline-link" href="${esc(item.video_url)}" target="_blank" rel="noreferrer">Watch video</a>` : ''}
      </div>
    </article>
  `).join('') : '<p class="empty-state">Gallery photos can be added from the admin panel.</p>';
}

function setupLightbox() {
  const lightbox = document.querySelector('#lightbox');
  if (!lightbox) return;
  const img = lightbox.querySelector('img');
  document.querySelectorAll('.gallery-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.tagName === 'A') return;
      img.src = card.dataset.image;
      lightbox.hidden = false;
    });
  });
  lightbox.querySelector('button').addEventListener('click', () => {
    lightbox.hidden = true;
    img.src = '';
  });
}

function renderContact(data) {
  const contact = document.querySelector('#contact-details');
  if (contact) {
    contact.innerHTML = `
      <p><strong>Phone:</strong> ${esc(data.contact.phone)}</p>
      <p><strong>Email:</strong> ${esc(data.contact.email)}</p>
      <p><strong>Address:</strong> ${esc(data.contact.address)}</p>
      <p><strong>WhatsApp:</strong> ${esc(data.contact.whatsapp)}</p>
    `;
  }
  const social = document.querySelector('#social-details');
  if (social) {
    social.innerHTML = `
      <a class="button secondary" href="${esc(data.social.facebook)}" target="_blank" rel="noreferrer">Facebook</a>
      <a class="button secondary" href="${esc(data.social.instagram)}" target="_blank" rel="noreferrer">Instagram</a>
      <a class="button secondary" href="${esc(data.social.youtube)}" target="_blank" rel="noreferrer">YouTube</a>
    `;
  }
  const map = document.querySelector('#map-link');
  if (map) map.href = data.contact.mapUrl;

  const upi = document.querySelector('#upi-id');
  const qr = document.querySelector('#qr-image');
  if (upi) upi.textContent = data.donation.upiId;
  if (qr) qr.src = data.donation.qrImage;
}

function renderHomeStats(data) {

  const members = document.querySelector('#stat-members');
  const events = document.querySelector('#stat-events');

  const membersData = data?.members || [];
  const eventsData = data?.events || [];

  if (members) {
    members.textContent = membersData.length;
  }

  if (events) {
    events.textContent = eventsData.length;
  }
}

async function loadSite() {
  let data = fallbackData;
  try {
    const response = await fetch('/api/site');
    if (response.ok) data = await response.json();
  } catch {
    data = fallbackData;
  }

  renderFooter(data);
  renderContact(data);
  renderHomeStats(data);

  renderPeople(document.querySelector('#home-leaders'), limit(data.leaders, 3), 'Leadership profiles can be added from the admin panel.');
  renderPeople(document.querySelector('#leaders-list'), data.leaders, 'Leadership profiles can be added from the admin panel.');
  renderPeople(document.querySelector('#members-list'), data.members, 'Approved members will appear here.');

  renderUpdates(document.querySelector('#home-updates'), limit(data.updates, 3));
  renderUpdates(document.querySelector('#updates-list'), data.updates);

  renderEvents(document.querySelector('#home-events'), limit(data.events, 4));
  renderEvents(document.querySelector('#events-list'), data.events);

  renderGallery(document.querySelector('#home-gallery'), limit(data.gallery, 6));
  renderGallery(document.querySelector('#gallery-list'), data.gallery);
  setupLightbox();
}

shellHeader();
setupMenu();
setupSlider();
loadSite();
