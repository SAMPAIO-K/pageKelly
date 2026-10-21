document.addEventListener('DOMContentLoaded', () => {
    // 1. Ano Dinâmico no Footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // 2. Dark Mode
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
    }
    themeToggle.addEventListener('click', () => {
        if (document.body.getAttribute('data-theme') === 'dark') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '🌙';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀️';
        }
    });

    // 3. Menu Mobile
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu');
    const navMenu = document.getElementById('nav-menu');
    if (mobileMenuBtn && closeMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => { navMenu.classList.add('active'); document.body.style.overflow = 'hidden'; });
        closeMenuBtn.addEventListener('click', () => { navMenu.classList.remove('active'); document.body.style.overflow = ''; });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => { navMenu.classList.remove('active'); document.body.style.overflow = ''; });
        });
    }

    // 4. FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isExpanded = question.getAttribute('aria-expanded') === 'true';
            document.querySelectorAll('.faq-question').forEach(q => {
                q.setAttribute('aria-expanded', 'false');
                q.nextElementSibling.style.maxHeight = null;
            });
            if (!isExpanded) {
                question.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // 5. Rastreamento de UTMs
    const urlParams = new URLSearchParams(window.location.search);
    let utmSource = urlParams.get('utm_source') || 'direto';
    if (urlParams.has('utm_source')) {
        localStorage.setItem('utm_source', utmSource);
        localStorage.setItem('utm_medium', urlParams.get('utm_medium') || 'organico');
    } else {
        utmSource = localStorage.getItem('utm_source') || 'direto';
    }

    // 6. Máscara de WhatsApp
    const whatsappInput = document.getElementById('whatsapp');
    if (whatsappInput) {
        whatsappInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length > 6) value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
            else if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            else if (value.length > 0) value = `(${value}`;
            e.target.value = value;
        });
    }

    // 7. Formulário Inteligente
    const smartForm = document.getElementById('smart-form');
    const toast = document.getElementById('toast');
    if (smartForm) {
        smartForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const whatsapp = document.getElementById('whatsapp').value;
            const duvida = document.getElementById('duvida').value;

            const textoFormatado = `Olá, Kelly! Me chamo *${nome}*.\n\n*E-mail:* ${email}\n*WhatsApp:* ${whatsapp}\n*Dúvida/Necessidade:* ${duvida}\n\n_(Vim pelo site, origem: ${utmSource})_`;
            const textoCodificado = encodeURIComponent(textoFormatado);
            const whatsappUrl = `https://wa.me/5511974440167?text=${textoCodificado}`;

            // Rastreamento de conversão (LGPD Safe)
            trackEvent('generate_lead', { method: 'whatsapp', form_name: 'contato_principal', utm_source: utmSource });

            if (toast) {
                toast.classList.remove('hidden');
                setTimeout(() => { toast.classList.add('hidden'); }, 3000);
            }
            window.open(whatsappUrl, '_blank');
            smartForm.reset();
        });
    }

    // 8. LGPD e Injeção Segura de Tags (GA4 + GTM)
    function injectTrackingScripts() {
        console.log("[LGPD] Consentimento aceito. Inicializando GA4 e GTM...");
        
        // Injeta GA4
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-MD8DFXDDZL';
        document.head.appendChild(gaScript);
        gaScript.onload = () => {
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', 'G-MD8DFXDDZL', { 'anonymize_ip': true }); // Conformidade LGPD
            console.log("[GA4] ✅ G-MD8DFXDDZL carregado.");
        };

        // Injeta GTM
        const gtmScript = document.createElement('script');
        gtmScript.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-KG8L7ZW6');`;
        document.head.appendChild(gtmScript);
        console.log("[GTM] ✅ GTM-KG8L7ZW6 carregado.");

        // Torna o iframe noscript visível
        const noscriptContainer = document.getElementById('gtm-noscript-container');
        if (noscriptContainer) noscriptContainer.style.display = 'block';
    }

    window.trackEvent = function(eventName, eventData = {}) {
        const consent = localStorage.getItem('cookieConsent');
        if (consent === 'accepted' && typeof window.gtag === 'function') {
            window.gtag('event', eventName, eventData);
            console.log(`[TRACKING] ✅ Evento enviado: ${eventName}`, eventData);
        } else {
            console.log(`[TRACKING] ⛔ Bloqueado: sem consentimento para "${eventName}"`);
        }
    };

    const cookieBanner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookies');
    const declineBtn = document.getElementById('decline-cookies');
    const hasConsent = localStorage.getItem('cookieConsent');

    if (!hasConsent && cookieBanner) cookieBanner.classList.remove('hidden');
    if (hasConsent === 'accepted') injectTrackingScripts();

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            cookieBanner.classList.add('hidden');
            injectTrackingScripts();
            trackEvent('cookie_consent', { status: 'accepted' });
        });
    }
    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'declined');
            cookieBanner.classList.add('hidden');
            console.log("[LGPD] Consentimento recusado. Nenhuma tag carregada.");
        });
    }
});