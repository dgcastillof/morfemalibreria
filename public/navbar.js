window.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    const current = document.querySelector('.current-section');
    if (toggle && links) {
        toggle.addEventListener('click', () => {
            links.classList.toggle('show');
            if (current) {
                current.classList.toggle('hide');
            }
        });
    }
});
