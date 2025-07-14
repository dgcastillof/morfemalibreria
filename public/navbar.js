window.addEventListener('DOMContentLoaded', function () {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    var current = document.querySelector('.current-section');
    if (toggle && links) {
        toggle.addEventListener('click', function () {
            links.classList.toggle('show');
            if (current) {
                current.classList.toggle('hide');
            }
        });
    }
});
