import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  where,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { db } from './firebase-app.js';

function renderTable(container, rows, headers) {
  const table = document.createElement('table');
  table.className = 'analytics-table';
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headers.forEach((text) => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((cell) => {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.innerHTML = '';
  container.appendChild(table);
}

async function loadDaily() {
  const q = query(
    collection(db, 'analytics_daily'),
    orderBy('date', 'desc'),
    limit(14),
  );
  const snap = await getDocs(q);
  const rows = snap.docs
    .map((doc) => doc.data())
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((data) => [
      data.date,
      data.visits || 0,
      data.uniqueVisitors || 0,
    ]);
  renderTable(
    document.getElementById('daily-visits'),
    rows,
    ['Fecha', 'Visitas', 'Usuarios únicos'],
  );
}

async function loadWeekly() {
  const q = query(
    collection(db, 'analytics_weekly'),
    orderBy('week', 'desc'),
    limit(8),
  );
  const snap = await getDocs(q);
  const rows = snap.docs
    .map((doc) => doc.data())
    .sort((a, b) => (a.week > b.week ? 1 : -1))
    .map((data) => [
      data.week,
      data.visits || 0,
      data.uniqueVisitors || 0,
    ]);
  renderTable(
    document.getElementById('weekly-visits'),
    rows,
    ['Semana', 'Visitas', 'Usuarios únicos'],
  );
}

function sevenDaysAgoKey() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

async function loadRoutes(range = 'daily') {
  const container = document.getElementById('route-views');
  const isWeekly = range === 'weekly';
  const startKey = isWeekly ? undefined : sevenDaysAgoKey();
  const collName = isWeekly
    ? 'analytics_routes_weekly'
    : 'analytics_routes_daily';
  let q;
  if (isWeekly) {
    q = query(collection(db, collName), orderBy('week', 'desc'), limit(12));
  } else {
    q = query(
      collection(db, collName),
      where('date', '>=', startKey),
      orderBy('date', 'asc'),
      limit(90),
    );
  }
  const snap = await getDocs(q);
  const totals = new Map();
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (!data.route) return;
    const current = totals.get(data.route) || 0;
    totals.set(data.route, current + (data.views || 0));
  });
  const rows = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([route, views]) => [route, views]);
  renderTable(container, rows, ['Ruta', 'Vistas']);
}

async function loadNavigation() {
  const container = document.getElementById('navigation-views');
  const start = sevenDaysAgoKey();
  const q = query(
    collection(db, 'analytics_navigation_daily'),
    where('date', '>=', start),
    orderBy('date', 'asc'),
    limit(120),
  );
  const snap = await getDocs(q);
  const totals = new Map();
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const key = `${data.from || 'desconocido'} → ${data.to || 'desconocido'}`;
    const current = totals.get(key) || 0;
    totals.set(key, current + (data.transitions || 0));
  });
  const rows = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([routes, count]) => [routes, count]);
  renderTable(container, rows, ['Navegación', 'Veces']);
}

async function bootstrap() {
  try {
    await loadDaily();
    await loadWeekly();
    await loadRoutes('daily');
    await loadNavigation();
  } catch (err) {
    console.error('No se pudo cargar analytics', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const rangeSelector = document.getElementById('route-range');
  if (rangeSelector) {
    rangeSelector.addEventListener('change', (e) => {
      loadRoutes(e.target.value);
    });
  }
  bootstrap();
});
