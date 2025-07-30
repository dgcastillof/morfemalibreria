document.addEventListener('DOMContentLoaded', function () { const formSection =
document.getElementById('form'); const form =
document.getElementById('sell-form'); if (formSection) {
formSection.classList.add('hidden'); } if (!form) return; const startButton =
document.querySelector('[data-scroll-to="form"]'); if (startButton &&
formSection) { startButton.addEventListener('click', function () {
formSection.classList.remove('hidden'); formSection.scrollIntoView({ behavior:
'smooth' }); }); } const steps = form.querySelectorAll('.form-step'); const
progress = document.querySelectorAll('.progress-step'); let current = 0;
function showStep(index) { steps.forEach(function (step, i) {
step.classList.toggle('current-step', i === index); });
progress.forEach(function (p, i) { p.classList.toggle('active', i === index);
p.classList.toggle('completed', i < index); }); } form.addEventListener('click',
function (e) { if (e.target.closest('.next-button')) { e.preventDefault(); if
(current < steps.length - 1) { current += 1; showStep(current); } } if
(e.target.closest('.prev-button')) { e.preventDefault(); if (current > 0) {
current -= 1; showStep(current); } } }); showStep(current); });
