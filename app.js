'use strict';

/* ============================================================
   Лаб 6. Тема: «Туристична компанія "Мандрівник"»
   Обробка серверних даних на JS: Fetch API + JSON +
   async/await + обробка помилок.
   Розширює app.js з Лаб 5.
   ============================================================ */

/* ============================================================
   (1) Тема (з Лаб 5) — на всіх сторінках
   ============================================================ */
const themeBtn = document.getElementById('theme-toggle');
const root = document.documentElement;

// 1. Відновлення збереженої теми
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  root.setAttribute('data-theme', savedTheme);
  root.style.setProperty('--color-accent', savedTheme === 'dark' ? '#4ea8de' : '#0077b6');
  if (themeBtn) {
    themeBtn.textContent = savedTheme === 'dark' ? '☀️ Тема' : '🌙 Тема';
  }
}

// 2. Логіка перемикання та збереження
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    root.style.setProperty('--color-accent', next === 'dark' ? '#4ea8de' : '#0077b6');
    themeBtn.textContent = next === 'dark' ? '☀️ Тема' : '🌙 Тема';
    localStorage.setItem('theme', next); // Зберігаємо вибір
  });
}

/* ============================================================
   (2) Каталог турів — fallback-дані для калькулятора
   (якщо tours.json ще не завантажений)
   ============================================================ */
let toursMap = {
  turkey: { name: 'Туреччина', basePrice: 800,  baseNights: 7  },
  egypt:  { name: 'Єгипет',    basePrice: 1100, baseNights: 10 },
  greece: { name: 'Греція',    basePrice: 950,  baseNights: 8  },
  italy:  { name: 'Італія',    basePrice: 1300, baseNights: 9  },
};

const calculateTotal = ({ tourKey, people, nights }) => {
  const tour = toursMap[tourKey];
  if (!tour) throw new Error(`Невідомий тур: ${tourKey}`);
  if (!Number.isInteger(people) || people < 1) throw new Error('К-ть людей ≥ 1');
  if (!Number.isInteger(nights) || nights < 1) throw new Error('К-ть ночей ≥ 1');

  const { name, basePrice, baseNights } = tour;
  const subtotal = (basePrice / baseNights) * nights * people;
  const discountRate = people >= 5 ? 0.15 : people >= 3 ? 0.10 : 0;
  const total = subtotal * (1 - discountRate);
  return { tourName: name, people, nights,
           subtotal: Math.round(subtotal), discountRate, total: Math.round(total) };
};

const calcForm = document.getElementById('calc-form');
if (calcForm) {
  const resultEl = document.getElementById('calc-result');
  calcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const r = calculateTotal({
        tourKey: document.getElementById('calc-tour').value,
        people:  Number(document.getElementById('calc-people').value),
        nights:  Number(document.getElementById('calc-nights').value),
      });
      resultEl.classList.remove('error'); resultEl.classList.add('success');
      resultEl.textContent =
        `Тур: ${r.tourName}\n${r.people} людей × ${r.nights} ночей\n` +
        `Сума: ${r.subtotal} USD\nЗнижка: ${r.discountRate * 100}%\n` +
        `Підсумок: ${r.total} USD`;
    } catch (err) {
      resultEl.classList.remove('success'); resultEl.classList.add('error');
      resultEl.textContent = `Помилка: ${err.message}`;
    }
  });
}

/* ============================================================
   (3) Делегування подій (з Лаб 5) — обране, copy, share
   ============================================================ */
const grid = document.getElementById('hot-tours');
const statusMsg = document.getElementById('status-msg');
const favCountEl = document.getElementById('fav-count');
const favorites = new Set();

const setStatus = (text) => { if (statusMsg) statusMsg.textContent = text; };

if (grid) {
  grid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const card = button.closest('.tour-card');
    const tourKey = card?.dataset.tour;
    const tourName = card?.querySelector('.card-title')?.textContent ?? '';
    const action = button.dataset.action;

    button.classList.add('flash');
    setTimeout(() => button.classList.remove('flash'), 400);

    switch (action) {
      case 'favorite': toggleFavorite(tourKey, tourName); break;
      case 'copy':     copyText(tourName); break;
      case 'share':    shareTour(tourName); break;
    }
  });
}

const toggleFavorite = (key, name) => {
  if (!key) return;
  if (favorites.has(key)) { favorites.delete(key); setStatus(`Видалено з обраного: ${name}`); }
  else { favorites.add(key); setStatus(`Додано в обране: ${name}`); }
  favCountEl.textContent = favorites.size;
  document.querySelectorAll('.tour-card').forEach((c) =>
    c.classList.toggle('is-fav', favorites.has(c.dataset.tour))
  );
};

const copyText = (text) => {
  navigator.clipboard?.writeText(text);
  setStatus(`Скопійовано: «${text}»`);
};

const shareTour = (name) => {
  setStatus('Готуємо посилання...');
  new Promise((res) => setTimeout(() => res(`https://example.com/tour/${encodeURIComponent(name)}`), 600))
    .then((url) => setStatus(`Посилання готове: ${url}`));
};

/* ============================================================
   (4) Бронювання (з Лаб 5)
   ============================================================ */
const bookingForm = document.getElementById('booking-form');
const bookingStatus = document.getElementById('booking-status');
if (bookingForm) {
  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    bookingStatus.textContent = 'Відправляємо заявку...';
    new Promise((res) => setTimeout(res, 600)).then(() => {
      bookingStatus.textContent = 'Заявку отримано! Менеджер зв\'яжеться найближчим часом.';
      bookingForm.reset();
    });
  });
}

/* ============================================================
   ============================================================
   (5) НОВЕ В ЛАБ 6: завантаження каталогу турів з tours.json
       через Fetch API + async/await + обробка помилок.
   ============================================================
   ============================================================ */

const loader   = document.getElementById('loader');
const errorMsg = document.getElementById('error-msg');
const metaEl   = document.getElementById('catalog-meta');
const reloadBtn = document.getElementById('reload-btn');

/* Чиста async-функція: повертає Promise<{updated, tours[]}> */
const loadTours = async () => {
  if (loader)   loader.hidden = false;
  if (errorMsg) errorMsg.hidden = true;
  if (grid)     grid.hidden = true;

  try {
    // fetch() повертає Promise<Response>
    const response = await fetch('tours.json', { cache: 'no-store' });

    if (!response.ok) {
      // Не-2xx статус — кидаємо помилку, її перехопить catch
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    // .json() теж асинхронний — чекаємо
    const data = await response.json();

    if (!Array.isArray(data.tours)) {
      throw new Error('Неочікуваний формат JSON: відсутнє поле "tours"');
    }

    return data;
  } catch (error) {
    // Мережеві помилки, неправильний JSON або throw вище
    console.error('Помилка завантаження tours.json:', error);
    throw error;
  } finally {
    // finally виконається завжди — навіть при помилці
    if (loader) loader.hidden = true;
  }
};

/* ---- Рендер однієї картки через template-рядок ---- */
const renderCard = (tour) => {
  const { key, name, country, nights, price, rating, description, image } = tour;
  return `
    <article class="tour-card" data-tour="${key}">
      <div class="tour-emoji" aria-hidden="true">${image ?? '🌍'}</div>
      <h4 class="card-title">${name}</h4>
      <p class="muted">${country} · ${nights} ночей · ⭐ ${rating}</p>
      <p>${description}</p>
      <p class="price"><strong>Ціна:</strong> від ${price} USD</p>
      <a class="btn" href="details.html?id=${key}">Детальніше</a>
      <div class="card-actions">
        <button data-action="favorite" aria-label="Додати в обране">★</button>
        <button data-action="copy" aria-label="Копіювати назву">⧉</button>
        <button data-action="share" aria-label="Поділитися">↗</button>
      </div>
    </article>
  `;
};

const renderCatalog = ({ updated, tours }) => {
  // Оновлюємо локальний словник для калькулятора
  toursMap = Object.fromEntries(tours.map((t) => [
    t.key,
    { name: t.country, basePrice: t.price, baseNights: t.nights },
  ]));

  if (!grid) return;
  grid.innerHTML = tours.map(renderCard).join('');
  grid.hidden = false;

  if (metaEl) {
    metaEl.textContent = `Оновлено: ${updated} · знайдено ${tours.length} турів`;
  }
};

const showError = (message) => {
  if (!errorMsg) return;
  errorMsg.textContent = `Помилка: ${message}`;
  errorMsg.hidden = false;
};

/* ---- Логіка для сторінки деталей (details.html) ---- */
const initDetails = async () => {
  const tourContent = document.getElementById('tour-content');
  if (!tourContent) return;

  const urlParams = new URLSearchParams(window.location.search);
  const tourId = urlParams.get('id');

  if (!tourId) {
    showError('ID туру не вказано');
    return;
  }

  try {
    const data = await loadTours();
    const tour = data.tours.find(t => t.key === tourId);

    if (!tour) {
      showError('Тур не знайдено');
      return;
    }

    // Заповнення сторінки даними
    document.title = `${tour.name} — Мандрівник`;
    document.getElementById('tour-emoji').textContent = tour.image || '🌍';
    document.getElementById('tour-name').textContent = tour.name;
    document.getElementById('tour-meta').textContent = `${tour.country} · ${tour.nights} ночей · ⭐ ${tour.rating}`;
    document.getElementById('tour-full-description').textContent = tour.fullDescription || tour.description;
    document.getElementById('tour-price').textContent = tour.price;

    const includedList = document.getElementById('tour-included');
    if (tour.included && Array.isArray(tour.included)) {
      includedList.innerHTML = tour.included.map(item => `<li>${item}</li>`).join('');
    }

    tourContent.hidden = false;
  } catch (error) {
    showError(error.message);
  }
};

/* ---- Стартова точка ---- */
if (grid && loader) {
  const init = async () => {
    try {
      const data = await loadTours();
      renderCatalog(data);
    } catch (error) {
      showError(error.message);
    }
  };

  init();
  reloadBtn?.addEventListener('click', init);
}

// Запуск ініціалізації деталей, якщо ми на відповідній сторінці
if (document.getElementById('tour-details')) {
  initDetails();
}

/* ============================================================
   (6) Event Loop (з Лаб 5)
   ============================================================ */
console.log('1: синхронний старт');
setTimeout(() => console.log('4: setTimeout (macrotask)'), 0);
Promise.resolve().then(() => console.log('3: Promise.then (microtask)'));
console.log('2: синхронний кінець');
