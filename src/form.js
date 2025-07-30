// Multistep form logic for vende page
document.addEventListener('DOMContentLoaded', function () {
  const formSection = document.getElementById('form');
  const form = document.getElementById('sell-form');
  const feedback = document.getElementById('form-feedback');
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
      'input[required], select[required], textarea[required]',
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
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
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
        '<img id="preview-' +
        i +
        '" class="photo-preview hidden" alt="Previsualización" />' +
        '<div id="progress-container-' +
        i +
        '" class="progress-container hidden">' +
        '<progress id="progress-' +
        i +
        '" value="0" max="100"></progress>' +
        '<span id="percent-' +
        i +
        '">0%</span>' +
        '</div>' +
        '<small class="error-message upload-error" id="upload-error-' +
        i +
        '"></small>' +
        '<button type="button" class="retry-upload hidden" id="retry-' +
        i +
        '" data-index="' +
        i +
        '">Reintentar</button>' +
        '<small>Necesitamos una foto principal de la portada, lo más cerca posible.</small>' +
        '</div>';
      container.appendChild(div);
      if (book.title) form['title-' + i].value = book.title;
      if (book.price) form['price-' + i].value = book.price;
      if (book.state) form['state-' + i].value = book.state;
      if (book.notes) form['notes-' + i].value = book.notes;
      if (book.previewUrl) {
        const img = document.getElementById('preview-' + i);
        if (img) {
          img.src = book.previewUrl;
          img.classList.remove('hidden');
        }
      }
    });
  }

  function previewImage(input) {
    const parts = input.id.split('-');
    const id = parts[1];
    const file = input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = document.getElementById('preview-' + id);
    if (img) {
      img.src = url;
      img.classList.remove('hidden');
    }
    books[id - 1].previewUrl = url;
    const err = document.getElementById('upload-error-' + id);
    if (err) err.textContent = '';
    const retry = document.getElementById('retry-' + id);
    if (retry) retry.classList.add('hidden');
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
        photoUrl: b.photoUrl || '',
        previewUrl: b.previewUrl || '',
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
    if (e.target.classList.contains('retry-upload')) {
      e.preventDefault();
      const idx = parseInt(e.target.dataset.index, 10);
      const file = form['photo-' + idx].files[0];
      if (file) {
        uploadBookPhoto(idx, file);
      }
    }
    if (e.target.id === 'edit-books') {
      e.preventDefault();
      showStep(2);
    }
  });

  form.addEventListener('change', function (e) {
    if (e.target.matches('input[type="file"]')) {
      previewImage(e.target);
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
      uploadBytesResumable: storage.uploadBytesResumable,
      getDownloadURL: storage.getDownloadURL,
    };
    return window._firebase;
  }

  async function uploadBookPhoto(index, file) {
    const fb = await loadFirebase();
    const progress = document.getElementById('progress-' + index);
    const container = document.getElementById('progress-container-' + index);
    const percent = document.getElementById('percent-' + index);
    const errorEl = document.getElementById('upload-error-' + index);
    const retry = document.getElementById('retry-' + index);
    if (container) container.classList.remove('hidden');
    if (retry) retry.classList.add('hidden');
    if (errorEl) errorEl.textContent = '';
    return new Promise(function (resolve, reject) {
      const photoRef = fb.ref(
        fb.storage,
        'book_photos/' + Date.now() + '-' + file.name,
      );
      const task = fb.uploadBytesResumable(photoRef, file);
      task.on(
        'state_changed',
        function (snap) {
          const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
          if (progress) progress.value = pct;
          if (percent) percent.textContent = Math.round(pct) + '%';
        },
        function (err) {
          if (errorEl) errorEl.textContent = 'Error al subir la foto';
          if (retry) retry.classList.remove('hidden');
          reject(err);
        },
        async function () {
          const url = await fb.getDownloadURL(task.snapshot.ref);
          if (container) container.classList.add('hidden');
          resolve(url);
        },
      );
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validateStep(current)) return;

    const fb = await loadFirebase();
    syncBooksFromForm();

    const submitBtn = form.querySelector('.submit-button');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
    }
    if (feedback) {
      feedback.textContent = 'Enviando...';
      feedback.className = 'form-feedback loading-message';
      feedback.classList.remove('hidden');
    }

    const uploadPromises = [];
    for (let i = 1; i <= books.length; i++) {
      const file = form['photo-' + i].files[0];
      if (file && !books[i - 1].photoUrl) {
        uploadPromises.push(
          uploadBookPhoto(i, file)
            .then(function (url) {
              books[i - 1].photoUrl = url;
            })
            .catch(function (err) {
              console.error('Error uploading', file.name, file.size, err);
              alert('No pudimos subir la foto ' + file.name);
              throw err;
            }),
        );
      }
    }

    try {
      await Promise.all(uploadPromises);
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar';
      }
      if (feedback) {
        feedback.innerHTML =
          '<p>Error al subir las fotos. Intentá nuevamente.</p>';
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = 'Reintentar';
        retry.className = 'retry-submit';
        retry.addEventListener('click', function () {
          feedback.classList.add('hidden');
          form.requestSubmit();
        });
        feedback.appendChild(retry);
        feedback.className = 'form-feedback form-error';
        feedback.classList.remove('hidden');
        feedback.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const booksData = books.map(function (book, idx) {
      const i = idx + 1;
      const priceValue = form['price-' + i].value;
      return {
        title: form['title-' + i].value,
        price: priceValue ? Number(priceValue) : null,
        priceMissing: priceValue === '',
        condition: form['state-' + i].value,
        notes: form['notes-' + i].value,
        photoUrl: book.photoUrl,
      };
    });

    const data = {
      user: {
        name: form.name.value,
        email: form.email.value,
        city: form.city.value,
      },
      books: booksData,
      accepted_terms: form.terms.checked,
      submittedAt: fb.serverTimestamp(),
    };

    try {
      const docRef = await fb.addDoc(
        fb.collection(fb.db, 'book_submissions'),
        data,
      );
      try {
        await fetch('/sendConfirmationEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.user.email, id: docRef.id }),
        });
      } catch (err) {
        console.warn('sendConfirmationEmail failed', err);
      }
      form.classList.add('hidden');
      if (feedback) {
        feedback.textContent =
          '\u00a1Gracias! Nos estaremos comunicando con vos por mail.';
        feedback.className = 'form-feedback form-success';
        feedback.classList.remove('hidden');
        feedback.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error saving form', err);
      if (feedback) {
        feedback.innerHTML =
          '<p>Ocurri\u00f3 un problema al enviar el formulario.</p>';
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = 'Reintentar';
        retry.className = 'retry-submit';
        retry.addEventListener('click', function () {
          feedback.classList.add('hidden');
          form.classList.remove('hidden');
          form.requestSubmit();
        });
        feedback.appendChild(retry);
        feedback.className = 'form-feedback form-error';
        feedback.classList.remove('hidden');
        feedback.scrollIntoView({ behavior: 'smooth' });
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar';
      }
      return;
    }

    if (submitBtn) submitBtn.disabled = false;
  });

  showStep(current);
});
