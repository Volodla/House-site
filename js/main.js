/* ===== Шапка: фон при прокрутке ===== */
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ===== Мобильное меню ===== */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
burger.addEventListener('click', () => {
  nav.classList.toggle('is-open');
  burger.classList.toggle('is-open');
});
nav.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.classList.remove('is-open');
  })
);

/* ===== Ипотечный калькулятор ===== */
const PRICE = 15_900_000;
const RATE = 0.06;
// Лимит кредита по семейной ипотеке — 12 млн ₽,
// поэтому минимальный первоначальный взнос — 3,9 млн ₽ (задан в min слайдера).
const MAX_LOAN = 12_000_000;

const downPaymentInput = document.getElementById('downPayment');
const termInput = document.getElementById('term');
const downPaymentOut = document.getElementById('downPaymentOut');
const termOut = document.getElementById('termOut');
const monthlyPaymentEl = document.getElementById('monthlyPayment');
const loanAmountEl = document.getElementById('loanAmount');
const heroPaymentEl = document.getElementById('heroPayment');

const fmt = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';

function yearsLabel(y) {
  const mod10 = y % 10, mod100 = y % 100;
  if (mod10 === 1 && mod100 !== 11) return y + ' год';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return y + ' года';
  return y + ' лет';
}

function annuity(loan, months) {
  const i = RATE / 12;
  return loan * (i * Math.pow(1 + i, months)) / (Math.pow(1 + i, months) - 1);
}

function recalc() {
  let downPayment = Number(downPaymentInput.value);
  const years = Number(termInput.value);
  if (PRICE - downPayment > MAX_LOAN) {
    downPayment = PRICE - MAX_LOAN;
    downPaymentInput.value = downPayment;
  }
  const loan = PRICE - downPayment;
  const payment = annuity(loan, years * 12);
  const dpPercent = (downPayment / PRICE * 100).toLocaleString('ru-RU', { maximumFractionDigits: 1 });

  downPaymentOut.textContent = `${fmt(downPayment)} (${dpPercent}%)`;
  termOut.textContent = yearsLabel(years);
  loanAmountEl.textContent = fmt(loan);
  monthlyPaymentEl.textContent = fmt(payment);
  if (heroPaymentEl) heroPaymentEl.textContent = fmt(payment) + '/мес';
}

downPaymentInput.addEventListener('input', recalc);
termInput.addEventListener('input', recalc);
recalc();

/* ===== Лайтбокс галереи ===== */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const figures = [...document.querySelectorAll('.gallery__item, .plan__img')];
let currentIndex = 0;

function openLightbox(index) {
  currentIndex = (index + figures.length) % figures.length;
  const fig = figures[currentIndex];
  const img = fig.querySelector('img');
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightboxCaption.textContent = fig.dataset.caption || img.alt;
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = '';
}

figures.forEach((fig, i) => fig.addEventListener('click', () => openLightbox(i)));
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxPrev').addEventListener('click', () => openLightbox(currentIndex - 1));
document.getElementById('lightboxNext').addEventListener('click', () => openLightbox(currentIndex + 1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') openLightbox(currentIndex - 1);
  if (e.key === 'ArrowRight') openLightbox(currentIndex + 1);
});

/* ===== Форма заявки → Telegram ===== */
/*
 * Заявка отправляется сообщением от бота @Zayavki_trilogiya_bot.
 * chatId — числовой id чата владельца (как получить — см. README,
 * раздел «Заявки в Telegram»).
 */
const TELEGRAM = {
  botToken: '8890037003:AAF5T3dSL5JVGfEhG2x6fF9g4YU-nlBJ2nM',
  chatId: '82544172',
};

const form = document.getElementById('leadForm');
const formStatus = document.getElementById('formStatus');

function leadText() {
  const data = new FormData(form);
  const lines = [
    '🏡 Заявка с сайта купить-дом.online',
    `Имя: ${data.get('name')}`,
    `Телефон: ${data.get('phone')}`,
  ];
  const msg = (data.get('message') || '').trim();
  if (msg) lines.push(`Комментарий: ${msg}`);
  return lines.join('\n');
}

function showStatus(ok, text) {
  formStatus.hidden = false;
  formStatus.className = 'form__status ' + (ok ? 'is-ok' : 'is-err');
  formStatus.textContent = text;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = leadText();

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    if (!TELEGRAM.botToken || !TELEGRAM.chatId) throw new Error('not configured');
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM.chatId, text }),
    });
    if (!res.ok) throw new Error('send failed');
    showStatus(true, 'Спасибо! Заявка отправлена — перезвоним в течение часа.');
    form.reset();
  } catch {
    showStatus(false, 'Не получилось отправить заявку. Позвоните нам: +7 (916) 910-90-85 — или напишите в WhatsApp/Telegram.');
  } finally {
    submitBtn.disabled = false;
  }
});
