import { doc, setDoc, increment, } from
'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js'; import { db }
from './firebase-app.js'; import { onAuthChange } from './auth-esm.js'; // Track
the current authenticated user at module level. // This avoids repeated
getCurrentUser() calls and provides // the uid for analytics writes when a user
is logged in. let currentUser = null; onAuthChange((user) => { currentUser =
user; }); const VISITOR_KEY = 'morfema:analytics:visitor'; const
DAILY_UNIQUE_KEY = 'morfema:analytics:last-daily'; const WEEKLY_UNIQUE_KEY =
'morfema:analytics:last-weekly'; const LAST_ROUTE_KEY =
'morfema:analytics:last-route'; function getVisitorId() { const stored =
localStorage.getItem(VISITOR_KEY); if (stored) return stored; const generated =
(crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) + '-' +
Math.random().toString(36).slice(2, 8); localStorage.setItem(VISITOR_KEY,
generated); return generated; } function getDayKey(date = new Date()) { return
date.toISOString().slice(0, 10); } function getWeekKey(date = new Date()) {
const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(),
date.getDate())); const dayNum = tmp.getUTCDay() || 7;
tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum); const yearStart = new
Date(Date.UTC(tmp.getUTCFullYear(), 0, 1)); const weekNo = Math.ceil(((tmp -
yearStart) / 86400000 + 1) / 7); return
`${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`; } function
buildRouteKey(pathname) { if (!pathname) return 'root'; return
encodeURIComponent(pathname.replace(/\/+$/, '') || '/'); } async function
updateDocSafe(ref, data) { try { await setDoc(ref, data, { merge: true }); }
catch (err) { console.warn('Analytics write failed', err); } } async function
recordTotals(dayKey, weekKey, isNewDailyVisitor, isNewWeeklyVisitor) { const
dailyRef = doc(db, 'analytics_daily', dayKey); const weeklyRef = doc(db,
'analytics_weekly', weekKey); await Promise.all([ updateDocSafe(dailyRef, {
date: dayKey, visits: increment(1), uniqueVisitors: isNewDailyVisitor ?
increment(1) : increment(0), lastUpdated: Date.now(), }),
updateDocSafe(weeklyRef, { week: weekKey, visits: increment(1), uniqueVisitors:
isNewWeeklyVisitor ? increment(1) : increment(0), lastUpdated: Date.now(), }),
]); } async function recordRouteViews(dayKey, weekKey, pathname) { const
routeKey = buildRouteKey(pathname); const dailyRef = doc(db,
'analytics_routes_daily', `${dayKey}_${routeKey}`); const weeklyRef = doc(db,
'analytics_routes_weekly', `${weekKey}_${routeKey}`); await Promise.all([
updateDocSafe(dailyRef, { date: dayKey, route: pathname, views: increment(1),
lastUpdated: Date.now(), }), updateDocSafe(weeklyRef, { week: weekKey, route:
pathname, views: increment(1), lastUpdated: Date.now(), }), ]); } async function
recordNavigation(dayKey, weekKey, from, to) { if (!from || !to || from === to)
return; const transition = `${from}->${to}`; const transitionKey =
encodeURIComponent(transition); const dailyRef = doc( db,
'analytics_navigation_daily', `${dayKey}_${transitionKey}`, ); const weeklyRef =
doc( db, 'analytics_navigation_weekly', `${weekKey}_${transitionKey}`, ); await
Promise.all([ updateDocSafe(dailyRef, { date: dayKey, from, to, transitions:
increment(1), lastUpdated: Date.now(), }), updateDocSafe(weeklyRef, { week:
weekKey, from, to, transitions: increment(1), lastUpdated: Date.now(), }), ]); }
// Main entrypoint: captures the current page, updates totals and navigation //
chains, and records a minimal heartbeat for the visitor. async function
trackPageView(pathname) { const visitorId = getVisitorId(); const dayKey =
getDayKey(); const weekKey = getWeekKey(); const lastDaily =
localStorage.getItem(DAILY_UNIQUE_KEY); const lastWeekly =
localStorage.getItem(WEEKLY_UNIQUE_KEY); const isNewDailyVisitor = lastDaily !==
dayKey; const isNewWeeklyVisitor = lastWeekly !== weekKey; // Persist the fact
we counted this visitor for the current windows to avoid // double counting
uniques on the same device. if (isNewDailyVisitor)
localStorage.setItem(DAILY_UNIQUE_KEY, dayKey); if (isNewWeeklyVisitor)
localStorage.setItem(WEEKLY_UNIQUE_KEY, weekKey); const previousRoute =
sessionStorage.getItem(LAST_ROUTE_KEY); sessionStorage.setItem(LAST_ROUTE_KEY,
pathname); await Promise.all([ recordTotals(dayKey, weekKey, isNewDailyVisitor,
isNewWeeklyVisitor), recordRouteViews(dayKey, weekKey, pathname),
recordNavigation(dayKey, weekKey, previousRoute, pathname), // Store a tiny
fingerprint so routes can be reconciled with visitors later // if needed. This
is intentionally lightweight and avoids PII. // Include uid when the user is
authenticated to associate analytics with user. updateDocSafe(doc(db,
'analytics_visitors', visitorId), { lastSeenDay: dayKey, lastSeenWeek: weekKey,
lastRoute: pathname, updatedAt: Date.now(), uid: currentUser ? currentUser.uid :
null, }), ]); } const currentPath = window.location ? window.location.pathname
|| '/' : '/'; trackPageView(currentPath);
