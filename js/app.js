/* ============================================================
   СтудиоСпа — общий скрипт
   Загружает данные (data/site.js), ставит шапку и подвал на
   каждую страницу, включает мобильное меню и плавные появления.
   ============================================================ */

/* ---------- Деньги: 4000 → «4 000 ₽» ---------- */
function formatPrice(value) {
  if (value == null) return '';
  return value.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽';
}

/* ---------- Описание услуги: воздух между блоками ----------
   В описаниях встречаются строки «Зона воздействия — …», заголовок
   «Стоимость…» и списки цен (строки со знаком ₽). Каждая такая часть
   становится отдельным блоком с отступом — текст перестает слипаться. */
function renderDesc(d) {
  if (!d) return '';
  const lines = String(d).split('\n').map(x => x.trim()).filter(Boolean);
  const isNewBlock = l => /^Зона\s*воздействия/.test(l) || /₽/.test(l) || /^Стоимость/.test(l);
  const blocks = []; let cur = [];
  for (const l of lines) {
    if (isNewBlock(l) && cur.length) { blocks.push(cur); cur = []; }
    cur.push(l);
  }
  if (cur.length) blocks.push(cur);
  return blocks.map(b => `<span class="desc-b">${b.join('\n')}</span>`).join('');
}

/* ---------- Каталог услуг: общие кирпичи ----------
   Иконки разделов и разметка строки услуги нужны и на «Услуги и цены»,
   и на страницах-разделах (massage.html, programs.html и т.д.) — поэтому
   живут здесь, а не копируются на каждой странице. */

/* Иконки разделов — тонкие линейные значки в фирменной рамке-кружке */
const CAT_ICONS = {
  // тело: ладонь с каплей
  body: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 11.5Q5 9.5 5 6.5a2.5 2.5 0 0 1 5-1 2.5 2.5 0 0 1 5 1.5c0 3-4.5 4.5-5.5 4.5z"/><path d="M9.5 11.5V21"/><path d="M9.5 16.5c-1.5 0-3-1-3-2.5"/><path d="M18 14c1.3 1.6 2 2.7 2 3.8A2.2 2.2 0 0 1 17.8 20 2.2 2.2 0 0 1 16 17.8c0-1.1.7-2.2 2-3.8z"/></svg>',
  // программы: цветок (лотос)
  programs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4c2 2.5 2 6 0 8-2-2-2-5.5 0-8z"/><path d="M6.5 9c3 1.5 5 4.5 5.5 8-3.5-.5-6.5-3-5.5-8z"/><path d="M17.5 9c1 5-2 7.5-5.5 8 .5-3.5 2.5-6.5 5.5-8z"/><path d="M5 17c4 2.5 10 2.5 14 0"/></svg>',
  // лицо: ромб-«бриллиант»
  face: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18"/><path d="M12 20 8 9l4-5 4 5z"/></svg>',
  // флоатинг: волна
  floating: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M12 4a4 4 0 0 1 4-4 4 4 0 0 1 4 4"/></svg>',
  // для двоих: две фигуры — большая и малая
  couple: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="7.5" r="2.8"/><path d="M4 20a5 5 0 0 1 10 0"/><circle cx="17.5" cy="9" r="2.2"/><path d="M14.5 20a4 4 0 0 1 8 0"/></svg>',
  // доп. услуги: лист
  extras: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 4.5C11 4.5 5 10 5 19.5c9.5 0 14.5-4.5 14.5-15z"/><path d="M5 19.5C9 14 13 10 17.5 6.5"/></svg>',
  // спа для волос: пряди
  hair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3c-2 5-2 11 0 18"/><path d="M12 3c-2.5 6-2.5 12 0 18"/><path d="M16 3c-2 5-2 11 0 18"/></svg>',
  // абонементы: карта с полосой
  abon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M3 10h18"/><path d="M7 14.5h6"/></svg>'
};

/* Значок часов рядом с длительностью (как в чатиум-версии) */
const ICON_DURATION = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>';

/* Одна строка услуги в каталоге: название, состав, длительность, цена.
   opts.hideSubtitle — на страницах-разделах под-заголовок каждой строки
   повторяет название группы (оно уже в .sub-head), поэтому прячем. */
function srvRowHtml(s, opts = {}) {
  return `
    <a href="service.html?slug=${s.slug}" class="srv-row" id="${s.slug}">
      <div class="srv-row-main">
        <div class="srv-info">
          ${s.subtitle && !opts.hideSubtitle ? `<div class="srv-subtitle">${s.subtitle}</div>` : ''}
          <div class="srv-name-row">
            <h3 class="srv-name">${s.name}</h3>
            ${s.popular ? '<span class="badge">★ Хит</span>' : ''}
          </div>
          ${s.description ? `<p class="srv-desc">${renderDesc(s.description)}</p>` : ''}
          ${s.includes.length ? `
            <ul class="srv-includes">${s.includes.map(i => {
              const t = i.trim();
              const cls = /^Гость \d+$/.test(t) ? 'head' : (/^(По окончании|Совместный отдых)/.test(t) ? 'note' : '');
              return `<li class="${cls}">${i}</li>`;
            }).join('')}</ul>` : ''}
          ${s.duration ? `
            <div class="srv-meta">${ICON_DURATION}<span>${s.duration2 ? s.duration + ' / ' + s.duration2 : s.duration}</span></div>` : ''}
        </div>
        <div class="srv-price-col">
          ${s.price2 ? `
            <div class="srv-prices-stacked">
              <div class="srv-price">${formatPrice(s.price)}</div>
              <div class="srv-price">${formatPrice(s.price2)}</div>
            </div>` : `
            <div class="srv-price">${formatPrice(s.price)}</div>
            ${s.oldPrice ? `<div class="srv-old-price">${formatPrice(s.oldPrice)}</div>` : ''}`}
        </div>
      </div>
      <span class="srv-arrow">›</span>
    </a>`;
}

/* Список строк услуг одним блоком */
function renderSrvRows(list, opts = {}) {
  return list.map(s => srvRowHtml(s, opts)).join('');
}

/* Раскладка услуг по под-блокам (как на оригинальном сайте: «Ритуалы
   талассо», «Детокс», «Для двоих»...). blocks — список {title, test},
   test — проверка подзаголовка услуги. Услуги, не попавшие никуда,
   уходят в последний блок «Прочее» (страховка от потерь). */
function groupServices(all, blocks, restTitle = 'Прочее') {
  const assigned = new Set();
  const groups = [];
  (blocks || []).forEach(b => {
    const rows = all.filter(s => b.test(s) && !assigned.has(s));
    rows.forEach(s => assigned.add(s));
    if (rows.length) groups.push({ title: b.title, rows });
  });
  const rest = all.filter(s => !assigned.has(s));
  if (rest.length) groups.push({ title: restTitle, rows: rest });
  return groups;
}

/* Отрисовка групп: под-заголовок + блок строк */
function renderCatalogGroups(groups, opts = {}) {
  return groups.map(g => `
    <div class="sub-head reveal">${g.title}</div>
    <div class="cat-block reveal">${renderSrvRows(g.rows, opts)}</div>`).join('');
}

/* Заголовок раздела каталога: иконка в кружке + название */
function catHeadHtml(cat, idSuffix = '') {
  return `
    <div class="cat-head reveal" ${cat ? `id="sect-${cat.key}${idSuffix}"` : ''}>
      <div class="cat-icon">${cat ? (CAT_ICONS[cat.key] || '') : ''}</div>
      <div>
        <h2>${cat ? cat.name : ''}</h2>
        ${cat && cat.subtext ? `<p class="cat-sub">${cat.subtext}</p>` : ''}
      </div>
    </div>`;
}

/* ---------- Кнопки-вкладки разделов ----------
   Полоса кнопок как на референсе владельца: стоит на «Услуги и цены»
   и на каждой странице-разделе. У каждой страницы-раздела своя ссылка —
   ее можно отправить клиенту целиком («спрашивает массаж — кидаю это»). */
const CAT_TABS = [
  { href: 'massage.html',     label: 'Массажи',               icon: 'body' },
  { href: 'programs.html',    label: 'СПА-программы',         icon: 'programs' },
  { href: 'spa-for-two.html', label: 'СПА для двоих',         icon: 'couple' },
  { href: 'face.html',        label: 'Лицо',                  icon: 'face' },
  { href: 'extras.html',      label: 'Доп. услуги',           icon: 'extras' },
  { href: 'hair.html',        label: 'Спа для волос',         icon: 'hair' },
  { href: 'abonements.html',  label: 'Абонементы',            icon: 'abon' },
  { href: 'floating.html',    label: 'Флоатинг',              icon: 'floating' },
];

function renderCatTabsHtml(active) {
  /* Разбивка на две полосы (просьба Наты 07.11): 5 категорий в верхней
     строке, остальные — в нижней, чтобы на десктопе кнопки не сбивались
     в кучу. На узких экранах полосы переносятся сами (CSS .cat-tab-row). */
  const FIRST_ROW = 5;
  const tabHtml = t =>
    `<a href="${t.href}" class="cat-tab${active === t.href ? ' is-active' : ''}">
       ${CAT_ICONS[t.icon]}<span>${t.label}</span>
     </a>`;
  const top = CAT_TABS.slice(0, FIRST_ROW);
  const bottom = CAT_TABS.slice(FIRST_ROW);
  return `<div class="cat-tabs">
    <div class="cat-tab-row">${top.map(tabHtml).join('')}</div>
    ${bottom.length ? `<div class="cat-tab-row">${bottom.map(tabHtml).join('')}</div>` : ''}
  </div>`;
}

/* ---------- Загрузка данных ----------
   Данные лежат в data/*.js и подключаются тегом <script> до app.js
   — так сайт работает даже при открытии файла двойным кликом
   (fetch для локальных файлов браузеры блокируют). */
function loadSite() {
  return Promise.resolve(window.SITE_DATA);
}
function loadServices() {
  return Promise.resolve(window.SERVICES_DATA);
}
function loadLegal() {
  return Promise.resolve(window.LEGAL_DATA);
}

/* ---------- Шапка ----------
   Раскладка как в чатиум-версии (AppHeader.vue): сверху по центру
   логотип — фирменный знак, рукописное «СтудиоСпа» и подпись;
   ниже за разделителем — строка меню: ВКонтакте, пункты, телефон,
   кнопка «Записаться» и поиск. На телефоне — компактная шапка
   с бургер-меню (три полоски, раскрываются в список ссылок). */
const HEADER_NAV = [
  ['index.html', 'Главная'],
  ['services.html', 'Услуги'],
  ['floating.html', 'Флоатинг'],
  ['hair.html', 'Спа для волос'],
  ['promotions.html', 'Акции'],
  ['abonements.html', 'Абонементы'],
  ['contacts.html', 'Контакты'],
];

/* Иконки — маленькие инлайн-SVG (векторные картинки в коде),
   чтобы не подключать целую библиотеку иконок ради трех значков */
const ICON_PHONE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
const ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
/* Тонкие монохромные значки для подвала (вместо цветных эмодзи) —
   рисуются линиями и красятся в цвет текста через currentColor */
const ICON_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-5.4-7-11a7 7 0 0 1 14 0c0 5.6-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
const ICON_PHONE_LINE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>';
const ICON_MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>';
const ICON_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>';

function renderHeader(activePage, site) {
  const phone = site.salon.phone;
  const phoneLink = site.salon.phoneLink;
  const links = HEADER_NAV.map(([href, label]) =>
    `<a href="${href}" class="${activePage === href ? 'active' : ''}">${label}</a>`
  ).join('');

  document.querySelector('header.site-header').innerHTML = `
    <div class="hdr-logo-row">
      <a href="index.html" class="hdr-logo">
        <img class="hdr-logo-mark" src="img/logo-mark.png" alt="Знак СтудиоСпа">
        <span class="hdr-logo-title">СтудиоСпа</span>
        <span class="hdr-logo-sub">время для себя</span>
      </a>
    </div>

    <div class="hdr-sep"></div>

    <div class="hdr-nav-row">
      <div class="hdr-nav-inner">
        <a href="${site.salon.vk}" target="_blank" rel="noopener" class="hdr-vk" aria-label="ВКонтакте">VK</a>
        <nav class="hdr-nav">${links}</nav>
        <a href="${phoneLink}" class="hdr-phone">${ICON_PHONE}<span>${phone}</span></a>
        <a href="contacts.html" class="hdr-book">Записаться</a>
        <a href="search.html" class="hdr-search">${ICON_SEARCH}<span>Поиск</span></a>
      </div>
    </div>

    <!-- Мобильная шапка: узкая полоса с меню-бургером -->
    <div class="hdr-mobile">
      <div class="hdr-mobile-bar">
        <div class="hdr-mobile-row">
          <a href="index.html" class="hdr-mobile-logo"><img src="img/logo-mark.png" alt="СтудиоСпа"></a>
          <div class="hdr-mobile-actions">
            <a href="search.html" class="hdr-mobile-icon" aria-label="Поиск">${ICON_SEARCH}</a>
            <a href="${phoneLink}" class="hdr-mobile-icon" aria-label="Позвонить">${ICON_PHONE}</a>
            <button class="hdr-burger" aria-label="Меню"><span></span><span></span><span></span></button>
          </div>
        </div>
        <span class="hdr-mobile-title">СтудиоСпа</span>
      </div>
      <div class="hdr-mobile-menu">
        <nav class="hdr-mobile-nav">${links}</nav>
        <div class="hdr-mobile-extra">
          <a href="${site.salon.vk}" target="_blank" rel="noopener" class="hdr-mobile-vk">VK</a>
          <a href="${phoneLink}" class="hdr-mobile-phone">${phone}</a>
        </div>
        <a href="contacts.html" class="hdr-mobile-cta">Записаться</a>
      </div>
    </div>`;
}

/* ---------- Подвал ---------- */
function renderFooter(salon) {
  document.querySelector('footer.site-footer').innerHTML = `
    <div class="footer-inner container">
      <div>
        <!-- Значок-треугольник с подписью — как в шапке сайта -->
        <div class="footer-logo">
          <img src="img/logo-mark.png" alt="Знак СтудиоСпа">
          <div>
            <span class="footer-logo-title">СтудиоСпа</span>
            <span class="footer-logo-sub">время для себя</span>
          </div>
        </div>
        <p>Ваш личный оазис гармонии&nbsp;и&nbsp;релаксации.<br>Наши процедуры помогут восстановить<br>баланс души&nbsp;и&nbsp;тела.</p>
        <div class="footer-social">
          <a href="${salon.vk}" target="_blank" rel="noopener" class="footer-social-btn" aria-label="ВКонтакте">VK</a>
          <a href="${salon.max}" target="_blank" rel="noopener" class="footer-social-btn" aria-label="Мессенджер MAX">MAX</a>
        </div>
        <p class="footer-legal">ИП Федоренко И. А.<br>ИНН 780710032085</p>
        <p class="footer-note">При использовании материалов ссылка на&nbsp;сайт обязательна</p>
      </div>
      <div class="footer-nav">
        <h3>Навигация</h3>
        <p><a href="index.html">Главная</a></p>
        <p><a href="services.html">Услуги</a></p>
        <p><a href="floating.html">Флоатинг</a></p>
        <p><a href="hair.html">Спа для волос</a></p>
        <p><a href="abonements.html">Абонементы</a></p>
        <p><a href="promotions.html">Акции</a></p>
        <p><a href="etiquette.html">СПА этикет</a></p>
        <p><a href="contacts.html">Контакты</a></p>
      </div>
      <div class="footer-contacts">
        <h3>Контакты</h3>
        <p>${ICON_PIN} ${salon.address.replace(', ул.', ',<br>ул.')}</p>
        <p>${salon.addressNote}</p>
        <p>${salon.metro}</p>
        <p>${ICON_PHONE_LINE} <a href="${salon.phoneLink}">${salon.phone}</a></p>
        <p>${ICON_MAIL} <a href="mailto:${salon.email}">${salon.email}</a></p>
        <p>${ICON_CLOCK} ${salon.schedule}</p>
      </div>
    </div>
    <div class="footer-bottom container">
      <span>© 2019 – 2026 СтудиоСпа</span>
      <a href="legal.html">Правовая информация</a>
    </div>`;
}

/* ---------- Cookie-плашка ----------
   По закону нужно уведомить гостя о файлах cookie и получить согласие.
   Согласие хранится в localStorage (память браузера) и плашка не мешает
   при следующих визитах. Подробнее — страница правовой информации. */
function initCookieBanner() {
  if (localStorage.getItem('spa-cookie-ok') === '1') return;
  const el = document.createElement('div');
  el.className = 'cookie-banner';
  el.innerHTML = `
    <p>🍪 Мы используем файлы cookie — они помогают сайту корректно работать
       и запоминать ваши предпочтения.<br>
       Оставаясь на сайте, вы соглашаетесь
       с <a href="legal.html?doc=cookie">политикой использования cookie</a>.</p>
    <button class="btn btn-primary" style="padding:9px 26px;font-size:14px">Хорошо</button>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  el.querySelector('button').addEventListener('click', () => {
    localStorage.setItem('spa-cookie-ok', '1');
    el.classList.remove('show');
  });
}

/* ---------- Плавное появление блоков при прокрутке ---------- */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(el => observer.observe(el));
}

/* ---------- Кнопка «наверх» ----------
   Появляется, когда страницу прокрутили вниз, и плавно
   возвращает к началу по клику. */
function initScrollTop() {
  const btn = document.createElement('a');
  btn.className = 'scroll-top';
  btn.href = '#top';
  btn.setAttribute('aria-label', 'Наверх');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(btn);

  const toggle = () => btn.classList.toggle('show', window.scrollY > 480);
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---------- Типографика: короткие слова не «зависают» ----------
   По правилам русского набора предлоги, союзы и частицы из одного-двух
   знаков (и, в, с, к, на, не, для…) не должны оставаться в конце строки —
   их переносят вместе со следующим словом. Проходим по всем текстовым
   узлам страницы и заменяем обычный пробел после таких слов на
   неразрывный (U+00A0). Работает на всех страницах и адаптивах сразу. */
function bindShortWords() {
  const rx = /(^|[\s ])(и|в|с|к|о|у|а|но|на|по|за|от|до|не|для|об|из|со|их|ее|же|ли|бы)([\s ]+)/gi;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent || /^(script|style|code|pre|textarea)$/i.test(parent.tagName)) continue;
    const text = node.nodeValue;
    if (!text.trim()) continue;
    const fixed = text.replace(rx, (m, before, word) => before + word + ' ');
    if (fixed !== text) node.nodeValue = fixed;
  }
}

/* ---------- Общая инициализация ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  const site = await loadSite();
  const header = document.querySelector('header.site-header');
  renderHeader(document.body.dataset.page, site);
  renderFooter(site.salon);

  // Бургер-меню на мобильном: раскрывает/закрывает список ссылок
  const burger = header.querySelector('.hdr-burger');
  const mobileMenu = header.querySelector('.hdr-mobile-menu');
  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    burger.classList.toggle('is-active', open);
    header.classList.toggle('is-menu-open', open);
  });

  // При прокрутке шапка сжимается (логотип меньше) — как в чатиум-версии
  window.addEventListener('scroll', () => {
    header.classList.toggle('is-scrolled', window.scrollY > 80);
  }, { passive: true });

  if (window.initPage) {
    // Ждем, пока страница нарисует свои карточки, — чтобы правило предлогов
    // обработало и динамические тексты (карточки услуг, результаты поиска)
    await window.initPage(site);
  }
  bindShortWords();
  initReveal();
  initScrollTop();
  initCookieBanner();
});