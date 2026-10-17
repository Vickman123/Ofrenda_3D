import QRCode from 'qrcode';
import { OfrendaEditor } from '../editor/OfrendaEditor';
import { OFRENDA_CATALOG } from '../ofrenda/Catalog';
import { ARManager } from '../ar/ARManager';
import { OfrendaSerializer } from '../ofrenda/OfrendaSerializer';
import type { OfrendaTheme, PlacedItemData } from '../types/ofrenda';

/**
 * UIManager gestiona la interfaz gráfica limpia, elegante y de alta fidelidad
 * visual de Ofrendas 3D inspirada en la estética del Día de Muertos.
 */
export class UIManager {
  private editor: OfrendaEditor;
  public readonly arManager: ARManager;
  private container: HTMLElement;
  private selectedCatalogId: string = 'veladora_vaso';

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
    this.updateUndoRedoUI();
    this.updateHeaderMeta(this.editor.getData());
  }

  private renderBaseUI(): void {
    const data = this.editor.getData();
    const isPanteon = data.theme === 'panteon_nocturno' || data.theme === 'noche_velas';

    // Primeros 8 elementos del catálogo para la barra inferior
    const primaryItems = OFRENDA_CATALOG.slice(0, 8);

    this.container.innerHTML = `
      <!-- 1. BARRA SUPERIOR -->
      <header class="top-nav">
        <div class="nav-left">
          <!-- Logo de Flor de Cempasúchil -->
          <div class="brand-group">
            <svg class="cempasuchil-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="16" fill="#fb8500" />
              <!-- Pétalos concéntricos -->
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
            <span class="brand-title">Ofrendas 3D</span>
          </div>

          <!-- Pestañas de Navegación -->
          <nav class="nav-tabs">
            <button class="nav-tab active" id="tab-crear">Crear</button>
            <button class="nav-tab" id="tab-escenarios">Escenarios</button>
            <button class="nav-tab" id="tab-galeria">Galería</button>
          </nav>
        </div>

        <div class="nav-right">
          <!-- Deshacer / Rehacer -->
          <button class="btn-history disabled" id="btn-undo" title="Deshacer cambio">
            <span class="history-icon">↺</span>
            <span class="history-text">Deshacer</span>
          </button>
          <button class="btn-history disabled" id="btn-redo" title="Rehacer cambio">
            <span class="history-icon">↻</span>
            <span class="history-text">Rehacer</span>
          </button>

          <!-- Toggle de Iluminación / Sol -->
          <button class="btn-icon-round" id="btn-sun-toggle" title="Alternar iluminación">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5" fill="#f59e0b" stroke="#f59e0b"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#f59e0b"/>
            </svg>
          </button>

          <!-- Botón WebXR -->
          <button class="btn-icon-round" id="btn-vr-toggle" title="Ver en Realidad Virtual (WebXR)">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-3l-3-3-3 3H6a3 3 0 0 1-3-3V8z" stroke="#cbd5e1"/>
              <circle cx="8" cy="12" r="2.5" fill="#38bdf8"/>
              <circle cx="16" cy="12" r="2.5" fill="#38bdf8"/>
            </svg>
          </button>

          <!-- Botón Compartir -->
          <button class="btn-share-pill" id="btn-share-ofrenda">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="18" cy="5" r="3" fill="currentColor"/>
              <circle cx="6" cy="12" r="3" fill="currentColor"/>
              <circle cx="18" cy="19" r="3" fill="currentColor"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>Compartir</span>
          </button>
        </div>
      </header>

      <!-- 2. PANEL IZQUIERDO (Dedicatoria y Escenarios) -->
      <aside class="left-panel-card" id="left-panel">
        <div class="panel-header-row">
          <h2 class="altar-title" id="ui-altar-title">${data.title}</h2>
          <button class="btn-edit-pencil" id="btn-edit-title" title="Editar título y dedicatoria">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
        </div>
        <p class="altar-dedication" id="ui-altar-dedication">${data.dedication}</p>

        <div class="scenario-section">
          <span class="scenario-label">Escenario</span>
          <div class="scenario-cards-row">
            <!-- Escenario 1: Casa Mexicana -->
            <button class="scenario-card ${!isPanteon ? 'active' : ''}" data-theme="casa_mexicana" id="scen-casa">
              <div class="scen-preview scen-casa-bg">
                <div class="scen-sun-glow"></div>
              </div>
              <span class="scen-name">Casa Mexicana</span>
            </button>

            <!-- Escenario 2: Panteón Nocturno -->
            <button class="scenario-card ${isPanteon ? 'active' : ''}" data-theme="panteon_nocturno" id="scen-panteon">
              <div class="scen-preview scen-panteon-bg">
                <div class="scen-moon"></div>
              </div>
              <span class="scen-name">Panteón Nocturno</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- 3. BARRA VERTICAL DERECHA (Controles de Edición) -->
      <aside class="right-toolbar" id="right-toolbar">
        <!-- Agregar -->
        <button class="tool-btn" id="tool-btn-add" title="Agregar objeto seleccionado del catálogo">
          <div class="tool-circle">
            <span class="tool-icon">+</span>
          </div>
          <span class="tool-label">Agregar</span>
        </button>

        <!-- Mover -->
        <button class="tool-btn" id="tool-btn-move" title="Mover objeto de nivel">
          <div class="tool-circle">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="5 9 2 12 5 15"/>
              <polyline points="9 5 12 2 15 5"/>
              <polyline points="15 19 12 22 9 19"/>
              <polyline points="19 9 22 12 19 15"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="12" y1="2" x2="12" y2="22"/>
            </svg>
          </div>
          <span class="tool-label">Mover</span>
        </button>

        <!-- Rotar -->
        <button class="tool-btn" id="tool-btn-rotate" title="Girar 45°">
          <div class="tool-circle">
            <span class="tool-icon">⟳</span>
          </div>
          <span class="tool-label">Rotar</span>
        </button>

        <!-- Escalar -->
        <button class="tool-btn" id="tool-btn-scale" title="Ajustar tamaño">
          <div class="tool-circle">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </div>
          <span class="tool-label">Escalar</span>
        </button>

        <!-- Eliminar -->
        <button class="tool-btn" id="tool-btn-delete" title="Eliminar del altar">
          <div class="tool-circle">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </div>
          <span class="tool-label">Eliminar</span>
        </button>

        <!-- RESET (Destacado con borde dorado) -->
        <button class="tool-btn tool-reset-btn" id="tool-btn-reset" title="Restablecer la ofrenda a su estado inicial">
          <div class="tool-circle reset-circle">
            <span class="tool-icon">↺</span>
          </div>
          <span class="tool-label reset-label">Reset</span>
        </button>
      </aside>

      <!-- 4. BARRA INFERIOR (Catálogo de Objetos) -->
      <footer class="bottom-catalog-tray">
        <div class="catalog-cards-wrapper">
          ${primaryItems.map((item, idx) => `
            <button class="catalog-item-btn ${idx === 0 ? 'selected' : ''}" data-template-id="${item.id}" title="${item.description}">
              <div class="item-visual-box">
                <span class="item-emoji">${item.icon}</span>
              </div>
              <span class="item-name">${item.shortName}</span>
            </button>
          `).join('')}

          <!-- Botón Más -->
          <button class="catalog-item-btn btn-more" id="btn-open-catalog-more" title="Ver catálogo completo de ofrendas">
            <div class="item-visual-box more-box">
              <span class="item-emoji">❯</span>
            </div>
            <span class="item-name">Más</span>
          </button>
        </div>
      </footer>

      <!-- BANNER GUÍA DE ALTAR VACÍO -->
      <div class="empty-altar-banner ${data.items.length === 0 ? 'visible' : ''}" id="empty-altar-banner">
        <div class="empty-banner-content">
          <span class="empty-banner-icon">🌼</span>
          <span class="empty-banner-text">Mesa lista para decorar — Selecciona un objeto abajo y pulsa <strong>+ Agregar</strong></span>
        </div>
      </div>

      <!-- 5. MODAL DE CONFIRMACIÓN DE RESET -->
      <div class="modal-backdrop" id="modal-reset">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-icon-badge">↺</div>
            <h2>¿Restablecer ofrenda?</h2>
          </div>
          <div class="modal-body">
            <p class="modal-confirm-text">¿Restablecer la ofrenda a su estado inicial?</p>
            <p class="modal-confirm-desc">Se eliminarán los objetos del altar y quedará la mesa limpia para comenzar a decorar de nuevo.</p>
          </div>
          <div class="modal-actions-row">
            <button class="btn-cancel" id="btn-reset-cancel">Cancelar</button>
            <button class="btn-confirm-reset" id="btn-reset-confirm">Restablecer</button>
          </div>
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
              <label for="input-dedication">Dedicatoria o frase:</label>
              <input type="text" id="input-dedication" placeholder="Ej: Siempre en nuestro corazón" maxlength="50" />
            </div>
          </div>
          <div class="modal-actions-row">
            <button class="btn-cancel" id="btn-photo-cancel">Cancelar</button>
            <button class="btn-confirm-reset" id="btn-photo-save">Guardar en Marco</button>
          </div>
        </div>
      </div>

      <!-- 7. MODAL DE EDICIÓN DE TÍTULO Y DEDICATORIA -->
      <div class="modal-backdrop" id="modal-title">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-icon-badge">✏️</div>
            <h2>Editar Ofrenda</h2>
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
            <button class="btn-confirm-reset" id="btn-title-save">Guardar Cambios</button>
          </div>
        </div>
      </div>

      <!-- 8. MODAL DE COMPARTIR Y CÓDIGO QR / AR -->
      <div class="modal-backdrop" id="modal-share">
        <div class="modal-dialog modal-share-dialog">
          <div class="modal-header">
            <div class="modal-icon-badge">✨</div>
            <h2>Compartir Ofrenda</h2>
          </div>
          <div class="modal-body">
            <!-- Opción de Compartir en Realidad Aumentada (AR) -->
            <div class="ar-share-toggle-card">
              <div class="ar-toggle-text">
                <div class="ar-toggle-title">
                  <span class="ar-cam-icon">📱</span>
                  <strong>Activar Realidad Aumentada (AR)</strong>
                </div>
                <small class="ar-toggle-desc">Al escanear el QR con un celular, la ofrenda abrirá la cámara para proyectarse en la mesa o suelo real.</small>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggle-share-ar" checked />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <!-- Código QR Dinámico -->
            <div class="qr-container-box">
              <div class="qr-frame">
                <canvas id="qr-code-canvas"></canvas>
              </div>
              <p class="qr-helper-text" id="qr-helper-text">
                Escanea con la cámara de tu celular para abrir en AR
              </p>
            </div>

            <!-- Selector de IP local (visible si se ejecuta en localhost) -->
            <div class="local-ip-hint" id="local-ip-box" style="display: none;">
              <label for="input-custom-host">Dirección Wi-Fi / Red Local (para celular):</label>
              <div class="ip-input-row">
                <input type="text" id="input-custom-host" placeholder="Ej: 172.16.4.57:5173" />
                <button type="button" class="btn-refresh-qr" id="btn-apply-host" title="Actualizar QR con esta IP">Actualizar</button>
              </div>
            </div>

            <div class="share-url-box">
              <input type="text" id="input-share-url" readonly />
              <button class="btn-copy-link" id="btn-copy-share-url">Copiar</button>
            </div>
            <div class="share-toast" id="share-toast" style="display: none;">
              ✓ ¡Enlace copiado al portapapeles!
            </div>
          </div>
          <div class="modal-actions-row split-actions">
            <button class="btn-try-ar" id="btn-try-ar-now">
              <span>📷 Probar AR en este equipo</span>
            </button>
            <button class="btn-confirm-reset" id="btn-share-close">Listo</button>
          </div>
        </div>
      </div>

      <!-- 8B. MODAL DE BIENVENIDA AR (Al abrir enlace con QR en celular) -->
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
                <span>Apunta a una mesa o piso y usa tus dedos para mover o rotar el altar.</span>
              </div>
            </div>
          </div>
          <div class="modal-actions-row">
            <button class="btn-cancel" id="btn-ar-welcome-3d">Ver solo en 3D</button>
            <button class="btn-confirm-reset" id="btn-ar-welcome-start">📷 Activar Cámara y Ver en AR</button>
          </div>
        </div>
      </div>

      <!-- 8C. INTERFAZ HUD EN VIVO DURANTE REALIDAD AUMENTADA -->
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
          <button class="btn-ar-control" id="btn-ar-recenter" title="Centrar altar frente a la cámara">
            <span class="ctrl-icon">✥</span>
            <span class="ctrl-label">Centrar</span>
          </button>
          <button class="btn-ar-control" id="btn-ar-scale-toggle" title="Alternar tamaño mesa / real">
            <span class="ctrl-icon">⤢</span>
            <span class="ctrl-label" id="lbl-ar-scale">Escala</span>
          </button>
          <button class="btn-ar-control" id="btn-ar-rotate" title="Girar 45°">
            <span class="ctrl-icon">⟳</span>
            <span class="ctrl-label">Girar</span>
          </button>
          <button class="btn-ar-control btn-ar-snap" id="btn-ar-capture" title="Tomar foto de tu ofrenda en el mundo real">
            <span class="ctrl-icon">📸</span>
            <span class="ctrl-label">Foto AR</span>
          </button>
        </footer>
      </div>

      <!-- 9. MODAL DE CATÁLOGO COMPLETO (Al pulsar "Más") -->
      <div class="modal-backdrop" id="modal-catalog-more">
        <div class="modal-dialog catalog-more-dialog">
          <div class="modal-header">
            <div class="modal-icon-badge">🌼</div>
            <h2>Catálogo Tradicional Completo</h2>
          </div>
          <div class="modal-body">
            <div class="catalog-full-grid">
              ${OFRENDA_CATALOG.map((item) => `
                <button class="full-catalog-card" data-template-id="${item.id}">
                  <span class="full-card-emoji">${item.icon}</span>
                  <strong class="full-card-name">${item.name}</strong>
                  <small class="full-card-desc">${item.description}</small>
                </button>
              `).join('')}
            </div>
          </div>
          <div class="modal-actions-row">
            <button class="btn-cancel full-w" id="btn-catalog-more-close">Cerrar</button>
          </div>
        </div>
      </div>

      <!-- 10. MODAL CREAR NUEVA OFRENDA -->
      <div class="modal-backdrop" id="modal-create-new">
        <div class="modal-dialog modal-create-dialog">
          <div class="modal-header">
            <div class="modal-icon-badge">🌼</div>
            <h2>Crear una nueva ofrenda</h2>
          </div>
          <div class="modal-body">
            <p class="modal-confirm-desc">Personaliza los detalles de tu ofrenda tradicional. Comenzarás con el altar limpio para colocar libremente velas, flores, calaveritas, fotos y ofrendas.</p>

            <div class="form-group">
              <label for="input-new-title">Título de la Ofrenda:</label>
              <input type="text" id="input-new-title" value="${data.title || 'Ofrenda a la Memoria'}" maxlength="36" placeholder="Ej: Ofrenda a la Familia" />
            </div>

            <div class="form-group">
              <label for="input-new-dedication">Dedicatoria general:</label>
              <textarea id="input-new-dedication" rows="2" maxlength="140" placeholder="A quienes iluminaron nuestro camino y viven en nuestro recuerdo.">${data.dedication || 'A quienes iluminaron nuestro camino y viven en nuestro recuerdo.'}</textarea>
            </div>

            <div class="form-group">
              <label>Escenario:</label>
              <div class="scenario-mini-picker">
                <button type="button" class="mini-scen-btn ${!isPanteon ? 'active' : ''}" data-theme-choice="casa_mexicana" id="choice-scen-casa">
                  <span class="mini-scen-circle scen-casa-bg"></span>
                  <span>Casa Mexicana</span>
                </button>
                <button type="button" class="mini-scen-btn ${isPanteon ? 'active' : ''}" data-theme-choice="panteon_nocturno" id="choice-scen-panteon">
                  <span class="mini-scen-circle scen-panteon-bg"></span>
                  <span>Panteón Nocturno</span>
                </button>
              </div>
            </div>
          </div>
          <div class="modal-actions-row">
            <button class="btn-cancel" id="btn-create-new-cancel">Cerrar</button>
            <button class="btn-confirm-reset" id="btn-create-new-confirm">✨ Comenzar Ofrenda</button>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    // 1. Escuchar eventos del editor
    this.editor.addListener((event, payload) => {
      if (event === 'historyChanged') {
        this.updateUndoRedoUI();
      } else if (event === 'ofrendaUpdated') {
        this.updateHeaderMeta(payload);
        this.updateUndoRedoUI();
      } else if (event === 'themeChanged') {
        this.updateThemeUI(payload);
        this.updateUndoRedoUI();
      } else if (event === 'selectionChanged') {
        this.onSelectionChanged(payload);
      }
    });

    // 2. Deshacer / Rehacer
    const btnUndo = this.container.querySelector('#btn-undo');
    const btnRedo = this.container.querySelector('#btn-redo');

    btnUndo?.addEventListener('click', () => {
      if (this.editor.canUndo()) {
        this.editor.undo();
      }
    });

    btnRedo?.addEventListener('click', () => {
      if (this.editor.canRedo()) {
        this.editor.redo();
      }
    });

    // 3. Alternar Iluminación con botón Sol
    const btnSun = this.container.querySelector('#btn-sun-toggle');
    btnSun?.addEventListener('click', () => {
      this.editor.toggleTheme();
    });

    // 3.1 Clic en logo de Ofrendas 3D para centrar la cámara
    const brandGroup = this.container.querySelector('.brand-group');
    brandGroup?.addEventListener('click', () => {
      this.editor.bridge.resetCamera();
      this.editor.bridge.playClickSound();
    });

    // 4. Botón WebXR
    const btnVr = this.container.querySelector('#btn-vr-toggle');
    btnVr?.addEventListener('click', () => {
      // Activa la sesión WebXR o enfoca el botón flotante nativo de VXR
      const vxrBtn = document.querySelector<HTMLElement>('#VXR_VRButton');
      if (vxrBtn) {
        vxrBtn.click();
      } else {
        alert('Para ingresar en Realidad Virtual, abre esta página en el navegador de tu visor Meta Quest.');
      }
    });

    // 5. Compartir con Código QR y soporte de Realidad Aumentada (AR)
    this.setupShareAndARListeners();

    // 6. Selección de Escenarios en panel izquierdo
    const scenCasa = this.container.querySelector('#scen-casa');
    const scenPanteon = this.container.querySelector('#scen-panteon');

    scenCasa?.addEventListener('click', () => {
      this.editor.applyTheme('casa_mexicana');
    });

    scenPanteon?.addEventListener('click', () => {
      this.editor.applyTheme('panteon_nocturno');
    });

    // 7. Barra derecha de Edición
    const btnAdd = this.container.querySelector('#tool-btn-add');
    const btnMove = this.container.querySelector('#tool-btn-move');
    const btnRotate = this.container.querySelector('#tool-btn-rotate');
    const btnScale = this.container.querySelector('#tool-btn-scale');
    const btnDelete = this.container.querySelector('#tool-btn-delete');
    const btnReset = this.container.querySelector('#tool-btn-reset');

    btnAdd?.addEventListener('click', () => {
      this.editor.addItem(this.selectedCatalogId);
    });

    btnMove?.addEventListener('click', () => {
      this.editor.moveSelectedItemLevel();
    });

    btnRotate?.addEventListener('click', () => {
      this.editor.rotateSelectedItem(45);
    });

    btnScale?.addEventListener('click', () => {
      this.editor.scaleSelectedItem(1.2);
    });

    btnDelete?.addEventListener('click', () => {
      this.editor.deleteSelectedItem();
    });

    // 8. Botón Reset con Modal de Confirmación
    const modalReset = this.container.querySelector('#modal-reset') as HTMLElement;
    const btnResetCancel = this.container.querySelector('#btn-reset-cancel');
    const btnResetConfirm = this.container.querySelector('#btn-reset-confirm');

    btnReset?.addEventListener('click', () => {
      modalReset.classList.add('open');
      this.editor.bridge.playClickSound();
    });

    btnResetCancel?.addEventListener('click', () => {
      modalReset.classList.remove('open');
    });

    btnResetConfirm?.addEventListener('click', () => {
      this.editor.resetToInitial();
      modalReset.classList.remove('open');
    });

    // 9. Barra inferior: Selección y Agregado de objetos
    const catalogCards = this.container.querySelectorAll('.catalog-item-btn:not(.btn-more)');
    catalogCards.forEach((btn) => {
      btn.addEventListener('click', () => {
        catalogCards.forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');

        const tid = btn.getAttribute('data-template-id');
        if (tid) {
          this.selectedCatalogId = tid;
          this.editor.addItem(tid);
        }
      });
    });

    // 10. Catálogo "Más" Modal
    const btnMore = this.container.querySelector('#btn-open-catalog-more');
    const modalMore = this.container.querySelector('#modal-catalog-more') as HTMLElement;
    const btnMoreClose = this.container.querySelector('#btn-catalog-more-close');

    btnMore?.addEventListener('click', () => {
      modalMore.classList.add('open');
      this.editor.bridge.playClickSound();
    });

    btnMoreClose?.addEventListener('click', () => {
      modalMore.classList.remove('open');
    });

    const fullCards = this.container.querySelectorAll('.full-catalog-card');
    fullCards.forEach((c) => {
      c.addEventListener('click', () => {
        const tid = c.getAttribute('data-template-id');
        if (tid) {
          this.selectedCatalogId = tid;
          this.editor.addItem(tid);
          modalMore.classList.remove('open');
        }
      });
    });

    // 11. Modal Editar Título y Dedicatoria
    const btnEditTitle = this.container.querySelector('#btn-edit-title');
    const modalTitle = this.container.querySelector('#modal-title') as HTMLElement;
    const inputTitle = this.container.querySelector('#input-altar-title') as HTMLInputElement;
    const inputDed = this.container.querySelector('#input-altar-dedication') as HTMLTextAreaElement;
    const btnTitleCancel = this.container.querySelector('#btn-title-cancel');
    const btnTitleSave = this.container.querySelector('#btn-title-save');

    btnEditTitle?.addEventListener('click', () => {
      const data = this.editor.getData();
      if (inputTitle) inputTitle.value = data.title;
      if (inputDed) inputDed.value = data.dedication;
      modalTitle.classList.add('open');
      this.editor.bridge.playClickSound();
    });

    btnTitleCancel?.addEventListener('click', () => {
      modalTitle.classList.remove('open');
    });

    btnTitleSave?.addEventListener('click', () => {
      const t = inputTitle.value.trim() || 'Ofrenda a la Memoria';
      const d = inputDed.value.trim();
      this.editor.updateMetadata(t, d);
      modalTitle.classList.remove('open');
      this.editor.bridge.playSuccessSound();
    });

    // 12. Modal de Foto en Portarretrato
    this.setupPhotoModalListeners();

    // 13. Modal Crear Nueva Ofrenda
    this.setupCreateNewModalListeners();
  }

  private updateUndoRedoUI(): void {
    const btnUndo = this.container.querySelector('#btn-undo');
    const btnRedo = this.container.querySelector('#btn-redo');

    if (btnUndo) {
      btnUndo.classList.toggle('disabled', !this.editor.canUndo());
    }
    if (btnRedo) {
      btnRedo.classList.toggle('disabled', !this.editor.canRedo());
    }
  }

  private updateHeaderMeta(data: any): void {
    const titleEl = this.container.querySelector('#ui-altar-title');
    const dedEl = this.container.querySelector('#ui-altar-dedication');
    if (titleEl) titleEl.textContent = data.title;
    if (dedEl) dedEl.textContent = data.dedication;

    const banner = this.container.querySelector('#empty-altar-banner');
    if (banner) {
      banner.classList.toggle('visible', !data.items || data.items.length === 0);
    }
  }

  private setupCreateNewModalListeners(): void {
    const tabCrear = this.container.querySelector('#tab-crear');
    const modalCreate = this.container.querySelector('#modal-create-new') as HTMLElement;
    const inputNewTitle = this.container.querySelector('#input-new-title') as HTMLInputElement;
    const inputNewDed = this.container.querySelector('#input-new-dedication') as HTMLTextAreaElement;
    const btnCreateCancel = this.container.querySelector('#btn-create-new-cancel');
    const btnCreateConfirm = this.container.querySelector('#btn-create-new-confirm');
    const choiceCasa = this.container.querySelector('#choice-scen-casa');
    const choicePanteon = this.container.querySelector('#choice-scen-panteon');

    let chosenTheme: OfrendaTheme = (this.editor.getData().theme || 'casa_mexicana') as OfrendaTheme;

    choiceCasa?.addEventListener('click', () => {
      chosenTheme = 'casa_mexicana';
      choiceCasa.classList.add('active');
      choicePanteon?.classList.remove('active');
    });

    choicePanteon?.addEventListener('click', () => {
      chosenTheme = 'panteon_nocturno';
      choicePanteon.classList.add('active');
      choiceCasa?.classList.remove('active');
    });

    tabCrear?.addEventListener('click', () => {
      const data = this.editor.getData();
      if (inputNewTitle) inputNewTitle.value = data.title;
      if (inputNewDed) inputNewDed.value = data.dedication;
      modalCreate?.classList.add('open');
      this.editor.bridge.playClickSound();
    });

    btnCreateCancel?.addEventListener('click', () => {
      modalCreate?.classList.remove('open');
      localStorage.setItem('ofrendas3d_has_started', 'true');
    });

    btnCreateConfirm?.addEventListener('click', () => {
      const title = inputNewTitle?.value.trim() || 'Ofrenda a la Memoria';
      const ded = inputNewDed?.value.trim() || 'A quienes iluminaron nuestro camino y viven en nuestro recuerdo.';
      this.editor.createNewOfrenda(title, ded, chosenTheme);
      modalCreate?.classList.remove('open');
      localStorage.setItem('ofrendas3d_has_started', 'true');
    });

    // En la primera visita (sin ofrenda compartida por URL), desplegar la bienvenida
    const isShared = window.location.hash.startsWith('#share=');
    const hasStarted = localStorage.getItem('ofrendas3d_has_started');
    if (!isShared && !hasStarted) {
      modalCreate?.classList.add('open');
    }
  }

  private updateThemeUI(theme: any): void {
    const isPanteon = theme.id === 'panteon_nocturno' || theme.id === 'noche_velas';
    const scenCasa = this.container.querySelector('#scen-casa');
    const scenPanteon = this.container.querySelector('#scen-panteon');

    if (scenCasa) scenCasa.classList.toggle('active', !isPanteon);
    if (scenPanteon) scenPanteon.classList.toggle('active', isPanteon);
  }

  private onSelectionChanged(item: PlacedItemData | null): void {
    // Si se seleccionó un marco, permitir abrir el modal de personalización
    if (item && item.templateId === 'marco_foto') {
      this.openPhotoModal(item);
    }
  }

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
        personName: inputName.value.trim() || 'NUESTRA MEMORIA',
        dedication: inputDed.value.trim() || 'Siempre en nuestro recuerdo',
      });
      modal.classList.remove('open');
    });
  }

  private openPhotoModal(item: PlacedItemData): void {
    const modal = this.container.querySelector('#modal-photo') as HTMLElement;
    const inputName = this.container.querySelector('#input-person-name') as HTMLInputElement;
    const inputDed = this.container.querySelector('#input-dedication') as HTMLInputElement;
    const previewImg = this.container.querySelector('#photo-preview-img') as HTMLImageElement;
    const placeholder = this.container.querySelector('#photo-upload-placeholder') as HTMLElement;

    if (inputName) inputName.value = item.customData?.personName || 'NUESTRA MEMORIA';
    if (inputDed) inputDed.value = item.customData?.dedication || 'Siempre en nuestro recuerdo';

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
   * con recorte armónico 3:4 para que quepa directamente dentro del código QR y la URL sin backend.
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

        // Recorte centrado en proporción retrato 3:4
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
    const localIpBox = this.container.querySelector('#local-ip-box') as HTMLElement;
    const inputHost = this.container.querySelector('#input-custom-host') as HTMLInputElement;
    const btnApplyHost = this.container.querySelector('#btn-apply-host');

    // Detectar si está en localhost para sugerir la IP de red local
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const savedHost = localStorage.getItem('ofrendas3d_custom_host');
    let currentCustomHost = savedHost || (isLocalhost ? '172.30.0.26:5173' : window.location.host);

    if (localIpBox && isLocalhost) {
      localIpBox.style.display = 'block';
      if (inputHost) inputHost.value = currentCustomHost;
    }

    const refreshShareModal = async () => {
      const isAr = toggleAr ? toggleAr.checked : true;
      const url = this.editor.getShareUrl(isAr, currentCustomHost || undefined);

      if (inputShare) inputShare.value = url;
      if (qrHelper) {
        qrHelper.textContent = isAr
          ? 'Escanea con la cámara de tu celular para abrir en Realidad Aumentada'
          : 'Escanea con tu celular para ver este altar 3D interactivo';
      }

      if (qrCanvas) {
        try {
          await QRCode.toCanvas(qrCanvas, url, {
            width: 220,
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
      modalShare.classList.add('open');
      if (toast) toast.style.display = 'none';
      this.editor.bridge.playClickSound();
      await refreshShareModal();
    });

    toggleAr?.addEventListener('change', async () => {
      await refreshShareModal();
      this.editor.bridge.playClickSound();
    });

    btnApplyHost?.addEventListener('click', async () => {
      if (inputHost) {
        currentCustomHost = inputHost.value.trim();
        localStorage.setItem('ofrendas3d_custom_host', currentCustomHost);
      }
      await refreshShareModal();
      this.editor.bridge.playSuccessSound();
    });

    btnCopy?.addEventListener('click', () => {
      if (inputShare) {
        navigator.clipboard.writeText(inputShare.value);
        if (toast) {
          toast.style.display = 'block';
          this.editor.bridge.playSuccessSound();
        }
      }
    });

    btnShareClose?.addEventListener('click', () => {
      modalShare.classList.remove('open');
    });

    // Botón de probar AR en el equipo actual
    btnTryAr?.addEventListener('click', async () => {
      modalShare.classList.remove('open');
      await this.arManager.startCameraAR();
    });

    // 2. Modal de Bienvenida AR (cuando se escanea el QR en el móvil)
    const modalArWelcome = this.container.querySelector('#modal-ar-welcome') as HTMLElement;
    const btnArStart = this.container.querySelector('#btn-ar-welcome-start');
    const btnAr3D = this.container.querySelector('#btn-ar-welcome-3d');

    btnArStart?.addEventListener('click', async () => {
      modalArWelcome.classList.remove('open');
      await this.arManager.startCameraAR();
    });

    btnAr3D?.addEventListener('click', () => {
      modalArWelcome.classList.remove('open');
    });

    // Si la URL solicita AR (al escanear el QR), abrir la bienvenida AR automáticamente
    if (OfrendaSerializer.isArRequested()) {
      modalArWelcome?.classList.add('open');
    }

    // 3. Controles HUD de Realidad Aumentada
    const hudOverlay = this.container.querySelector('#ar-hud-overlay') as HTMLElement;
    const btnArExit = this.container.querySelector('#btn-ar-exit');
    const btnArRecenter = this.container.querySelector('#btn-ar-recenter');
    const btnArScale = this.container.querySelector('#btn-ar-scale-toggle');
    const lblArScale = this.container.querySelector('#lbl-ar-scale');
    const btnArRotate = this.container.querySelector('#btn-ar-rotate');
    const btnArCapture = this.container.querySelector('#btn-ar-capture');
    const btnArShareMobile = this.container.querySelector('#btn-ar-share-mobile');

    const scalePresets = [0.45, 0.8, 1.2];
    const scaleLabels = ['Mesa (0.4x)', 'Medio (0.8x)', 'Real (1.2x)'];
    let currentScaleIdx = 0;

    btnArExit?.addEventListener('click', () => {
      this.arManager.stopCameraAR();
    });

    btnArRecenter?.addEventListener('click', () => {
      this.arManager.recenterAltar();
    });

    btnArScale?.addEventListener('click', () => {
      currentScaleIdx = (currentScaleIdx + 1) % scalePresets.length;
      this.arManager.setAltarScale(scalePresets[currentScaleIdx]);
      if (lblArScale) lblArScale.textContent = scaleLabels[currentScaleIdx];
      this.editor.bridge.playClickSound();
    });

    btnArRotate?.addEventListener('click', () => {
      this.arManager.rotateAltar(45);
    });

    btnArCapture?.addEventListener('click', async () => {
      const snapBtn = btnArCapture as HTMLElement;
      snapBtn.style.transform = 'scale(0.85)';
      setTimeout(() => { snapBtn.style.transform = ''; }, 150);
      await this.arManager.captureARPhoto();
    });

    btnArShareMobile?.addEventListener('click', async () => {
      const url = this.editor.getShareUrl(true);
      if (navigator.share) {
        try {
          await navigator.share({
            title: this.editor.getData().title,
            text: `¡Mira mi ofrenda de Día de Muertos en Realidad Aumentada!`,
            url,
          });
        } catch {}
      } else {
        await navigator.clipboard.writeText(url);
        alert('✓ Enlace AR copiado al portapapeles');
      }
    });

    // Escuchar cambios de estado en ARManager
    this.arManager.addListener((state) => {
      if (hudOverlay) {
        hudOverlay.classList.toggle('active', state.isActive);
      }
    });
  }
}
