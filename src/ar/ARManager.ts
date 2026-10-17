import * as THREE from 'three';
import type { OfrendaEditor } from '../editor/OfrendaEditor';

export interface ARState {
  isActive: boolean;
  scale: number;
  rotationY: number;
  position: THREE.Vector3;
  error?: string;
}

export type ARListener = (state: ARState) => void;

/**
 * ARManager proporciona soporte de Realidad Aumentada (AR) para Ofrendas 3D.
 * Utiliza la cámara del dispositivo móvil mediante MediaDevices (cámara trasera ambiental)
 * con fondo WebGL transparente, permitiendo proyectar el altar sobre una mesa o habitación real,
 * interactuar con gestos táctiles y capturar fotografías combinadas de cámara + altar 3D.
 */
export class ARManager {
  private editor: OfrendaEditor;
  private videoEl: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private listeners: Set<ARListener> = new Set();

  private state: ARState = {
    isActive: false,
    scale: 0.55,
    rotationY: 0,
    position: new THREE.Vector3(0, -0.4, 0),
  };

  // Guardado de estado previo para restaurar al salir de AR
  private savedAltarPos = new THREE.Vector3();
  private savedAltarScale = new THREE.Vector3(1, 1, 1);
  private savedAltarRot = new THREE.Euler();

  // Variables para interacción táctil en AR
  private touchStartX = 0;
  private touchStartY = 0;
  private initialPinchDist = 0;
  private initialScale = 0.55;
  private boundTouchStart: any;
  private boundTouchMove: any;
  private boundTouchEnd: any;

  constructor(editor: OfrendaEditor) {
    this.editor = editor;
  }

  /**
   * Comprueba si el dispositivo soporta acceso a la cámara.
   */
  public isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Inicia el modo de Realidad Aumentada solicitando permiso de cámara.
   */
  public async startCameraAR(): Promise<boolean> {
    if (!this.isSupported()) {
      alert('Tu navegador o dispositivo no soporta acceso a la cámara para Realidad Aumentada.');
      return false;
    }

    try {
      // 1. Solicitar acceso a la cámara trasera (environment)
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      // 2. Crear y montar elemento de video en segundo plano detrás del canvas
      const video = document.createElement('video');
      video.id = 'ar-camera-feed';
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.srcObject = this.stream;
      await video.play();

      this.videoEl = video;
      const appContainer = document.querySelector('#app-container') || document.body;
      appContainer.prepend(video);

      // 3. Configurar escena Three.js para AR transparente
      const app = this.editor.bridge.app;
      app.scene.nativeScene.background = null;
      app.scene.nativeScene.fog = null;

      // 4. Guardar posición original del altar y ajustar para visualización de mesa
      const altarGroup = this.editor.altar.group;
      this.savedAltarPos.copy(altarGroup.position);
      this.savedAltarScale.copy(altarGroup.scale);
      this.savedAltarRot.copy(altarGroup.rotation);

      this.state.scale = 0.55; // Escala óptima de mesa
      this.state.rotationY = 0;
      this.state.position.set(0, -0.4, 0);

      altarGroup.scale.setScalar(this.state.scale);
      altarGroup.position.copy(this.state.position);
      altarGroup.rotation.y = 0;

      // Ajustar cámara para punto de vista AR
      app.renderer.camera.position.set(0, 0.45, 1.9);
      if (app.controls) {
        app.controls.target.set(0, -0.1, 0);
        app.controls.update();
      }

      // 5. Vincular gestos táctiles de arrastre y escala
      this.setupTouchGestures();

      this.state.isActive = true;
      this.notify();
      this.editor.bridge.playSuccessSound();

      document.body.classList.add('ar-active-mode');

      return true;
    } catch (err: any) {
      console.error('[Ofrendas 3D AR] Error al acceder a la cámara:', err);
      let msg = 'No se pudo activar la cámara.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Se denegó el permiso de cámara. Por favor permítelo en tu navegador para ver la ofrenda en AR.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No se encontró una cámara disponible en este dispositivo.';
      }
      alert(msg);
      this.state.isActive = false;
      this.notify();
      return false;
    }
  }

  /**
   * Finaliza el modo AR y restaura la vista 3D tradicional.
   */
  public stopCameraAR(): void {
    if (!this.state.isActive) return;

    // 1. Detener pistas de la cámara
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // 2. Eliminar elemento de video
    if (this.videoEl && this.videoEl.parentNode) {
      this.videoEl.parentNode.removeChild(this.videoEl);
      this.videoEl = null;
    }

    // 3. Restaurar fondo y niebla de la ofrenda tradicional
    const currentTheme = this.editor.getData().theme;
    this.editor.applyTheme(currentTheme, false);

    // 4. Restaurar posición y escala del altar
    const altarGroup = this.editor.altar.group;
    altarGroup.position.set(0, 0, 0);
    altarGroup.scale.set(1, 1, 1);
    altarGroup.rotation.set(0, 0, 0);

    this.editor.bridge.resetCamera();

    // 5. Remover listeners táctiles
    this.removeTouchGestures();

    this.state.isActive = false;
    document.body.classList.remove('ar-active-mode');
    this.notify();
    this.editor.bridge.playClickSound();
  }

  /**
   * Configura gestos táctiles intuitivos para mover, rotar y escalar en AR.
   */
  private setupTouchGestures(): void {
    const canvas = this.editor.bridge.app.renderer.domElement;

    this.boundTouchStart = (e: TouchEvent) => {
      if (!this.state.isActive) return;

      if (e.touches.length === 1) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.initialPinchDist = Math.hypot(dx, dy);
        this.initialScale = this.state.scale;
      }
    };

    this.boundTouchMove = (e: TouchEvent) => {
      if (!this.state.isActive) return;

      if (e.touches.length === 1) {
        // Arrastrar para reposicionar en X y Y
        const dx = (e.touches[0].clientX - this.touchStartX) * 0.003;
        const dy = (e.touches[0].clientY - this.touchStartY) * 0.003;

        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;

        this.state.position.x += dx;
        this.state.position.y -= dy;
        this.editor.altar.group.position.copy(this.state.position);
      } else if (e.touches.length === 2) {
        // Pellizcar para escalar
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);

        if (this.initialPinchDist > 0) {
          const factor = dist / this.initialPinchDist;
          const newScale = Math.max(0.2, Math.min(1.4, this.initialScale * factor));
          this.setAltarScale(newScale);
        }
      }
    };

    this.boundTouchEnd = () => {
      this.initialPinchDist = 0;
    };

    canvas.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    canvas.addEventListener('touchmove', this.boundTouchMove, { passive: true });
    canvas.addEventListener('touchend', this.boundTouchEnd, { passive: true });
  }

  private removeTouchGestures(): void {
    const canvas = this.editor.bridge.app.renderer.domElement;
    if (this.boundTouchStart) canvas.removeEventListener('touchstart', this.boundTouchStart);
    if (this.boundTouchMove) canvas.removeEventListener('touchmove', this.boundTouchMove);
    if (this.boundTouchEnd) canvas.removeEventListener('touchend', this.boundTouchEnd);
  }

  /**
   * Cambia la escala del altar en AR (tamaño mesa vs tamaño real).
   */
  public setAltarScale(scale: number): void {
    this.state.scale = Math.max(0.2, Math.min(1.5, scale));
    this.editor.altar.group.scale.setScalar(this.state.scale);
    this.notify();
  }

  /**
   * Rota el altar en AR una cantidad de grados dada.
   */
  public rotateAltar(degrees: number = 45): void {
    const rad = (degrees * Math.PI) / 180;
    this.state.rotationY += rad;
    this.editor.altar.group.rotation.y = this.state.rotationY;
    this.editor.bridge.playClickSound();
    this.notify();
  }

  /**
   * Vuelve a centrar el altar frente a la cámara en AR.
   */
  public recenterAltar(): void {
    this.state.position.set(0, -0.4, 0);
    this.state.rotationY = 0;
    this.editor.altar.group.position.copy(this.state.position);
    this.editor.altar.group.rotation.y = 0;
    this.editor.bridge.playSuccessSound();
    this.notify();
  }

  /**
   * Captura una fotografía de alta calidad combinando el fondo de la cámara
   * con el render 3D de la ofrenda y marca decorativa de Día de Muertos.
   */
  public async captureARPhoto(): Promise<string | null> {
    if (!this.state.isActive || !this.videoEl) return null;

    try {
      const video = this.videoEl;
      const threeCanvas = this.editor.bridge.app.renderer.domElement;

      const width = threeCanvas.width;
      const height = threeCanvas.height;

      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = width;
      captureCanvas.height = height;
      const ctx = captureCanvas.getContext('2d');
      if (!ctx) return null;

      // 1. Dibujar frame del video con ajuste "cover"
      const videoRatio = video.videoWidth / (video.videoHeight || 1);
      const canvasRatio = width / (height || 1);

      let sx = 0;
      let sy = 0;
      let sWidth = video.videoWidth;
      let sHeight = video.videoHeight;

      if (videoRatio > canvasRatio) {
        sWidth = video.videoHeight * canvasRatio;
        sx = (video.videoWidth - sWidth) / 2;
      } else {
        sHeight = video.videoWidth / canvasRatio;
        sy = (video.videoHeight - sHeight) / 2;
      }

      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, width, height);

      // 2. Dibujar capa Three.js con la ofrenda encima
      ctx.drawImage(threeCanvas, 0, 0, width, height);

      // 3. Marca de agua estilizada tradicional
      ctx.save();
      ctx.fillStyle = 'rgba(20, 13, 31, 0.7)';
      ctx.fillRect(width - 320, height - 70, 300, 52);
      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 2;
      ctx.strokeRect(width - 320, height - 70, 300, 52);

      ctx.font = 'bold 20px "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffb703';
      ctx.fillText('🌼 Ofrendas 3D · AR', width - 300, height - 38);

      ctx.font = '12px "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#faf5ef';
      ctx.fillText('Día de Muertos en Realidad Aumentada', width - 300, height - 22);
      ctx.restore();

      const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.92);

      // Intentar compartir nativamente en móvil (Web Share API)
      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'mi-ofrenda-ar.jpg', { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Mi Ofrenda 3D en Realidad Aumentada',
              text: '¡Mira mi ofrenda de Día de Muertos en Realidad Aumentada!',
            });
            return dataUrl;
          }
        } catch {}
      }

      // Descarga directa como fallback
      const link = document.createElement('a');
      link.download = `ofrenda-ar-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();

      this.editor.bridge.playSuccessSound();
      return dataUrl;
    } catch (err) {
      console.error('[Ofrendas 3D] Error al capturar foto en AR:', err);
      return null;
    }
  }

  public getState(): ARState {
    return { ...this.state };
  }

  public addListener(fn: ARListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }
}
