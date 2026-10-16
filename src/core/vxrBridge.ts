import * as THREE from 'three';
import { XRApp } from 'vxr';
import type { ThemeConfig } from '../types/ofrenda';

/**
 * VXRBridge conecta la lógica creativa de Ofrendas 3D con el motor VXR Core,
 * utilizando exclusivamente sus APIs reales comprobadas.
 */
export class VXRBridge {
  public readonly app: XRApp;
  private currentTheme?: ThemeConfig;

  constructor(containerSelector: string = '#app-viewport') {
    // 1. Inicializar XRApp con sombras de alta calidad y punto de vista a la ofrenda
    this.app = new XRApp({
      container: containerSelector,
      autoVRButton: true,      // Botón flotante WebXR nativo de VXR
      enableShadows: true,     // Sombras PCF Soft
      enableGrid: false,       // Ocultamos grid técnico para dar protagonismo a la ofrenda
      autoOrbitControls: true, // Controles de ratón y táctiles con amortiguamiento
      pixelRatioCap: 1.5,      // Límite óptimo para Meta Quest y móviles
      cameraPosition: [0, 1.15, 3.9],
      fov: 48,
    });

    // 2. Apagar grid explícitamente a través del método nativo de XRScene
    this.app.scene.setGridVisible(false);

    // 3. Ajustar el encuadre y objetivo de OrbitControls al centro de la ofrenda
    if (this.app.controls) {
      this.app.renderer.camera.position.set(0, 1.15, 3.9);
      this.app.controls.target.set(0, 0.88, -0.1);
      this.app.controls.minDistance = 1.2;
      this.app.controls.maxDistance = 6.5;
      this.app.controls.maxPolarAngle = Math.PI / 2 + 0.05; // No pasar por debajo del suelo
      this.app.controls.update();
    }
  }

  /**
   * Aplica un tema lumínico y atmosférico utilizando las propiedades reales de XRScene.
   */
  public applyTheme(theme: ThemeConfig): void {
    this.currentTheme = theme;

    // 1. Color de fondo y niebla de la escena nativa
    this.app.scene.setBackground(theme.backgroundColor);
    this.app.scene.setFog(theme.fogColor, 4, 18);

    // 2. Luces nativas configuradas por XRScene
    if (this.app.scene.ambientLight) {
      this.app.scene.ambientLight.color.setHex(theme.ambientLightColor);
      this.app.scene.ambientLight.intensity = theme.ambientLightIntensity;
    }

    if (this.app.scene.directionalLight) {
      this.app.scene.directionalLight.color.setHex(theme.keyLightColor);
      this.app.scene.directionalLight.intensity = theme.keyLightIntensity;
      this.app.scene.directionalLight.position.set(3, 6, 4);
    }

    if (this.app.scene.hemiLight) {
      this.app.scene.hemiLight.color.setHex(theme.accentLightColor);
      this.app.scene.hemiLight.groundColor.setHex(theme.backgroundColor);
      this.app.scene.hemiLight.intensity = theme.accentLightIntensity;
    }
  }

  /**
   * Agrega objetos a la escena mediante XRScene.
   */
  public addToScene(...objects: THREE.Object3D[]): void {
    this.app.scene.add(...objects);
  }

  /**
   * Remueve objetos de la escena mediante XRScene.
   */
  public removeFromScene(...objects: THREE.Object3D[]): void {
    this.app.scene.remove(...objects);
  }

  /**
   * Realiza raycasting desde eventos de puntero usando la API nativa de XRApp.
   */
  public raycastPointer(
    event: MouseEvent | PointerEvent | { clientX: number; clientY: number },
    targets?: THREE.Object3D[]
  ): THREE.Intersection[] {
    return this.app.raycastPointer(event, targets, true);
  }

  /**
   * Emite sonido táctil de clic mediante el sintetizador Web Audio procedural de VXR.
   */
  public playClickSound(): void {
    try {
      this.app.audio.playClick();
    } catch {}
  }

  /**
   * Emite sonido celebratorio de éxito con VXR Web Audio.
   */
  public playSuccessSound(): void {
    try {
      this.app.audio.playSuccess();
    } catch {}
  }

  /**
   * Registra un callback en el bucle de animación de VXR.
   */
  public onUpdate(callback: (delta: number, elapsed: number) => void): () => void {
    return this.app.onUpdate(callback);
  }

  /**
   * Restablece la cámara orbital al encuadre ideal de la ofrenda.
   */
  public resetCamera(): void {
    this.app.resetCamera([0, 1.15, 3.9], [0, 0.88, -0.1]);
  }

  /**
   * Inicia el bucle de renderizado WebGL/WebXR de VXR Core.
   */
  public start(): void {
    this.app.start();
  }

  /**
   * Libera recursos y contexto WebGL.
   */
  public dispose(): void {
    this.app.dispose();
  }
}
