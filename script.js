import * as THREE from "three";

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const canvas = document.querySelector("#universe");
const sections = [...document.querySelectorAll(".destination")];
const links = [...document.querySelectorAll("[data-destination]")];
const motionToggle = document.querySelector("#motion-toggle");
const sceneStatus = document.querySelector("#scene-status");
const locationLabel = document.querySelector("#location-label");
const menu = document.querySelector("#primary-nav");
const menuButton = document.querySelector(".menu-button");
const state = { reduced: reducedMotionQuery.matches, travelling: false, destination: "home", pointerX: 0, pointerY: 0 };
const destinations = {
  home: new THREE.Vector3(0, 0, 7.5), about: new THREE.Vector3(3.4, .5, 5.5), skills: new THREE.Vector3(-3.1, 1.1, 5.8),
  projects: new THREE.Vector3(2.3, -1.3, 4.8), writing: new THREE.Vector3(-2.8, -1.3, 4.9), achievements: new THREE.Vector3(3.2, 1.6, 4.7), contact: new THREE.Vector3(0, -2.5, 5.6),
};
let renderer; let scene; let camera; let starField; let trailField; let shuttle; let destinationGroup; let animationFrame; let lastTime = 0; let travelToken = 0;

function makeStars(count, trail = false) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3); const colors = new Float32Array(count * 3);
  const palette = [new THREE.Color("#ffffff"), new THREE.Color("#9b7bff"), new THREE.Color("#62dce7"), new THREE.Color("#f05c78")];
  for (let i = 0; i < count; i += 1) {
    const radius = trail ? 5 + Math.random() * 17 : 5 + Math.random() * 10;
    const theta = Math.random() * Math.PI * 2; const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta); positions[i * 3 + 1] = radius * Math.cos(phi); positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    const color = palette[Math.floor(Math.random() * palette.length)]; colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3)); geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: trail ? .026 : .018, vertexColors: true, transparent: true, opacity: trail ? 0 : .8, depthWrite: false });
  return { points: new THREE.Points(geometry, material), material, geometry };
}

function makeShuttle() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.18, .78, 6, 16), new THREE.MeshStandardMaterial({ color: "#d7d1eb", metalness: .72, roughness: .24 }));
  body.rotation.z = Math.PI / 2; group.add(body);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#2d4e7b", emissive: "#1e6a75", emissiveIntensity: .7, metalness: .5, roughness: .17, transparent: true, opacity: .9 }));
  cockpit.position.x = .24; cockpit.scale.set(1, .75, 1); group.add(cockpit);
  const wingMaterial = new THREE.MeshStandardMaterial({ color: "#6f5b9f", metalness: .5, roughness: .35 });
  [-1, 1].forEach((side) => { const wing = new THREE.Mesh(new THREE.BoxGeometry(.52, .035, .22), wingMaterial); wing.position.set(-.04, 0, side * .2); wing.rotation.y = side * .22; group.add(wing); });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 10), new THREE.MeshBasicMaterial({ color: "#62dce7", transparent: true, opacity: .9 }));
  glow.position.x = -.48; group.add(glow);
  group.scale.setScalar(.72); group.rotation.y = -.15; return group;
}

function tweenCamera(targetName) {
  if (!camera || state.reduced) { if (camera) camera.position.copy(destinations[targetName]); state.travelling = false; return; }
  const from = camera.position.clone(); const target = destinations[targetName].clone(); const start = performance.now(); const duration = 1250; const token = ++travelToken;
  state.travelling = true; sceneStatus.textContent = "HYPERSPACE / NAVIGATING"; trailField.material.opacity = .72;
  const travel = (now) => { if (token !== travelToken) return; const progress = Math.min((now - start) / duration, 1); const eased = progress < .5 ? 4 * progress ** 3 : 1 - ((-2 * progress + 2) ** 3) / 2; camera.position.lerpVectors(from, target, eased); camera.rotation.z = Math.sin(progress * Math.PI) * -.06; trailField.material.size = .026 + Math.sin(progress * Math.PI) * .08; if (progress < 1) requestAnimationFrame(travel); else { state.travelling = false; trailField.material.opacity = 0; sceneStatus.textContent = "ORBITAL LINK / STABLE"; } };
  requestAnimationFrame(travel);
}

function initScene() {
  if (!canvas || !window.WebGLRenderingContext) return false;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6)); renderer.setSize(window.innerWidth, window.innerHeight, false);
    scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, .1, 100); camera.position.copy(destinations.home);
    scene.add(new THREE.AmbientLight("#798bb8", .42)); const key = new THREE.PointLight("#9b7bff", 4, 15); key.position.set(2, 3, 4); scene.add(key);
    starField = makeStars(window.innerWidth < 720 ? 520 : 1050); trailField = makeStars(window.innerWidth < 720 ? 180 : 360, true); scene.add(starField.points, trailField.points);
    destinationGroup = new THREE.Group(); scene.add(destinationGroup);
    const planet = new THREE.Mesh(new THREE.SphereGeometry(1.05, 32, 24), new THREE.MeshStandardMaterial({ color: "#271e57", emissive: "#161d4d", emissiveIntensity: 1.1, roughness: .82 }));
    planet.position.set(0, 0, -1); destinationGroup.add(planet);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.65, .012, 8, 96), new THREE.MeshBasicMaterial({ color: "#9b7bff", transparent: true, opacity: .55 })); ring.rotation.set(.8, .2, -.2); ring.position.copy(planet.position); destinationGroup.add(ring);
    shuttle = makeShuttle(); shuttle.position.set(-1.3, .4, 1.2); destinationGroup.add(shuttle);
    window.addEventListener("resize", resize); document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(animationFrame); else { lastTime = 0; animationFrame = requestAnimationFrame(render); } });
    return true;
  } catch (error) { return false; }
}

function resize() { if (!renderer || !camera) return; camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6)); renderer.setSize(window.innerWidth, window.innerHeight, false); }
function render(time) { if (!renderer || document.hidden) return; const delta = Math.min((time - lastTime) / 1000 || .016, .05); lastTime = time; if (!state.reduced) { starField.points.rotation.y += delta * .006; destinationGroup.rotation.y += delta * .035; shuttle.position.y = .4 + Math.sin(time * .0012) * .05; camera.position.x += (state.pointerX * .18 - camera.position.x + destinations[state.destination].x) * delta * .7; camera.position.y += (state.pointerY * .12 - camera.position.y + destinations[state.destination].y) * delta * .7; } renderer.render(scene, camera); animationFrame = requestAnimationFrame(render); }

function setDestination(name, { updateHash = true, focus = true } = {}) {
  if (!destinations[name]) name = "home"; state.destination = name;
  sections.forEach((section) => { const active = section.id === name; section.classList.toggle("is-active", active); section.setAttribute("aria-hidden", String(!active)); });
  links.forEach((link) => link.classList.toggle("is-current", link.dataset.destination === name)); document.querySelector("#location-label").textContent = `${name.toUpperCase()} / ${Object.keys(destinations).indexOf(name) + 1}`; if (updateHash && window.location.hash !== `#${name}`) history.pushState({ destination: name }, "", `#${name}`); tweenCamera(name);
  menu.classList.remove("is-open"); menuButton.setAttribute("aria-expanded", "false"); if (focus) document.querySelector(`#${name} h1, #${name} h2`)?.focus({ preventScroll: true });
}

links.forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); setDestination(link.dataset.destination); }));
window.addEventListener("popstate", () => setDestination(window.location.hash.slice(1) || "home", { updateHash: false }));
window.addEventListener("hashchange", () => setDestination(window.location.hash.slice(1) || "home", { updateHash: false }));
window.addEventListener("pointermove", (event) => { state.pointerX = (event.clientX / window.innerWidth - .5) * 2; state.pointerY = (event.clientY / window.innerHeight - .5) * -2; });
menuButton.addEventListener("click", () => { const open = menu.classList.toggle("is-open"); menuButton.setAttribute("aria-expanded", String(open)); });
motionToggle.addEventListener("click", () => { state.reduced = !state.reduced; motionToggle.setAttribute("aria-pressed", String(state.reduced)); motionToggle.querySelector("span:last-child").textContent = state.reduced ? "Motion off" : "Motion on"; if (state.reduced) { trailField?.material && (trailField.material.opacity = 0); } });
window.addEventListener("keydown", (event) => { if (event.key.toLowerCase() === "m" && event.target === document.body) motionToggle.click(); });
reducedMotionQuery.addEventListener("change", (event) => { state.reduced = event.matches; });

const sceneReady = initScene(); if (!sceneReady) { document.body.classList.add("webgl-fallback"); sceneStatus.textContent = "STATIC FALLBACK / READY"; }
setDestination(window.location.hash.slice(1) || "home", { updateHash: false, focus: false }); animationFrame = requestAnimationFrame(render);
