/* ══════════════════════════════════════════════════════════
   micolegio.js  –  Colegio Yermo y Parres
══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

    /* ── 1. HERO SLIDESHOW CON FADE ─────────────────────────── */
    (function () {
        const slides = document.querySelectorAll('.hero-slide');
        const dotsContainer = document.getElementById('heroDots');
        if (!slides.length || !dotsContainer) return;

        let current = 0;
        let timer;

        // Crear dots
        slides.forEach(function (_, i) {
            const btn = document.createElement('button');
            btn.className = 'hero-dot' + (i === 0 ? ' active' : '');
            btn.setAttribute('aria-label', 'Diapositiva ' + (i + 1));
            btn.addEventListener('click', function () { goTo(i); });
            dotsContainer.appendChild(btn);
        });

        const dots = dotsContainer.querySelectorAll('.hero-dot');

        function goTo(n) {
            slides[current].classList.remove('active');
            dots[current].classList.remove('active');
            current = (n + slides.length) % slides.length;
            slides[current].classList.add('active');
            dots[current].classList.add('active');
            resetTimer();
        }

        function resetTimer() {
            clearInterval(timer);
            timer = setInterval(function () { goTo(current + 1); }, 5000);
        }

        resetTimer();
    })();

    /* ── 2. MINI-SLIDESHOW HISTORIA ─────────────────────────── */
    (function () {
        const slides = document.querySelectorAll('#miniSlide .mini-slide');
        if (!slides.length) return;

        let cur = 0;
        setInterval(function () {
            slides[cur].classList.remove('active');
            cur = (cur + 1) % slides.length;
            slides[cur].classList.add('active');
        }, 4000);
    })();

    /* ── 3. SCROLL FADE-IN ──────────────────────────────────── */
    const fadeEls = document.querySelectorAll(
        '.pastoral-card, .stat-card, .valor-card, .fade-up'
    );

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        fadeEls.forEach(function (el) {
            el.classList.add('fade-up');
            observer.observe(el);
        });
    } else {
        // Fallback para navegadores sin IntersectionObserver
        fadeEls.forEach(function (el) { el.classList.add('visible'); });
    }

});
