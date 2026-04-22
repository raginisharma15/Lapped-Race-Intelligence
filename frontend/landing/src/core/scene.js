import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CAR_TARGET_HEIGHT, TRACK_TARGET_SPAN } from './config.js';

/* ═══════════════════════════════════════════════════
   WIREFRAME MORPH STATE
   carState.wireframe goes 0 → 1 via scroll.
   applyFrame cross-fades solid ↔ wireframe clones.
═══════════════════════════════════════════════════ */
let _solidMeshes   = [];   // original MeshStandardMaterials (cloned)
let _wireMeshes    = [];   // blue wireframe copies
let _wireMat       = null;

/** Build per-mesh wireframe twins and attach to carGroup */
function buildWireframeClones(carGroup) {
  _wireMat = new THREE.MeshBasicMaterial({
    color: 0x4a9eff,
    wireframe: true,
    transparent: true,
    opacity: 0,
  });

  carGroup.traverse((child) => {
    if (!child.isMesh) return;

    // Store solid mesh ref + clone its material for opacity control
    const solidMat = Array.isArray(child.material)
      ? child.material.map((m) => m.clone())
      : child.material.clone();
    child.material = solidMat;
    _solidMeshes.push(child);

    // Create wireframe twin
    const wClone = new THREE.Mesh(child.geometry, _wireMat.clone());
    wClone.position.copy(child.position);
    wClone.rotation.copy(child.rotation);
    wClone.scale.copy(child.scale);
    // Attach to same parent so transforms match
    child.parent.add(wClone);
    _wireMeshes.push(wClone);
  });
}

/** Called every frame – morph = 0 (solid) → 1 (full wireframe) */
export function applyWireframeMorph(morph) {
  const m = Math.max(0, Math.min(1, morph));

  _solidMeshes.forEach((mesh) => {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      if (mat.transparent !== undefined) {
        mat.transparent = true;
        mat.opacity = 1 - m;
      }
    });
  });

  _wireMeshes.forEach((mesh) => {
    mesh.material.opacity = m * 0.92;
  });
}

/* ═══════════════════════════════════════════════════
   PLACEHOLDER CAR (used when GLB missing)
═══════════════════════════════════════════════════ */
function createPlaceholderCar() {
  const ferrariRed = new THREE.MeshStandardMaterial({ color: 0xd71920, metalness: 0.62, roughness: 0.32 });
  const carbon     = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.18, roughness: 0.8  });
  const yellow     = new THREE.MeshStandardMaterial({ color: 0xf2c230, metalness: 0.35, roughness: 0.55 });
  const rimMetal   = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, metalness: 0.85, roughness: 0.28 });

  const group = new THREE.Group();

  const floor = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.08, 1.34), carbon);
  floor.position.y = -0.1; floor.castShadow = true; group.add(floor);

  const monocoque = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.26, 0.88), ferrariRed);
  monocoque.position.y = 0.12; monocoque.castShadow = true; group.add(monocoque);

  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.45, 12), ferrariRed);
  nose.rotation.z = Math.PI / 2; nose.position.set(1.82, 0.1, 0); nose.castShadow = true; group.add(nose);

  const noseTip = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.3), carbon);
  noseTip.position.set(2.53, 0.02, 0); group.add(noseTip);

  const frontWing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 1.88), carbon);
  frontWing.position.set(2.32, -0.04, 0); group.add(frontWing);

  [-0.92, 0.92].forEach((z) => {
    const wingEndplate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.12), carbon);
    wingEndplate.position.set(2.33, 0.08, z / 1.8); group.add(wingEndplate);
  });

  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.34, 0.56), carbon);
  cockpit.position.set(0.34, 0.38, 0); group.add(cockpit);

  const driverCover = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 0.6), ferrariRed);
  driverCover.position.set(0.02, 0.34, 0); group.add(driverCover);

  [-0.54, 0.54].forEach((z) => {
    const sidepod = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 0.42), ferrariRed);
    sidepod.position.set(-0.22, 0.02, z); sidepod.castShadow = true; group.add(sidepod);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.03, 0.08), yellow);
    stripe.position.set(-0.22, 0.13, z * 1.02); group.add(stripe);
  });

  const engineCover = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.34, 0.52), ferrariRed);
  engineCover.position.set(-1.08, 0.36, 0); engineCover.castShadow = true; group.add(engineCover);

  const haloGeo = new THREE.TorusGeometry(0.24, 0.022, 8, 22, Math.PI);
  const halo = new THREE.Mesh(haloGeo, carbon);
  halo.rotation.z = -Math.PI / 2; halo.position.set(0.31, 0.66, 0); group.add(halo);

  const haloPillar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.27, 0.05), carbon);
  haloPillar.position.set(0.52, 0.52, 0); group.add(haloPillar);

  const rearWingMain = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 1.56), carbon);
  rearWingMain.position.set(-2.02, 0.5, 0); group.add(rearWingMain);

  const rearWingFlap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 1.45), carbon);
  rearWingFlap.position.set(-2.11, 0.68, 0); group.add(rearWingFlap);

  [-0.72, 0.72].forEach((z) => {
    const ep = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.44, 0.11), carbon);
    ep.position.set(-2.03, 0.47, z); group.add(ep);
  });

  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 1.02), carbon);
  diffuser.position.set(-2.2, -0.02, 0); group.add(diffuser);

  [[0.66, 0.42, 0.35], [0.66, 0.42, -0.35]].forEach(([x, y, z]) => {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.1), ferrariRed);
    mirror.position.set(x, y, z); group.add(mirror);
  });

  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.36, 28);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.92 });
  const rimGeo   = new THREE.CylinderGeometry(0.15, 0.15, 0.38, 16);
  [[1.42,-0.18,0.76],[1.42,-0.18,-0.76],[-1.34,-0.18,0.79],[-1.34,-0.18,-0.79]].forEach(([x,y,z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2; wheel.position.set(x, y, z); wheel.castShadow = true; group.add(wheel);
    const rim = new THREE.Mesh(rimGeo, rimMetal);
    rim.rotation.z = Math.PI / 2; rim.position.set(x, y, z); group.add(rim);
  });

  const box = new THREE.Box3().setFromObject(group);
  const ctr = box.getCenter(new THREE.Vector3());
  group.position.sub(ctr);
  group.position.y += 0.38;
  group.rotation.y = -Math.PI * 0.5;
  return group;
}

/* ═══════════════════════════════════════════════════
   INIT THREE SCENE
   — Sky-blue/grey palette matching the snowy track.
   — No black background.
═══════════════════════════════════════════════════ */
export function initThreeScene() {
  const canvas = document.getElementById('webgl-canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,               // solid background — no black flash
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  const scene = new THREE.Scene();
  // Light sky-blue that matches the snowy track model
  scene.background = new THREE.Color(0x8fa8be);
  scene.fog = new THREE.FogExp2(0x8fa8be, 0.018);

  const clock = new THREE.Clock();

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    300,
  );
  // Start very far behind — annotation step 1
  camera.position.set(0, 4, 28);
  camera.lookAt(0, 0.8, 0);

  // Lighting tuned for daylight/overcast outdoor scene
  scene.add(new THREE.AmbientLight(0xc8d8e8, 0.9));
  scene.add(new THREE.HemisphereLight(0xdce8f0, 0x3a4a58, 1.1));

  const sun = new THREE.DirectionalLight(0xfff4e0, 2.8);
  sun.position.set(8, 18, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.width  = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far  = 80;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -30;
  sun.shadow.camera.right = sun.shadow.camera.top   =  30;
  scene.add(sun);

  const rimLight = new THREE.PointLight(0x88c4ff, 2.2, 20, 2);
  rimLight.position.set(-5, 2, -2);
  scene.add(rimLight);

  const groundGeo = new THREE.PlaneGeometry(120, 120);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.22 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -1.05;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  const gridHelper = new THREE.GridHelper(60, 60, 0x2a3a4a, 0x1e2c38);
  gridHelper.position.y = -1.04;
  gridHelper.material.opacity = 0.08;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  return { renderer, scene, camera, clock, sun, groundMesh, gridHelper };
}

/* ═══════════════════════════════════════════════════
   LOAD TRACK ENVIRONMENT
═══════════════════════════════════════════════════ */
export function loadTrackEnvironment({ scene, sceneState, trackUrl, onProgress }) {
  if (!trackUrl) {
    console.log('[LAPPED] No track URL provided, skipping track load');
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('[LAPPED] Track loading timeout - continuing without track');
      resolve(null);
    }, 15000); // 15 second timeout

    loader.load(
      trackUrl,
      (gltf) => {
        clearTimeout(timeout);
        const root = gltf.scene;
        root.name = 'track-environment';

        root.traverse((child) => {
          if (!child.isMesh) return;
          if (child.name && /flag|banner/i.test(child.name)) { child.visible = false; return; }
          child.castShadow = true;
          child.receiveShadow = true;
        });

        const box    = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        root.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        root.scale.setScalar((TRACK_TARGET_SPAN / maxDim) * 0.72);

        const box2 = new THREE.Box3().setFromObject(root);
        root.position.y -= box2.min.y - 0.04;
        root.position.z -= 3;
        scene.add(root);

        if (sceneState.groundMesh) sceneState.groundMesh.visible = false;
        if (sceneState.gridHelper)  sceneState.gridHelper.visible  = false;

        // Match scene sky to the track's snowy/overcast palette
        scene.background = new THREE.Color(0x8fa8be);
        scene.fog = new THREE.FogExp2(0x9ab5c8, 0.016);

        if (sceneState.renderer) sceneState.renderer.toneMappingExposure = 1.42;

        console.log('[LAPPED] Track loaded successfully');
        resolve(root);
      },
      (xhr) => {
        if (xhr.lengthComputable) onProgress?.(Math.round((xhr.loaded / xhr.total) * 40));
      },
      (err) => {
        clearTimeout(timeout);
        console.warn('[LAPPED] Track GLB failed:', err);
        resolve(null);
      },
    );
  });
}

/* ═══════════════════════════════════════════════════
   LOAD CAR MODEL
═══════════════════════════════════════════════════ */
export function loadCarModel({ scene, modelUrl, onProgress }) {
  return new Promise((resolve) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('[LAPPED] Car loading timeout - using placeholder');
      const carGroup = createPlaceholderCar();
      scene.add(carGroup);
      buildWireframeClones(carGroup);
      resolve(carGroup);
    }, 15000); // 15 second timeout

    loader.load(
      modelUrl,
      (gltf) => {
        clearTimeout(timeout);
        const model = gltf.scene;
        model.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) child.material.envMapIntensity = 1.2;
        });

        const box    = new THREE.Box3().setFromObject(model);
        const centre = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        model.position.sub(centre);
        model.scale.setScalar(CAR_TARGET_HEIGHT / maxDim);

        const carGroup = new THREE.Group();
        carGroup.add(model);
        carGroup.rotation.y = -Math.PI * 0.5;
        carGroup.position.set(0.2, -0.08, 0.2);
        scene.add(carGroup);

        // Build wireframe clones after the model is in the scene
        buildWireframeClones(carGroup);

        console.log('[LAPPED] Car loaded successfully');
        resolve(carGroup);
      },
      (xhr) => {
        if (!xhr.lengthComputable) return;
        onProgress?.(Math.round((xhr.loaded / xhr.total) * 60) + 30);
      },
      (err) => {
        clearTimeout(timeout);
        console.warn('[LAPPED] GLB load failed — using placeholder.', err);
        const carGroup = createPlaceholderCar();
        scene.add(carGroup);
        buildWireframeClones(carGroup);
        resolve(carGroup);
      },
    );
  });
}

/* ═══════════════════════════════════════════════════
   APPLY FRAME
═══════════════════════════════════════════════════ */
export function applyFrame({ sceneState, carGroup, carState, camState, elapsed }) {
  const { camera, renderer, scene, sun } = sceneState;

  if (carGroup) {
    // Gentle suspension float
    carGroup.position.x = carState.posX;
    carGroup.position.y = carState.posY + Math.sin(elapsed * 0.9) * 0.018;
    carGroup.position.z = carState.posZ;
    carGroup.rotation.y = carState.rotY;
    carGroup.rotation.x = carState.rotX;
    carGroup.scale.setScalar(carState.scale);

    // Sun tracks car loosely
    if (sun) {
      sun.position.x = carGroup.position.x + 8;
      sun.position.z = carGroup.position.z + 12;
    }

    // Apply wireframe morph (driven by carState.wireframe 0→1)
    applyWireframeMorph(carState.wireframe ?? 0);
  }

  camera.position.set(camState.posX, camState.posY, camState.posZ);
  camera.lookAt(camState.lookX, camState.lookY, camState.lookZ);
  renderer.render(scene, camera);
}

export function resizeScene(sceneState) {
  const { camera, renderer } = sceneState;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}