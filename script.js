(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    // ---------- smooth scroll (Lenis, desktop wheel only) ----------
    let lenis = null;
    if (!reduceMotion && window.Lenis) {
        lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    }

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const id = link.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -96 });
        else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        if (target.id === 'main') target.focus({ preventScroll: true });
    });

    // ---------- nav + mobile menu ----------
    const nav = $('.nav');
    const menuBtn = $('.menu-btn');
    const setMenu = (open) => {
        document.body.classList.toggle('menu-open', open);
        if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', String(open));
            menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        }
        if (lenis) open ? lenis.stop() : lenis.start();
    };
    if (menuBtn) menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 921px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

    // ---------- split headings into masked words ----------
    const splitWords = (el) => {
        let index = 0;
        const wrap = (node) => {
            const outer = document.createElement('span');
            const inner = document.createElement('span');
            outer.className = 'w';
            inner.className = 'wi';
            inner.style.setProperty('--d', index++);
            inner.appendChild(node);
            outer.appendChild(inner);
            return outer;
        };
        [...el.childNodes].forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const frag = document.createDocumentFragment();
                node.textContent.split(/(\s+)/).forEach(part => {
                    if (!part) return;
                    frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(document.createTextNode(part)));
                });
                node.replaceWith(frag);
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
                const marker = document.createComment('');
                node.replaceWith(marker);
                marker.replaceWith(wrap(node));
            }
        });
    };
    if (!reduceMotion) $$('[data-split]').forEach(splitWords);

    // ---------- count up ----------
    const countUp = (el) => {
        if (el.dataset.counted) return;
        el.dataset.counted = 'true';
        const target = Number(el.dataset.count || 0);
        const suffix = el.dataset.suffix || '';
        if (reduceMotion) {
            el.textContent = target + suffix;
            return;
        }
        const start = performance.now();
        const duration = 1600;
        const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 4);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0' + suffix;
        requestAnimationFrame(tick);
    };

    // ---------- reveal on scroll ----------
    $$('[data-stagger]').forEach(parent => {
        const mod = Number(parent.dataset.stagger) || 6;
        [...parent.children].forEach((child, i) => child.style.setProperty('--stagger', i % mod));
    });

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add(el.hasAttribute('data-split') ? 'split-in' : 'visible');
            if (el.matches('[data-count]')) countUp(el);
            $$('[data-count]', el).forEach(countUp);
            // drop the stagger delay once shown so hover transitions stay instant
            setTimeout(() => el.style.setProperty('--stagger', 0), 1400);
            revealObserver.unobserve(el);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal, .clip-reveal, [data-split], [data-count]').forEach(el => {
        if (el.closest('.hero')) return;
        revealObserver.observe(el);
    });

    // hero intro plays on load
    const hero = $('.hero');
    if (hero) {
        const playHero = () => {
            hero.classList.add('is-in');
            $$('[data-split]', hero).forEach(el => el.classList.add('split-in'));
            $$('.reveal', hero).forEach(el => el.classList.add('visible'));
            $$('[data-count]', hero).forEach(countUp);
        };
        requestAnimationFrame(() => setTimeout(playHero, 80));
    }

    // ---------- rotating words ----------
    $$('[data-rotator]').forEach(rotator => {
        const words = [...rotator.children];
        if (reduceMotion || words.length < 2) return;
        let i = 0;
        setInterval(() => {
            const current = words[i];
            i = (i + 1) % words.length;
            const next = words[i];
            current.classList.remove('is-active');
            current.classList.add('is-leaving');
            next.classList.remove('is-leaving');
            next.classList.add('is-active');
            setTimeout(() => current.classList.remove('is-leaving'), 900);
        }, 2800);
    });

    // ---------- live local time (Kelantan, GMT+8) ----------
    const clocks = $$('[data-clock]');
    if (clocks.length) {
        const long = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const short = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', minute: '2-digit' });
        const tick = () => {
            const now = new Date();
            clocks.forEach(el => { el.textContent = el.dataset.clock === 'short' ? short.format(now) : long.format(now); });
        };
        tick();
        setInterval(tick, 1000);
    }

    // ---------- images: fade in when loaded ----------
    $$('.shot img').forEach(img => {
        const done = () => img.classList.add('is-loaded');
        if (img.complete && img.naturalWidth) done();
        else {
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', () => img.remove(), { once: true });
        }
    });

    // ---------- pointer effects (desktop) ----------
    document.addEventListener('pointermove', (e) => {
        const card = e.target.closest && e.target.closest('.card');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    }, { passive: true });

    let cursor = null;
    const pointer = { x: -200, y: -200, cx: -200, cy: -200 };
    if (finePointer && !reduceMotion) {
        $$('[data-magnetic]').forEach(el => {
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                const x = e.clientX - (r.left + r.width / 2);
                const y = e.clientY - (r.top + r.height / 2);
                el.style.transform = `translate(${x * 0.22}px, ${y * 0.32}px)`;
            });
            el.addEventListener('pointerleave', () => { el.style.transform = ''; });
        });

        cursor = document.createElement('div');
        cursor.className = 'cursor';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.innerHTML = '<span class="cursor-label"></span>';
        document.body.appendChild(cursor);
        const label = cursor.firstChild;
        window.addEventListener('pointermove', (e) => {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            cursor.classList.add('is-visible');
            const labelled = e.target.closest('[data-cursor]');
            const interactive = e.target.closest('a, button, input, select, textarea, label');
            if (labelled) {
                label.textContent = labelled.dataset.cursor;
                cursor.classList.add('is-label');
            } else {
                cursor.classList.remove('is-label');
            }
            cursor.classList.toggle('is-link', !labelled && !!interactive);
        }, { passive: true });
        document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) cursor.classList.remove('is-visible'); });

        if (hero) {
            hero.addEventListener('pointermove', (e) => {
                const r = hero.getBoundingClientRect();
                hero.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
                hero.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
            });
            hero.addEventListener('pointerleave', () => {
                hero.style.setProperty('--px', 0);
                hero.style.setProperty('--py', 0);
            });
        }
    }

    // ---------- view transitions for in-page filtering ----------
    const withTransition = (container, update) => {
        if (!document.startViewTransition || reduceMotion) {
            update();
            return;
        }
        root.classList.add('vt-filter');
        container.classList.add('vt-on');
        const transition = document.startViewTransition(update);
        transition.finished.finally(() => {
            root.classList.remove('vt-filter');
            container.classList.remove('vt-on');
        });
    };

    // ---------- projects: filter, search, show more ----------
    const grid = $('#project-grid');
    if (grid) {
        const items = $$('.project', grid);
        const chips = $$('.chip[data-filter]');
        const search = $('#project-search');
        const moreBtn = $('#show-more');
        const empty = $('#project-empty');
        const PAGE = 12;
        let filter = 'all';
        let limit = PAGE;

        items.forEach((item, i) => item.style.setProperty('--vt', 'p' + i));

        const render = (fromUser) => {
            const q = (search ? search.value : '').trim().toLowerCase();
            const matches = items.filter(item => {
                const inCat = filter === 'all' || item.dataset.cat === filter;
                const inText = !q || item.textContent.toLowerCase().includes(q);
                return inCat && inText;
            });
            items.forEach(item => item.classList.add('is-hidden'));
            matches.slice(0, limit).forEach(item => {
                item.classList.remove('is-hidden');
                if (fromUser) item.classList.add('visible');
            });
            if (moreBtn) moreBtn.parentElement.style.display = matches.length > limit ? '' : 'none';
            if (empty) empty.style.display = matches.length ? 'none' : 'block';
        };

        chips.forEach(chip => chip.addEventListener('click', () => {
            if (chip.classList.contains('active')) return;
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filter = chip.dataset.filter;
            limit = PAGE;
            withTransition(grid, () => render(true));
        }));
        if (search) search.addEventListener('input', () => { limit = PAGE; render(true); });
        if (moreBtn) moreBtn.addEventListener('click', () => { limit += PAGE; withTransition(grid, () => render(true)); });
        render(false);
    }

    // ---------- experience: timeline filter ----------
    const timelines = $$('.tl');
    const tlChips = $$('.chip[data-tl-filter]');
    if (tlChips.length && timelines.length) {
        const tl = timelines[0];
        const groups = $$('.tl-group', tl);
        $$('.tl-item', tl).forEach((item, i) => item.style.setProperty('--vt', 't' + i));
        groups.forEach((group, i) => group.style.setProperty('--vt', 'g' + i));
        tlChips.forEach(chip => chip.addEventListener('click', () => {
            if (chip.classList.contains('active')) return;
            tlChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const f = chip.dataset.tlFilter;
            withTransition(tl, () => {
                groups.forEach(group => {
                    let shown = 0;
                    $$('.tl-item', group).forEach(item => {
                        const match = f === 'all' || item.dataset.tags.split(' ').includes(f);
                        item.classList.toggle('is-hidden', !match);
                        if (match) {
                            item.classList.add('visible');
                            shown++;
                        }
                    });
                    group.classList.toggle('is-hidden', shown === 0);
                });
                lastY = -1;
            });
        }));
    }

    // ---------- scroll-linked effects ----------
    const progressBar = $('.progress');
    const toTop = $('.to-top');
    const ringFg = toTop ? $('.ring-fg', toTop) : null;
    const ringLength = ringFg ? ringFg.getTotalLength() : 0;
    if (ringFg) ringFg.style.strokeDasharray = ringLength;
    const parallaxEls = $$('[data-parallax]');
    const stackCards = $$('.stack-card');
    const desktop = window.matchMedia('(min-width: 761px)');
    let stickyTops = [];
    let vh = window.innerHeight;
    let lastY = -1;

    const measure = () => {
        vh = window.innerHeight;
        stickyTops = stackCards.map(card => parseFloat(getComputedStyle(card).top) || 0);
        lastY = -1;
    };
    measure();
    window.addEventListener('resize', measure);

    const update = () => {
        const y = window.scrollY;
        if (y === lastY) return;
        lastY = y;
        const max = root.scrollHeight - vh;
        const p = max > 0 ? clamp(y / max, 0, 1) : 0;

        if (progressBar) progressBar.style.transform = `scaleX(${p})`;
        if (nav) nav.classList.toggle('is-scrolled', y > 12);
        if (toTop) toTop.classList.toggle('is-visible', y > 600);
        if (ringFg) ringFg.style.strokeDashoffset = ringLength * (1 - p);

        if (!reduceMotion) {
            parallaxEls.forEach(el => {
                const box = el.parentElement.getBoundingClientRect();
                if (box.bottom < -100 || box.top > vh + 100) return;
                const offset = (box.top + box.height / 2 - vh / 2) * Number(el.dataset.parallax || 0.1);
                el.style.transform = `translate3d(0, ${(-offset).toFixed(1)}px, 0)`;
            });
        }

        if (stackCards.length > 1 && desktop.matches && !reduceMotion) {
            stackCards.forEach((card, i) => {
                const next = stackCards[i + 1];
                if (!next) return;
                const nextTop = next.getBoundingClientRect().top;
                const progress = clamp((vh - nextTop) / (vh - stickyTops[i + 1]), 0, 1);
                card.style.setProperty('--p', progress.toFixed(3));
            });
        }

        const mid = vh * 0.55;
        timelines.forEach(tl => {
            const box = tl.getBoundingClientRect();
            const fill = $('.tl-fill', tl);
            if (fill) fill.style.height = (clamp((mid - box.top) / box.height, 0, 1) * 100).toFixed(2) + '%';
            $$('.tl-item', tl).forEach(item => item.classList.toggle('is-active', item.getBoundingClientRect().top + 30 < mid));
            $$('.tl-group', tl).forEach(group => {
                const g = group.getBoundingClientRect();
                group.classList.toggle('is-current', g.top < mid && g.bottom > mid);
            });
        });
    };

    if (toTop) {
        toTop.addEventListener('click', () => {
            if (lenis) lenis.scrollTo(0);
            else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    }

    const frame = (time) => {
        if (lenis) lenis.raf(time);
        update();
        if (cursor) {
            pointer.cx += (pointer.x - pointer.cx) * 0.2;
            pointer.cy += (pointer.y - pointer.cy) * 0.2;
            cursor.style.transform = `translate3d(${pointer.cx.toFixed(1)}px, ${pointer.cy.toFixed(1)}px, 0)`;
        }
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    // ---------- copy buttons ----------
    $$('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.copy;
            const label = btn.textContent;
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = 'Copied ✓';
                setTimeout(() => { btn.textContent = label; }, 1400);
            });
        });
    });

    const contactForm = $('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your message! I will get back to you soon.');
            e.target.reset();
        });
    }

    const RESUME_PASSWORD = 'Adamihaikal769';
    $$('.resume-download').forEach(link => {
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
})();
