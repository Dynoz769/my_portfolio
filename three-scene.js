/* ===========================================================
   3D backdrop — a floating low-poly "core" with orbit rings,
   data nodes and a particle field. Reads the theme colours from
   CSS variables, follows the pointer and the scroll position.
   =========================================================== */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const backdrop = document.querySelector('.backdrop');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const supportsWebGL = () => {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) {
        return false;
    }
};

if (backdrop && supportsWebGL()) {
    const isSmall = () => window.innerWidth < 760;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'scene-3d';
    backdrop.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    // ---------- lights ----------
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 5, 6);
    const rim = new THREE.PointLight(0xffffff, 18, 20);
    rim.position.set(-4, -2, 3);
    scene.add(ambient, key, rim);

    // ---------- core ----------
    const rig = new THREE.Group();
    scene.add(rig);

    const coreGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const coreMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.35, metalness: 0.45 });
    const core = new THREE.Mesh(coreGeo, coreMat);

    const shellGeo = new THREE.IcosahedronGeometry(1.95, 1);
    const shellMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 });
    const shell = new THREE.LineSegments(new THREE.EdgesGeometry(shellGeo), shellMat);

    const ringMatA = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.6 });
    const ringMatB = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.6 });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.022, 12, 160), ringMatA);
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.016, 12, 160), ringMatB);
    ringA.rotation.set(Math.PI / 2.4, 0.3, 0);
    ringB.rotation.set(Math.PI / 1.8, -0.5, 0.4);

    rig.add(core, shell, ringA, ringB);

    // ---------- orbiting data nodes ----------
    const nodeMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.4, metalness: 0.3 });
    const nodeGeos = [new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.OctahedronGeometry(0.13)];
    const nodes = [];
    for (let i = 0; i < 14; i++) {
        const mesh = new THREE.Mesh(nodeGeos[i % 2], nodeMat);
        mesh.userData = {
            radius: 2.3 + Math.random() * 1.2,
            speed: 0.15 + Math.random() * 0.25,
            offset: Math.random() * Math.PI * 2,
            tilt: (Math.random() - 0.5) * 1.4
        };
        nodes.push(mesh);
        rig.add(mesh);
    }

    // ---------- particle field ----------
    const particleCount = isSmall() ? 320 : 900;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 26;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 3;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ size: 0.035, transparent: true, opacity: 0.7, sizeAttenuation: true });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ---------- theme colours ----------
    const cssColor = (name) => new THREE.Color(getComputedStyle(document.body).getPropertyValue(name).trim() || '#ffffff');
    const applyTheme = () => {
        const light = document.body.classList.contains('theme-light');
        coreMat.color = cssColor('--card');
        coreMat.emissive = cssColor('--accent');
        coreMat.emissiveIntensity = light ? 0.03 : 0.05;
        shellMat.color = cssColor('--accent');
        ringMatA.color = cssColor('--accent-2');
        ringMatB.color = cssColor('--accent-3');
        nodeMat.color = cssColor('--accent');
        particleMat.color = cssColor(light ? '--muted' : '--stroke');
        particleMat.opacity = light ? 0.55 : 0.8;
        rim.color = cssColor('--accent-2');
        ambient.intensity = light ? 0.9 : 0.45;
    };
    applyTheme();
    new MutationObserver(applyTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // ---------- layout: keep the core to the side of the content ----------
    // Desktop: the core sits behind the hero panel so its rings orbit around it.
    const home = { y: 0 };
    const layout = () => {
        home.y = isSmall() ? 2.4 : 0;
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        if (isSmall()) {
            rig.position.set(1.7, home.y, -3);
            rig.scale.setScalar(0.6);
        } else {
            rig.position.set(2.6, home.y, 0);
            rig.scale.setScalar(1.15);
        }
    };
    layout();
    window.addEventListener('resize', layout);

    // ---------- interaction ----------
    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0, scroll: 0 };
    window.addEventListener('pointermove', (e) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    const clock = new THREE.Clock();
    let running = true;

    const frame = () => {
        const t = clock.getElapsedTime();
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const scroll = window.scrollY / maxScroll;

        eased.x += (pointer.x - eased.x) * 0.05;
        eased.y += (pointer.y - eased.y) * 0.05;
        eased.scroll += (scroll - eased.scroll) * 0.08;

        core.rotation.set(t * 0.18 + eased.scroll * 3, t * 0.24, 0);
        shell.rotation.set(-t * 0.1, -t * 0.14 + eased.scroll * 2, 0);
        ringA.rotation.z = t * 0.2;
        ringB.rotation.z = -t * 0.15;

        nodes.forEach((n) => {
            const d = n.userData;
            const a = t * d.speed + d.offset;
            n.position.set(Math.cos(a) * d.radius, Math.sin(a * 1.3) * d.tilt, Math.sin(a) * d.radius);
            n.rotation.set(a * 2, a * 1.5, 0);
        });

        rig.rotation.x = eased.y * 0.25;
        rig.rotation.y = eased.x * 0.35;
        rig.position.y += (home.y + Math.sin(t * 0.8) * 0.12 + eased.scroll * 2.2 - rig.position.y) * 0.1;

        particles.rotation.y = t * 0.015 + eased.x * 0.08;
        particles.rotation.x = eased.y * 0.05;
        particles.position.y = eased.scroll * 3;

        camera.position.x = eased.x * 0.4;
        camera.position.y = -eased.y * 0.3;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    };

    const loop = () => {
        if (!running) return;
        frame();
        requestAnimationFrame(loop);
    };

    if (reduceMotion) {
        frame();
        window.addEventListener('resize', frame);
        new MutationObserver(frame).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    } else {
        loop();
        document.addEventListener('visibilitychange', () => {
            running = !document.hidden;
            if (running) loop();
        });
    }

    requestAnimationFrame(() => renderer.domElement.classList.add('ready'));
}
