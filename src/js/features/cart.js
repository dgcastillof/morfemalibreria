(function () {
  const STORAGE_KEY = 'morfema-cart';
  const WHATSAPP_NUMBER = '5491135752748';

  const state = {
    items: [],
  };

  let floatingButton;
  let cartOverlay;
  let cartModal;
  let cartItemsContainer;
  let subtotalElem;
  let discountElem;
  let totalElem;
  let checkoutButton;
  let emptyStateElem;

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const parsePriceNumber = (price) => {
    const numericValue = parseFloat(price?.toString().replace(/[^0-9.-]/g, ''));
    return Number.isNaN(numericValue) ? 0 : numericValue;
  };

  function getCartDiscountPercentage(itemCount) {
    if (itemCount >= 4) return 20;
    if (itemCount === 3) return 15;
    if (itemCount === 2) return 10;
    return 0;
  }

  const getItemCount = () =>
    state.items.reduce((accumulator, item) => accumulator + item.quantity, 0);

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => ({
        ...item,
        priceNumber: parsePriceNumber(item.price),
        quantity: item.quantity || 1,
      }));
    } catch (error) {
      console.warn('No se pudo leer el carrito desde el almacenamiento.', error);
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.warn('No se pudo guardar el carrito.', error);
    }
  }

  function computeTotals() {
    const subtotal = state.items.reduce(
      (total, item) => total + item.priceNumber * item.quantity,
      0,
    );
    const itemCount = getItemCount();
    const discountPercentage = getCartDiscountPercentage(itemCount);
    const discountAmount = (subtotal * discountPercentage) / 100;
    const total = subtotal - discountAmount;

    return { subtotal, itemCount, discountPercentage, discountAmount, total };
  }

  function closeCart() {
    if (!cartOverlay) return;
    cartOverlay.classList.remove('show');
    document.body.classList.remove('cart-open');
  }

  function buildCartItemRow(item) {
    const row = document.createElement('div');
    row.className = 'cart-item-row';

    const info = document.createElement('div');
    info.className = 'cart-item-info';
    info.innerHTML = `
      <p class="cart-item-title">${item.title}</p>
      <p class="cart-item-author">${item.author}</p>
      <p class="cart-item-meta">${formatCurrency(item.priceNumber)} x ${
        item.quantity
      }</p>
    `;

    const subtotal = document.createElement('div');
    subtotal.className = 'cart-item-subtotal';
    subtotal.textContent = formatCurrency(item.priceNumber * item.quantity);

    const removeButton = document.createElement('button');
    removeButton.className = 'cart-remove-button';
    removeButton.type = 'button';
    removeButton.textContent = 'Eliminar';
    removeButton.addEventListener('click', () => {
      removeItem(item.id);
    });

    row.appendChild(info);
    row.appendChild(subtotal);
    row.appendChild(removeButton);

    return row;
  }

  function renderCartItems() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';

    if (state.items.length === 0) {
      emptyStateElem.classList.add('show');
      return;
    }

    emptyStateElem.classList.remove('show');

    state.items.forEach((item) => {
      const row = buildCartItemRow(item);
      cartItemsContainer.appendChild(row);
    });
  }

  function renderSummary(totals) {
    if (!subtotalElem || !discountElem || !totalElem) return;
    subtotalElem.textContent = formatCurrency(totals.subtotal);
    discountElem.textContent = `${totals.discountPercentage}% (-${formatCurrency(
      totals.discountAmount,
    )})`;
    totalElem.textContent = formatCurrency(totals.total);
  }

  function updateFloatingButton(totals) {
    if (!floatingButton) return;
    floatingButton.textContent = `🛒 ${totals.itemCount} - ${formatCurrency(
      totals.total,
    )}`;
  }

  function renderCart() {
    const totals = computeTotals();
    renderCartItems();
    renderSummary(totals);
    updateFloatingButton(totals);
    if (checkoutButton) {
      checkoutButton.disabled = totals.itemCount === 0;
    }
  }

  function ensureUI() {
    if (floatingButton && cartOverlay) return;

    floatingButton = document.createElement('button');
    floatingButton.type = 'button';
    floatingButton.className = 'floating-cart-button';
    floatingButton.setAttribute('aria-label', 'Abrir carrito');
    floatingButton.addEventListener('click', () => {
      cartOverlay.classList.add('show');
      document.body.classList.add('cart-open');
    });
    document.body.appendChild(floatingButton);

    cartOverlay = document.createElement('div');
    cartOverlay.className = 'cart-overlay';

    cartModal = document.createElement('div');
    cartModal.className = 'cart-modal';
    cartModal.innerHTML = `
      <div class="cart-header">
        <h3>Tu carrito</h3>
        <button type="button" class="cart-close" aria-label="Cerrar carrito">&times;</button>
      </div>
      <div class="cart-items"></div>
      <p class="cart-empty">Tu carrito está vacío.</p>
      <div class="cart-summary">
        <div class="cart-summary-row">
          <span>Subtotal</span>
          <span class="cart-subtotal">$0</span>
        </div>
        <div class="cart-summary-row">
          <span>Descuento</span>
          <span class="cart-discount">0% (-$0)</span>
        </div>
        <div class="cart-summary-row cart-summary-total">
          <span>Total</span>
          <span class="cart-total">$0</span>
        </div>
      </div>
      <button type="button" class="cart-checkout">Iniciar compra</button>
    `;

    cartOverlay.appendChild(cartModal);
    document.body.appendChild(cartOverlay);

    cartItemsContainer = cartModal.querySelector('.cart-items');
    subtotalElem = cartModal.querySelector('.cart-subtotal');
    discountElem = cartModal.querySelector('.cart-discount');
    totalElem = cartModal.querySelector('.cart-total');
    checkoutButton = cartModal.querySelector('.cart-checkout');
    emptyStateElem = cartModal.querySelector('.cart-empty');

    cartOverlay.addEventListener('click', (event) => {
      if (event.target === cartOverlay) {
        closeCart();
      }
    });

    const closeBtn = cartModal.querySelector('.cart-close');
    closeBtn.addEventListener('click', closeCart);

    checkoutButton.addEventListener('click', () => {
      startCheckout();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeCart();
    });
  }

  function addItem(book) {
    if (!book || !book.id) return;
    ensureUI();

    const existingIndex = state.items.findIndex((item) => item.id === book.id);
    const priceNumber = parsePriceNumber(book.precio || book.price);

    if (existingIndex >= 0) {
      state.items[existingIndex].quantity += 1;
    } else {
      state.items.push({
        id: book.id,
        title: book.titulo || book.title,
        author: book.autor || book.author || 'Autor desconocido',
        price: book.precio || book.price || '$0',
        priceNumber,
        quantity: 1,
      });
    }

    saveCart();
    renderCart();
  }

  function removeItem(id) {
    state.items = state.items.filter((item) => item.id !== id);
    saveCart();
    renderCart();
  }

  function buildWhatsappMessage(totals) {
    const lines = state.items.map(
      (item) =>
        `- ${item.title} (${item.author}) x${item.quantity}: ${formatCurrency(
          item.priceNumber * item.quantity,
        )}`,
    );
    const intro = 'Hola, quiero iniciar la compra con este carrito:';
    const summary = [
      `Subtotal: ${formatCurrency(totals.subtotal)}`,
      `Descuento (${totals.discountPercentage}%): ${formatCurrency(totals.discountAmount)}`,
      `Total: ${formatCurrency(totals.total)}`,
    ];

    return `${intro}\n${lines.join('\n')}\n${summary.join('\n')}`;
  }

  function startCheckout() {
    if (state.items.length === 0) return;
    const totals = computeTotals();
    const message = buildWhatsappMessage(totals);
    const url = `https://wa.me/${WHATSAPP_NUMBER}/?text=${encodeURIComponent(
      message,
    )}`;

    window.open(url, '_blank');
  }

  document.addEventListener('DOMContentLoaded', () => {
    state.items = loadCart();
    ensureUI();
    renderCart();
  });

  window.cartManager = {
    addItem,
    removeItem,
    computeTotals,
    open: () => {
      ensureUI();
      cartOverlay.classList.add('show');
      document.body.classList.add('cart-open');
    },
  };
})();
