export const MODEL_URL =
  import.meta.env.VITE_CAR_MODEL_URL || '/models/mclaren_mp45__formula_1.glb';

/** Optional snowy / modular track GLB (served from `public/models/`). */
export const TRACK_SCENE_URL =
  import.meta.env.VITE_TRACK_SCENE_URL || '/models/modular_track_roads_free.glb';

/** Largest axis of the car's bounding box after normalization (world units; increased for larger size). */
export const CAR_TARGET_HEIGHT = 8.5;

/** Track fills roughly this many world units on its longest axis. */
export const TRACK_TARGET_SPAN = 56;

export const LENIS_CONFIG = {
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 0.85,
};

/** Hero "track" start: car positioned to move left to right. */
export const INITIAL_CAR = {
  rotY: Math.PI * 0.5,
  rotX: 0,
  posX: -8,
  posY: 0.5,
  posZ: 0,
  scale: 1,
};

export const INITIAL_CAM = {
  posX: 0,
  posY: 2.2,
  posZ: 18,
  lookX: 0,
  lookY: 0.8,
  lookZ: 0,
};
