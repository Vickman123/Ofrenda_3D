import * as THREE from 'three';

export interface LevelInfo {
  level: number;
  y: number; // Altura de la superficie en metros
  width: number;
  depth: number;
  centerZ: number;
}

/**
 * OfrendaAltar construye proceduralmente el altar tradicional mexicano de 3 niveles,
 * con repisas escalonadas, manteles decorativos, papel picado en los bordes
 * y un arco de cempasúchil que corona la estructura.
 */
export class OfrendaAltar {
  public readonly group: THREE.Group = new THREE.Group();
  public levels: LevelInfo[] = [];

  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];

  constructor() {
    this.group.name = 'Ofrenda_AltarStructure';
    this.setupLevelDimensions();
    this.buildSteps();
    this.buildArch();
    this.buildFlowerCarpet();
  }

  private setupLevelDimensions(): void {
    // Definición métrica de los 3 niveles + suelo
    this.levels = [
      { level: 0, y: 0.005, width: 2.6, depth: 0.8, centerZ: 0.6 },   // Suelo / Petate
      { level: 1, y: 0.36, width: 2.2, depth: 0.55, centerZ: 0.2 },   // Nivel 1 (Tierra)
      { level: 2, y: 0.72, width: 1.7, depth: 0.50, centerZ: -0.25 }, // Nivel 2 (Limbo / Purgatorio)
      { level: 3, y: 1.08, width: 1.2, depth: 0.45, centerZ: -0.65 }, // Nivel 3 (Cielo)
    ];
  }

  private buildSteps(): void {
    // Material de madera noble oscura para el cuerpo del altar
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3d2314,
      roughness: 0.75,
      metalness: 0.1,
    });
    this.materials.push(woodMat);

    // Material de mantel tradicional blanco / marfil con textura cálida
    const clothMat = new THREE.MeshStandardMaterial({
      color: 0xfaf5ef,
      roughness: 0.85,
      metalness: 0.02,
    });
    this.materials.push(clothMat);

    // Material de mantel morado terciopelo para contraste
    const purpleClothMat = new THREE.MeshStandardMaterial({
      color: 0x4a0e4e,
      roughness: 0.7,
      metalness: 0.05,
    });
    this.materials.push(purpleClothMat);

    // Colores tradicionales para las tiras de papel picado
    const papelPicadoColors = [0xe60067, 0xff7800, 0x9c27b0, 0x00bcd4, 0xffeb3b];

    for (let i = 1; i <= 3; i++) {
      const lvl = this.levels[i];
      const prevY = this.levels[i - 1].y;
      const stepH = lvl.y - prevY;

      // 1. Bloque estructural del escalón
      const boxGeo = new THREE.BoxGeometry(lvl.width, stepH, lvl.depth);
      this.geometries.push(boxGeo);
      const stepMesh = new THREE.Mesh(boxGeo, woodMat);
      stepMesh.position.set(0, prevY + stepH / 2, lvl.centerZ);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      this.group.add(stepMesh);

      // 2. Mantel superior con vuelo
      const clothGeo = new THREE.BoxGeometry(lvl.width + 0.04, 0.02, lvl.depth + 0.04);
      this.geometries.push(clothGeo);
      const activeClothMat = i === 2 ? purpleClothMat : clothMat;
      const clothMesh = new THREE.Mesh(clothGeo, activeClothMat);
      clothMesh.position.set(0, lvl.y - 0.01, lvl.centerZ);
      clothMesh.castShadow = true;
      clothMesh.receiveShadow = true;
      this.group.add(clothMesh);

      // 3. Cenefas colgantes de papel picado en el borde frontal
      const bannerPieces = Math.floor(lvl.width / 0.18);
      const pieceWidth = (lvl.width - 0.04) / bannerPieces;

      for (let p = 0; p < bannerPieces; p++) {
        const pColor = papelPicadoColors[(p + i * 2) % papelPicadoColors.length];
        const papelMat = new THREE.MeshStandardMaterial({
          color: pColor,
          roughness: 0.6,
          side: THREE.DoubleSide,
        });
        this.materials.push(papelMat);

        const bannerGeo = new THREE.PlaneGeometry(pieceWidth * 0.92, 0.14);
        this.geometries.push(bannerGeo);

        const bannerMesh = new THREE.Mesh(bannerGeo, papelMat);
        const xOffset = -lvl.width / 2 + 0.02 + pieceWidth * (p + 0.5);
        bannerMesh.position.set(xOffset, lvl.y - 0.08, lvl.centerZ + lvl.depth / 2 + 0.025);
        bannerMesh.rotation.x = 0.08; // Ligera inclinación natural
        this.group.add(bannerMesh);
      }
    }
  }

  /**
   * Construye el arco tradicional de flores de cempasúchil que enmarca el nivel superior.
   */
  private buildArch(): void {
    const archGroup = new THREE.Group();
    archGroup.name = 'Ofrenda_Arch';

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xff8c00,
      emissive: 0xff5500,
      emissiveIntensity: 0.15,
      roughness: 0.8,
    });
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xffbe0b,
      roughness: 0.7,
    });
    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.9,
    });
    this.materials.push(goldMat, yellowMat, greenMat);

    // Radio y posición del arco
    const radius = 0.85;
    const centerPoint = new THREE.Vector3(0, 1.25, -0.75);
    const flowerCount = 36;

    for (let i = 0; i <= flowerCount; i++) {
      const angle = (Math.PI * i) / flowerCount;
      const x = Math.cos(angle) * radius;
      const y = centerPoint.y + Math.sin(angle) * (radius * 0.9);
      const z = centerPoint.z;

      // Flor compuesta con pétalos estilizados
      const flowerGeo = new THREE.DodecahedronGeometry(0.065, 1);
      this.geometries.push(flowerGeo);
      const flowerMat = i % 2 === 0 ? goldMat : yellowMat;
      const flower = new THREE.Mesh(flowerGeo, flowerMat);
      flower.position.set(x, y, z);
      flower.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
      archGroup.add(flower);

      // Pequeñas hojas verdes de base
      if (i % 3 === 0) {
        const leafGeo = new THREE.ConeGeometry(0.025, 0.08, 4);
        this.geometries.push(leafGeo);
        const leaf = new THREE.Mesh(leafGeo, greenMat);
        leaf.position.set(x * 1.05, y, z - 0.02);
        leaf.rotation.z = angle + Math.PI / 2;
        archGroup.add(leaf);
      }
    }

    // Columnas de soporte de carrizo/caña
    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.35, 8);
    this.geometries.push(postGeo);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
    this.materials.push(postMat);

    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-radius, 0.65, centerPoint.z);
    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(radius, 0.65, centerPoint.z);

    archGroup.add(leftPost, rightPost);
    this.group.add(archGroup);
  }

  /**
   * Tapete ceremonial de pétalos de cempasúchil en la base del suelo.
   */
  private buildFlowerCarpet(): void {
    const carpetGeo = new THREE.PlaneGeometry(1.8, 0.9);
    this.geometries.push(carpetGeo);

    // Lienzo con textura procedural de tapete de aserrín/pétalos
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Fondo naranja cempasúchil
      ctx.fillStyle = '#ff7800';
      ctx.fillRect(0, 0, 256, 128);

      // Cruz / cenefa central de pétalos amarillos
      ctx.fillStyle = '#ffb703';
      ctx.fillRect(20, 52, 216, 24);
      ctx.fillRect(116, 12, 24, 104);

      // Bordes punteados de flor
      ctx.fillStyle = '#e60067';
      for (let x = 10; x < 246; x += 16) {
        ctx.beginPath();
        ctx.arc(x, 10, 5, 0, Math.PI * 2);
        ctx.arc(x, 118, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    const carpetMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      transparent: true,
      opacity: 0.92,
    });
    this.materials.push(carpetMat);

    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.003, 0.65);
    carpet.receiveShadow = true;
    this.group.add(carpet);
  }

  /**
   * Obtiene la elevación de superficie Y de un nivel específico (0, 1, 2 o 3).
   */
  public getLevelY(level: number): number {
    const lvl = this.levels[Math.max(0, Math.min(level, this.levels.length - 1))];
    return lvl.y;
  }

  /**
   * Obtiene la posición Z central de un nivel.
   */
  public getLevelZ(level: number): number {
    const lvl = this.levels[Math.max(0, Math.min(level, this.levels.length - 1))];
    return lvl.centerZ;
  }

  /**
   * Limpia memoria GPU de geometrías y materiales.
   */
  public dispose(): void {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    this.group.clear();
  }
}
