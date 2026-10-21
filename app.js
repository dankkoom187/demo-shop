/* ============================================================
   Магазин плёнок — общая логика сайта (шапка, каталог, корзина, сравнение)
   ============================================================ */
'use strict';

(() => {
  const { PRODUCTS, CATEGORIES, GROUP_ORDER, GROUP_LABEL, COMPARE_ROWS } = window.PP_DATA;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
  const plural = (n, one, few, many) => {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  };
  const escapeHtml = (str) =>
    String(str).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );

  const state = {
    cart: new Map(),
    compare: new Set(),
    filters: { cats: new Set(), thickness: new Set(), maxPrice: 40000, search: '', sort: 'popular' }
  };

  /* ---------- сохранение состояния между страницами ---------- */
  const STORAGE = { cart: 'pp:cart', compare: 'pp:compare' };

  function saveState() {
    try {
      localStorage.setItem(STORAGE.cart, JSON.stringify(Array.from(state.cart.entries())));
      localStorage.setItem(STORAGE.compare, JSON.stringify(Array.from(state.compare)));
    } catch {
      /* приватный режим — работаем без сохранения */
    }
  }

  function loadState() {
    try {
      const cart = JSON.parse(localStorage.getItem(STORAGE.cart) || '[]');
      cart.forEach(([key, item]) => state.cart.set(key, item));
      const compare = JSON.parse(localStorage.getItem(STORAGE.compare) || '[]');
      compare.forEach((id) => state.compare.add(id));
    } catch {
      /* повреждённое значение — начинаем с нуля */
    }
  }

  /* ---------- уведомления ---------- */
  function toast(message, type = 'ok') {
    const wrap = $('#toastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'warn' ? ' warn' : '');
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .25s, transform .25s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(() => el.remove(), 260);
    }, 2600);
  }

  /* ---------- каталог ---------- */
  function productById(id) {
    return PRODUCTS.find((p) => p.id === id);
  }

  function renderCategoryFilters() {
    const box = $('#catFilters');
    if (!box) return;
    box.innerHTML = CATEGORIES.map((c) => {
      const count = PRODUCTS.filter((p) => p.cat === c.key).length;
      return `<label class="filter-item">
        <input type="checkbox" value="${c.key}"${state.filters.cats.has(c.key) ? ' checked' : ''} />
        <span>${c.label}</span><span class="count">${count}</span>
      </label>`;
    }).join('');

    $$('input', box).forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) state.filters.cats.add(input.value);
        else state.filters.cats.delete(input.value);
        renderProducts();
      });
    });
  }

  function getFiltered() {
    const f = state.filters;
    const query = f.search.trim().toLowerCase();
    let list = PRODUCTS.filter((p) => {
      if (f.cats.size && !f.cats.has(p.cat)) return false;
      if (f.thickness.size && !f.thickness.has(p.thickness)) return false;
      if (p.price > f.maxPrice) return false;
      if (query) {
        const haystack = (p.name + ' ' + p.code + ' ' + p.catLabel + ' ' + p.colorName).toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    if (f.sort === 'price-asc') list = list.slice().sort((a, b) => a.price - b.price);
    else if (f.sort === 'price-desc') list = list.slice().sort((a, b) => b.price - a.price);
    else list = list.slice().sort((a, b) => b.pop - a.pop);

    return list;
  }

  function cardHtml(p) {
    const inCart = Array.from(state.cart.keys()).some((k) => k.startsWith(p.id + '|'));
    const isCompared = state.compare.has(p.id);
    const href = `product.html?id=${encodeURIComponent(p.id)}`;
    const priceLabel = p.variants
      ? `от ${money(p.price)}`
      : `${money(p.price)}<small>${p.volume ? 'за штуку' : 'за рулон'}</small>`;

    return `<article class="card">
      <div class="card-media">
        <a class="card-media-link" href="${href}">
          <span class="card-swatch${p.pattern ? ' pattern' : ''}" style="--c:${p.color}"></span>
          <span class="sr-only">${escapeHtml(p.name)}</span>
        </a>
        <span class="card-badges">
          ${p.variants ? '<span class="badge accent">2 варианта ширины</span>' : ''}
          ${p.volume ? `<span class="badge dark">${escapeHtml(p.volume)}</span>` : ''}
          ${!p.volume && !p.variants ? '<span class="badge">целый рулон</span>' : ''}
        </span>
        <button class="card-compare${isCompared ? ' active' : ''}" type="button" data-compare="${p.id}"
          title="Добавить к сравнению" aria-label="Добавить к сравнению">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M4 12h16M4 17h7" /><path d="M17 4v6M14 7h6" /></svg>
        </button>
      </div>
      <div class="card-body">
        <span class="card-code">${escapeHtml(p.code)} · ${escapeHtml(p.catLabel)}</span>
        <h3 class="card-title"><a href="${href}">${escapeHtml(p.name)}</a></h3>
        <div class="card-specs">
          <span class="spec">${escapeHtml(p.surface)}</span>
          ${p.thickness ? `<span class="spec">${p.thickness} мкм</span>` : ''}
          <span class="spec">${escapeHtml(p.roll)}</span>
          <span class="spec">${escapeHtml(p.life)}</span>
        </div>
        <div class="card-foot">
          <span class="price">${priceLabel}</span>
          <button class="add-btn${inCart ? ' in-cart' : ''}" type="button" data-add="${p.id}">
            ${inCart ? 'В корзине' : 'В корзину'}
          </button>
        </div>
      </div>
    </article>`;
  }

  function renderProducts() {
    const grid = $('#productGrid');
    if (!grid) return;
    const list = getFiltered();
    grid.innerHTML = list.map(cardHtml).join('');
    const empty = $('#emptyState');
    if (empty) empty.hidden = list.length > 0;
    const counter = $('#resultCount');
    if (counter)
      counter.textContent = list.length
        ? `${list.length} ${plural(list.length, 'товар', 'товара', 'товаров')}`
        : 'Ничего не найдено';
  }

  function renderFeatured(selector = '#featuredGrid', limit = 6) {
    const grid = $(selector);
    if (!grid) return;
    const list = PRODUCTS.slice()
      .sort((a, b) => b.pop - a.pop)
      .slice(0, limit);
    grid.innerHTML = list.map(cardHtml).join('');
  }

  /* ---------- корзина ---------- */
  function cartKey(p, variantLabel) {
    return `${p.id}|${variantLabel || ''}`;
  }

  function addToCart(id, variantLabel, qty, price) {
    const p = productById(id);
    if (!p) return;
    const key = cartKey(p, variantLabel);
    const existing = state.cart.get(key);
    if (existing) existing.qty += qty;
    else
      state.cart.set(key, {
        id: p.id,
        name: p.name,
        variant: variantLabel,
        price,
        qty,
        color: p.color,
        unit: p.volume ? 'шт' : 'рулон',
        href: `product.html?id=${encodeURIComponent(p.id)}`
      });
    renderCart();
    saveState();
    toast(`${p.name} — в корзине`);
  }

  function changeQty(key, delta) {
    const item = state.cart.get(key);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) state.cart.delete(key);
    renderCart();
    saveState();
  }

  // на странице корзины свой чекбокс «первый заказ», в drawer — свой; приоритет у страницы
  function discountEnabled() {
    const pageCb = $('#pageFirstOrder');
    if (pageCb) return pageCb.checked;
    const drawerCb = $('#firstOrder');
    return drawerCb ? drawerCb.checked : false;
  }

  function cartTotals() {
    const subtotal = Array.from(state.cart.values()).reduce((sum, it) => sum + it.price * it.qty, 0);
    const discount = discountEnabled() ? subtotal * 0.1 : 0;
    return { subtotal, discount, total: subtotal - discount };
  }

  function renderCart() {
    const body = $('#cartBody');
    const foot = $('#cartFoot');
    if (!body) return;
    const items = Array.from(state.cart.entries());

    if (!items.length) {
      body.innerHTML = `<div class="cart-empty">
        <b>Корзина пуста</b>
        <p>Выберите плёнку в каталоге — добавим её сюда.</p>
        <a class="ghost-btn" href="catalog.html">Перейти в каталог</a>
      </div>`;
      if (foot) foot.hidden = true;
      updateCounters();
      return;
    }

    body.innerHTML = items
      .map(
        ([key, it]) => `
      <div class="cart-item">
        <span class="cart-thumb" style="--c:${it.color}"></span>
        <div>
          <h4><a href="${it.href}">${escapeHtml(it.name)}</a></h4>
          ${it.variant ? `<div class="variant">Ширина рулона: ${escapeHtml(it.variant)}</div>` : ''}
          <div class="unit">${it.qty} ${plural(it.qty, it.unit, it.unit === 'рулон' ? 'рулона' : 'штуки', it.unit === 'рулон' ? 'рулонов' : 'штук')} × ${money(it.price)}</div>
          <button class="remove" type="button" data-remove="${key}">Убрать</button>
        </div>
        <div class="cart-right">
          <span class="cart-price">${money(it.price * it.qty)}</span>
          <span class="qty">
            <button type="button" data-qty="-1" data-key="${key}" aria-label="Уменьшить">−</button>
            <span>${it.qty}</span>
            <button type="button" data-qty="1" data-key="${key}" aria-label="Увеличить">+</button>
          </span>
        </div>
      </div>`
      )
      .join('');

    const { subtotal, discount, total } = cartTotals();
    const sub = $('#cartSubtotal');
    if (sub) sub.textContent = money(subtotal);
    const disc = $('#cartDiscount');
    if (disc) disc.textContent = '− ' + money(discount);
    const row = $('#discountRow');
    if (row) row.style.display = discount ? '' : 'none';
    const tot = $('#cartTotal');
    if (tot) tot.textContent = money(total);
    if (foot) foot.hidden = false;
    updateCounters();
  }

  function updateCounters() {
    const count = Array.from(state.cart.values()).reduce((s, it) => s + it.qty, 0);
    const cartCount = $('#cartCount');
    if (cartCount) cartCount.textContent = count;
    const compareCount = $('#compareCount');
    if (compareCount) compareCount.textContent = state.compare.size;
  }

  /* ---------- сравнение ---------- */
  function toggleCompare(id) {
    const p = productById(id);
    if (!p) return;

    if (state.compare.has(id)) {
      state.compare.delete(id);
      renderProducts();
      updateCounters();
      saveState();
      return;
    }

    const groups = new Set(Array.from(state.compare).map((cid) => productById(cid).group));
    if (groups.size && !groups.has(p.group)) {
      toast(
        `Сравнивать можно внутри одной группы. ${p.groupLabel} — не с ${Array.from(groups)
          .map((g) => GROUP_LABEL[g])
          .join(', ')}`,
        'warn'
      );
      return;
    }
    if (state.compare.size >= 4) {
      toast('Больше четырёх товаров сравнить нельзя', 'warn');
      return;
    }

    state.compare.add(id);
    renderProducts();
    updateCounters();
    saveState();
    toast(`${p.name} — в сравнении`);
  }

  function compareTableHtml(items) {
    const head = `<thead><tr><th>Параметр</th>${items
      .map(
        (p) => `
      <th><div class="col-head">
        <span class="swatch-dot" style="background:linear-gradient(150deg, color-mix(in srgb, ${p.color} 88%, #fff 12%), ${p.color})"></span>
        <b>${escapeHtml(p.name)}</b>
        <span style="color:var(--muted);font-weight:400">${escapeHtml(p.code)}</span>
        <a class="remove" href="product.html?id=${encodeURIComponent(p.id)}">Открыть</a>
        <button class="remove" type="button" data-uncompare="${p.id}">Убрать</button>
      </div></th>`
      )
      .join('')}</tr></thead>`;

    const body = `<tbody>${COMPARE_ROWS.map(([label, field]) => {
      return `<tr><th>${label}</th>${items
        .map((p) => {
          let value = p[field];
          if (field === 'thickness') value = value ? value + ' мкм' : '—';
          else if (field === 'price')
            value = p.variants ? `от ${money(p.price)}` : `${money(p.price)}${p.volume ? ' / шт' : ' / рулон'}`;
          else if (field === 'roll' && p.variants) value = p.variants.map((v) => v.label).join(' / ');
          return `<td>${escapeHtml(value || '—')}</td>`;
        })
        .join('')}</tr>`;
    }).join('')}</tbody>`;

    return `<div class="compare-scroll"><table class="compare-table">${head}${body}</table></div>`;
  }

  function compareGroupsHtml() {
    const ids = Array.from(state.compare);
    if (!ids.length) return '';
    let html = '';
    GROUP_ORDER.forEach((group) => {
      const items = ids.map(productById).filter((p) => p.group === group);
      if (!items.length) return;
      html += `<div class="compare-group"><div class="compare-group-title">${GROUP_LABEL[group]}</div>${compareTableHtml(items)}</div>`;
    });
    return html;
  }

  /* ---------- drawer / overlay ---------- */
  function openDrawer(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    const overlay = $('#overlay');
    if (overlay) {
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add('show'));
    }
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    const overlay = $('#overlay');
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (!$('.drawer.open')) overlay.hidden = true;
      }, 250);
    }
    document.body.style.overflow = '';
  }

  /* ---------- валидация форм ---------- */
  function validate(form) {
    let ok = true;
    $$('input, select, textarea', form).forEach((el) => {
      if (!el.required) return;
      const valid = el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
      el.classList.toggle('invalid', !valid);
      if (!valid && ok) {
        el.focus();
        ok = false;
      }
    });
    return ok;
  }

  function bindForm(formId, message, extra) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(form)) {
        toast('Проверьте заполнение формы', 'warn');
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      if (extra) Object.assign(data, extra());
      console.log('Заявка в CRM:', data);
      toast(message);
      form.reset();
    });
  }

  /* ---------- общие события ---------- */
  function initCommon() {
    const header = $('#siteHeader');
    if (header) {
      window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 8));
    }

    const burger = $('#burger');
    const menu = $('#mobileMenu');
    if (burger && menu) {
      burger.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
      });
      $$('#mobileMenu a').forEach((a) =>
        a.addEventListener('click', () => {
          menu.classList.remove('open');
          burger.classList.remove('open');
        })
      );
    }

    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add]');
      if (addBtn) {
        const p = productById(addBtn.dataset.add);
        if (p) {
          if (p.variants) location.href = `product.html?id=${encodeURIComponent(p.id)}`;
          else addToCart(p.id, null, 1, p.price);
        }
        return;
      }

      const cmpBtn = e.target.closest('[data-compare]');
      if (cmpBtn) {
        e.preventDefault();
        toggleCompare(cmpBtn.dataset.compare);
        return;
      }

      const qtyBtn = e.target.closest('[data-qty]');
      if (qtyBtn) {
        changeQty(qtyBtn.dataset.key, Number(qtyBtn.dataset.qty));
        return;
      }

      const rm = e.target.closest('[data-remove]');
      if (rm) {
        state.cart.delete(rm.dataset.remove);
        renderCart();
        saveState();
        return;
      }

      const scrollBtn = e.target.closest('[data-scroll-to]');
      if (scrollBtn) {
        const target = document.getElementById(scrollBtn.dataset.scrollTo);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      const closeBtn = e.target.closest('[data-close]');
      if (closeBtn) {
        const id = closeBtn.dataset.close;
        if (id === 'cartDrawer') closeDrawer(id);
        return;
      }

      const unc = e.target.closest('[data-uncompare]');
      if (unc) {
        toggleCompare(unc.dataset.uncompare);
        renderProducts();
        return;
      }
    });

    const cartBtn = $('#cartBtn');
    if (cartBtn && cartBtn.tagName === 'BUTTON') cartBtn.addEventListener('click', () => openDrawer('cartDrawer'));

    const overlay = $('#overlay');
    if (overlay) overlay.addEventListener('click', () => closeDrawer('cartDrawer'));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer('cartDrawer');
    });

    const firstOrder = $('#firstOrder');
    if (firstOrder) firstOrder.addEventListener('change', () => renderCart());
  }

  function initCatalogPage() {
    const search = $('#searchInput');
    const sort = $('#sortSelect');
    const range = $('#priceRange');
    if (!search) return;

    search.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      renderProducts();
    });
    sort.addEventListener('change', (e) => {
      state.filters.sort = e.target.value;
      renderProducts();
    });
    range.addEventListener('input', (e) => {
      state.filters.maxPrice = Number(e.target.value);
      $('#priceValue').textContent = money(e.target.value);
      renderProducts();
    });
    $$('#thicknessFilters .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const v = Number(chip.dataset.thickness);
        if (state.filters.thickness.has(v)) state.filters.thickness.delete(v);
        else state.filters.thickness.add(v);
        chip.classList.toggle('active');
        renderProducts();
      });
    });

    const reset = () => {
      state.filters.cats.clear();
      state.filters.thickness.clear();
      state.filters.maxPrice = 40000;
      state.filters.search = '';
      search.value = '';
      range.value = '40000';
      $('#priceValue').textContent = money(40000);
      $$('#thicknessFilters .chip').forEach((c) => c.classList.remove('active'));
      $$('#catFilters input').forEach((i) => {
        i.checked = false;
      });
      renderProducts();
    };
    $('#resetFilters').addEventListener('click', reset);
    $('#emptyReset').addEventListener('click', reset);

    // переход из блока категорий на главной и из подвала: ?cat=matte
    const cat = new URLSearchParams(location.search).get('cat');
    if (cat && CATEGORIES.some((c) => c.key === cat)) {
      state.filters.cats.add(cat);
      const input = $(`#catFilters input[value="${cat}"]`);
      if (input) input.checked = true;
      renderProducts();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderCategoryFilters();
    renderProducts();
    renderCart();
    initCommon();
    initCatalogPage();
  });

  // API для pages.js
  window.PP = {
    state,
    PRODUCTS,
    CATEGORIES,
    GROUP_ORDER,
    GROUP_LABEL,
    COMPARE_ROWS,
    $,
    $$,
    money,
    plural,
    escapeHtml,
    toast,
    productById,
    cardHtml,
    renderProducts,
    renderFeatured,
    addToCart,
    changeQty,
    renderCart,
    cartTotals,
    updateCounters,
    toggleCompare,
    compareGroupsHtml,
    compareTableHtml,
    openDrawer,
    closeDrawer,
    validate,
    bindForm
  };
})();
