import * as THREE from "three";

export class WebGLScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scrollProgress = 0;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.clock = new THREE.Clock();

    this.init();
    this.createGoldenGearSystem();
    this.createEmbersUniverse();
    this.createWarpTunnelMesh();
    this.setupEvents();
    this.animate();
  }

  init() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x080103, 0.04);

    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0, 15);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Warm Gold & Crimson Lights
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.9);
    this.scene.add(ambientLight);

    this.lightGold = new THREE.PointLight(0xffaa00, 4, 30);
    this.lightGold.position.set(4, 4, 8);
    this.scene.add(this.lightGold);

    this.lightCrimson = new THREE.PointLight(0xb91c1c, 4, 30);
    this.lightCrimson.position.set(-5, -4, 6);
    this.scene.add(this.lightCrimson);

    this.masterGroup = new THREE.Group();
    this.scene.add(this.masterGroup);
  }

  // Helper: Procedural Gear Geometry with Teeth
  createGearGeometry(teeth = 12, innerRadius = 2.0, outerRadius = 3.0, toothHeight = 0.5, thickness = 0.45) {
    const shape = new THREE.Shape();
    const totalPoints = teeth * 2;
    const step = (Math.PI * 2) / totalPoints;

    for (let i = 0; i <= totalPoints; i++) {
      const angle = i * step;
      const isTooth = i % 2 === 1;
      const r = isTooth ? outerRadius + toothHeight : outerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }

    const holePath = new THREE.Path();
    holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    return new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.1,
      bevelThickness: 0.1
    });
  }

  createGoldenGearSystem() {
    this.gearSystem = new THREE.Group();

    // Molten Gold Metallic Material
    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 0.9,
      roughness: 0.22,
      emissive: 0x442200,
      emissiveIntensity: 0.4
    });

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffdd66,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });

    // 1. Center Main Gear (Scene 1)
    const mainGeo = this.createGearGeometry(14, 1.8, 2.7, 0.45, 0.4);
    mainGeo.center();
    this.mainGear = new THREE.Mesh(mainGeo, this.goldMat);
    const wire = new THREE.Mesh(mainGeo, wireMat);
    this.mainGear.add(wire);
    this.gearSystem.add(this.mainGear);

    // 2. Exploded Sub-Gears (For Scene 2 Deconstructed View)
    this.subGears = [];
    const subPositions = [
      { x: -3.5, y: 2.2, z: 0.5 },
      { x: 3.5, y: 2.5, z: -0.2 },
      { x: -3.2, y: -2.0, z: -0.4 },
      { x: 3.2, y: -2.2, z: 0.3 },
      { x: 4.2, y: 0.2, z: 0.8 },
    ];

    const subMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 0.85,
      roughness: 0.3,
      emissive: 0x331100
    });

    subPositions.forEach((pos, idx) => {
      const geo = this.createGearGeometry(8 + idx * 2, 0.8, 1.4, 0.35, 0.3);
      geo.center();
      const mesh = new THREE.Mesh(geo, subMat);
      mesh.userData = {
        homePos: new THREE.Vector3(pos.x, pos.y, pos.z),
        centerPos: new THREE.Vector3(0, 0, 0)
      };
      mesh.position.set(0, 0, 0); // Initially collapsed into main gear
      mesh.scale.set(0.01, 0.01, 0.01);
      this.gearSystem.add(mesh);
      this.subGears.push(mesh);
    });

    this.masterGroup.add(this.gearSystem);
  }

  // Glowing Golden & Crimson Ember Particles
  createEmbersUniverse() {
    const count = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cGold = new THREE.Color(0xffaa00);
    const cCrimson = new THREE.Color(0xb91c1c);
    const cAmber = new THREE.Color(0xffdd66);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35;

      const r = Math.random();
      let c = r < 0.5 ? cGold : r < 0.8 ? cCrimson : cAmber;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.embers = new THREE.Points(geometry, material);
    this.scene.add(this.embers);
  }

  // Golden Warp Tunnel Rings (Scene 4)
  createWarpTunnelMesh() {
    this.warpGroup = new THREE.Group();
    const ringCount = 14;
    this.warpRings = [];

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });

    for (let i = 0; i < ringCount; i++) {
      const geo = new THREE.TorusGeometry(3.5 + i * 0.15, 0.04, 8, 36);
      const ring = new THREE.Mesh(geo, ringMat);
      ring.position.z = -i * 2.2;
      this.warpGroup.add(ring);
      this.warpRings.push(ring);
    }

    this.warpGroup.position.set(0, 0, -50); // Initially far back
    this.masterGroup.add(this.warpGroup);
  }

  setupEvents() {
    window.addEventListener("resize", () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });

    window.addEventListener("mousemove", (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  updateScroll(p) {
    this.scrollProgress = p; // 0.0 to 1.0
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    const p = this.scrollProgress;

    // SCROLL-DRIVEN GEAR ROTATION (เลื่อนเร็วหมุนเร็ว เลื่อนถอยหลังหมุนกลับ)
    const scrollAngle = p * Math.PI * 16;

    if (this.mainGear) {
      this.mainGear.rotation.z = scrollAngle + time * 0.2;
    }

    // SCENE TRANSITIONS
    if (p < 0.15) {
      // Scene 1: Hero (Centered Solid Gear)
      this.masterGroup.position.set(2.5 + this.mouse.x * 0.4, this.mouse.y * 0.4, 0);
      this.mainGear.scale.set(1, 1, 1);

      // Sub-gears collapsed inside
      this.subGears.forEach((g) => {
        g.position.lerp(g.userData.centerPos, 0.15);
        g.scale.lerp(new THREE.Vector3(0.01, 0.01, 0.01), 0.15);
      });
      this.warpGroup.position.z = -50;
    } else if (p >= 0.15 && p < 0.35) {
      // Scene 2: We Build It (EXPLODED GEAR - แตกตัวเป็นชิ้นส่วนอุปกรณ์)
      const explodeT = (p - 0.15) / 0.2;
      this.masterGroup.position.set(0, 0, -2);
      this.mainGear.scale.lerp(new THREE.Vector3(0.4, 0.4, 0.4), 0.1);

      // Sub-gears explode outward to their home positions!
      this.subGears.forEach((g, idx) => {
        const targetPos = g.userData.homePos.clone().multiplyScalar(explodeT);
        g.position.lerp(targetPos, 0.1);
        g.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        g.rotation.z += (0.6 * (idx % 2 === 0 ? 1 : -1)) * delta;
      });
    } else if (p >= 0.35 && p < 0.55) {
      // Scene 3: Coding Lab (ชิ้นส่วนอุปกรณ์ บินมารวมตัวกันเป็น Robot Companion)
      const morphT = (p - 0.35) / 0.2;
      this.masterGroup.position.set(3.5, -0.8, -4);

      // Collapse into mini robot core on the desk
      this.subGears.forEach((g) => {
        const robotDeskPos = new THREE.Vector3(0, 0, 0);
        g.position.lerp(robotDeskPos, 0.12);
        g.scale.lerp(new THREE.Vector3(0.25, 0.25, 0.25), 0.12);
      });
      this.mainGear.scale.lerp(new THREE.Vector3(0.1, 0.1, 0.1), 0.1);
    } else if (p >= 0.55 && p < 0.75) {
      // Scene 4: Warp Into The Digital World (Fly-through Warp Tunnel)
      const warpT = (p - 0.55) / 0.2;
      this.masterGroup.position.set(0, 0, 0);
      this.warpGroup.position.z = -20 + warpT * 25; // Warp rings fly towards camera

      this.warpRings.forEach((r, idx) => {
        r.rotation.z = time * 0.5 + idx * 0.2;
      });
    } else {
      // Scene 5-8: Future City, Curriculum, Faculty, Footer
      this.masterGroup.position.set(0, 1.5, -10);
      this.warpGroup.position.z = -50;
      this.mainGear.scale.set(0.6, 0.6, 0.6);
      this.subGears.forEach((g) => g.scale.set(0.01, 0.01, 0.01));
    }

    // Slowly drift embers
    if (this.embers) {
      this.embers.rotation.y = time * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
