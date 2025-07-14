document.addEventListener('DOMContentLoaded', () => {
    fetch('navbar.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            const placeholder = document.getElementById('navbar-placeholder');
            if (placeholder) {
                placeholder.innerHTML = html;
            }
        })
        .catch(error => {
            console.error('Error loading navbar:', error);
        });
});
