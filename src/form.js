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
  const progressText = document.querySelector('.progress-text');
  let books = [];
  let current = 0;

  function showStep(index) {
    steps.forEach(function (step, i) {
      step.classList.toggle('current-step', i === index);
    });
    progress.forEach(function (p, i) {
      p.classList.toggle('active', i === index);
      p.classList.toggle('completed', i < index);
    });
    if (progressText) {
      progressText.textContent = 'Paso ' + (index + 1) + ' de ' + steps.length;
    }
  }

  function validateStep(idx) {
    const step = steps[idx];
    const fields = step.querySelectorAll(
      'input[required], select[required], textarea[required]'
    );
    const optionalPrices = step.querySelectorAll('input[name^="price-"]');
    let valid = true;

    function showError(field, message) {
      const group = field.closest('.field-group');
      if (!group) return;
      group.classList.add('invalid');
      let msg = group.querySelector('.error-message');
      if (!msg) {
        msg = document.createElement('small');
        msg.className = 'error-message';
        group.appendChild(msg);
      }
      msg.textContent = message;
    }

    function clearError(field) {
      const group = field.closest('.field-group');
      if (!group) return;
      group.classList.remove('invalid');
      const msg = group.querySelector('.error-message');
      if (msg) msg.textContent = '';
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPrice(value) {
      return /^\d+(\.\d{1,2})?$/.test(value) && parseFloat(value) > 0;
    }

    function validateFileInput(input) {
      const file = input.files[0];
      if (!file) {
        showError(input, 'Seleccioná una imagen');
        return false;
      }
      const validTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/jpg',
      ];
      if (!validTypes.includes(file.type)) {
        showError(input, 'Formato de imagen inválido');
        return false;
      }
      if (file.size > 2 * 1024 * 1024) {
        showError(input, 'La imagen debe pesar menos de 2MB');
        return false;
      }
      return true;
    }

    for (const field of fields) {
      clearError(field);
      const value = field.value.trim();
      if (field.type === 'email') {
        if (!isValidEmail(value)) {
          showError(field, 'Ingresá un email válido');
          valid = false;
        }
      } else if (field.name.startsWith('price')) {
        if (value !== '' && !isValidPrice(value)) {
          showError(field, 'El precio debe ser positivo');
          valid = false;
        }
      } else if (field.type === 'file') {
        if (!validateFileInput(field)) {
          valid = false;
        }
      } else if (value === '') {
        showError(field, 'Este campo es obligatorio');
        valid = false;
      } else if (!field.checkValidity()) {
        field.reportValidity();
        valid = false;
      }
    }

    for (const field of optionalPrices) {
      if (Array.from(fields).includes(field)) continue;
      clearError(field);
      const value = field.value.trim();
      if (value !== '' && !isValidPrice(value)) {
        showError(field, 'El precio debe ser positivo');
        valid = false;
      }
    }

    return valid;
  }

  function renderBookBlocks() {
    const container = document.getElementById('book-steps');
    if (!container) return;
    container.innerHTML = '';
    books.forEach(function (book, idx) {
      const i = idx + 1;
      const div = document.createElement('div');
      div.className = 'book-fields';
      div.dataset.index = String(idx);
      div.innerHTML =
        '<button type="button" class="remove-book-button" data-index="' +
        idx +
        '">✖</button>' +
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
        '" placeholder="Si lo dej\u00e1s vac\u00edo nosotros te sugerimos un precio" />' +
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
      if (book.title) form['title-' + i].value = book.title;
      if (book.price) form['price-' + i].value = book.price;
      if (book.state) form['state-' + i].value = book.state;
      if (book.notes) form['notes-' + i].value = book.notes;
    });
  }

  function syncBooksFromForm() {
    books = books.map(function (b, idx) {
      const i = idx + 1;
      return {
        title: form['title-' + i].value,
        price: form['price-' + i].value,
        state: form['state-' + i].value,
        notes: form['notes-' + i].value,
        file: form['photo-' + i].files[0] || null,
      };
    });
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
    books.forEach(function (book, idx) {
      const i = idx + 1;
      const details = document.createElement('details');
      const title = book.title;
      const price = book.price;
      const state = book.state;
      const notes = book.notes;
      details.innerHTML =
        '<summary>Libro ' +
        i +
        ': ' +
        title +
        '</summary>' +
        '<p><strong>Precio:</strong> ' +
        (price ? price : 'A definir') +
        '</p>' +
        '<p><strong>Estado:</strong> ' +
        state +
        '</p>' +
        (notes ? '<p><strong>Observaciones:</strong> ' + notes + '</p>' : '');
      summary.appendChild(details);
    });
  }

  form.addEventListener('click', function (e) {
    if (e.target.closest('.next-button')) {
      e.preventDefault();
      if (!validateStep(current)) return;
      if (current === 1) {
        const count = parseInt(form['book-count'].value, 10);
        if (Number.isNaN(count) || count < 1) return;
        books = Array.from({ length: count }, () => ({}));
        renderBookBlocks();
      }
      if (current === 2) {
        syncBooksFromForm();
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
    if (e.target.id === 'add-book') {
      e.preventDefault();
      if (books.length < 50) {
        books.push({});
        renderBookBlocks();
      }
    }
    if (e.target.classList.contains('remove-book-button')) {
      e.preventDefault();
      const idx = parseInt(e.target.dataset.index, 10);
      if (!Number.isNaN(idx)) {
        books.splice(idx, 1);
        renderBookBlocks();
      }
    }
    if (e.target.id === 'edit-books') {
      e.preventDefault();
      showStep(2);
    }
  });

  async function loadFirebase() {
    if (window._firebase) return window._firebase;
    const [{ initializeApp }, firestore, storage, { default: config }] =
      await Promise.all([
        import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js'),
        import(
          'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js'
        ),
        import('https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js'),
        import('/firebase-config.js'),
      ]);
    const app = initializeApp(config);
    window._firebase = {
      db: firestore.getFirestore(app),
      storage: storage.getStorage(app),
      addDoc: firestore.addDoc,
      collection: firestore.collection,
      serverTimestamp: firestore.serverTimestamp,
      ref: storage.ref,
      uploadBytes: storage.uploadBytes,
      getDownloadURL: storage.getDownloadURL,
    };
    return window._firebase;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validateStep(current)) return;

    const fb = await loadFirebase();
    syncBooksFromForm();
    const booksData = [];
    for (let i = 1; i <= books.length; i++) {
      const file = form['photo-' + i].files[0];
      let photoUrl = '';
      if (file) {
        const photoRef = fb.ref(
          fb.storage,
          'book_photos/' + Date.now() + '-' + file.name,
        );
        try {
          await fb.uploadBytes(photoRef, file);
          photoUrl = await fb.getDownloadURL(photoRef);
        } catch (err) {
          console.error('Error uploading', file.name, file.size, err);
          alert('No pudimos subir la foto ' + file.name);
        }
      }
      const priceValue = form['price-' + i].value;
      booksData.push({
        title: form['title-' + i].value,
        price: priceValue ? Number(priceValue) : null,
        priceMissing: priceValue === '',
        condition: form['state-' + i].value,
        notes: form['notes-' + i].value,
        photoUrl,
      });
    }

    const data = {
      user: {
        name: form.name.value,
        email: form.email.value,
        city: form.city.value,
        accepted_terms: form.terms.checked,
      },
      books: booksData,
      submittedAt: fb.serverTimestamp(),
    };

    try {
      await fb.addDoc(fb.collection(fb.db, 'book_submissions'), data);
      form.innerHTML =
        '<p class="success-message">\u00a1Gracias! Nos vamos a estar comunicando con vos por mail.</p>';
    } catch (err) {
      console.error('Error saving form', err);
      alert(
        'Ocurri\u00f3 un problema al enviar el formulario. Intentalo nuevamente.',
      );
    }
  });

  showStep(current);
});
