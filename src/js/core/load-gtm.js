(function () { // Load the lightweight analytics module on every page so visits
and page // views are recorded even before GTM finishes loading. var
analyticsScript = document.createElement('script'); analyticsScript.type =
'module'; analyticsScript.src = '/analytics-esm.js'; analyticsScript.defer =
true; document.head.appendChild(analyticsScript); fetch('/gtm.html')
.then(function (res) { return res.text(); }) .then(function (html) { var
container = document.createElement('div'); container.innerHTML = html; var
script = container.querySelector('script'); if (script) {
document.head.prepend(script); } var insertNoscript = function () { var ns =
container.querySelector('noscript'); if (ns) { document.body.insertBefore(ns,
document.body.firstChild); } }; if (document.body) { insertNoscript(); } else {
window.addEventListener('DOMContentLoaded', insertNoscript); } }); })();
