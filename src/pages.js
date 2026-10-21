/* ============================================================
   ПЛЁНКА ПРО — логика отдельных страниц
   ============================================================ */
'use strict';

(() => {
  const { ARTICLES, GUIDE_TOPICS } = window.PP_DATA;
  const P = () => window.PP;
  const { $, $$, money, escapeHtml, toast, productById, cardHtml } = P();

  const params = new URLSearchParams(location.search);
  const page = document.body.dataset.page || 'home';

  /* ---------- главная и 404: витрина ---------- */
  function initHome() {
    P().renderFeatured('#featuredGrid', 6);
  }

  /* ---------- карточка товара ---------- */
  function initProduct() {
    const id = params.get('id');
    const p = productById(id) || P().PRODUCTS[0];
    document.title = `${p.name} — ПЛЁНКА ПРО`;

    const crumb = $('#productCrumb');
    if (crumb) crumb.textContent = p.name;

    const unit = p.volume ? 'за штуку' : 'за рулон';
    const price = p.variants
      ? p.variants
          .map((v) => `<option value="${v.label}" data-price="${v.price}">${v.label} — ${money(v.price)}</option>`)
          .join('')
      : '';

    const related = P()
      .PRODUCTS.filter((x) => x.id !== p.id && (x.cat === p.cat || x.group === p.group))
      .slice(0, 3);

    $('#productPage').innerHTML = `
      <div class="product-layout">
        <div class="product-gallery">
          <div class="pm-media" style="--c:${p.color}"></div>
          <div class="pm-thumbs">
            <span class="pm-thumb active" style="--c:${p.color}"></span>
            <span class="pm-thumb" style="--c:${p.color};filter:brightness(1.12)"></span>
            <span class="pm-thumb" style="--c:${p.color};filter:brightness(.82)"></span>
          </div>
        </div>

        <div class="product-info">
          <span class="card-code">${escapeHtml(p.code)} · ${escapeHtml(p.catLabel)}</span>
          <h1>${escapeHtml(p.name)}</h1>
          <p class="lead">${escapeHtml(p.desc)}</p>

          <div class="product-price" id="productPrice">${p.variants ? `от ${money(p.price)}` : money(p.price)}
            <small>${unit}</small>
          </div>

          ${
            p.variants
              ? `<div class="field field-narrow">
                  <label for="productVariant">Ширина рулона</label>
                  <select id="productVariant">${price}</select>
                </div>`
              : ''
          }

          <div class="pm-actions">
            <span class="qty">
              <button type="button" id="productMinus" aria-label="Уменьшить">−</button>
              <span id="productQty">1</span>
              <button type="button" id="productPlus" aria-label="Увеличить">+</button>
            </span>
            <button class="solid-btn lg" type="button" id="productAdd">В корзину</button>
            <button class="ghost-btn lg" type="button" id="productCompare">${
              P().state.compare.has(p.id) ? 'В сравнении' : 'Сравнить'
            }</button>
          </div>

          <p class="pm-note">${p.volume ? 'Шаг 1 штука' : 'Целый рулон · шаг 1 рулон'} · ${escapeHtml(p.life)} · гарантия производителя</p>

          <ul class="product-facts">
            <li><b>Доставка</b><span>ТК, курьер по СПб, самовывоз</span></li>
            <li><b>Оплата</b><span>Онлайн картой или по счёту</span></li>
            <li><b>Гарантия</b><span><a href="delivery.html#warranty">${escapeHtml(p.life)}</a> по заявлению производителя</span></li>
          </ul>
        </div>
      </div>

      <div class="product-specs">
        <h2>Характеристики</h2>
        <dl>
          ${p.specs.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}
        </dl>
        <p class="pm-note">
          Инструкция по монтажу и техническая документация доступны по запросу — напишите
          <a href="about.html#contact-form">менеджеру</a>.
        </p>
      </div>`;

    let qty = 1;
    $('#productPlus').addEventListener('click', () => {
      qty += 1;
      $('#productQty').textContent = qty;
    });
    $('#productMinus').addEventListener('click', () => {
      if (qty > 1) {
        qty -= 1;
        $('#productQty').textContent = qty;
      }
    });

    const variantSelect = $('#productVariant');
    if (variantSelect) {
      variantSelect.addEventListener('change', () => {
        const opt = variantSelect.selectedOptions[0];
        const value = money(Number(opt.dataset.price));
        $('#productPrice').innerHTML = `${value} <small>за рулон</small>`;
      });
    }

    $('#productAdd').addEventListener('click', () => {
      let variant = null;
      let price = p.price;
      if (variantSelect) {
        variant = variantSelect.value;
        price = Number(variantSelect.selectedOptions[0].dataset.price);
      }
      P().addToCart(p.id, variant, qty, price);
    });

    $('#productCompare').addEventListener('click', () => {
      P().toggleCompare(p.id);
      $('#productCompare').textContent = P().state.compare.has(p.id) ? 'В сравнении' : 'Сравнить';
    });

    if (related.length) {
      const block = $('#relatedBlock');
      if (block) block.hidden = false;
      $('#relatedGrid').innerHTML = related.map(cardHtml).join('');
    }

    const hidden = $('#questionProduct');
    if (hidden) hidden.value = `${p.name} (${p.code})`;
    P().bindForm('productQuestionForm', 'Вопрос отправлен менеджеру');
  }

  /* ---------- страница сравнения ---------- */
  function renderComparePage() {
    const box = $('#comparePage');
    if (!box) return;
    const ids = Array.from(P().state.compare);
    if (!ids.length) {
      box.innerHTML = `<div class="compare-empty">
        <b>В сравнении пока пусто</b>
        <p>Отметьте товары кнопкой со значком сравнения в каталоге — можно выбрать до четырёх позиций.</p>
        <a class="solid-btn" href="catalog.html">Перейти в каталог</a>
      </div>`;
      return;
    }
    box.innerHTML =
      P().compareGroupsHtml() +
      `<p class="compare-hint">Сравнивать можно внутри своей группы: кузов, оптика, стекло и керамика. <a href="catalog.html">Добавить ещё</a></p>`;
  }

  function initCompare() {
    renderComparePage();
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-uncompare]')) setTimeout(renderComparePage, 0);
    });
  }

  /* ---------- гид по выбору ---------- */
  function articleCardHtml(a) {
    return `<a class="article-card" href="article.html?slug=${a.slug}">
      <span class="article-tag">${escapeHtml(a.tag)}</span>
      <h3>${escapeHtml(a.title)}</h3>
      <p>${escapeHtml(a.excerpt)}</p>
      <span class="article-meta">${a.readTime} чтения · ${a.date}</span>
    </a>`;
  }

  function initGuide() {
    const topics = $('#guideTopics');
    if (topics) {
      topics.innerHTML = GUIDE_TOPICS.map(
        (t, i) =>
          `<button class="chip${i === 0 ? ' active' : ''}" type="button" data-topic="${t.key}">${t.label}</button>`
      ).join('');
      topics.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-topic]');
        if (!chip) return;
        $$('.chip', topics).forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const key = chip.dataset.topic;
        const list = key === 'all' ? ARTICLES : ARTICLES.filter((a) => a.topic === key);
        $('#guideList').innerHTML = list.length
          ? list.map(articleCardHtml).join('')
          : '<p class="loading">В этой теме пока нет статей.</p>';
      });
    }
    const list = $('#guideList');
    if (list) list.innerHTML = ARTICLES.map(articleCardHtml).join('');
  }

  /* ---------- статья ---------- */
  function initArticle() {
    const slug = params.get('slug');
    const a = ARTICLES.find((x) => x.slug === slug) || ARTICLES[0];
    document.title = `${a.title} — ПЛЁНКА ПРО`;
    const crumb = $('#articleCrumb');
    if (crumb) crumb.textContent = a.title;

    $('#articlePage').innerHTML = `
      <span class="article-tag">${escapeHtml(a.tag)}</span>
      <h1>${escapeHtml(a.title)}</h1>
      <p class="article-meta">${a.readTime} чтения · ${a.date}</p>
      ${a.body
        .map(
          (block) => `
        <h2>${escapeHtml(block.h)}</h2>
        ${block.p.map((par) => `<p>${escapeHtml(par)}</p>`).join('')}`
        )
        .join('')}
      <p class="article-cta">
        Не уверены, что подойдёт? <a href="catalog.html">Подберите плёнку в каталоге</a> или
        <a href="about.html#contact-form">задайте вопрос менеджеру</a>.
      </p>`;

    const related = ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 3);
    if (related.length) {
      $('#relatedArticles').hidden = false;
      $('#relatedArticlesGrid').innerHTML = related.map(articleCardHtml).join('');
    }
  }

  /* ---------- корзина и оформление ---------- */
  function initCart() {
    const box = $('#cartPage');
    if (!box) return;

    const render = () => {
      const items = Array.from(P().state.cart.entries());
      if (!items.length) {
        box.innerHTML = `<div class="compare-empty">
          <b>Корзина пуста</b>
          <p>Выберите плёнку или керамику в каталоге — позиции появятся здесь.</p>
          <a class="solid-btn" href="catalog.html">Перейти в каталог</a>
        </div>`;
      } else {
        box.innerHTML = items
          .map(
            ([key, it]) => `
          <div class="cart-item cart-item-page">
            <span class="cart-thumb" style="--c:${it.color}"></span>
            <div>
              <h4><a href="${it.href}">${escapeHtml(it.name)}</a></h4>
              ${it.variant ? `<div class="variant">Ширина рулона: ${escapeHtml(it.variant)}</div>` : ''}
              <div class="unit">${it.qty} ${P().plural(it.qty, it.unit, it.unit === 'рулон' ? 'рулона' : 'штуки', it.unit === 'рулон' ? 'рулонов' : 'штук')} × ${money(it.price)}</div>
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
      }

      const { subtotal, discount, total } = P().cartTotals();
      const sub = $('#sumSubtotal');
      if (sub) sub.textContent = money(subtotal);
      const disc = $('#sumDiscount');
      if (disc) disc.textContent = '− ' + money(discount);
      const row = $('#pageDiscountRow');
      if (row) row.style.display = discount ? '' : 'none';
      const tot = $('#sumTotal');
      if (tot) tot.textContent = money(total);
      const order = $('#orderTotal');
      if (order) order.textContent = money(total);
    };

    render();
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-qty]') || e.target.closest('[data-remove]')) setTimeout(render, 0);
    });
    const firstOrder = $('#pageFirstOrder');
    if (firstOrder)
      firstOrder.addEventListener('change', () => {
        const drawerCb = $('#firstOrder');
        if (drawerCb) drawerCb.checked = firstOrder.checked;
        render();
      });

    // форма оформления
    $$('#orderBuyer .seg').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('#orderBuyer .seg').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const isCompany = btn.dataset.buyer === 'company';
        $('#orderCompanyFields').hidden = !isCompany;
        const invoice = $('input[name="pay"][value="invoice"]');
        if (invoice) invoice.checked = isCompany;
      });
    });

    const delivery = $('#oDelivery');
    if (delivery) {
      delivery.addEventListener('change', () => {
        $('#orderAddressField').hidden = delivery.value === 'pickup';
      });
    }

    const form = $('#orderForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!P().validate(form)) {
          toast('Проверьте заполнение формы', 'warn');
          return;
        }
        const isCompany = $('#orderBuyer .seg.active').dataset.buyer === 'company';
        console.log('Заказ:', {
          buyer: isCompany ? 'company' : 'person',
          items: Array.from(P().state.cart.values()),
          payment: form.querySelector('input[name="pay"]:checked').value,
          delivery: $('#oDelivery').value,
          discount: $('#firstOrder').checked ? 10 : 0,
          total: $('#orderTotal').textContent
        });
        toast(isCompany ? 'Заявка отправлена менеджеру — выставим счёт' : 'Заказ оформлен, оплата на следующем шаге');
        form.reset();
      });
    }
  }

  /* ---------- формы на статичных страницах ---------- */
  function initForms() {
    P().bindForm('leadForm', 'Заявка отправлена менеджеру');
    P().bindForm('contactForm', 'Обращение отправлено — ответим в течение рабочего дня');
    P().bindForm('partnerForm', 'Заявка на партнёрские условия отправлена');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (page === 'home' || page === '404') initHome();
    if (page === 'product') initProduct();
    if (page === 'compare') initCompare();
    if (page === 'guide') initGuide();
    if (page === 'article') initArticle();
    if (page === 'cart') initCart();
    initForms();
  });
})();
