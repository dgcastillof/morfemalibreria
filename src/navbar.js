// Start fetching navbar immediately, don't wait for DOMContentLoaded
var navbarPromise = fetch('/navbar.html').then(function (res) { return res.text(); });

function initNavbar() {
    var container = document.getElementById('navbar');
    if (!container) return;

    navbarPromise.then(function (html) {
        container.innerHTML = html;
        var currentText = container.getAttribute('data-current');
        var toggle = container.querySelector('.nav-toggle');
        var links = container.querySelector('.nav-links');
        var current = container.querySelector('.current-section');
        if (current && currentText) current.textContent = currentText;
        if (toggle && links) {
            toggle.addEventListener('click', function () {
                links.classList.toggle('show');
                if (current) current.classList.toggle('hide');
            });
        }
    });
}

// Initialize as soon as possible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}
