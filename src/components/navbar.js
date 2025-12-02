document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('navbar');
    if (!container) return;

    // Navbar HTML is now injected at build time, just set up interactions
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
