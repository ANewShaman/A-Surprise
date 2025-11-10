import React, { useRef, useEffect } from 'react';
import {
    ACESFilmicToneMapping,
    AdditiveBlending,
    AmbientLight,
    BoxGeometry,
    BufferAttribute,
    BufferGeometry,
    CanvasTexture,
    CatmullRomCurve3,
    Color,
    ConeGeometry,
    CylinderGeometry,
    DirectionalLight,
    DoubleSide,
    ExtrudeGeometry,
    Group,
    Mesh,
    MeshBasicMaterial,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    Object3D,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    PointLight,
    Points,
    PointsMaterial,
    Raycaster,
    Scene,
    Shape,
    SphereGeometry,
    SRGBColorSpace,
    TubeGeometry,
    Vector3,
    WebGLRenderer,
} from 'three';
import { gsap } from 'gsap';

interface Flame {
    mesh: Mesh;
    light: PointLight;
    timeline: gsap.core.Timeline;
}

interface CakeConfig {
    flavor: string;
    frosting: string;
    toppings: string[];
}

interface ThreeSceneProps {
    isBlowing: boolean;
    onCandlesOut: () => void;
    cakeConfig: CakeConfig;
    isPreview?: boolean;
}

const CANDLE_COUNT = 3;

const createFlameTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 96, 0, 32, 64, 48);
    grad.addColorStop(0, 'rgba(255, 220, 150, 1)');
    grad.addColorStop(0.5, 'rgba(255, 160, 50, 0.7)');
    grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(32, 128);
    ctx.quadraticCurveTo(0, 80, 32, 0);
    ctx.quadraticCurveTo(64, 80, 32, 128);
    ctx.fill();
    return new CanvasTexture(canvas);
};

const createDrippingFrosting = (frostingColor: string): Mesh => {
    const frostingRadius = 1.57;
    const frostingHeight = 0.6;
    const radialSegments = 128;
    const heightSegments = 5;

    const geometry = new CylinderGeometry(
        frostingRadius,
        frostingRadius,
        frostingHeight,
        radialSegments,
        heightSegments
    );

    const positionAttribute = geometry.attributes.position;
    const vertex = new Vector3();
    const baseHeight = geometry.parameters.height;

    for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);

        if (vertex.y < baseHeight / 2 * 0.99) {
            const angle = Math.atan2(vertex.z, vertex.x);

            const dripiness =
                (Math.sin(angle * 4) + 1) / 2 * 0.4 +
                (Math.sin(angle * 7) + 1) / 2 * 0.2 +
                (Math.sin(angle * 13) + 1) / 2 * 0.15 +
                (Math.sin(angle * 21) + 1) / 2 * 0.1;

            const maxDripLength = dripiness * 1.0;
            const verticalProgress = (baseHeight / 2 - vertex.y) / baseHeight;
            const dripDisplacement = maxDripLength * Math.pow(verticalProgress, 2);
            const newY = vertex.y - dripDisplacement;

            const tipFactor = Math.sin(verticalProgress * Math.PI);
            let newRadius = frostingRadius + tipFactor * dripiness * 0.05;

            if (verticalProgress > 0.8) {
                newRadius *= 1 - (verticalProgress - 0.8) * 0.5;
            }

            positionAttribute.setXYZ(
                i,
                Math.cos(angle) * newRadius,
                newY,
                Math.sin(angle) * newRadius
            );
        }
    }
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new MeshPhysicalMaterial({
        color: frostingColor,
        roughness: 0.3,
        metalness: 0.0,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
    });

    const frostingMesh = new Mesh(geometry, material);
    frostingMesh.castShadow = true;
    return frostingMesh;
};

const createToppings = (scene: Scene, toppings: string[], frostingMesh: Mesh) => {
    const toppingObjects: Object3D[] = [];
    const cakeRadius = 1.5;
    
    const raycaster = new Raycaster();
    const origin = new Vector3(0, 10, 0);
    const direction = new Vector3(0, -1, 0);

    const getFrostingY = (x: number, z: number): number => {
        origin.set(x, 10, z);
        raycaster.set(origin, direction);
        const intersects = raycaster.intersectObject(frostingMesh);
        if (intersects.length > 0) {
            return intersects[0].point.y;
        }
        return 2.7;
    };

    const addTopping = (mesh: Object3D) => {
        toppingObjects.push(mesh);
    };

    if (toppings.includes('Sprinkles')) {
        const sprinkleGeometry = new CylinderGeometry(0.02, 0.02, 0.1, 8);
        const sprinkleColors = [0xffadad, 0xffd6a5, 0xfdffb6, 0xcaffbf, 0x9bf6ff, 0xa0c4ff, 0xbdb2ff, 0xffc6ff];
        for (let i = 0; i < 150; i++) {
            const mat = new MeshStandardMaterial({ color: sprinkleColors[i % sprinkleColors.length], roughness: 0.8 });
            const sprinkle = new Mesh(sprinkleGeometry, mat);
            const r = Math.random() * cakeRadius * 0.95;
            const theta = Math.random() * Math.PI * 2;
            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;
            const y = getFrostingY(x, z);
            sprinkle.position.set(x, y + 0.01, z);
            sprinkle.rotation.set(Math.PI / 2, 0, Math.random() * Math.PI);
            sprinkle.castShadow = true;
            addTopping(sprinkle);
        }
    }
    
    if (toppings.includes('Cherries')) {
        const cherryGeometry = new SphereGeometry(0.1, 16, 16);
        const mat = new MeshStandardMaterial({ color: 0xD93232, roughness: 0.2, metalness: 0.1 });
        const stemGeo = new CylinderGeometry(0.01, 0.01, 0.2, 8);
        const stemMat = new MeshStandardMaterial({ color: 0x006400 });
        const numCherries = 8;
        for (let i = 0; i < numCherries; i++) {
            const cherry = new Mesh(cherryGeometry, mat);
            const r = cakeRadius * 0.85;
            const theta = (i / numCherries) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;
            const y = getFrostingY(x, z);
            cherry.position.set(x, y + 0.08, z);
            cherry.castShadow = true;
            const stem = new Mesh(stemGeo, stemMat);
            stem.position.set(0, 0.15, 0);
            stem.rotation.z = Math.PI / 8;
            cherry.add(stem);
            addTopping(cherry);
        }
    }
    
    if (toppings.includes('Chocolate Drizzle')) {
        const mat = new MeshStandardMaterial({ color: 0x4b2b0d, roughness: 0.3 });
        for (let i = 0; i < 12; i++) {
            const startAngle = Math.random() * Math.PI * 2;
            const endAngle = startAngle + Math.PI * (0.3 + Math.random() * 0.5);
            const pathPoints = Array.from({length: 5}, (_, j) => {
                const angle = startAngle + (endAngle - startAngle) * (j / 4);
                const radius = cakeRadius * (0.9 - (j/4) * 0.8);
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const y = getFrostingY(x, z);
                return new Vector3(x, y + 0.01, z)
            });
            const path = new CatmullRomCurve3(pathPoints);
            const geo = new TubeGeometry(path, 20, 0.03, 8, false);
            const drizzle = new Mesh(geo, mat);
            drizzle.castShadow = true;
            addTopping(drizzle);
        }
    }
    
    if (toppings.includes('Star Edibles')) {
        const starShape = new Shape();
        const outerRadius = 0.1, innerRadius = 0.05;
        starShape.moveTo(0, outerRadius);
        for (let i = 1; i <= 10; i++) {
            const angle = (i * Math.PI) / 5;
            const radius = i % 2 === 1 ? innerRadius : outerRadius;
            starShape.lineTo(radius * Math.sin(angle), radius * Math.cos(angle));
        }
        const extrudeSettings = { depth: 0.02, bevelEnabled: false };
        const starGeo = new ExtrudeGeometry(starShape, extrudeSettings);
        const mat = new MeshStandardMaterial({ color: 0xE6C76E, metalness: 0.8, roughness: 0.2 });
         for (let i = 0; i < 12; i++) {
             const star = new Mesh(starGeo, mat);
             const r = 0.5 + Math.random() * 1.0;
             const theta = Math.random() * Math.PI * 2;
             const x = Math.cos(theta) * r;
             const z = Math.sin(theta) * r;
             const y = getFrostingY(x, z);
             star.position.set(x, y + 0.01, z);
             star.rotation.x = -Math.PI / 2;
             star.rotation.z = Math.random() * Math.PI;
             star.castShadow = true;
             addTopping(star);
         }
    }
    
    if (toppings.includes('Pearl Edibles')) {
        const pearlGeo = new SphereGeometry(0.05, 16, 16);
        const mat = new MeshStandardMaterial({ color: 0xF5F5F5, metalness: 0.1, roughness: 0.05 });
         for (let i = 0; i < 30; i++) {
             const pearl = new Mesh(pearlGeo, mat);
             const r = Math.random() * cakeRadius * 0.9;
             const theta = Math.random() * Math.PI * 2;
             const x = Math.cos(theta) * r;
             const z = Math.sin(theta) * r;
             const y = getFrostingY(x, z);
             pearl.position.set(x, y + 0.04, z);
             pearl.castShadow = true;
             addTopping(pearl);
         }
    }

    if (toppings.includes('Choco Chips')) {
        const chipGeo = new ConeGeometry(0.05, 0.08, 16);
        const mat = new MeshStandardMaterial({ color: 0x3B2F2F, roughness: 0.6 });
        for (let i = 0; i < 40; i++) {
            const chip = new Mesh(chipGeo, mat);
            const r = Math.random() * cakeRadius * 0.9;
            const theta = Math.random() * Math.PI * 2;
            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;
            const y = getFrostingY(x, z);
            chip.position.set(x, y + 0.05, z);
            chip.rotation.x = Math.PI + (Math.random() - 0.5) * 0.5;
            chip.rotation.z = (Math.random() - 0.5) * 0.5;
            chip.castShadow = true;
            addTopping(chip);
        }
    }
    return toppingObjects;
};

const createSmokeParticles = (position: Vector3, scene: Scene) => {
    const particleCount = 20;
    const particles = new BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;
    }
    particles.setAttribute('position', new BufferAttribute(positions, 3));
    const material = new PointsMaterial({
        color: 0xaaaaaa,
        size: 0.2,
        transparent: true,
        opacity: 0.5,
        blending: AdditiveBlending,
    });
    const smoke = new Points(particles, material);
    scene.add(smoke);
    
    gsap.to(smoke.material, { duration: 2, opacity: 0, onComplete: () => {
        scene.remove(smoke);
        particles.dispose();
        material.dispose();
    }});

    const posAttr = smoke.geometry.attributes.position;
    for (let i = 0; i < particleCount; i++) {
        gsap.to(posAttr.array, {
            duration: 2,
            [i * 3]: posAttr.getX(i) + (Math.random() - 0.5) * 0.5,
            [i * 3 + 1]: posAttr.getY(i) + Math.random() * 1.5,
            [i * 3 + 2]: posAttr.getZ(i) + (Math.random() - 0.5) * 0.5,
            onUpdate: () => posAttr.needsUpdate = true,
        });
    }
};

const ThreeScene: React.FC<ThreeSceneProps> = ({ isBlowing, onCandlesOut, cakeConfig, isPreview = false }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const flamesRef = useRef<Flame[]>([]);
    const animationFrameIdRef = useRef<number | null>(null);
    const candlesBlownOutRef = useRef(false);
    const rendererRef = useRef<WebGLRenderer | null>(null);
    const cameraRef = useRef<PerspectiveCamera | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        candlesBlownOutRef.current = false;
        const currentMount = mountRef.current;

        const scene = new Scene();
        scene.background = new Color(0x3a2a30);

        const camera = new PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.set(0, 4, 8);
        camera.lookAt(0, 2, 0);
        cameraRef.current = camera;

        const renderer = new WebGLRenderer({ antialias: true, alpha: isPreview });
        rendererRef.current = renderer;
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = PCFSoftShadowMap;
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.outputColorSpace = SRGBColorSpace;
        currentMount.appendChild(renderer.domElement);
        
        const ambientLight = new AmbientLight(0xFFEFD5, 0.3);
        scene.add(ambientLight);

        const mainLight = new DirectionalLight(0xFFD8A8, 1.0);
        mainLight.position.set(8, 12, 10);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.bias = -0.0001;
        scene.add(mainLight);

        const cakeMat = new MeshStandardMaterial({ color: cakeConfig.flavor, roughness: 0.8, metalness: 0.0 });

        const cakeGeo1 = new CylinderGeometry(2, 2.05, 1.5, 64);
        const cake1 = new Mesh(cakeGeo1, cakeMat);
        cake1.castShadow = true;
        cake1.receiveShadow = true;
        
        const cakeGeo2 = new CylinderGeometry(1.5, 1.55, 1.2, 64);
        const cake2 = new Mesh(cakeGeo2, cakeMat);
        cake2.castShadow = true;
        cake2.receiveShadow = true;

        [cake1, cake2].forEach(cakeMesh => {
            const position = cakeMesh.geometry.attributes.position;
            const vertex = new Vector3();
            const height = cakeMesh.geometry.parameters.height;
            for (let i = 0; i < position.count; i++) {
                vertex.fromBufferAttribute(position, i);
                if (Math.abs(vertex.y) < height / 2 * 0.95) {
                    const noise = (Math.random() - 0.5) * 0.05;
                    const angle = Math.atan2(vertex.z, vertex.x);
                    vertex.x += Math.cos(angle) * noise;
                    vertex.z += Math.sin(angle) * noise;
                    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
                }
            }
            position.needsUpdate = true;
        });
        
        const frosting = createDrippingFrosting(cakeConfig.frosting);
        
        const roomGroup = new Group();
        scene.add(roomGroup);

        const floorMat = new MeshStandardMaterial({ color: 0x967259, roughness: 0.8 });
        const floorGeo = new CylinderGeometry(7.5, 7.5, 0.2, 64);
        const floor = new Mesh(floorGeo, floorMat);
        floor.position.y = -0.1;
        floor.receiveShadow = true;
        roomGroup.add(floor);
        
        const wallMat = new MeshStandardMaterial({ color: 0xF5EFE6, side: DoubleSide });
        const wallHeight = 10;
        const wallRadius = 7.5;
        const wallsGeo = new CylinderGeometry(wallRadius, wallRadius, wallHeight, 64, 1, true, 0, Math.PI * 1.5);
        const walls = new Mesh(wallsGeo, wallMat);
        walls.position.y = wallHeight / 2 - 0.2;
        walls.rotation.y = Math.PI / 4;
        walls.receiveShadow = true;
        roomGroup.add(walls);

        const createPictureFrame = (pos: Vector3) => {
            const frameGroup = new Group();
            const frameMaterial = new MeshStandardMaterial({ color: 0x3a2a30 });
            const picMaterial = new MeshStandardMaterial({ color: 0xcccccc });
            const frame = new Mesh(new BoxGeometry(1.5, 2, 0.1), frameMaterial);
            const pic = new Mesh(new BoxGeometry(1.3, 1.8, 0.11), picMaterial);
            frameGroup.add(frame, pic);
            frameGroup.position.copy(pos);
            frameGroup.lookAt(0, frameGroup.position.y, 0);
            return frameGroup;
        };
        const frame1Pos = new Vector3(Math.cos(Math.PI * 0.75) * (wallRadius - 0.2), 5, Math.sin(Math.PI * 0.75) * (wallRadius - 0.2));
        roomGroup.add(createPictureFrame(frame1Pos));
        const frame2Pos = new Vector3(Math.cos(Math.PI * 1.75) * (wallRadius - 0.2), 4, Math.sin(Math.PI * 1.75) * (wallRadius - 0.2));
        roomGroup.add(createPictureFrame(frame2Pos));

        const bannerGroup = new Group();
        const bannerY = 7.5;
        
        const stringGeo = new CylinderGeometry(0.02, 0.02, 10, 8);
        const stringMat = new MeshStandardMaterial({ color: 0xE8D5C4 });
        const string = new Mesh(stringGeo, stringMat);
        string.rotation.z = Math.PI / 2;
        string.position.y = bannerY;
        bannerGroup.add(string);

        const flagColors = [0xFADADD, 0xFFF7EE, 0xEBD5B3, 0xCFE9E3, 0xFFF4E3];
        for (let i = 0; i < 8; i++) {
            const flagShape = new Shape();
            flagShape.moveTo(0, 0);
            flagShape.lineTo(0.4, 0);
            flagShape.lineTo(0.2, -0.5);
            
            const flagGeo = new ExtrudeGeometry(flagShape, { depth: 0.02, bevelEnabled: false });
            const flagMat = new MeshStandardMaterial({ 
                color: flagColors[i % flagColors.length], 
                roughness: 0.8,
                side: DoubleSide 
            });
            const flag = new Mesh(flagGeo, flagMat);
            flag.position.set(-4.5 + i * 1.2, bannerY, 0);
            flag.rotation.y = Math.PI / 2;
            flag.castShadow = true;
            
            gsap.to(flag.rotation, {
                z: (Math.random() - 0.5) * 0.1,
                duration: 2 + Math.random() * 2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
            
            bannerGroup.add(flag);
        }
        
        scene.add(bannerGroup);
        
        const cakeStandGroup = new Group();
        scene.add(cakeStandGroup);
        
        const plateGeo = new CylinderGeometry(2.5, 2.5, 0.15, 64);
        const plateMat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.1 });
        const plate = new Mesh(plateGeo, plateMat);
        plate.receiveShadow = true;

        const plateHeight = plate.geometry.parameters.height / 2;
        cake1.position.y = plateHeight + cakeGeo1.parameters.height / 2;
        cake2.position.y = cake1.position.y + cakeGeo1.parameters.height / 2 + cakeGeo2.parameters.height / 2;
        frosting.position.y = cake2.position.y + cakeGeo2.parameters.height / 2 - 0.1;

        cakeStandGroup.add(plate, cake1, cake2, frosting);
// === TABLE DECORATIONS ===

// Juice Jar (same as before)
const juiceJar = new Group();
const jarBody = new Mesh(
    new CylinderGeometry(0.5, 0.5, 1.6, 48),
    new MeshPhysicalMaterial({ 
        color: 0xFFE5B4, 
        transparent: true, 
        opacity: 0.65, 
        roughness: 0.08, 
        metalness: 0.15,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1 
    })
);
jarBody.position.y = plateHeight + 0.8;
jarBody.castShadow = true;
juiceJar.add(jarBody);

const juice = new Mesh(
    new CylinderGeometry(0.46, 0.46, 1.3, 48),
    new MeshStandardMaterial({ color: 0xFFB347, transparent: true, opacity: 0.85 })
);
juice.position.y = plateHeight + 0.65;
juiceJar.add(juice);

const lid = new Mesh(
    new CylinderGeometry(0.55, 0.55, 0.12, 48),
    new MeshStandardMaterial({ color: 0xF4E3D7, roughness: 0.3 })
);
lid.position.y = plateHeight + 1.65;
lid.castShadow = true;
juiceJar.add(lid);

juiceJar.position.set(-3.8, 0, -1.8);
cakeStandGroup.add(juiceJar);

// 🍪 Cookie Plate — Larger, more detailed, rougher, some stacked
const cookiePlate = new Group();
const cookiePlateBase = new Mesh(
    new CylinderGeometry(2.0, 2.0, 0.1, 64),
    new MeshStandardMaterial({ color: 0xFFF7EE, roughness: 0.25, metalness: 0.1 })
);
cookiePlateBase.position.y = plateHeight + 0.05;
cookiePlateBase.castShadow = true;
cookiePlate.add(cookiePlateBase);

// cookie spread
const cookiePositions = [];
for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const radius = 0.9 + Math.random() * 0.3;
    cookiePositions.push({
        x: Math.cos(angle) * radius * 0.9,
        z: Math.sin(angle) * radius * 0.9,
        stacked: Math.random() > 0.7 // 30% stacked
    });
}

cookiePositions.forEach((pos) => {
    const cookieMat = new MeshStandardMaterial({
        color: 0xC96E2D,
        roughness: 0.95,
        metalness: 0.05
    });

    const cookie = new Mesh(
        new CylinderGeometry(0.4, 0.4, 0.12, 64),
        cookieMat
    );
    cookie.position.set(pos.x, plateHeight + 0.15, pos.z);
    cookie.castShadow = true;
    cookiePlate.add(cookie);

    // stacked cookie for realism
    if (pos.stacked) {
        const topCookie = new Mesh(
            new CylinderGeometry(0.4, 0.4, 0.12, 64),
            cookieMat
        );
        topCookie.position.set(pos.x + (Math.random() - 0.5) * 0.05, plateHeight + 0.28, pos.z + (Math.random() - 0.5) * 0.05);
        topCookie.rotation.y = Math.random() * Math.PI;
        topCookie.castShadow = true;
        cookiePlate.add(topCookie);
    }

    // chocolate chips
    for (let j = 0; j < 10; j++) {
        const chip = new Mesh(
            new SphereGeometry(0.04, 12, 12),
            new MeshStandardMaterial({ color: 0x3B2F2F, roughness: 0.9 })
        );
        const chipAngle = (j / 10) * Math.PI * 2;
        chip.position.set(
            pos.x + Math.cos(chipAngle) * 0.18,
            plateHeight + 0.24 + Math.random() * 0.02,
            pos.z + Math.sin(chipAngle) * 0.18
        );
        cookiePlate.add(chip);
    }
});

cookiePlate.position.set(4.5, 0, -2.0);
cakeStandGroup.add(cookiePlate);

// 🌷 Flower Vase — 1.5× larger, softer realism, pastel touch
const flowerVase = new Group();

const vaseBody = new Mesh(
    new CylinderGeometry(0.35, 0.45, 1.35, 64),
    new MeshPhysicalMaterial({ 
        color: 0xE8F6F8, 
        roughness: 0.12, 
        metalness: 0.05, 
        clearcoat: 0.7,
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity: 0.9 
    })
);
vaseBody.position.y = plateHeight + 0.68;
vaseBody.castShadow = true;
flowerVase.add(vaseBody);

const flowerColors = [0xFFD6E0, 0xFFF8E1, 0xE5CCFF, 0xFFE6B3];
const flowerPositions = [
    { x: 0, z: 0, rot: 0 },
    { x: 0.2, z: 0.15, rot: 0.25 },
    { x: -0.18, z: 0.18, rot: -0.2 },
    { x: 0.1, z: -0.2, rot: 0.35 }
];

flowerPositions.forEach((pos, i) => {
    const stem = new Mesh(
        new CylinderGeometry(0.02, 0.02, 1.2, 16),
        new MeshStandardMaterial({ color: 0x2E8B57 })
    );
    stem.position.set(pos.x, plateHeight + 1.05, pos.z);
    stem.rotation.z = pos.rot;
    flowerVase.add(stem);

    const center = new Mesh(
        new SphereGeometry(0.12, 24, 24),
        new MeshStandardMaterial({ color: 0xFFD700, roughness: 0.5 })
    );
    center.position.set(
        pos.x + Math.sin(pos.rot) * 0.35,
        plateHeight + 1.6,
        pos.z
    );
    center.castShadow = true;
    flowerVase.add(center);

    const petalColor = flowerColors[i % flowerColors.length];
    for (let j = 0; j < 8; j++) {
        const petal = new Mesh(
            new SphereGeometry(0.12, 20, 20),
            new MeshStandardMaterial({ color: petalColor, roughness: 0.4 })
        );
        const angle = (j / 8) * Math.PI * 2;
        petal.position.set(
            center.position.x + Math.cos(angle) * 0.22,
            center.position.y,
            center.position.z + Math.sin(angle) * 0.22
        );
        petal.scale.set(0.75, 1.3, 0.75);
        flowerVase.add(petal);
    }
});

// Move further away from cake
flowerVase.position.set(-3.5, 0, 3.2);
cakeStandGroup.add(flowerVase);

// === END TABLE DECORATIONS ===


        
        frosting.updateMatrixWorld(true);
        const toppings = createToppings(scene, cakeConfig.toppings, frosting);
        toppings.forEach(t => cakeStandGroup.add(t));
        
        // Balloons
        const balloonSequence = [
            { x: -4.5, y: 4.0, z: -5.5, color: 0xFADADD, bob: 0.6, duration: 7, rot: 0.1 },
            { x: -2.5, y: 5.0, z: -5.0, color: 0xFFF7EE, bob: 0.8, duration: 8, rot: -0.05 },
            { x: 0,    y: 4.5, z: -4.5, color: 0xEBD5B3, bob: 0.5, duration: 6, rot: 0.08 },
            { x: 2.5,  y: 5.2, z: -5.0, color: 0xCFE9E3, bob: 0.7, duration: 7.5, rot: -0.1 },
            { x: 4.5,  y: 4.2, z: -5.5, color: 0xFADADD, bob: 0.6, duration: 8.5, rot: 0.07 }
        ];

        balloonSequence.forEach(config => {
            const balloonMat = new MeshStandardMaterial({ color: config.color, roughness: 0.8, metalness: 0.1 });
            const balloon = new Group();
            const balloonBody = new Mesh(new SphereGeometry(0.6, 32, 32), balloonMat);
            balloonBody.scale.y = 1.25;
            balloonBody.receiveShadow = true;
            balloon.add(balloonBody);
            const knot = new Mesh(new ConeGeometry(0.06, 0.1, 16), balloonMat);
            knot.position.y = -0.6 * 1.25;
            knot.rotation.x = Math.PI;
            balloon.add(knot);
            balloon.position.set(config.x, config.y, config.z);
            scene.add(balloon);

            gsap.to(balloon.position, { y: `+=${config.bob}`, duration: config.duration, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            gsap.to(balloon.rotation, { z: config.rot, duration: config.duration * 0.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        });
        
        // Dust Motes
        const moteGeo = new BufferGeometry();
        const moteCount = 200;
        const motePos = new Float32Array(moteCount * 3);
        for (let i = 0; i < moteCount; i++) {
            motePos[i*3] = (Math.random() - 0.5) * 20;
            motePos[i*3 + 1] = Math.random() * 10;
            motePos[i*3 + 2] = (Math.random() - 0.5) * 20;
        }
        moteGeo.setAttribute('position', new BufferAttribute(motePos, 3));
        const moteMat = new PointsMaterial({ size: 0.03, color: 0xffefd5, transparent: true, opacity: 0.3, blending: AdditiveBlending, depthWrite: false });
        const dustMotes = new Points(moteGeo, moteMat);
        scene.add(dustMotes);
        
        flamesRef.current = [];
        const flameTexture = createFlameTexture();
        if (!isPreview) {
            const candleColors = [0xF5F5DC, 0xF9DADA, 0xCFE9E3];
            for (let i = 0; i < CANDLE_COUNT; i++) {
                const angle = (i / CANDLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
                const radius = 0.7;
                const candleGeo = new CylinderGeometry(0.08, 0.09, 0.8, 16);
                const candleMat = new MeshStandardMaterial({ color: candleColors[i % candleColors.length] });
                const candle = new Mesh(candleGeo, candleMat);
                candle.position.set(Math.cos(angle) * radius, frosting.position.y + 0.5, Math.sin(angle) * radius);
                candle.castShadow = true;
                cakeStandGroup.add(candle);

                const flameMat = new MeshBasicMaterial({ map: flameTexture, transparent: true, blending: AdditiveBlending, side: DoubleSide, depthWrite: false });
                const flameGeo = new PlaneGeometry(0.3, 0.6);
                const flame = new Mesh(flameGeo, flameMat);
                flame.position.set(candle.position.x, candle.position.y + 0.55, candle.position.z);
                cakeStandGroup.add(flame);

                const flameLight = new PointLight(0xffaa33, 2.0, 6);
                flameLight.position.copy(flame.position);
                flameLight.castShadow = true;
                flameLight.shadow.bias = -0.001;
                cakeStandGroup.add(flameLight);
                
                const flickerTl = gsap.timeline({ repeat: -1, yoyo: true, delay: Math.random() * 0.5 });
                flickerTl.to(flame.scale, { duration: 0.2, x: 0.9, y: 1.1, ease: 'power1.inOut' })
                         .to(flame.scale, { duration: 0.2, x: 1.1, y: 0.9, ease: 'power1.inOut' })
                         .to(flameLight, { duration: 0.2, intensity: 1.8, ease: 'power1.inOut' }, "<")
                         .to(flameLight, { duration: 0.2, intensity: 2.2, ease: 'power1.inOut' });
                
                flamesRef.current.push({ mesh: flame, light: flameLight, timeline: flickerTl });
            }
        }

        const animate = () => {
            animationFrameIdRef.current = requestAnimationFrame(animate);
            if(isPreview) cakeStandGroup.rotation.y += 0.002;
            
            const positions = dustMotes.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < moteCount; i++) {
                positions[i*3 + 1] -= 0.004;
                if (positions[i*3 + 1] < -1) positions[i*3 + 1] = 10;
            }
            dustMotes.geometry.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (currentMount) {
                camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            flamesRef.current.forEach(f => f.timeline.kill());
            flameTexture.dispose();
            if (currentMount && renderer.domElement) currentMount.removeChild(renderer.domElement);
            renderer.dispose();
            scene.traverse(object => {
                if (object instanceof Mesh) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else if (object.material) {
                        object.material.dispose();
                    }
                }
            });
        };
    }, [cakeConfig, isPreview]);

    useEffect(() => {
        if (isBlowing && !candlesBlownOutRef.current && rendererRef.current) {
            candlesBlownOutRef.current = true;
            const whoosh = new Audio(`https://cdn.pixabay.com/audio/2022/10/24/audio_39c59a35e7.mp3`);
            whoosh.volume = 0.5;
            whoosh.play();
            
            const camera = cameraRef.current;
            if (!camera) return;

            gsap.to(camera, {
                zoom: 1.15,
                duration: 2,
                ease: 'power2.inOut',
                onUpdate: () => camera.updateProjectionMatrix(),
            });

            const masterTimeline = gsap.timeline({ onComplete: () => setTimeout(onCandlesOut, 500) });
            flamesRef.current.forEach((flame, index) => {
                flame.timeline.kill();
                masterTimeline.to(flame.mesh.material, {
                    duration: 0.3,
                    opacity: 0,
                    ease: 'power2.in'
                }, index * 0.05);

                masterTimeline.to(flame.light, {
                    duration: 0.3,
                    intensity: 0,
                    ease: 'power2.in',
                    onStart: () => {
                        const smokePos = new Vector3();
                        flame.mesh.getWorldPosition(smokePos);
                        createSmokeParticles(smokePos, flame.mesh.parent as Scene)
                    }
                }, index * 0.05);
            });
        }
    }, [isBlowing, onCandlesOut]);

    return <div ref={mountRef} className="w-full h-full bg-transparent" />;
};

export default ThreeScene;