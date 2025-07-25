document.addEventListener('DOMContentLoaded', function () { var container =
document.getElementById('navbar'); if (!container) return; var script =
document.currentScript || document.querySelector('script[src$="navbar.js"]');
var base = ''; if (script) { base = script.getAttribute('data-base') || ''; if
(!base) { var src = script.getAttribute('src') || ''; var idx =
src.lastIndexOf('/'); if (idx !== -1) base = src.slice(0, idx + 1); } }
fetch(base + 'navbar.html') .then(function (res) { return res.text(); })
.then(function (html) { container.innerHTML = html; var currentText =
container.getAttribute('data-current'); var toggle =
container.querySelector('.nav-toggle'); var links =
container.querySelector('.nav-links'); var current =
container.querySelector('.current-section'); if (current && currentText)
current.textContent = currentText; if (toggle && links) {
toggle.addEventListener('click', function () { links.classList.toggle('show');
if (current) current.classList.toggle('hide'); }); } }); });
