import * as THREE from "three";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.querySelector("#space-canvas");
let sceneReady = false;

function initSpace() {
  if (!canvas || !window.WebGLRenderingContext) return;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 4.8;
    const group = new THREE.Group();
    scene.add(group);

    const starCount = 950;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const palette = [new THREE.Color("#c7a9ff"), new THREE.Color("#68d9df"), new THREE.Color("#ffffff")];
    for (let i = 0; i < starCount; i += 1) {
      const radius = 2.8 + Math.random() * 3.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.68;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ size: 0.018, vertexColors: true, transparent: true, opacity: 0.8 }));
    group.add(stars);

    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.58, 2), new THREE.MeshBasicMaterial({ color: "#8b55e8", wireframe: true, transparent: true, opacity: 0.28 }));
    orb.position.set(1.55, 0.15, 0);
    group.add(orb);
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.008, 8, 100), new THREE.MeshBasicMaterial({ color: "#c3a1ff", transparent: true, opacity: 0.5 }));
    orbit.position.copy(orb.position);
    orbit.rotation.set(0.8, 0.3, -0.4);
    group.add(orbit);
    const pointer = { x: 0, y: 0 };
    window.addEventListener("pointermove", (event) => { pointer.x = (event.clientX / window.innerWidth - 0.5) * 2; pointer.y = (event.clientY / window.innerHeight - 0.5) * 2; });
    const resize = () => { const rect = canvas.getBoundingClientRect(); renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); };
    resize(); window.addEventListener("resize", resize);
    const animate = (time) => {
      if (!prefersReducedMotion) { stars.rotation.y = time * 0.000025; stars.rotation.x = time * 0.000008; orb.rotation.x = time * 0.0005; orb.rotation.y = time * 0.0008; orbit.rotation.z = time * 0.0004; group.rotation.y += (pointer.x * 0.07 - group.rotation.y) * 0.025; group.rotation.x += (-pointer.y * 0.04 - group.rotation.x) * 0.025; }
      renderer.render(scene, camera); requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate); sceneReady = true;
  } catch (error) { canvas.style.display = "none"; }
}

initSpace();
if (!sceneReady) document.body.classList.add("webgl-fallback");

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("visible"); }), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
menuToggle?.addEventListener("click", () => { const open = nav.classList.toggle("open"); menuToggle.setAttribute("aria-expanded", String(open)); });
nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => { nav.classList.remove("open"); menuToggle?.setAttribute("aria-expanded", "false"); }));

const cursorGlow = document.querySelector(".cursor-glow");
window.addEventListener("pointermove", (event) => { if (cursorGlow) { cursorGlow.style.left = `${event.clientX}px`; cursorGlow.style.top = `${event.clientY}px`; } });
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`)); }), { rootMargin: "-35% 0px -55% 0px" });
sections.forEach((section) => sectionObserver.observe(section));
