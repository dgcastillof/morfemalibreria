// Multistep form logic for vende page
document.addEventListener('DOMContentLoaded', function () {
  const formSection = document.getElementById('form');
  const form = document.getElementById('sell-form');
  if (formSection) {
    formSection.classList.add('hidden');
  }

  const startButton = document.querySelector('[data-scroll-to="form"]');
  if (startButton && formSection) {
    startButton.addEventListener('click', function () {
      formSection.classList.remove('hidden');
      formSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (!form) return;

  const steps = form.querySelectorAll('.form-step');
  const progress = document.querySelectorAll('.progress-step');
  let current = 0;

  function showStep(index) {
    steps.forEach(function (step, i) {
      step.classList.toggle('current-step', i === index);
    });
    progress.forEach(function (p, i) {
      p.classList.toggle('active', i === index);
      p.classList.toggle('completed', i < index);
    });
  }

  function validateStep(idx) {
    const step = steps[idx];
    const fields = step.querySelectorAll(
      'input[required], select[required], textarea[required]',
    );
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  function createBookBlocks(count) {
    const container = document.getElementById('book-steps');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= count; i++) {
      const div = document.createElement('div');
      div.className = 'book-fields';
      div.dataset.book = String(i);
      div.innerHTML =
        '<h3>Libro ' +
        i +
        '</h3>' +
        '<div class="field-group">' +
        '<label for="title-' +
        i +
        '">Título</label>' +
        '<input type="text" id="title-' +
        i +
        '" name="title-' +
        i +
        '" required />' +
        '</div>' +
        '<div class="field-group">' +
        '<label for="price-' +
        i +
        '">Precio</label>' +
        '<input type="number" id="price-' +
        i +
        '" name="price-' +
        i +
        '" required />' +
        '</div>' +
        '<div class="field-group">' +
        '<label for="state-' +
        i +
        '">Estado</label>' +
        '<select id="state-' +
        i +
        '" name="state-' +
        i +
        '" required>' +
        '<option value="" disabled selected hidden>Seleccioná</option>' +
        '<option>Como nuevo</option>' +
        '<option>Muy bueno</option>' +
        '<option>Detalles</option>' +
        '</select>' +
        '</div>' +
        '<div class="field-group">' +
        '<label for="notes-' +
        i +
        '">Observaciones</label>' +
        '<textarea id="notes-' +
        i +
        '" name="notes-' +
        i +
        '" placeholder="Acá nos podés comentar si el libro está en otro idioma, si es una edición especial, si tiene detalles, y cualquier otro comentario que creas conveniente."></textarea>' +
        '</div>' +
        '<div class="field-group">' +
        '<label for="photo-' +
        i +
        '">Foto</label>' +
        '<input type="file" id="photo-' +
        i +
        '" name="photo-' +
        i +
        '" accept="image/*" required />' +
        '<small>Necesitamos una foto principal de la portada, lo más cerca posible.</small>' +
        '</div>';
      container.appendChild(div);
    }
  }

  function renderSummary() {
    const summary = document.getElementById('summary');
    if (!summary) return;
    summary.innerHTML =
      '<p><strong>Nombre:</strong> ' +
      form.name.value +
      '</p>' +
      '<p><strong>Email:</strong> ' +
      form.email.value +
      ' <small>Este dato es importante porque nos vamos a contactar con vos por ahí.</small></p>' +
      '<p><strong>Ciudad:</strong> ' +
      form.city.value +
      '</p>' +
      '<p><strong>Cantidad de libros:</strong> ' +
      form['book-count'].value +
      '</p>';
    const count = parseInt(form['book-count'].value, 10) || 0;
    for (let i = 1; i <= count; i++) {
      const details = document.createElement('details');
      const title = form['title-' + i].value;
      const price = form['price-' + i].value;
      const state = form['state-' + i].value;
      const notes = form['notes-' + i].value;
      details.innerHTML =
        '<summary>Libro ' +
        i +
        ': ' +
        title +
        '</summary>' +
        '<p><strong>Precio:</strong> ' +
        price +
        '</p>' +
        '<p><strong>Estado:</strong> ' +
        state +
        '</p>' +
        (notes ? '<p><strong>Observaciones:</strong> ' + notes + '</p>' : '');
      summary.appendChild(details);
    }
  }

  form.addEventListener('click', function (e) {
    if (e.target.closest('.next-button')) {
      e.preventDefault();
      if (!validateStep(current)) return;
      if (current === 1) {
        const count = parseInt(form['book-count'].value, 10);
        if (Number.isNaN(count) || count < 1) return;
        createBookBlocks(count);
      }
      if (current === 2) {
        renderSummary();
      }
      if (current < steps.length - 1) {
        current += 1;
        showStep(current);
      }
    }
    if (e.target.closest('.prev-button')) {
      e.preventDefault();
      if (current > 0) {
        current -= 1;
        showStep(current);
      }
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(current)) return;
    form.innerHTML =
      '<p class="success-message">\u00a1Gracias! Nos vamos a estar comunicando con vos por mail.</p>';
  });

  showStep(current);
});
