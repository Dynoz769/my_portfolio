document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const navLinks = document.querySelectorAll('.nav-menu a');
    const sections = document.querySelectorAll('main section[id]');
    const meters = document.querySelectorAll('.meter-fill');
    const stats = document.querySelectorAll('.stat-number');
    const reveals = document.querySelectorAll('.reveal');
    const typing = document.querySelector('.typing-effect');
    const themeToggle = document.getElementById('theme-toggle');
    const motionToggle = document.getElementById('motion-toggle');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    const phrases = [
        'IT enthusiast turning ideas into dependable systems.',
        'Developer who ships clean, fast experiences.',
        'Creative technologist blending code and design.'
    ];

    let phraseIndex = 0;
    let charIndex = 0;

    const setTheme = (mode) => {
        body.classList.toggle('theme-light', mode === 'light');
        if (themeToggle) themeToggle.textContent = mode === 'light' ? 'Dark' : 'Light';
        localStorage.setItem('theme', mode);
    };

    const setMotion = (state) => {
        const reduced = state === 'off';
        body.classList.toggle('reduced-motion', reduced);
        if (motionToggle) motionToggle.textContent = reduced ? 'Motion Off' : 'Motion On';
        localStorage.setItem('motion', state);
        if (reduced && typing) {
            typing.textContent = phrases[0];
        }
    };

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const savedMotion = localStorage.getItem('motion') || (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'on');
    setTheme(savedTheme);
    setMotion(savedMotion);

    const typeWriter = () => {
        if (!typing) return;
        if (body.classList.contains('reduced-motion')) {
            typing.textContent = phrases[phraseIndex];
            return;
        }
        const current = phrases[phraseIndex];
        if (charIndex <= current.length) {
            typing.textContent = current.slice(0, charIndex);
            charIndex++;
            setTimeout(typeWriter, 32);
        } else {
            setTimeout(() => {
                charIndex = 0;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                typeWriter();
            }, 1800);
        }
    };

    const updateScrollIndicator = () => {
        if (!scrollIndicator) return;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const progress = maxScroll ? window.scrollY / maxScroll : 0;
        scrollIndicator.style.transform = 'scaleX(' + progress + ')';
    };

    const highlightNav = () => {
        if (!sections.length) return;
        let current = null;
        sections.forEach(section => {
            const top = section.getBoundingClientRect().top;
            if (top <= 140) {
                current = section.id;
            }
        });
        if (!current) return;
        navLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            if (href.startsWith('#')) {
                link.classList.toggle('active', href.slice(1) === current);
            }
        });
    };

    const animateStats = (entry) => {
        const target = Number(entry.dataset.count || 0);
        if (body.classList.contains('reduced-motion')) {
            entry.textContent = target;
            return;
        }
        let start = 0;
        const step = () => {
            start += Math.max(1, Math.ceil(target / 60));
            if (start >= target) {
                entry.textContent = target;
                return;
            }
            entry.textContent = start;
            requestAnimationFrame(step);
        };
        step();
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (entry.target.classList.contains('meter-fill')) {
                    entry.target.style.width = entry.target.dataset.progress;
                }
                if (entry.target.classList.contains('stat-number') && !entry.target.dataset.animated) {
                    entry.target.dataset.animated = 'true';
                    animateStats(entry.target);
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.35 });

    reveals.forEach(el => observer.observe(el));
    meters.forEach(el => observer.observe(el));
    stats.forEach(el => observer.observe(el));

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            projectCards.forEach(card => {
                const categories = (card.dataset.category || '').split(' ');
                const show = filter === 'all' || categories.includes(filter);
                card.style.display = show ? 'grid' : 'none';
            });
        });
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.copy;
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = 'Copied';
                setTimeout(() => btn.textContent = 'Copy ' + (text.includes('@') ? 'email' : 'phone'), 1000);
            });
        });
    });

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = body.classList.contains('theme-light') ? 'dark' : 'light';
            setTheme(next);
        });
    }

    if (motionToggle) {
        motionToggle.addEventListener('click', () => {
            const next = body.classList.contains('reduced-motion') ? 'on' : 'off';
            setMotion(next);
            if (next === 'on' && typing) {
                phraseIndex = 0;
                charIndex = 0;
                setTimeout(typeWriter, 200);
            }
        });
    }

    navLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = href.slice(1);
                const target = document.getElementById(id);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            });
        }
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

    window.addEventListener('scroll', () => {
        updateScrollIndicator();
        highlightNav();
    });

    updateScrollIndicator();
    highlightNav();
    if (typing) {
        if (!body.classList.contains('reduced-motion')) {
            setTimeout(typeWriter, 400);
        } else {
            typing.textContent = phrases[0];
        }
    }
});
