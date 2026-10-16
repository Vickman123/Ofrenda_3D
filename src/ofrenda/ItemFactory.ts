import * as THREE from 'three';
import type { PlacedItemData } from '../types/ofrenda';

export interface UpdatableItem {
  update: (delta: number, elapsed: number) => void;
  dispose: () => void;
}

/**
 * ItemFactory genera modelos 3D estilizados y de alto impacto visual
 * representativos de la tradición mexicana del Día de Muertos.
 */
export class ItemFactory {
  /**
   * Crea un objeto 3D a partir de los datos guardados o de plantilla.
   */
  public static createItem(data: PlacedItemData): { group: THREE.Group; updatable?: UpdatableItem } {
    let result: { group: THREE.Group; updatable?: UpdatableItem };

    switch (data.templateId) {
      case 'veladora_vaso':
        result = this.createVeladoraVaso();
        break;
      case 'cirio_tradicional':
        result = this.createCirio();
        break;
      case 'flor_cempasuchil':
        result = this.createFlorCempasuchil();
        break;
      case 'ramo_cempasuchil':
        result = this.createRamoCempasuchil();
        break;
      case 'calaverita_azucar':
        result = this.createCalaverita(data.customData?.personName);
        break;
      case 'pan_de_muerto':
        result = this.createPanDeMuerto();
        break;
      case 'marco_foto':
        result = this.createMarcoFoto(data.customData);
        break;
      case 'copalero_incienso':
        result = this.createCopalero();
        break;
      case 'cazuela_mole':
        result = this.createCazuelaMole();
        break;
      case 'jarrito_barro':
        result = this.createJarritoBarro();
        break;
      case 'plato_frutas':
        result = this.createPlatoFrutas();
        break;
      case 'guitarra':
        result = this.createGuitarra();
        break;
      default:
        result = this.createFlorCempasuchil();
        break;
    }

    // Configurar transformaciones y metadatos
    const { group } = result;
    group.name = `OfrendaItem_${data.instanceId}`;
    group.position.set(data.position[0], data.position[1], data.position[2]);
    group.rotation.y = data.rotationY || 0;
    group.scale.setScalar(data.scale || 1.0);

    group.userData = {
      isOfrendaItem: true,
      instanceId: data.instanceId,
      templateId: data.templateId,
      level: data.level,
      customData: data.customData,
    };

    // Habilitar sombras en mallas opacas (evita auto-sombras erráticas en transparentes)
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material;
        const isTransparent = Array.isArray(mat) ? mat.some((m) => m.transparent) : mat.transparent;
        mesh.castShadow = !isTransparent && mesh.name !== 'flame';
        mesh.receiveShadow = true;
      }
    });

    return result;
  }

  /**
   * 1. Veladora en vaso de vidrio con flama animada y luz titilante
   */
  private static createVeladoraVaso(): { group: THREE.Group; updatable: UpdatableItem } {
    const group = new THREE.Group();

    // Vaso de vidrio transparente
    const glassGeo = new THREE.CylinderGeometry(0.065, 0.05, 0.14, 16);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 0.02,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = 0.07;
    group.add(glass);

    // Cera blanca en el fondo
    const waxGeo = new THREE.CylinderGeometry(0.058, 0.046, 0.09, 16);
    const waxMat = new THREE.MeshStandardMaterial({
      color: 0xfffae8,
      roughness: 0.5,
    });
    const wax = new THREE.Mesh(waxGeo, waxMat);
    wax.position.y = 0.05;
    group.add(wax);

    // Flama estilizada
    const flameGeo = new THREE.ConeGeometry(0.022, 0.06, 8);
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffa000,
      emissive: 0xff7700,
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 0.125;
    group.add(flame);

    // Luz puntual cálida (sin sombras de punto para eliminar parpadeo y z-fighting)
    const light = new THREE.PointLight(0xffa233, 1.15, 2.2, 2.0);
    light.position.set(0, 0.15, 0);
    light.castShadow = false;
    group.add(light);

    const updatable: UpdatableItem = {
      update: (_delta, elapsed) => {
        // Titileo orgánico concentrado en la geometría y emisividad de la flama
        const s = Math.sin(elapsed * 7) * 0.08 + Math.cos(elapsed * 13) * 0.04;
        flame.scale.set(1.0 - s * 0.15, 1.0 + s * 0.35, 1.0 - s * 0.15);
        (flameMat as THREE.MeshStandardMaterial).emissiveIntensity = 2.2 + s * 0.3;
        // La intensidad de la luz es ultra estable para evitar destellos globales
        light.intensity = 1.15 + s * 0.03;
      },
      dispose: () => {
        glassGeo.dispose();
        glassMat.dispose();
        waxGeo.dispose();
        waxMat.dispose();
        flameGeo.dispose();
        flameMat.dispose();
      },
    };

    return { group, updatable };
  }

  /**
   * 2. Cirio tradicional alto
   */
  private static createCirio(): { group: THREE.Group; updatable: UpdatableItem } {
    const group = new THREE.Group();

    // Cirio cilíndrico
    const bodyGeo = new THREE.CylinderGeometry(0.04, 0.045, 0.26, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfdfbf7, roughness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.13;
    group.add(body);

    // Plato de barro base
    const baseGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.02, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x9c4221, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.01;
    group.add(base);

    // Flama
    const flameGeo = new THREE.ConeGeometry(0.018, 0.06, 8);
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffbe0b,
      emissive: 0xff8800,
      emissiveIntensity: 2.4,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 0.29;
    group.add(flame);

    const light = new THREE.PointLight(0xffb040, 1.05, 2.4, 2.0);
    light.position.set(0, 0.31, 0);
    light.castShadow = false;
    group.add(light);

    const updatable: UpdatableItem = {
      update: (_delta, elapsed) => {
        const s = Math.sin(elapsed * 6) * 0.08;
        flame.scale.y = 1.0 + s * 0.25;
        (flameMat as THREE.MeshStandardMaterial).emissiveIntensity = 2.4 + s * 0.3;
        light.intensity = 1.05 + s * 0.02;
      },
      dispose: () => {
        bodyGeo.dispose();
        bodyMat.dispose();
        baseGeo.dispose();
        baseMat.dispose();
        flameGeo.dispose();
        flameMat.dispose();
      },
    };

    return { group, updatable };
  }

  /**
   * 3. Flor de Cempasúchil tradicional estilizada (20 pétalos)
   */
  private static createFlorCempasuchil(): { group: THREE.Group } {
    const group = new THREE.Group();

    // Material dorado profundo
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xff7b00,
      roughness: 0.75,
      metalness: 0.05,
    });
    // Material amarillo cálido para puntas
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xffc300,
      roughness: 0.7,
      metalness: 0.05,
    });
    // Cáliz verde
    const calyxMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.9,
    });

    // 1. Cáliz base
    const calyxGeo = new THREE.CylinderGeometry(0.035, 0.015, 0.04, 8);
    const calyx = new THREE.Mesh(calyxGeo, calyxMat);
    calyx.position.y = 0.02;
    group.add(calyx);

    // 2. Capas concéntricas de pétalos ondulados
    const layers = [
      { count: 10, radius: 0.065, height: 0.045, size: 0.035, mat: orangeMat },
      { count: 8, radius: 0.048, height: 0.065, size: 0.032, mat: orangeMat },
      { count: 6, radius: 0.032, height: 0.082, size: 0.028, mat: yellowMat },
      { count: 4, radius: 0.015, height: 0.095, size: 0.024, mat: yellowMat },
    ];

    layers.forEach((layer) => {
      for (let i = 0; i < layer.count; i++) {
        const angle = (i / layer.count) * Math.PI * 2 + Math.random() * 0.15;
        const petalGeo = new THREE.DodecahedronGeometry(layer.size, 0);
        const petal = new THREE.Mesh(petalGeo, layer.mat);
        petal.position.set(
          Math.cos(angle) * layer.radius,
          layer.height,
          Math.sin(angle) * layer.radius
        );
        petal.rotation.set(Math.random() * 0.4, angle, Math.random() * 0.4);
        petal.scale.set(1.2, 0.8, 1.0);
        group.add(petal);
      }
    });

    return { group };
  }

  /**
   * 4. Ramillete denso de cempasúchil en macetita de barro
   */
  private static createRamoCempasuchil(): { group: THREE.Group } {
    const group = new THREE.Group();

    // Maceta de barro
    const potGeo = new THREE.CylinderGeometry(0.075, 0.05, 0.12, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xaa441c, roughness: 0.85 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = 0.06;
    group.add(pot);

    // Múltiples flores emergiendo
    const flowerOffsets = [
      [0, 0.15, 0],
      [0.045, 0.13, 0.04],
      [-0.045, 0.13, -0.03],
      [-0.04, 0.13, 0.04],
      [0.04, 0.13, -0.04],
    ];

    flowerOffsets.forEach(([x, y, z]) => {
      const fl = this.createFlorCempasuchil().group;
      fl.position.set(x, y, z);
      fl.scale.setScalar(0.75);
      group.add(fl);
    });

    return { group };
  }

  /**
   * 5. Calaverita de Azúcar decorada tradicional
   */
  private static createCalaverita(name?: string): { group: THREE.Group } {
    const group = new THREE.Group();

    // Cráneo blanco de azúcar
    const skullMat = new THREE.MeshStandardMaterial({
      color: 0xfdfefe,
      roughness: 0.35,
      metalness: 0.05,
    });

    // Bóveda craneal
    const craniumGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const cranium = new THREE.Mesh(craniumGeo, skullMat);
    cranium.position.set(0, 0.12, 0);
    cranium.scale.set(1.0, 1.05, 1.15);
    group.add(cranium);

    // Mandíbula
    const jawGeo = new THREE.BoxGeometry(0.09, 0.065, 0.08);
    const jaw = new THREE.Mesh(jawGeo, skullMat);
    jaw.position.set(0, 0.055, 0.04);
    group.add(jaw);

    // Cuencas oculares decoradas (colores festivos: rosa mexicano y turquesa)
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
    const eyeDecoMat = new THREE.MeshStandardMaterial({ color: 0xe60067, roughness: 0.4 });

    [-0.035, 0.035].forEach((x) => {
      const eyeGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12);
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.rotation.x = Math.PI / 2;
      eye.position.set(x, 0.12, 0.085);
      group.add(eye);

      // Aro decorativo de glaseado alrededor del ojo
      const ringGeo = new THREE.TorusGeometry(0.026, 0.005, 8, 16);
      const ring = new THREE.Mesh(ringGeo, eyeDecoMat);
      ring.position.set(x, 0.12, 0.087);
      group.add(ring);
    });

    // Nariz en triángulo invertido
    const noseGeo = new THREE.ConeGeometry(0.012, 0.022, 3);
    const nose = new THREE.Mesh(noseGeo, eyeMat);
    nose.rotation.z = Math.PI;
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.088, 0.092);
    group.add(nose);

    // Lentejuela / adorno floral en la frente
    const decorMat = new THREE.MeshStandardMaterial({ color: 0x00bcd4, roughness: 0.3 });
    const flowerFrtGeo = new THREE.DodecahedronGeometry(0.018, 0);
    const flowerFrt = new THREE.Mesh(flowerFrtGeo, decorMat);
    flowerFrt.position.set(0, 0.165, 0.085);
    group.add(flowerFrt);

    // Nombre en la frente con CanvasTexture
    const skullName = name || 'MÉXICO';
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ff7800';
      ctx.fillRect(0, 0, 128, 48);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(skullName.substring(0, 10).toUpperCase(), 64, 24);
    }
    const nameTex = new THREE.CanvasTexture(canvas);
    const nameMat = new THREE.MeshBasicMaterial({ map: nameTex });
    const nameGeo = new THREE.PlaneGeometry(0.065, 0.024);
    const nameMesh = new THREE.Mesh(nameGeo, nameMat);
    nameMesh.position.set(0, 0.145, 0.09);
    nameMesh.rotation.x = -0.15;
    group.add(nameMesh);

    return { group };
  }

  /**
   * 6. Pan de Muerto tradicional con huesitos y azúcar
   */
  private static createPanDeMuerto(): { group: THREE.Group } {
    const group = new THREE.Group();

    // Cuerpo esponjoso del pan (tono dorado horneado)
    const breadMat = new THREE.MeshStandardMaterial({
      color: 0xc48243,
      roughness: 0.85,
    });

    const domeGeo = new THREE.SphereGeometry(0.09, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const dome = new THREE.Mesh(domeGeo, breadMat);
    dome.position.y = 0.01;
    group.add(dome);

    // Huesitos cruzados en X
    const boneGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.18, 8);
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xdf9b5a, roughness: 0.8 });

    const bone1 = new THREE.Mesh(boneGeo, boneMat);
    bone1.rotation.z = Math.PI / 2;
    bone1.position.y = 0.085;
    group.add(bone1);

    const bone2 = new THREE.Mesh(boneGeo, boneMat);
    bone2.rotation.x = Math.PI / 2;
    bone2.position.y = 0.085;
    group.add(bone2);

    // Bolita central (el cráneo)
    const knobGeo = new THREE.SphereGeometry(0.024, 12, 12);
    const knob = new THREE.Mesh(knobGeo, boneMat);
    knob.position.y = 0.105;
    group.add(knob);

    return { group };
  }

  /**
   * 7. Marco para Fotografía con retrato y dedicatoria
   */
  private static createMarcoFoto(customData?: { photoUrl?: string; personName?: string; dedication?: string }): { group: THREE.Group } {
    const group = new THREE.Group();

    // Marco exterior dorado barroco
    const frameGeo = new THREE.BoxGeometry(0.24, 0.32, 0.035);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.35,
      metalness: 0.65,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0.16;
    frame.rotation.x = -0.12; // Inclinación de portarretrato
    group.add(frame);

    // Soporte trasero
    const standGeo = new THREE.BoxGeometry(0.04, 0.18, 0.015);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.set(0, 0.08, -0.06);
    stand.rotation.x = 0.35;
    group.add(stand);

    // Lienzo de la foto con Canvas 2D
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');

    const renderPhotoCanvas = (img?: HTMLImageElement) => {
      if (!ctx) return;
      // Fondo sepia elegante
      ctx.fillStyle = '#f4ebd0';
      ctx.fillRect(0, 0, 256, 340);

      if (img) {
        // Dibujar foto del usuario con borde redondeado y filtro cálido
        ctx.drawImage(img, 12, 12, 232, 250);
      } else {
        // Silueta o retrato de homenaje por defecto
        ctx.fillStyle = '#e6d5b8';
        ctx.fillRect(16, 16, 224, 240);

        // Corona de flores dibujada
        ctx.fillStyle = '#ff7800';
        ctx.beginPath();
        ctx.arc(128, 120, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3d2314';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EN RECUERDO', 128, 115);
        ctx.font = '13px sans-serif';
        ctx.fillText('ETERNAL', 128, 135);
      }

      // Nombre y Dedicatoria en la parte inferior
      ctx.fillStyle = '#2c1810';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      const name = customData?.personName || 'Ser Querido';
      ctx.fillText(name, 128, 290);

      ctx.fillStyle = '#78350f';
      ctx.font = 'italic 12px sans-serif';
      const ded = customData?.dedication || 'Siempre en nuestros corazones';
      ctx.fillText(ded.substring(0, 32), 128, 315);
    };

    renderPhotoCanvas();

    const photoTex = new THREE.CanvasTexture(canvas);
    const photoMat = new THREE.MeshBasicMaterial({ map: photoTex });
    const photoGeo = new THREE.PlaneGeometry(0.19, 0.26);
    const photoMesh = new THREE.Mesh(photoGeo, photoMat);
    photoMesh.position.set(0, 0.16, 0.02);
    photoMesh.rotation.x = -0.12;
    group.add(photoMesh);

    // Cargar imagen remota o de dataURL si existe
    if (customData?.photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        renderPhotoCanvas(img);
        photoTex.needsUpdate = true;
      };
      img.src = customData.photoUrl;
    }

    return { group };
  }

  /**
   * 8. Copalero de barro con humo aromático
   */
  private static createCopalero(): { group: THREE.Group; updatable: UpdatableItem } {
    const group = new THREE.Group();

    // Copa de barro
    const cupGeo = new THREE.CylinderGeometry(0.07, 0.025, 0.13, 16);
    const cupMat = new THREE.MeshStandardMaterial({ color: 0x8b3a1b, roughness: 0.9 });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.y = 0.09;
    group.add(cup);

    // Base del copalero
    const baseGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.03, 16);
    const base = new THREE.Mesh(baseGeo, cupMat);
    base.position.y = 0.015;
    group.add(base);

    // Carbón incandescente
    const coalGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const coalMat = new THREE.MeshStandardMaterial({
      color: 0x221105,
      emissive: 0xff3700,
      emissiveIntensity: 0.8,
    });
    const coal = new THREE.Mesh(coalGeo, coalMat);
    coal.position.y = 0.14;
    coal.scale.set(1.2, 0.4, 1.2);
    group.add(coal);

    // Partículas de humo estilizadas
    const smokePuffs: THREE.Mesh[] = [];
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0xfff0e0,
      transparent: true,
      opacity: 0.28,
    });

    for (let i = 0; i < 5; i++) {
      const puffGeo = new THREE.DodecahedronGeometry(0.025 + i * 0.008, 0);
      const puff = new THREE.Mesh(puffGeo, smokeMat);
      puff.position.set(
        (Math.random() - 0.5) * 0.03,
        0.16 + i * 0.06,
        (Math.random() - 0.5) * 0.03
      );
      group.add(puff);
      smokePuffs.push(puff);
    }

    const updatable: UpdatableItem = {
      update: (_delta, elapsed) => {
        smokePuffs.forEach((puff, idx) => {
          const t = elapsed * 1.2 + idx * 1.5;
          puff.position.y = 0.16 + ((t % 4) / 4) * 0.35;
          puff.position.x = Math.sin(t * 2) * 0.04;
          puff.position.z = Math.cos(t * 2.3) * 0.04;
          puff.scale.setScalar(0.8 + ((t % 4) / 4) * 1.5);
          (puff.material as THREE.Material & { opacity: number }).opacity = Math.max(0, 0.35 * (1 - (t % 4) / 4));
        });
      },
      dispose: () => {
        cupGeo.dispose();
        cupMat.dispose();
      },
    };

    return { group, updatable };
  }

  /**
   * 9. Cazuela de Mole tradicional
   */
  private static createCazuelaMole(): { group: THREE.Group } {
    const group = new THREE.Group();

    // Cazuela
    const potGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.06, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0x8b3a1b, roughness: 0.75 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = 0.03;
    group.add(pot);

    // Mole oscuro con ajonjolí
    const moleGeo = new THREE.CylinderGeometry(0.082, 0.082, 0.01, 16);
    const moleMat = new THREE.MeshStandardMaterial({ color: 0x2b1509, roughness: 0.4 });
    const mole = new THREE.Mesh(moleGeo, moleMat);
    mole.position.y = 0.055;
    group.add(mole);

    // Ajonjolí (pequeñas pepitas blancas)
    const seedMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    for (let i = 0; i < 14; i++) {
      const seedGeo = new THREE.BoxGeometry(0.006, 0.003, 0.006);
      const seed = new THREE.Mesh(seedGeo, seedMat);
      const r = Math.random() * 0.06;
      const th = Math.random() * Math.PI * 2;
      seed.position.set(Math.cos(th) * r, 0.062, Math.sin(th) * r);
      group.add(seed);
    }

    return { group };
  }

  /**
   * 10. Jarrito de barro clásico
   */
  private static createJarritoBarro(): { group: THREE.Group } {
    const group = new THREE.Group();

    // Cuerpo globular
    const mugGeo = new THREE.SphereGeometry(0.055, 16, 16);
    const mugMat = new THREE.MeshStandardMaterial({ color: 0x9c4221, roughness: 0.65 });
    const mug = new THREE.Mesh(mugGeo, mugMat);
    mug.position.y = 0.06;
    mug.scale.set(1, 1.2, 1);
    group.add(mug);

    // Asa
    const handleGeo = new THREE.TorusGeometry(0.03, 0.008, 8, 16, Math.PI);
    const handle = new THREE.Mesh(handleGeo, mugMat);
    handle.rotation.z = -Math.PI / 2;
    handle.position.set(0.055, 0.06, 0);
    group.add(handle);

    return { group };
  }

  /**
   * 11. Plato de Frutas (mandarinas y cañas)
   */
  private static createPlatoFrutas(): { group: THREE.Group } {
    const group = new THREE.Group();

    // Plato de barro vidriado
    const plateGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.02, 16);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.5 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = 0.01;
    group.add(plate);

    // Mandarinas
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xff8f00, roughness: 0.6 });
    [-0.04, 0.04, 0].forEach((x, idx) => {
      const z = idx === 2 ? 0.04 : -0.02;
      const fruitGeo = new THREE.SphereGeometry(0.032, 12, 12);
      const fruit = new THREE.Mesh(fruitGeo, orangeMat);
      fruit.position.set(x, 0.04, z);
      fruit.scale.set(1.05, 0.9, 1.05);
      group.add(fruit);
    });

    return { group };
  }

  /**
   * 12. Guitarra tradicional mexicana en madera acústica
   */
  private static createGuitarra(): { group: THREE.Group } {
    const group = new THREE.Group();
    group.name = 'GuitarraMexicana';

    // Madera cálida para tapa armónica
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xc87d32,
      roughness: 0.45,
      metalness: 0.05,
    });
    // Madera oscura para aros, puente y mástil
    const darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x3d1f0d,
      roughness: 0.6,
      metalness: 0.05,
    });
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xfdfbf7, roughness: 0.3 });
    const stringMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });

    // 1. Cuerpo inferior de la guitarra
    const lowerBoutGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.045, 20);
    const lowerBout = new THREE.Mesh(lowerBoutGeo, bodyMat);
    lowerBout.rotation.x = Math.PI / 2;
    lowerBout.position.set(0, 0.13, 0);
    group.add(lowerBout);

    // 2. Cuerpo superior de la guitarra
    const upperBoutGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.044, 20);
    const upperBout = new THREE.Mesh(upperBoutGeo, bodyMat);
    upperBout.rotation.x = Math.PI / 2;
    upperBout.position.set(0, 0.28, 0);
    group.add(upperBout);

    // Cintura
    const waistGeo = new THREE.BoxGeometry(0.18, 0.15, 0.044);
    const waist = new THREE.Mesh(waistGeo, bodyMat);
    waist.position.set(0, 0.2, 0);
    group.add(waist);

    // 3. Boca / Roseta decorativa
    const holeGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.046, 16);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x1a0f05 });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(0, 0.24, 0.001);
    group.add(hole);

    const rosetteGeo = new THREE.TorusGeometry(0.04, 0.005, 8, 20);
    const rosette = new THREE.Mesh(rosetteGeo, boneMat);
    rosette.position.set(0, 0.24, 0.024);
    group.add(rosette);

    // 4. Puente
    const bridgeGeo = new THREE.BoxGeometry(0.1, 0.02, 0.012);
    const bridge = new THREE.Mesh(bridgeGeo, darkWoodMat);
    bridge.position.set(0, 0.12, 0.026);
    group.add(bridge);

    // 5. Mástil y diapasón
    const neckGeo = new THREE.BoxGeometry(0.035, 0.28, 0.022);
    const neck = new THREE.Mesh(neckGeo, darkWoodMat);
    neck.position.set(0, 0.48, 0.008);
    group.add(neck);

    // 6. Clavijero / Pala
    const headGeo = new THREE.BoxGeometry(0.042, 0.11, 0.018);
    const head = new THREE.Mesh(headGeo, darkWoodMat);
    head.position.set(0, 0.66, 0.002);
    head.rotation.x = -0.15;
    group.add(head);

    // Clavijas de afinación
    for (let i = 0; i < 3; i++) {
      const pegGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.06, 8);
      const peg = new THREE.Mesh(pegGeo, boneMat);
      peg.rotation.z = Math.PI / 2;
      peg.position.set(0, 0.63 + i * 0.028, 0);
      group.add(peg);
    }

    // 7. Cuerdas
    for (let s = -2; s <= 2; s++) {
      const stringGeo = new THREE.BoxGeometry(0.002, 0.5, 0.002);
      const stringMesh = new THREE.Mesh(stringGeo, stringMat);
      stringMesh.position.set(s * 0.005, 0.37, 0.025);
      group.add(stringMesh);
    }

    // Inclinación natural
    group.rotation.z = 0.15;
    group.rotation.y = 0.25;

    return { group };
  }
}
