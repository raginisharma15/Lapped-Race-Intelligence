import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import styles from './LandingWithCar.module.css';

export const LandingWithCar = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Dynamically load Three.js and initialize the scene
    const loadThreeJS = async () => {
      try {
        // Import Three.js dynamically
        const THREE = await import('three');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');

        if (!canvasRef.current) return;

        // Scene setup
        const renderer = new THREE.WebGLRenderer({ 
          canvas: canvasRef.current, 
          antialias: true, 
          alpha: true 
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        const camera = new THREE.PerspectiveCamera(
          50,
          window.innerWidth / window.innerHeight,
          0.1,
          200
        );
        camera.position.set(0, 2, 8);

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));

        const light = new THREE.DirectionalLight(0xffffff, 1.5);
        light.position.set(5, 10, 5);
        light.castShadow = true;
        light.shadow.mapSize.set(2048, 2048);
        scene.add(light);

        const rim = new THREE.PointLight(0xb4ff2c, 2, 20);
        rim.position.set(-3, 2, -3);
        scene.add(rim);

        // Ground
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(100, 100),
          new THREE.ShadowMaterial({ opacity: 0.3 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        scene.add(ground);

        // Load car model
        const draco = new DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);

        let carGroup: THREE.Group | null = null;

        loader.load(
          '/models/mclaren_mp45__formula_1.glb',
          (gltf) => {
            const car = gltf.scene;
            const box = new THREE.Box3().setFromObject(car);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            car.position.sub(center);
            car.scale.setScalar(3 / Math.max(size.x, size.y, size.z));
            car.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).castShadow = true;
                (child as THREE.Mesh).receiveShadow = true;
              }
            });

            carGroup = new THREE.Group();
            carGroup.add(car);
            carGroup.rotation.y = Math.PI * 0.25;
            scene.add(carGroup);
          },
          undefined,
          (error) => {
            console.error('Error loading car model:', error);
          }
        );

        // Animation loop
        let scrollY = 0;
        const animate = () => {
          requestAnimationFrame(animate);

          if (carGroup) {
            // Floating animation
            carGroup.position.y = Math.sin(Date.now() * 0.0005) * 0.1;
            
            // Rotation based on scroll
            const maxScroll = document.body.scrollHeight - window.innerHeight;
            const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
            carGroup.rotation.y = Math.PI * 0.25 + progress * Math.PI * 2;
            
            // Camera movement based on scroll
            camera.position.z = 8 - progress * 2;
            camera.position.y = 2 - progress * 1;
          }

          camera.lookAt(0, 0, 0);
          renderer.render(scene, camera);
        };
        animate();

        // Scroll handler
        const handleScroll = () => {
          scrollY = window.scrollY;
        };
        window.addEventListener('scroll', handleScroll);

        // Resize handler
        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
          window.removeEventListener('scroll', handleScroll);
          window.removeEventListener('resize', handleResize);
          renderer.dispose();
        };
      } catch (error) {
        console.error('Failed to load Three.js:', error);
      }
    };

    loadThreeJS();
  }, []);

  const handleEnterDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <button className={styles.dashboardButton} onClick={handleEnterDashboard}>
        Enter Dashboard →
      </button>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>LAPPED</div>
          <nav className={styles.nav}>
            <a href="#hero">Home</a>
            <a href="#features">Features</a>
            <a href="#about">About</a>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <section id="hero" className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              <span>Reinventing race logistics</span>
              <span>through AI-powered intelligence</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Transform manual race operations into connected, intelligent missions
            </p>
          </div>
          <div className={styles.scrollIndicator}>
            <span className={styles.scrollLine}></span>
            <span className={styles.scrollText}>Scroll</span>
          </div>
        </section>

        <section id="text-reveal" className={styles.textRevealSection}>
          <p className={styles.revealText}>
            Reinventing the future of race logistics
          </p>
        </section>

        <section id="features" className={styles.features}>
          <div className={styles.container}>
            <div className={styles.featureGrid}>
              <div className={styles.featureCard}>
                <span className={styles.featureNumber}>01</span>
                <h3 className={styles.featureTitle}>Live Telemetry</h3>
                <p className={styles.featureDesc}>
                  Real-time data transformation turning every lap, sector, and tire signal into actionable intelligence.
                </p>
              </div>
              <div className={styles.featureCard}>
                <span className={styles.featureNumber}>02</span>
                <h3 className={styles.featureTitle}>Strategic Decisions</h3>
                <p className={styles.featureDesc}>
                  AI-powered scenario simulation for undercut windows, safety car strategies, and race-critical calls.
                </p>
              </div>
              <div className={styles.featureCard}>
                <span className={styles.featureNumber}>03</span>
                <h3 className={styles.featureTitle}>Unified Operations</h3>
                <p className={styles.featureDesc}>
                  One platform connecting strategists, engineers, and race control in perfect synchronization.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className={styles.ctaSection}>
          <div className={styles.container}>
            <h2 className={styles.ctaTitle}>Ready to transform your race operations?</h2>
            <button className={styles.btnPrimary} onClick={handleEnterDashboard}>
              Enter Dashboard
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
