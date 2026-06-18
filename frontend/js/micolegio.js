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

    /* ── 4. NOTICIAS Y ACTUALIDAD (públicas) ────────────────── */
    cargarNoticiasPublicas();

});

// Convierte un enlace de YouTube a su formato "embed" para el iframe
function youtubeEmbed(url) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    return m ? 'https://www.youtube.com/embed/' + m[1] : null;
}

// Escapa HTML básico (por si api.js no estuviera disponible)
function esc(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
}

async function cargarNoticiasPublicas() {
    const cont = document.getElementById('cont-noticias');
    if (!cont) return;

    try {
        const noticias = await apiFetch('/noticias');

        if (noticias.length === 0) {
            cont.innerHTML = '<p class="text-muted text-center">Próximamente publicaremos novedades.</p>';
            return;
        }

        cont.innerHTML = noticias.map(function (n) {
            // Bloque multimedia según el tipo
            let media = '';
            if (n.tipoMedia === 'imagen' && n.mediaUrl) {
                media = `<img src="${esc(n.mediaUrl)}" alt="${esc(n.titulo)}"
                              style="width:100%;height:200px;object-fit:cover;border-radius:8px 8px 0 0;">`;
            } else if (n.tipoMedia === 'video' && n.mediaUrl) {
                const embed = youtubeEmbed(n.mediaUrl);
                if (embed) {
                    media = `<div class="ratio ratio-16x9"><iframe src="${embed}" title="${esc(n.titulo)}"
                                  allowfullscreen style="border:0;border-radius:8px 8px 0 0;"></iframe></div>`;
                }
            }

            const fecha = new Date(n.fechaPublicacion).toLocaleDateString('es-CO', {
                day: '2-digit', month: 'long', year: 'numeric'
            });

            return `
                <div class="col-lg-4 col-md-6">
                    <div class="pastoral-card h-100">
                        ${media}
                        <div class="card-body">
                            <span class="badge mb-2" style="background:var(--verde)">${esc(n.categoria)}</span>
                            <h3 class="mc-card-title">${esc(n.titulo)}</h3>
                            <p>${esc(n.contenido)}</p>
                            <small class="text-muted"><i class="bi bi-clock me-1"></i>${fecha}</small>
                        </div>
                    </div>
                </div>`;
        }).join('');
    } catch (err) {
        cont.innerHTML = `<p class="text-danger text-center">No se pudieron cargar las noticias.</p>`;
        console.error(err);
    }
}
