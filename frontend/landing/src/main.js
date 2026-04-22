import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CONFIG = {
  modelUrl: '/models/mclaren_mp45__formula_1.glb',
  animatedText: 'Reinventing the future of race logistics',
};

// Loading
function updateLoading(progress, text) {
  const bar = document.getElementById('loading-progress');
  const txt = document.getElementById('loading-text');
  if (bar) bar.style.width = `${progress}%`;
  if (txt) txt.textContent = text;
}

function hideLoading() {
  const screen = document.getElementById('loading-screen');
  if (screen) {
    screen.classList.add('hidden');
    setTimeout(() => screen.remove(), 1000);
  }
}

// Scene Setup
function initScene() {
  const canvas = document.getElementById('webgl-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 2, 8);
  
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  
  const light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(5, 10, 5);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  scene.add(light);
  
  const rim = new THREE.PointLight(0xb4ff2c, 2, 20);
  rim.position.set(-3, 2, -3);
  scene.add(rim);
  
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.ShadowMaterial({ opacity: 0.3 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1;
  ground.receiveShadow = true;
  scene.add(ground);
  
  return { renderer, scene, camera };
}

// Load Car
async function loadCar(scene) {
  return new Promise((resolve) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    
    const timeout = setTimeout(() => resolve(null), 15000);
    
    loader.load(
      CONFIG.modelUrl,
      (gltf) => {
        clearTimeout(timeout);
        const car = gltf.scene;
        const box = new THREE.Box3().setFromObject(car);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        car.position.sub(center);
        car.scale.setScalar(3 / Math.max(size.x, size.y, size.z));
        car.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        const group = new THREE.Group();
        group.add(car);
        scene.add(group);
        resolve(group);
      },
      (xhr) => {
        const progress = xhr.lengthComputable ? (xhr.loaded / xhr.total) * 100 : 0;
        updateLoading(30 + progress * 0.5, `Loading... ${Math.round(progress)}%`);
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      }
    );
  });
}

// Text Animation
function setupTextAnimation() {
  const el = document.getElementById('animated-text');
  if (!el) return;
  
  el.innerHTML = CONFIG.animatedText.split(' ').map(word => 
    word.split('').map(char => `<span class="char">${char}</span>`).join('') + ' '
  ).join('');
  
  const chars = el.querySelectorAll('.char');
  
  ScrollTrigger.create({
    trigger: '.text-reveal-section',
    start: 'top center',
    onEnter: () => {
      chars.forEach((char, i) => {
        setTimeout(() => {
          char.classList.add('visible');
          if (!chars[i + 1] || chars[i + 1].textContent === ' ') {
            char.classList.add('accent');
          }
        }, i * 50);
      });
    },
  });
}

// Scroll Animations
function setupScrollAnimations(car, camera) {
  if (!car) return;
  
  car.rotation.y = Math.PI * 0.25;
  
  gsap.to(car.rotation, {
    y: -Math.PI * 0.25,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
  });
  
  gsap.to(camera.position, {
    z: 4, y: 1,
    scrollTrigger: { trigger: '.text-reveal-section', start: 'top bottom', end: 'center center', scrub: 1 }
  });
  
  gsap.to(car.rotation, {
    y: Math.PI * 0.5,
    scrollTrigger: { trigger: '.text-reveal-section', start: 'top bottom', end: 'center center', scrub: 1 }
  });
  
  gsap.to(camera.position, {
    z: 10, y: 3,
    scrollTrigger: { trigger: '.features', start: 'top bottom', end: 'center center', scrub: 1 }
  });
  
  gsap.to(car.rotation, {
    y: Math.PI * 2,
    scrollTrigger: { trigger: '.features', start: 'top bottom', end: 'bottom bottom', scrub: 1 }
  });
}

// Render Loop
function startRenderLoop(renderer, scene, camera, car) {
  function animate() {
    requestAnimationFrame(animate);
    if (car) car.position.y = Math.sin(Date.now() * 0.0005) * 0.1;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  animate();
}

// Resize
function setupResize(renderer, camera) {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
}

// Init
async function init() {
  try {
    updateLoading(10, 'Initializing...');
    const { renderer, scene, camera } = initScene();
    updateLoading(30, 'Loading car...');
    const car = await loadCar(scene);
    updateLoading(80, 'Setting up...');
    setupTextAnimation();
    setupScrollAnimations(car, camera);
    setupResize(renderer, camera);
    startRenderLoop(renderer, scene, camera, car);
    updateLoading(100, 'Ready!');
    setTimeout(hideLoading, 500);
  } catch (error) {
    console.error('Init failed:', error);
    hideLoading();
  }
}

init();
