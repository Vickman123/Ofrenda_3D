import QRCode from 'qrcode';
import { OfrendaEditor } from '../editor/OfrendaEditor';
import { OFRENDA_CATALOG, OFRENDA_CATEGORIES } from '../ofrenda/Catalog';
import { ARManager } from '../ar/ARManager';
import { OfrendaSerializer } from '../ofrenda/OfrendaSerializer';
import type { OfrendaTheme, PlacedItemData, SimpleCategory } from '../types/ofrenda';

/**
 * UIManager transforma la experiencia de Ofrendas 3D en un juego sencillo,
 * cálido, emocional y festivo para que cualquier persona honre a sus seres queridos.
 */
export class UIManager {
  private editor: OfrendaEditor;
  public readonly arManager: ARManager;
  private container: HTMLElement;

  private activeCategory: SimpleCategory = 'flores';
  private currentCaptureDataUrl: string = '';

  constructor(editor: OfrendaEditor, containerSelector: string = '#ui-overlay') {
    this.editor = editor;
    this.arManager = new ARManager(editor);
    const el = document.querySelector<HTMLElement>(containerSelector);
    if (!el) {
      throw new Error(`[UIManager] No se encontró el contenedor "${containerSelector}"`);
    }
    this.container = el;

    this.renderBaseUI();
    this.bindEvents();
    this.updateHeaderMeta(this.editor.getData());
  }

  /**
   * Renderiza la interfaz principal limpia, sin tecnicismos y con estética festiva.
   */
  private renderBaseUI(): void {
    const data = this.editor.getData();

    this.container.innerHTML = `
      <!-- 1. BARRA SUPERIOR ELEGANTE Y MÍNIMA -->
      <header class="top-nav">
        <div class="nav-left">
          <!-- Logo de Flor de Cempasúchil -->
          <button class="brand-group" id="btn-brand-home" title="Centrar altar">
            <svg class="cempasuchil-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="16" fill="#fb8500" />
              <ellipse cx="50" cy="20" rx="9" ry="16" fill="#ffb703" />
              <ellipse cx="50" cy="80" rx="9" ry="16" fill="#ffb703" />
              <ellipse cx="20" cy="50" rx="16" ry="9" fill="#ffb703" />
              <ellipse cx="80" cy="50" rx="16" ry="9" fill="#ffb703" />
              <ellipse cx="28" cy="28" rx="10" ry="15" transform="rotate(-45 28 28)" fill="#ff9e00" />
              <ellipse cx="72" cy="72" rx="10" ry="15" transform="rotate(-45 72 72)" fill="#ff9e00" />
              <ellipse cx="72" cy="28" rx="10" ry="15" transform="rotate(45 72 28)" fill="#ff9e00" />
              <ellipse cx="28" cy="72" rx="10" ry="15" transform="rotate(45 28 72)" fill="#ff9e00" />
              <circle cx="50" cy="50" r="8" fill="#d97706" />
            </svg>
            <div class="brand-text-col">
              <span class="brand-title">Ofrendas 3D</span>
            </div>
          </button>

          <!-- Título y Dedicatoria editable con un toque -->
          <button class="altar-title-pill" id="btn-edit-title-pill" title="Editar título y dedicatoria">
            <span class="pill-dot">🌼</span>
            <span class="pill-title-text" id="ui-altar-title">${data.title}</span>
            <span class="pill-edit-icon">✏️</span>
          </button>
        </div>

        <div class="nav-right">
          <!-- Alternar Iluminación (Sol / Luna) -->
          <button class="btn-icon-round" id="btn-sun-toggle" title="Alternar ambiente lumínico">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5" fill="#f59e0b" stroke="#f59e0b"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#f59e0b"/>
            </svg>
          </button>

          <!-- Botón WebXR -->
          <button class="btn-icon-round" id="btn-vr-toggle" title="Ver en Realidad Virtual (WebXR)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-3l-3-3-3 3H6a3 3 0 0 1-3-3V8z" stroke="#cbd5e1"/>
              <circle cx="8" cy="12" r="2.5" fill="#38bdf8"/>
              <circle cx="16" cy="12" r="2.5" fill="#38bdf8"/>
            </svg>
          </button>

          <!-- Botón Pantalla Completa (Inmersión en móvil y escritorio) -->
          <button class="btn-icon-round" id="btn-fullscreen-toggle" title="Pantalla Completa">
            <svg id="fullscreen-icon-enter" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
            <svg id="fullscreen-icon-exit" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="display:none;">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
            </svg>
          </button>

          <!-- Botón Limpiar / Nuevo Altar -->
          <button class="btn-icon-round" id="btn-new-altar" title="Comenzar nueva ofrenda limpia">
            <span style="font-size: 16px;">↺</span>
          </button>

          <!-- Botón Principal: Terminar y Compartir -->
          <button class="btn-finish-share" id="btn-share-ofrenda" title="Finalizar ofrenda y compartir">
            <span class="share-sparkle">✨</span>
            <span class="share-label">Terminar y Compartir</span>
          </button>
        </div>
      </header>

      <!-- 2. MENSAJE EMOCIONAL CUANDO EL ALTAR ESTÁ LIMPIO -->
      <div class="empty-altar-banner ${data.items.length === 0 ? 'visible' : ''}" id="empty-altar-banner">
        <div class="empty-banner-content">
          <span class="empty-banner-icon">🌼</span>
          <span class="empty-banner-text">Tu ofrenda está lista. Toca <strong>Decorar Ofrenda</strong> abajo para comenzar a honrar a tus seres queridos.</span>
        </div>
      </div>

      <!-- 3. BOTÓN FLOTANTE PRINCIPAL "DECORAR OFRENDA" -->
      <div class="decorating-cta-container" id="decorating-cta-container">
        <button class="btn-open-decorating" id="btn-open-decorating">
          <span class="btn-deco-sparkle">🌼</span>
          <span class="btn-deco-text">Decorar Ofrenda</span>
        </button>
      </div>

      <!-- 4. CAJÓN DESPLEGABLE DE ELEMENTOS TRADICIONALES -->
      <div class="decorating-drawer-backdrop" id="decorating-backdrop"></div>
      <aside class="decorating-drawer" id="decorating-drawer">
        <div class="drawer-header">
          <div class="drawer-title-group">
            <h3 class="drawer-title">🌼 Elementos para tu Ofrenda</h3>
            <p class="drawer-subtitle">Toca un objeto para colocarlo con amor en el altar</p>
          </div>
          <button class="btn-close-drawer" id="btn-close-drawer" title="Cerrar panel">✕</button>
        </div>

        <!-- Pestañas de las 5 Categorías Requeridas -->
        <div class="drawer-categories-bar">
          ${OFRENDA_CATEGORIES.map((cat, idx) => `
            <button class="category-pill ${idx === 0 ? 'active' : ''}" data-category-id="${cat.id}">
              <span class="cat-pill-icon">${cat.icon}</span>
              <span class="cat-pill-name">${cat.name}</span>
            </button>
          `).join('')}
        </div>

        <!-- Cuadrícula de Objetos según la Categoría Seleccionada -->
        <div class="drawer-items-grid" id="drawer-items-grid">
          <!-- Se inyecta dinámicamente con renderCategoryItems() -->
        </div>
      </aside>

      <!-- 5. BARRA DE ACCIÓN VISUAL PARA EL MODO DE COLOCACIÓN / EDICIÓN -->
      <div class="placement-action-bar" id="placement-action-bar">
        <div class="placement-header-row">
          <div class="placement-item-badge">
            <span class="badge-icon" id="placement-badge-icon">🕯️</span>
            <span class="badge-title" id="placement-badge-title">Elemento</span>
            <span class="badge-level" id="placement-badge-level">Repisa</span>
          </div>
        </div>

        <!-- Controles Visuales Sencillos (Mover, Girar, Tamaño, Quitar) -->
        <div class="placement-controls-row">
          <button class="btn-placement-ctrl" id="ctrl-btn-left" title="Mover a la izquierda en la repisa">
            <span class="ctrl-btn-icon">◀</span>
            <span class="ctrl-btn-text">Izquierda</span>
          </button>

          <button class="btn-placement-ctrl" id="ctrl-btn-right" title="Mover a la derecha en la repisa">
            <span class="ctrl-btn-icon">▶</span>
            <span class="ctrl-btn-text">Derecha</span>
          </button>

          <button class="btn-placement-ctrl" id="ctrl-btn-level" title="Cambiar a otra repisa">
            <span class="ctrl-btn-icon">⬆</span>
            <span class="ctrl-btn-text">Repisa</span>
          </button>

          <button class="btn-placement-ctrl" id="ctrl-btn-rotate" title="Girar">
            <span class="ctrl-btn-icon">⟳</span>
            <span class="ctrl-btn-text">Girar</span>
          </button>

          <button class="btn-placement-ctrl" id="ctrl-btn-scale" title="Ajustar tamaño">
            <span class="ctrl-btn-icon">⤢</span>
            <span class="ctrl-btn-text">Tamaño</span>
          </button>

          <button class="btn-placement-ctrl" id="ctrl-btn-custom" title="Personalizar retrato o dedicatoria" style="display: none;">
            <span class="ctrl-btn-icon">✏️</span>
            <span class="ctrl-btn-text">Foto</span>
          </button>

          <button class="btn-placement-ctrl btn-ctrl-delete" id="ctrl-btn-delete" title="Quitar del altar">
            <span class="ctrl-btn-icon">🗑️</span>
            <span class="ctrl-btn-text">Quitar</span>
          </button>
        </div>

        <!-- Botones de Decisión Claros: Cancelar o Confirmar Posición -->
        <div class="placement-decision-row">
          <button class="btn-placement-cancel" id="ctrl-btn-cancel">
            <span>✕ Cancelar</span>
          </button>
          <button class="btn-placement-confirm" id="ctrl-btn-confirm">
            <span>✓ Confirmar Posición</span>
          </button>
        </div>
      </div>

      <!-- 6. MODAL DE EDICIÓN DE FOTO DE MARCO -->
      <div class="modal-backdrop" id="modal-photo">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-icon-badge">🖼️</div>
            <h2>Retrato de Homenaje</h2>
          </div>
          <div class="modal-body">
            <p class="modal-confirm-desc">Sube la fotografía de tu ser querido para colocarla en el portarretrato:</p>
            <div class="photo-upload-zone" id="photo-drop-zone">
              <img id="photo-preview-img" class="photo-preview-hidden" alt="Vista previa" />
              <div id="photo-upload-placeholder" class="upload-placeholder">
                <span class="upload-icon">📷</span>
                <span class="upload-label">Haz clic para elegir foto</span>
                <span class="upload-formats">JPG, PNG o WebP</span>
              </div>
              <input type="file" id="input-photo-file" accept="image/*" class="file-input-hidden" />
            </div>

            <div class="form-group">
              <label for="input-person-name">Nombre de la persona:</label>
              <input type="text" id="input-person-name" placeholder="Ej: Abuelita Elena" maxlength="28" />
            </div>

            <div class="form-group">
              <label for="input-dedication">Dedicatoria o recuerdo:</label>
              <input type="text" id="input-dedication" placeholder="Ej: Siempre en nuestro corazón" maxlength="50" />
            </div>
          </div>
          <div class="modal-actions-row">
            <button class="btn-cancel" id="btn-photo-cancel">Cancelar</button>
            <button class="btn-confirm-reset" id="btn-photo-save">Colocar en el Marco</button>
          </div>
        </div>
      </div>

      <!-- 7. MODAL DE EDICIÓN DE TÍTULO Y DEDICATORIA -->
      <div class="modal-backdrop" id="modal-title">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-icon-badge">✏️</div>
            <h2>Dedicatoria de la Ofrenda</h2>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="input-altar-title">Título del Altar:</label>
              <input type="text" id="input-altar-title" value="${data.title}" maxlength="36" />
            </div>
            <div class="form-group">
              <label for="input-altar-dedication">Dedicatoria general:</label>
              <textarea id="input-altar-dedication" rows="3" maxlength="140">${data.dedication}</textarea>
            </div>
          </div>
          <div class="modal-actions-row">
            <button class="btn-cancel" id="btn-title-cancel">Cancelar</button>
            <button class="btn-confirm-reset" id="btn-title-save">Guardar Dedicatoria</button>
          </div>
        </div>
      </div>

      <!-- 8. MODAL LIMPIAR ALTAR / NUEVA OFRENDA -->
      <div class="modal-backdrop" id="modal-reset">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-icon-badge">↺</div>
            <h2>¿Comenzar nueva ofrenda?</h2>
          </div>
          <div class="modal-body">
            <p class="modal-confirm-text">¿Deseas limpiar el altar para decorarlo desde cero?</p>
            <p class="modal-confirm-desc">Se retirarán los objetos del altar y quedarán las mesas vacías listas para colocar nuevas ofrendas.</p>
          </div>
          <div class="modal-actions-row">
            <button class="btn-cancel" id="btn-reset-cancel">Cancelar</button>
            <button class="btn-confirm-reset" id="btn-reset-confirm">Limpiar Mesa</button>
          </div>
        </div>
      </div>

      <!-- 9. MODAL TERMINAR Y COMPARTIR CON FOTO HD Y ENLACE ÚNICO -->
      <div class="modal-backdrop" id="modal-share">
        <div class="modal-dialog modal-share-dialog">
          <div class="modal-header">
            <div class="modal-icon-badge">✨</div>
            <h2>¡Tu Ofrenda está Lista!</h2>
          </div>
          <div class="modal-body">
            <p class="share-congrats-text">Tu ofrenda ha sido guardada con éxito y está lista para compartirla con tu familia y amigos.</p>

            <!-- Sección Postal / Foto del Altar -->
            <div class="share-postcard-card">
              <div class="postcard-img-wrapper">
                <img id="share-capture-img" class="share-capture-img" alt="Foto de tu Ofrenda" />
              </div>
              <button class="btn-download-capture" id="btn-download-capture">
                <span>📥 Descargar Foto de Recuerdo</span>
              </button>
            </div>

            <!-- Sección Enlace Compartible -->
            <div class="share-section-title">
              <span>🔗 Enlace Único de tu Ofrenda</span>
            </div>
            <div class="share-url-box">
              <input type="text" id="input-share-url" readonly />
              <button class="btn-copy-link" id="btn-copy-share-url">Copiar Enlace</button>
            </div>
            <div class="share-toast" id="share-toast" style="display: none;">
              ✓ ¡Enlace copiado al portapapeles!
            </div>

            <!-- Sección Código QR & Realidad Aumentada -->
            <div class="ar-share-toggle-card">
              <div class="ar-toggle-text">
                <div class="ar-toggle-title">
                  <span class="ar-cam-icon">📱</span>
                  <strong>Abrir en Realidad Aumentada (AR)</strong>
                </div>
                <small class="ar-toggle-desc">Al escanear el QR, abrirá la cámara para proyectar el altar sobre una mesa física.</small>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggle-share-ar" checked />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="qr-container-box">
              <div class="qr-frame">
                <canvas id="qr-code-canvas"></canvas>
              </div>
              <p class="qr-helper-text" id="qr-helper-text">
                Escanea con la cámara de cualquier celular
              </p>
            </div>
          </div>
          <div class="modal-actions-row split-actions">
            <button class="btn-try-ar" id="btn-try-ar-now">
              <span>📷 Ver en Realidad Aumentada (AR)</span>
            </button>
            <button class="btn-confirm-reset" id="btn-share-close">Seguir Decorando</button>
          </div>
        </div>
      </div>

      <!-- 10. MODAL DE BIENVENIDA AR (Para celular) -->
      <div class="modal-backdrop" id="modal-ar-welcome">
        <div class="modal-dialog modal-ar-welcome-dialog">
          <div class="modal-header">
            <div class="modal-icon-badge">📷</div>
            <h2>Ofrenda en Realidad Aumentada</h2>
          </div>
          <div class="modal-body">
            <p class="modal-confirm-text">¡Bienvenido a este altar tradicional en AR!</p>
            <p class="modal-confirm-desc">Permite el acceso a tu cámara para colocar esta ofrenda con sus flores, velas, fotos y dedicatorias directamente sobre tu mesa o habitación.</p>
            <div class="ar-instructions-grid">
              <div class="ar-inst-item">
                <span class="ar-inst-icon">1️⃣</span>
                <span>Toca <strong>Activar Cámara</strong> abajo.</span>
              </div>
              <div class="ar-inst-item">
                <span class="ar-inst-icon">2️⃣</span>
                <span>Acepta el permiso de cámara del navegador.</span>
              </div>
              <div class="ar-inst-item">
                <span class="ar-inst-icon">3️⃣</span>
                <span>Apunta a una mesa o piso para colocar el altar.</span>
              </div>
            </div>
          </div>
          <div class="modal-actions-row">
            <button class="btn-cancel" id="btn-ar-welcome-3d">Ver solo en 3D</button>
            <button class="btn-confirm-reset" id="btn-ar-welcome-start">📷 Activar Cámara y Ver en AR</button>
          </div>
        </div>
      </div>

      <!-- 11. HUD DE REALIDAD AUMENTADA -->
      <div class="ar-hud-overlay" id="ar-hud-overlay">
        <header class="ar-top-hud">
          <div class="ar-live-badge">
            <span class="ar-pulse-dot"></span>
            <span>Cámara AR Activa</span>
          </div>
          <div class="ar-top-actions">
            <button class="btn-ar-hud" id="btn-ar-share-mobile" title="Compartir ofrenda">
              <span>🔗 Compartir</span>
            </button>
            <button class="btn-ar-hud btn-ar-exit" id="btn-ar-exit" title="Salir de AR">
              <span>✕ Salir de AR</span>
            </button>
          </div>
        </header>

        <footer class="ar-bottom-hud">
          <button class="btn-ar-control" id="btn-ar-recenter" title="Centrar altar">
            <span class="ctrl-icon">✥</span>
            <span class="ctrl-label">Centrar</span>
          </button>
          <button class="btn-ar-control" id="btn-ar-scale-toggle" title="Tamaño mesa / real">
            <span class="ctrl-icon">⤢</span>
            <span class="ctrl-label" id="lbl-ar-scale">Escala</span>
          </button>
          <button class="btn-ar-control" id="btn-ar-rotate" title="Girar 45°">
            <span class="ctrl-icon">⟳</span>
            <span class="ctrl-label">Girar</span>
          </button>
          <button class="btn-ar-control btn-ar-snap" id="btn-ar-capture" title="Tomar foto en AR">
            <span class="ctrl-icon">📸</span>
            <span class="ctrl-label">Foto AR</span>
          </button>
        </footer>
      </div>
    `;

    // Renderizar los elementos iniciales de la categoría flores
    this.renderCategoryItems('flores');
  }

  /**
   * Renderiza las tarjetas de elementos correspondientes a la categoría seleccionada.
   */
  private renderCategoryItems(categoryId: SimpleCategory): void {
    const grid = this.container.querySelector('#drawer-items-grid');
    if (!grid) return;

    this.activeCategory = categoryId;
    const items = OFRENDA_CATALOG.filter((it) => it.simpleCategory === categoryId);

    grid.innerHTML = items
      .map(
        (it) => `
        <button class="drawer-item-card" data-template-id="${it.id}">
          <div class="drawer-card-icon-box">
            <span class="card-emoji">${it.icon}</span>
          </div>
          <div class="drawer-card-info">
            <strong class="card-title">${it.name}</strong>
            <small class="card-desc">${it.description}</small>
          </div>
          <span class="card-add-badge">+ Agregar</span>
        </button>
      `
      )
      .join('');

    // Conectar clics para agregar directamente el elemento al altar
    grid.querySelectorAll<HTMLButtonElement>('.drawer-item-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const templateId = btn.dataset.templateId;
        if (!templateId) return;

        this.closeDrawer();
        const newItem = this.editor.addItem(templateId);

        // Si se agregó un marco para fotografía, abrir directamente el diálogo para personalizarlo
        if (newItem && templateId === 'marco_foto') {
          setTimeout(() => {
            this.openPhotoModal(newItem);
          }, 250);
        }
      });
    });
  }

  /**
   * Abre el panel/cajón de decoración con animación.
   */
  private openDrawer(): void {
    const drawer = this.container.querySelector('#decorating-drawer');
    const backdrop = this.container.querySelector('#decorating-backdrop');
    drawer?.classList.add('open');
    backdrop?.classList.add('open');
    this.editor.bridge.playClickSound();
  }

  /**
   * Cierra el panel/cajón de decoración.
   */
  private closeDrawer(): void {
    const drawer = this.container.querySelector('#decorating-drawer');
    const backdrop = this.container.querySelector('#decorating-backdrop');
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
  }

  /**
   * Actualiza la barra de acción de colocación según el elemento seleccionado.
   */
  private updatePlacementBar(item: PlacedItemData | null): void {
    const bar = this.container.querySelector('#placement-action-bar');
    const cta = this.container.querySelector('#decorating-cta-container');
    const iconEl = this.container.querySelector('#placement-badge-icon');
    const titleEl = this.container.querySelector('#placement-badge-title');
    const levelEl = this.container.querySelector('#placement-badge-level');
    const btnCustom = this.container.querySelector('#ctrl-btn-custom') as HTMLElement;

    if (!item) {
      bar?.classList.remove('open');
      cta?.classList.remove('hidden');
      return;
    }

    const template = OFRENDA_CATALOG.find((t) => t.id === item.templateId);
    if (iconEl) iconEl.textContent = template?.icon || '🌼';
    if (titleEl) titleEl.textContent = template?.name || 'Elemento';

    const levelLabels = ['Piso / Base', 'Repisa 1 (Baja)', 'Repisa 2 (Media)', 'Repisa 3 (Alta)'];
    if (levelEl) levelEl.textContent = levelLabels[item.level] || `Nivel ${item.level}`;

    // Mostrar botón de personalizar foto/nombre solo si aplica
    if (btnCustom) {
      btnCustom.style.display = item.templateId === 'marco_foto' || item.templateId === 'calaverita_azucar' ? 'flex' : 'none';
      const label = btnCustom.querySelector('.ctrl-btn-text');
      if (label) {
        label.textContent = item.templateId === 'marco_foto' ? 'Foto' : 'Nombre';
      }
    }

    bar?.classList.add('open');
    cta?.classList.add('hidden');
  }

  /**
   * Conecta todos los eventos de interacción y escucha del editor.
   */
  private bindEvents(): void {
    // 1. Escuchar eventos del Editor
    this.editor.addListener((event, payload) => {
      if (event === 'editingModeChanged') {
        this.updatePlacementBar(payload?.item || null);
      } else if (event === 'ofrendaUpdated') {
        this.updateHeaderMeta(payload);
      } else if (event === 'themeChanged') {
        this.updateThemeUI(payload);
      }
    });

    // 2. Centrar cámara con el logo
    const brandBtn = this.container.querySelector('#btn-brand-home');
    brandBtn?.addEventListener('click', () => {
      this.editor.bridge.resetCamera();
      this.editor.bridge.playClickSound();
    });

    // 3. Abrir / Cerrar Cajón de Decoración
    const btnOpenDeco = this.container.querySelector('#btn-open-decorating');
    const btnCloseDrawer = this.container.querySelector('#btn-close-drawer');
    const backdrop = this.container.querySelector('#decorating-backdrop');

    btnOpenDeco?.addEventListener('click', () => this.openDrawer());
    btnCloseDrawer?.addEventListener('click', () => this.closeDrawer());
    backdrop?.addEventListener('click', () => this.closeDrawer());

    // 4. Pestañas de categorías dentro del cajón
    const categoryPills = this.container.querySelectorAll<HTMLButtonElement>('.category-pill');
    categoryPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        categoryPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        const catId = pill.dataset.categoryId as SimpleCategory;
        if (catId) {
          this.renderCategoryItems(catId);
          this.editor.bridge.playClickSound();
        }
      });
    });

    // 5. Botones de la Barra de Colocación (Modo Edición)
    const btnLeft = this.container.querySelector('#ctrl-btn-left');
    const btnRight = this.container.querySelector('#ctrl-btn-right');
    const btnLevel = this.container.querySelector('#ctrl-btn-level');
    const btnRotate = this.container.querySelector('#ctrl-btn-rotate');
    const btnScale = this.container.querySelector('#ctrl-btn-scale');
    const btnCustom = this.container.querySelector('#ctrl-btn-custom');
    const btnDelete = this.container.querySelector('#ctrl-btn-delete');
    const btnCancel = this.container.querySelector('#ctrl-btn-cancel');
    const btnConfirm = this.container.querySelector('#ctrl-btn-confirm');

    btnLeft?.addEventListener('click', () => this.editor.moveSelectedItemX(-0.1));
    btnRight?.addEventListener('click', () => this.editor.moveSelectedItemX(0.1));
    btnLevel?.addEventListener('click', () => {
      this.editor.moveSelectedItemLevel();
      const item = this.editor.getSelectedItem();
      if (item) this.updatePlacementBar(item);
    });
    btnRotate?.addEventListener('click', () => this.editor.rotateSelectedItem(45));
    btnScale?.addEventListener('click', () => this.editor.scaleSelectedItem(1.15));

    btnCustom?.addEventListener('click', () => {
      const item = this.editor.getSelectedItem();
      if (!item) return;
      if (item.templateId === 'marco_foto') {
        this.openPhotoModal(item);
      } else if (item.templateId === 'calaverita_azucar') {
        const current = item.customData?.personName || 'MÉXICO';
        const newName = prompt('Nombre para la frente de la calaverita (máx. 10 letras):', current);
        if (newName !== null) {
          this.editor.updateSelectedItemCustomData({ personName: newName.trim().toUpperCase() || 'MÉXICO' });
        }
      }
    });

    btnDelete?.addEventListener('click', () => {
      this.editor.deleteSelectedItem();
      this.updatePlacementBar(null);
    });

    btnCancel?.addEventListener('click', () => {
      this.editor.cancelEditing();
    });

    btnConfirm?.addEventListener('click', () => {
      this.editor.confirmEditing();
    });

    // 6. Botones de la Barra Superior
    // 6.1 Alternar tema (Día / Noche)
    const btnSun = this.container.querySelector('#btn-sun-toggle');
    btnSun?.addEventListener('click', () => {
      this.editor.toggleTheme();
    });

    // 6.2 Botón WebXR
    const btnVr = this.container.querySelector('#btn-vr-toggle');
    btnVr?.addEventListener('click', () => {
      const vxrBtn = document.querySelector<HTMLElement>('#VXR_VRButton');
      if (vxrBtn) {
        vxrBtn.click();
      } else {
        alert('Para disfrutar en Realidad Virtual, abre este enlace en el navegador de tu visor Meta Quest.');
      }
    });

    // 6.3 Pantalla Completa
    const btnFullscreen = this.container.querySelector('#btn-fullscreen-toggle');
    const fsEnterIcon = this.container.querySelector('#fullscreen-icon-enter') as HTMLElement | null;
    const fsExitIcon = this.container.querySelector('#fullscreen-icon-exit') as HTMLElement | null;

    const updateFullscreenIcons = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      if (fsEnterIcon && fsExitIcon) {
        fsEnterIcon.style.display = isFs ? 'none' : 'block';
        fsExitIcon.style.display = isFs ? 'block' : 'none';
      }
    };

    btnFullscreen?.addEventListener('click', () => {
      this.editor.bridge.playClickSound();
      const doc = document as any;
      const el = document.documentElement as any;
      const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement;

      if (!isFs) {
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          el.mozRequestFullScreen();
        }
      } else {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          doc.mozCancelFullScreen();
        }
      }
    });

    document.addEventListener('fullscreenchange', updateFullscreenIcons);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcons);

    // 6.4 Limpiar / Nuevo Altar
    const btnNewAltar = this.container.querySelector('#btn-new-altar');
    const modalReset = this.container.querySelector('#modal-reset') as HTMLElement;
    const btnResetCancel = this.container.querySelector('#btn-reset-cancel');
    const btnResetConfirm = this.container.querySelector('#btn-reset-confirm');

    btnNewAltar?.addEventListener('click', () => {
      modalReset?.classList.add('open');
      this.editor.bridge.playClickSound();
    });

    btnResetCancel?.addEventListener('click', () => {
      modalReset?.classList.remove('open');
    });

    btnResetConfirm?.addEventListener('click', () => {
      this.editor.createNewOfrenda();
      modalReset?.classList.remove('open');
      this.updatePlacementBar(null);
    });

    // 6.5 Editar Título y Dedicatoria
    this.setupTitleModalListeners();

    // 6.6 Subir Foto al Marco
    this.setupPhotoModalListeners();

    // 7. Flujo Terminar y Compartir (Captura HD + Guardado Real + Link Único)
    this.setupShareAndARListeners();
  }

  /**
   * Configura el modal de edición de título y dedicatoria general.
   */
  private setupTitleModalListeners(): void {
    const btnTitlePill = this.container.querySelector('#btn-edit-title-pill');
    const modalTitle = this.container.querySelector('#modal-title') as HTMLElement;
    const btnCancel = this.container.querySelector('#btn-title-cancel');
    const btnSave = this.container.querySelector('#btn-title-save');
    const inputTitle = this.container.querySelector('#input-altar-title') as HTMLInputElement;
    const inputDed = this.container.querySelector('#input-altar-dedication') as HTMLTextAreaElement;

    btnTitlePill?.addEventListener('click', () => {
      const data = this.editor.getData();
      if (inputTitle) inputTitle.value = data.title;
      if (inputDed) inputDed.value = data.dedication;
      modalTitle.classList.add('open');
      this.editor.bridge.playClickSound();
    });

    btnCancel?.addEventListener('click', () => {
      modalTitle.classList.remove('open');
    });

    btnSave?.addEventListener('click', () => {
      const title = inputTitle.value.trim() || 'Ofrenda a la Memoria';
      const ded = inputDed.value.trim() || 'A quienes iluminaron nuestro camino y viven en nuestro recuerdo.';
      this.editor.updateMetadata(title, ded);
      modalTitle.classList.remove('open');
      this.editor.bridge.playSuccessSound();
    });
  }

  /**
   * Configura el modal para cargar la foto de homenaje y dedicatoria en el marco.
   */
  private setupPhotoModalListeners(): void {
    const modal = this.container.querySelector('#modal-photo') as HTMLElement;
    const btnCancel = this.container.querySelector('#btn-photo-cancel');
    const btnSave = this.container.querySelector('#btn-photo-save');
    const inputName = this.container.querySelector('#input-person-name') as HTMLInputElement;
    const inputDed = this.container.querySelector('#input-dedication') as HTMLInputElement;
    const inputFile = this.container.querySelector('#input-photo-file') as HTMLInputElement;
    const dropZone = this.container.querySelector('#photo-drop-zone') as HTMLElement;
    const previewImg = this.container.querySelector('#photo-preview-img') as HTMLImageElement;
    const placeholder = this.container.querySelector('#photo-upload-placeholder') as HTMLElement;

    let currentPhotoUrl = '';

    dropZone?.addEventListener('click', () => inputFile?.click());

    inputFile?.addEventListener('change', async () => {
      if (inputFile.files && inputFile.files[0]) {
        const file = inputFile.files[0];
        const compressed = await this.compressPortraitToMicroWebp(file);
        if (compressed) {
          currentPhotoUrl = compressed;
          if (previewImg) {
            previewImg.src = currentPhotoUrl;
            previewImg.classList.remove('photo-preview-hidden');
          }
          if (placeholder) placeholder.style.display = 'none';
        }
      }
    });

    btnCancel?.addEventListener('click', () => modal.classList.remove('open'));

    btnSave?.addEventListener('click', () => {
      this.editor.updateSelectedItemCustomData({
        photoUrl: currentPhotoUrl,
        personName: inputName.value.trim() || 'Ser Querido',
        dedication: inputDed.value.trim() || 'Siempre en nuestros corazones',
      });
      modal.classList.remove('open');
      this.editor.bridge.playSuccessSound();
    });
  }

  /**
   * Abre el modal de fotografía para un marco específico.
   */
  private openPhotoModal(item: PlacedItemData): void {
    const modal = this.container.querySelector('#modal-photo') as HTMLElement;
    const inputName = this.container.querySelector('#input-person-name') as HTMLInputElement;
    const inputDed = this.container.querySelector('#input-dedication') as HTMLInputElement;
    const previewImg = this.container.querySelector('#photo-preview-img') as HTMLImageElement;
    const placeholder = this.container.querySelector('#photo-upload-placeholder') as HTMLElement;

    if (inputName) inputName.value = item.customData?.personName || 'Ser Querido';
    if (inputDed) inputDed.value = item.customData?.dedication || 'Siempre en nuestros corazones';

    if (item.customData?.photoUrl) {
      if (previewImg) {
        previewImg.src = item.customData.photoUrl;
        previewImg.classList.remove('photo-preview-hidden');
      }
      if (placeholder) placeholder.style.display = 'none';
    } else {
      if (previewImg) previewImg.classList.add('photo-preview-hidden');
      if (placeholder) placeholder.style.display = 'flex';
    }

    modal.classList.add('open');
  }

  /**
   * Comprime la imagen del retrato a formato micro-WebP (~1.2 KB)
   * para preservarla directamente en la URL compartida sin backend.
   */
  private compressPortraitToMicroWebp(file: File, width = 120, height = 160, quality = 0.72): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        const targetRatio = width / height;
        const currentRatio = img.width / img.height;
        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

        if (currentRatio > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve('');
      img.src = objectUrl;
    });
  }

  /**
   * Flujo principal de "Terminar y Compartir":
   * Captura la ofrenda completa en alta resolución, verifica el guardado real,
   * y genera el enlace único y código QR.
   */
  private setupShareAndARListeners(): void {
    const btnShare = this.container.querySelector('#btn-share-ofrenda');
    const modalShare = this.container.querySelector('#modal-share') as HTMLElement;
    const inputShare = this.container.querySelector('#input-share-url') as HTMLInputElement;
    const btnCopy = this.container.querySelector('#btn-copy-share-url');
    const btnShareClose = this.container.querySelector('#btn-share-close');
    const toast = this.container.querySelector('#share-toast') as HTMLElement;
    const toggleAr = this.container.querySelector('#toggle-share-ar') as HTMLInputElement;
    const qrCanvas = this.container.querySelector('#qr-code-canvas') as HTMLCanvasElement;
    const qrHelper = this.container.querySelector('#qr-helper-text');
    const btnTryAr = this.container.querySelector('#btn-try-ar-now');
    const captureImg = this.container.querySelector('#share-capture-img') as HTMLImageElement;
    const btnDownload = this.container.querySelector('#btn-download-capture');

    const updateShareDetails = async () => {
      // 1. Guardado real y verificación
      this.editor.save();
      const verified = OfrendaSerializer.loadFromLocalStorage();
      if (!verified) {
        alert('Hubo un inconveniente al verificar el guardado local de la ofrenda.');
        return;
      }

      // 2. Generar enlace compartible con o sin AR
      const isAr = toggleAr ? toggleAr.checked : true;
      const url = this.editor.getShareUrl(isAr);
      if (inputShare) inputShare.value = url;

      if (qrHelper) {
        qrHelper.textContent = isAr
          ? 'Escanea con tu celular para abrir en Realidad Aumentada'
          : 'Escanea con tu celular para ver este altar 3D interactivo';
      }

      // 3. Renderizar código QR
      if (qrCanvas) {
        try {
          await QRCode.toCanvas(qrCanvas, url, {
            width: 200,
            margin: 2,
            color: {
              dark: '#140d1f',
              light: '#ffffff',
            },
          });
        } catch (err) {
          console.error('[Ofrendas 3D] Error al generar código QR:', err);
        }
      }
    };

    btnShare?.addEventListener('click', async () => {
      // Si había un item en edición activa, confirmarlo
      if (this.editor.isEditing()) {
        this.editor.confirmEditing();
      }

      // Cerrar cajón de decoración si estaba abierto
      this.closeDrawer();

      // Generar captura fotográfica de alta resolución independiente del encuadre
      try {
        this.currentCaptureDataUrl = this.editor.bridge.captureOfrendaImage(1600, 900);
        if (captureImg && this.currentCaptureDataUrl) {
          captureImg.src = this.currentCaptureDataUrl;
        }
      } catch (err) {
        console.warn('[Ofrendas 3D] No se pudo generar captura previa:', err);
      }

      modalShare.classList.add('open');
      if (toast) toast.style.display = 'none';
      this.editor.bridge.playSuccessSound();
      await updateShareDetails();
    });

    // Descargar imagen
    btnDownload?.addEventListener('click', () => {
      if (!this.currentCaptureDataUrl) return;
      const title = this.editor.getData().title || 'mi-ofrenda';
      const cleanName = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-');
      const a = document.createElement('a');
      a.href = this.currentCaptureDataUrl;
      a.download = `${cleanName}-ofrenda-3d.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.editor.bridge.playClickSound();
    });

    toggleAr?.addEventListener('change', async () => {
      await updateShareDetails();
      this.editor.bridge.playClickSound();
    });

    btnCopy?.addEventListener('click', () => {
      if (inputShare) {
        navigator.clipboard.writeText(inputShare.value);
        if (toast) {
          toast.style.display = 'block';
          this.editor.bridge.playSuccessSound();
          setTimeout(() => {
            toast.style.display = 'none';
          }, 3500);
        }
      }
    });

    btnShareClose?.addEventListener('click', () => {
      modalShare.classList.remove('open');
    });

    btnTryAr?.addEventListener('click', async () => {
      modalShare.classList.remove('open');
      await this.arManager.startCameraAR();
    });

    // Bienvenida AR para cuando se abre desde escáner QR en celular
    const modalArWelcome = this.container.querySelector('#modal-ar-welcome') as HTMLElement;
    const btnArStart = this.container.querySelector('#btn-ar-welcome-start');
    const btnAr3D = this.container.querySelector('#btn-ar-welcome-3d');

    btnArStart?.addEventListener('click', async () => {
      modalArWelcome?.classList.remove('open');
      await this.arManager.startCameraAR();
    });

    btnAr3D?.addEventListener('click', () => {
      modalArWelcome?.classList.remove('open');
    });

    // Si la URL contiene el parámetro para iniciar en AR, mostrar bienvenida
    if (OfrendaSerializer.isArRequested()) {
      modalArWelcome?.classList.add('open');
    }
  }

  private updateHeaderMeta(data: any): void {
    const titleEl = this.container.querySelector('#ui-altar-title');
    if (titleEl) titleEl.textContent = data.title;

    const banner = this.container.querySelector('#empty-altar-banner');
    if (banner) {
      banner.classList.toggle('visible', !data.items || data.items.length === 0);
    }
  }

  private updateThemeUI(theme: any): void {
    // El tema lumínico y atmosférico es manejado por vxrBridge
  }
}
