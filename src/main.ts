import { OfrendaEditor } from './editor/OfrendaEditor';
import { UIManager } from './ui/UIManager';

/**
 * Punto de entrada principal de Ofrendas 3D.
 */
function bootstrap() {
  console.log('🕯️ [Ofrendas 3D] Inicializando experiencia...');

  try {
    // 1. Inicializar el motor del editor con VXR Core
    const editor = new OfrendaEditor('#app-viewport');
    editor.init();

    // 2. Montar la interfaz de usuario desacoplada
    new UIManager(editor, '#ui-overlay');

    console.log('✨ [Ofrendas 3D] Aplicación ejecutándose correctamente sobre VXR Core.');
    console.log('🌌 [VXR Engine] Render WebGL2, sombras PCF Soft, Web Audio y WebXR activos.');
  } catch (error) {
    console.error('❌ [Ofrendas 3D] Error fatal al iniciar:', error);
  }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
