document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mobile menu
    const nav = document.querySelector('.nav');
    const menuBtn = document.querySelector('.menu-btn');
    if (nav && menuBtn) {
        menuBtn.addEventListener('click', () => {
            const open = nav.classList.toggle('open');
            menuBtn.setAttribute('aria-expanded', String(open));
        });
        nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
    }

    // Count-up for stats
    const animateCount = (el) => {
        const target = Number(el.dataset.count || 0);
        const suffix = el.dataset.suffix || '';
        if (reduceMotion) {
            el.textContent = target + suffix;
            return;
        }
        const start = performance.now();
        const duration = 1200;
        const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    // Fade-up on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            entry.target.querySelectorAll('[data-count]').forEach(animateCount);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach((el, i) => {
        el.style.transitionDelay = (i % 6) * 60 + 'ms';
        observer.observe(el);
    });

    // Cursor spotlight on cards
    document.addEventListener('pointermove', (e) => {
        const card = e.target.closest && e.target.closest('.card');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    }, { passive: true });

    // Screenshot fallback: drop a failed preview so the gradient + initials show
    document.querySelectorAll('.shot img').forEach(img => {
        img.addEventListener('error', () => img.remove());
    });

    // Projects: filter, search and show more
    const grid = document.getElementById('project-grid');
    if (grid) {
        const items = [...grid.querySelectorAll('.project')];
        const chips = document.querySelectorAll('.chip[data-filter]');
        const search = document.getElementById('project-search');
        const moreBtn = document.getElementById('show-more');
        const empty = document.getElementById('project-empty');
        const PAGE = 12;
        let filter = 'all';
        let limit = PAGE;

        const render = () => {
            const q = (search ? search.value : '').trim().toLowerCase();
            const matches = items.filter(item => {
                const inCat = filter === 'all' || item.dataset.cat === filter;
                const inText = !q || item.textContent.toLowerCase().includes(q);
                return inCat && inText;
            });
            items.forEach(item => item.classList.add('is-hidden'));
            matches.slice(0, limit).forEach(item => item.classList.remove('is-hidden'));
            if (moreBtn) moreBtn.parentElement.style.display = matches.length > limit ? '' : 'none';
            if (empty) empty.style.display = matches.length ? 'none' : 'block';
        };

        chips.forEach(chip => chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filter = chip.dataset.filter;
            limit = PAGE;
            render();
        }));
        if (search) search.addEventListener('input', () => { limit = PAGE; render(); });
        if (moreBtn) moreBtn.addEventListener('click', () => { limit += PAGE; render(); });
        render();
    }

    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.copy;
            const label = btn.textContent;
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = 'Copied';
                setTimeout(() => btn.textContent = label, 1200);
            });
        });
    });

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your message! I will get back to you soon.');
            e.target.reset();
        });
    }

    const RESUME_PASSWORD = 'Adamihaikal769';
    document.querySelectorAll('.resume-download').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const input = window.prompt('Enter the password to download the resume:');
            if (input === null) return;
            if (input === RESUME_PASSWORD) {
                const a = document.createElement('a');
                a.href = link.getAttribute('href');
                a.setAttribute('download', '');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                alert('Incorrect password. The resume is password-protected.');
            }
        });
    });
});
