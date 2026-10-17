/* Kelly Sampaio | Funcionalidades compartilhadas sem dependências */
'use strict';

const CONFIG = {
  whatsapp: '',            // Ex.: '5511987654321' (com DDI 55 + DDD + número)
  linkedin: '',            // Ex.: 'https://www.linkedin.com/in/kellysampaio'
  email: '',               // Ex.: 'contato@kellysampaio.com.br'
  cidade: '',
  bairro: '',
  consentKey: 'kelly_prefs_v5',
  draftKey: 'kelly_contact_draft_v1'
};

const $  = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const safeGet    = k => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet    = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const safeRemove = k => { try { localStorage.removeItem(k); } catch {} };

const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function setLink(el, url) {
  if (!url) {
    el.removeAttribute('href');
    el.classList.add('disabled-link');
    el.setAttribute('aria-disabled', 'true');
  } else {
    el.href = url;
    el.classList.remove('disabled-link');
    el.removeAttribute('aria-disabled');
  }
}

/* ============ ROTEAMENTO SPA POR HASH ============ */
const pages = $$('.page');
const navLinks = $$('[data-nav]');

function getPageFromHash() {
  const h = (location.hash || '#apresentacao').replace('#', '').toLowerCase();
  return ['apresentacao', 'curriculo', 'contato'].includes(h) ? h : 'apresentacao';
}

function navigate(page) {
  pages.forEach(p => { p.hidden = p.dataset.pageId !== page; });
  navLinks.forEach(a => {
    if (a.dataset.nav === page) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  document.body.dataset.page = page;
  document.title = {
    apresentacao: 'Kelly Sampaio | Educação em Saúde, Gestão e Inovação',
    curriculo:    'Currículo Profissional | Kelly Sampaio',
    contato:      'Contato e Consultoria | Kelly Sampaio'
  }[page];
  window.scrollTo({ top: 0, behavior: 'instant' });
  setupContacts();
  initReveal();
  closeMenu();
}

window.addEventListener('hashchange', () => navigate(getPageFromHash()));

document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const target = a.getAttribute('href').slice(1);
  if (['apresentacao', 'curriculo', 'contato'].includes(target)) {
    e.preventDefault();
    history.pushState(null, '', '#' + target);
    navigate(target);
  }
});

/* ============ CONTATOS (WhatsApp, LinkedIn, E-mail) ============ */
function setupContacts() {
  const num = CONFIG.whatsapp.replace(/\D/g, '');
  const valid = /^55\d{10,11}$/.test(num);
  const page = document.body.dataset.page || 'apresentacao';
  const messages = {
    apresentacao: 'Olá, Kelly! Conheci sua apresentação profissional e gostaria de conversar.',
    curriculo:    'Olá, Kelly! Consultei seu currículo e gostaria de entrar em contato.',
    contato:      'Olá, Kelly! Gostaria de solicitar informações sobre consultoria.'
  };
  const wa = valid ? 'https://wa.me/' + num + '?text=' + encodeURIComponent(messages[page]) : '';
  $$('.whatsapp-link').forEach(a => setLink(a, wa));

  let linkedin = '';
  try {
    const u = new URL(CONFIG.linkedin);
    if (
      u.protocol === 'https:' &&
      ['linkedin.com', 'www.linkedin.com'].includes(u.hostname.toLowerCase()) &&
      u.pathname !== '/' && !u.username && !u.password
    ) linkedin = u.href;
  } catch {}
  $$('.linkedin-link').forEach(a => setLink(a, linkedin));

  $$('.email-link').forEach(a => setLink(a, isEmail(CONFIG.email) ? 'mailto:' + CONFIG.email : ''));
}

/* ============ MENU MOBILE ============ */
const nav = $('.nav'), toggle = $('.menu-toggle');

function closeMenu() {
  if (!nav || !toggle) return;
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Abrir menu');
  toggle.textContent = '☰';
}

if (nav && toggle) {
  toggle.addEventListener('click', () => {
    const opened = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(opened));
    toggle.setAttribute('aria-label', opened ? 'Fechar menu' : 'Abrir menu');
    toggle.textContent = opened ? '✕' : '☰';
  });
  $$('a', nav).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) closeMenu();
  });
  window.addEventListener('resize', () => { if (innerWidth >= 992) closeMenu(); });
}

/* ============ HEADER GLASSMORPHISM ============ */
const header = $('.header');
function updateHeader() {
  header?.classList.toggle('scrolled', scrollY > 18);
}
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

/* ============ CONSENTIMENTO ============ */
const cookie = $('.cookie-banner');
function showCookie() { if (cookie) cookie.hidden = false; }
function hideCookie() { if (cookie) cookie.hidden = true; }
function consent(v) { safeSet(CONFIG.consentKey, v); hideCookie(); }

if (!['accepted', 'rejected'].includes(safeGet(CONFIG.consentKey))) showCookie();
$$('.accept-cookies').forEach(b => b.addEventListener('click', () => consent('accepted')));
$$('.reject-cookies').forEach(b => b.addEventListener('click', () => consent('rejected')));
$$('.cookie-settings').forEach(b => b.addEventListener('click', () => {
  showCookie();
  $('.accept-cookies')?.focus();
}));

/* ============ EVENTOS (GTM) ============ */
const EVENTS = new Set([
  'cta_curriculo', 'cta_consultoria',
  'clique_whatsapp', 'clique_linkedin', 'formulario_preparado'
]);
function trackEvent(name) {
  if (safeGet(CONFIG.consentKey) !== 'accepted' || !EVENTS.has(name)) return;
  /* Quando GTM estiver integrado: window.dataLayer.push({ event: name }); */
}
$$('[data-event]').forEach(el => el.addEventListener('click', () => {
  if (!el.classList.contains('disabled-link')) trackEvent(el.dataset.event);
}));

/* ============ SCROLL REVEAL ============ */
let revealObserver = null;

function initReveal() {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.page:not([hidden]) .reveal:not(.visible)').forEach(el => revealObserver.observe(el));
}

/* ============ FAQ ============ */
$$('.faq-item').forEach(item => {
  const button = $('button', item), panel = $('.faq-panel', item);
  if (!button || !panel) return;
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    panel.classList.toggle('open', !expanded);
  });
});

/* ============ FORMULÁRIO ============ */
const form = $('#contactForm');
if (form) {
  const message = $('#formMessage');
  const fields = ['nome', 'email', 'organizacao', 'assunto', 'mensagem'];

  function status(s, kind = 'error') {
    message.textContent = s;
    message.className = 'form-message ' + kind;
  }

  function draft() {
    const obj = {};
    fields.forEach(k => obj[k] = form.elements[k]?.value || '');
    safeSet(CONFIG.draftKey, JSON.stringify(obj));
  }

  try {
    const data = JSON.parse(safeGet(CONFIG.draftKey) || '{}');
    fields.forEach(k => {
      if (typeof data[k] === 'string' && form.elements[k]) form.elements[k].value = data[k];
    });
  } catch {}

  let draftTimeout;
  form.addEventListener('input', () => {
    clearTimeout(draftTimeout);
    draftTimeout = setTimeout(draft, 400);
  });
  form.addEventListener('change', draft);

  form.addEventListener('submit', e => {
    e.preventDefault();
    status('');
    const v = k => (form.elements[k]?.value || '').trim();
    $$('[aria-invalid="true"]', form).forEach(el => el.removeAttribute('aria-invalid'));

    function invalid(k, msg) {
      const el = form.elements[k];
      el.setAttribute('aria-invalid', 'true');
      el.focus();
      status(msg);
    }

    if (v('nome').length < 2)        return invalid('nome', 'Informe seu nome (mínimo de 2 caracteres).');
    if (!isEmail(v('email')))        return invalid('email', 'Informe um e-mail válido.');
    if (!v('assunto'))               return invalid('assunto', 'Escolha uma área de interesse.');
    if (v('mensagem').length < 10)   return invalid('mensagem', 'Descreva sua necessidade com pelo menos 10 caracteres.');
    if (!form.elements.privacidade.checked) {
      form.elements.privacidade.focus();
      return status('Confirme que leu as informações de privacidade.');
    }
    if (!isEmail(CONFIG.email))      return status('Configure o e-mail profissional no script.js.');

    const subject = 'Solicitação de consultoria — ' + v('assunto');
    const body = [
      'Olá, Kelly!', '',
      `Nome: ${v('nome')}`,
      `E-mail: ${v('email')}`,
      `Organização: ${v('organizacao') || 'Não informada'}`,
      `Assunto: ${v('assunto')}`, '',
      'Mensagem:', v('mensagem')
    ].join('\n');

    trackEvent('formulario_preparado');
    status('Seu aplicativo de e-mail será solicitado. Revise e confirme o envio; o site não consegue verificar se foi enviado.', 'success');
    window.location.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });

  $('#clearDraft')?.addEventListener('click', () => {
    safeRemove(CONFIG.draftKey);
    form.reset();
    status('Rascunho local apagado.', 'success');
  });
}

/* ============ ANO E IMPRESSÃO ============ */
$$('.year').forEach(el => el.textContent = new Date().getFullYear());
$('.print-button')?.addEventListener('click', () => window.print());

/* ============ INICIALIZAÇÃO ============ */
navigate(getPageFromHash());