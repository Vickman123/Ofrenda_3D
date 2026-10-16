import { OfrendaEditor } from '../editor/OfrendaEditor';
import { OFRENDA_CATALOG } from '../ofrenda/Catalog';
import { OFRENDA_THEMES } from '../ofrenda/Themes';
import type { OfrendaTheme, PlacedItemData } from '../types/ofrenda';

/**
 * UIManager gestiona la interfaz gráfica accesible, festiva y responsiva de Ofrendas 3D.
 */
export class UIManager {
  private editor: OfrendaEditor;
  private container: HTMLElement;

  constructor(editor: OfrendaEditor, containerSelector: string = '#ui-overlay') {
    this.editor = editor;
    const el = document.querySelector<HTMLElement>(containerSelector);
    if (!el) {
      throw new Error(`[UIManager] No se encontró el contenedor "${containerSelector}"`);
    }
    this.container = el;

    this.renderBaseUI();
    this.bindEvents();
  }

  private renderBaseUI(): void {
    const data = this.editor.getData();

    this.container.innerHTML = `
      <!-- 1. Barra Superior -->
      <header class="top-nav">
        <div class="nav-brand">
          <span class="brand-emoji">🕯️</span>
          <div class="brand-info">
            <h1 class="brand-title" id="ui-altar-title">${data.title}</h1>
            <p class="brand-subtitle" id="ui-altar-dedication">${data.dedication || 'Altar Tradicional de Día de Muertos'}</p>
          </div>
          <button class="btn-icon" id="btn-edit-title" title="Editar título y dedicatoria">✏️</button>
        </div>

        <div class="nav-actions">
          <!-- Selector de Escenario -->
          <div class="theme-picker-wrapper">
            <button class="btn-pill" id="btn-theme-toggle">
              <span>🎨</span>
              <span id="label-current-theme">Noche de Velas</span>
            </button>
            <div class="theme-dropdown" id="theme-dropdown">
              ${Object.values(OFRENDA_THEMES)
                .map(
                  (th) => `
                <button class="theme-option ${th.id === data.theme ? 'active' : ''}" data-theme="${th.id}">
                  <strong>${th.name}</strong>
                  <small>${th.description}</small>
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Reset de Cámara -->
          <button class="btn-icon" id="btn-reset-cam" title="Restablecer vista centrada">🎯</button>

          <!-- Compartir -->
          <button class="btn-cta" id="btn-share-ofrenda">
            <span>✨</span>
            <span>Compartir</span>
          </button>
        </div>
      </header>

      <!-- 2. Barra Flotante de Acciones Contextuales (Aparece al seleccionar un elemento) -->
      <aside class="context-toolbar" id="context-toolbar">
        <div class="context-header">
          <div class="context-item-info">
            <span class="context-icon" id="ctx-item-icon">🕯️</span>
            <div>
              <h3 class="context-name" id="ctx-item-name">Veladora</h3>
              <span class="context-level" id="ctx-item-level">Nivel 1</span>
            </div>
          </div>
          <button class="btn-close-sm" id="btn-ctx-close" title="Deseleccionar">✕</button>
        </div>

        <!-- Botones de Acción -->
        <div class="context-actions-grid">
          <!-- Rotación -->
          <div class="action-group">
            <span class="action-label">Girar</span>
            <div class="btn-row">
              <button class="btn-tool" id="btn-rot-left" title="Girar -45°">↺ -45°</button>
              <button class="btn-tool" id="btn-rot-right" title="Girar +45°">↻ +45°</button>
            </div>
          </div>

          <!-- Escala -->
          <div class="action-group">
            <span class="action-label">Tamaño</span>
            <div class="btn-row">
              <button class="btn-tool" id="btn-scale-down" title="Reducir tamaño">➖</button>
              <button class="btn-tool" id="btn-scale-up" title="Aumentar tamaño">➕</button>
            </div>
          </div>

          <!-- Mover a Nivel -->
          <div class="action-group full-width">
            <span class="action-label">Cambiar de Nivel</span>
            <div class="level-btn-row">
              <button class="btn-level" data-level="3">Nivel 3</button>
              <button class="btn-level" data-level="2">Nivel 2</button>
              <button class="btn-level" data-level="1">Nivel 1</button>
              <button class="btn-level" data-level="0">Suelo</button>
            </div>
          </div>

          <!-- Personalización especial de Marco o Calaverita -->
          <div class="action-group full-width" id="ctx-custom-action-container">
            <!-- Rellenado dinámicamente si es marco o calaverita -->
          </div>

          <!-- Eliminar -->
          <button class="btn-danger full-width" id="btn-delete-item">
            <span>🗑️</span>
            <span>Eliminar del altar</span>
          </button>
        </div>
      </aside>

      <!-- 3. Catálogo Inferior con Elementos Tradicionales -->
      <footer class="catalog-tray">
        <div class="catalog-header">
          <span class="catalog-badge">Catálogo Tradicional</span>
          <span class="catalog-hint">Toca un elemento para colocarlo en el altar</span>
        </div>
        <div class="catalog-scroll-container">
          ${OFRENDA_CATALOG.map(
            (item) => `
            <button class="catalog-card" data-template-id="${item.id}" title="${item.description}">
              <span class="card-emoji">${item.icon}</span>
              <span class="card-name">${item.name}</span>
            </button>
          `
          ).join('')}
        </div>
      </footer>

      <!-- 4. Modales de Usuario -->
      <!-- Modal: Editar Foto y Dedicatoria de Marco -->
      <div class="modal-backdrop" id="modal-photo">
        <div class="modal-card">
          <div class="modal-header">
            <h2>🖼️ Retrato de Homenaje</h2>
            <button class="btn-close-sm" id="btn-modal-photo-close">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-instruction">Sube una fotografía de tu ser querido para honrar su memoria en la ofrenda.</p>
            
            <div class="photo-upload-zone" id="photo-drop-zone">
              <img id="photo-preview-img" class="photo-preview-hidden" alt="Vista previa" />
              <div id="photo-upload-placeholder" class="upload-placeholder">
                <span class="upload-icon">📷</span>
                <span class="upload-label">Haz clic para elegir una foto</span>
                <span class="upload-formats">JPG, PNG, WebP</span>
              </div>
              <input type="file" id="input-photo-file" accept="image/*" class="file-input-hidden" />
            </div>

            <div class="form-group">
              <label for="input-person-name">Nombre de la persona o familiar:</label>
              <input type="text" id="input-person-name" placeholder="Ej: Abuelita Elena" maxlength="28" />
            </div>

            <div class="form-group">
              <label for="input-dedication">Dedicatoria o frase de recuerdo:</label>
              <input type="text" id="input-dedication" placeholder="Ej: Siempre en nuestro corazón" maxlength="50" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="btn-modal-photo-cancel">Cancelar</button>
            <button class="btn-cta" id="btn-modal-photo-save">Guardar en el Altar</button>
          </div>
        </div>
      </div>

      <!-- Modal: Editar Nombre en Calaverita -->
      <div class="modal-backdrop" id="modal-skull">
        <div class="modal-card">
          <div class="modal-header">
            <h2>💀 Calaverita de Azúcar</h2>
            <button class="btn-close-sm" id="btn-modal-skull-close">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-instruction">Escribe el nombre que deseas colocar en la frente de la calaverita:</p>
            <div class="form-group">
              <input type="text" id="input-skull-name" placeholder="Ej: CARLOS" maxlength="12" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="btn-modal-skull-cancel">Cancelar</button>
            <button class="btn-cta" id="btn-modal-skull-save">Actualizar Nombre</button>
          </div>
        </div>
      </div>

      <!-- Modal: Título y Dedicatoria General -->
      <div class="modal-backdrop" id="modal-title">
        <div class="modal-card">
          <div class="modal-header">
            <h2>🕯️ Dedicatoria del Altar</h2>
            <button class="btn-close-sm" id="btn-modal-title-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="input-altar-title">Nombre de la Ofrenda:</label>
              <input type="text" id="input-altar-title" value="${data.title}" maxlength="38" />
            </div>
            <div class="form-group">
              <label for="input-altar-dedication">Dedicatoria general:</label>
              <textarea id="input-altar-dedication" rows="3" maxlength="140">${data.dedication}</textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="btn-modal-title-cancel">Cancelar</button>
            <button class="btn-cta" id="btn-modal-title-save">Guardar</button>
          </div>
        </div>
      </div>

      <!-- Modal: Compartir Ofrenda -->
      <div class="modal-backdrop" id="modal-share">
        <div class="modal-card">
          <div class="modal-header">
            <h2>✨ Comparte tu Ofrenda</h2>
            <button class="btn-close-sm" id="btn-modal-share-close">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-instruction">Cualquier persona con este enlace podrá ver tu altar 3D con todas las fotos, veladoras, nombres y dedicatorias que colocaste, incluso en realidad virtual:</p>
            <div class="share-url-box">
              <input type="text" id="input-share-url" readonly />
              <button class="btn-copy" id="btn-copy-share-url">Copiar</button>
            </div>
            <div class="share-toast" id="share-toast" style="display: none;">
              ✓ ¡Enlace copiado al portapapeles!
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cta full-width" id="btn-modal-share-ok">Listo</button>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    // 1. Escuchar eventos del Editor
    this.editor.addListener((event, payload) => {
      if (event === 'selectionChanged') {
        this.updateContextToolbar(payload);
      } else if (event === 'ofrendaUpdated') {
        this.updateHeaderMeta(payload);
      } else if (event === 'themeChanged') {
        this.updateThemeUI(payload);
      }
    });

    // 2. Catálogo: agregar elementos con un toque
    const cards = this.container.querySelectorAll('.catalog-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const templateId = card.getAttribute('data-template-id');
        if (templateId) {
          this.editor.addItem(templateId);
        }
      });
    });

    // 3. Toolbar contextual de manipulación
    const btnRotL = this.container.querySelector('#btn-rot-left');
    const btnRotR = this.container.querySelector('#btn-rot-right');
    const btnScaleDown = this.container.querySelector('#btn-scale-down');
    const btnScaleUp = this.container.querySelector('#btn-scale-up');
    const btnDelete = this.container.querySelector('#btn-delete-item');
    const btnCtxClose = this.container.querySelector('#btn-ctx-close');

    btnRotL?.addEventListener('click', () => this.editor.rotateSelectedItem(-45));
    btnRotR?.addEventListener('click', () => this.editor.rotateSelectedItem(45));
    btnScaleDown?.addEventListener('click', () => this.editor.scaleSelectedItem(0.9));
    btnScaleUp?.addEventListener('click', () => this.editor.scaleSelectedItem(1.1));
    btnDelete?.addEventListener('click', () => this.editor.deleteSelectedItem());
    btnCtxClose?.addEventListener('click', () => this.editor.selectItem(null));

    // Botones de cambio de nivel
    const levelBtns = this.container.querySelectorAll('.btn-level');
    levelBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const lvl = parseInt(btn.getAttribute('data-level') || '1', 10);
        this.editor.moveSelectedItemLevel(lvl);
      });
    });

    // 4. Reset de cámara
    this.container.querySelector('#btn-reset-cam')?.addEventListener('click', () => {
      this.editor.bridge.resetCamera();
      this.editor.bridge.playClickSound();
    });

    // 5. Selector de temas
    const themeDropdown = this.container.querySelector('#theme-dropdown') as HTMLElement;
    const btnThemeToggle = this.container.querySelector('#btn-theme-toggle');

    btnThemeToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      themeDropdown.classList.remove('open');
    });

    const themeOptions = this.container.querySelectorAll('.theme-option');
    themeOptions.forEach((opt) => {
      opt.addEventListener('click', () => {
        const themeId = opt.getAttribute('data-theme') as OfrendaTheme;
        if (themeId) {
          this.editor.applyTheme(themeId);
          themeDropdown.classList.remove('open');
        }
      });
    });

    // 6. Modales
    this.setupModalListeners();
  }

  private updateContextToolbar(item: PlacedItemData | null): void {
    const toolbar = this.container.querySelector('#context-toolbar') as HTMLElement;
    if (!toolbar) return;

    if (!item) {
      toolbar.classList.remove('open');
      return;
    }

    toolbar.classList.add('open');

    const template = OFRENDA_CATALOG.find((t) => t.id === item.templateId);
    const iconEl = this.container.querySelector('#ctx-item-icon');
    const nameEl = this.container.querySelector('#ctx-item-name');
    const levelEl = this.container.querySelector('#ctx-item-level');

    if (iconEl) iconEl.textContent = template?.icon || '🕯️';
    if (nameEl) nameEl.textContent = template?.name || 'Elemento';
    if (levelEl) levelEl.textContent = item.level === 0 ? 'En el Suelo' : `Nivel ${item.level}`;

    // Resaltar botón de nivel activo
    const levelBtns = this.container.querySelectorAll('.btn-level');
    levelBtns.forEach((btn) => {
      const lvl = parseInt(btn.getAttribute('data-level') || '1', 10);
      btn.classList.toggle('active', lvl === item.level);
    });

    // Acciones especiales de marco o calaverita
    const customContainer = this.container.querySelector('#ctx-custom-action-container') as HTMLElement;
    if (customContainer) {
      if (item.templateId === 'marco_foto') {
        customContainer.innerHTML = `
          <button class="btn-special full-width" id="btn-edit-photo">
            <span>📷</span>
            <span>Cambiar Foto y Dedicatoria</span>
          </button>
        `;
        customContainer.querySelector('#btn-edit-photo')?.addEventListener('click', () => {
          this.openPhotoModal(item);
        });
      } else if (item.templateId === 'calaverita_azucar') {
        customContainer.innerHTML = `
          <button class="btn-special full-width" id="btn-edit-skull-name">
            <span>✏️</span>
            <span>Editar Nombre (${item.customData?.personName || 'MÉXICO'})</span>
          </button>
        `;
        customContainer.querySelector('#btn-edit-skull-name')?.addEventListener('click', () => {
          this.openSkullModal(item);
        });
      } else {
        customContainer.innerHTML = '';
      }
    }
  }

  private updateHeaderMeta(data: any): void {
    const titleEl = this.container.querySelector('#ui-altar-title');
    const dedEl = this.container.querySelector('#ui-altar-dedication');
    if (titleEl) titleEl.textContent = data.title;
    if (dedEl) dedEl.textContent = data.dedication;
  }

  private updateThemeUI(theme: any): void {
    const label = this.container.querySelector('#label-current-theme');
    if (label) label.textContent = theme.name;

    const themeOptions = this.container.querySelectorAll('.theme-option');
    themeOptions.forEach((opt) => {
      opt.classList.toggle('active', opt.getAttribute('data-theme') === theme.id);
    });
  }

  private setupModalListeners(): void {
    // Modal Compartir
    const modalShare = this.container.querySelector('#modal-share') as HTMLElement;
    const btnShare = this.container.querySelector('#btn-share-ofrenda');
    const btnShareClose = this.container.querySelector('#btn-modal-share-close');
    const btnShareOk = this.container.querySelector('#btn-modal-share-ok');
    const btnCopy = this.container.querySelector('#btn-copy-share-url');
    const inputShare = this.container.querySelector('#input-share-url') as HTMLInputElement;
    const toast = this.container.querySelector('#share-toast') as HTMLElement;

    btnShare?.addEventListener('click', () => {
      const url = this.editor.getShareUrl();
      if (inputShare) inputShare.value = url;
      modalShare.classList.add('open');
      if (toast) toast.style.display = 'none';
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

    [btnShareClose, btnShareOk].forEach((btn) => {
      btn?.addEventListener('click', () => modalShare.classList.remove('open'));
    });

    // Modal Título
    const modalTitle = this.container.querySelector('#modal-title') as HTMLElement;
    const btnEditTitle = this.container.querySelector('#btn-edit-title');
    const btnTitleClose = this.container.querySelector('#btn-modal-title-close');
    const btnTitleCancel = this.container.querySelector('#btn-modal-title-cancel');
    const btnTitleSave = this.container.querySelector('#btn-modal-title-save');
    const inputTitle = this.container.querySelector('#input-altar-title') as HTMLInputElement;
    const inputDed = this.container.querySelector('#input-altar-dedication') as HTMLTextAreaElement;

    btnEditTitle?.addEventListener('click', () => {
      const data = this.editor.getData();
      if (inputTitle) inputTitle.value = data.title;
      if (inputDed) inputDed.value = data.dedication;
      modalTitle.classList.add('open');
    });

    btnTitleSave?.addEventListener('click', () => {
      this.editor.updateMetadata(inputTitle.value.trim() || 'Mi Ofrenda 3D', inputDed.value.trim());
      modalTitle.classList.remove('open');
      this.editor.bridge.playSuccessSound();
    });

    [btnTitleClose, btnTitleCancel].forEach((btn) => {
      btn?.addEventListener('click', () => modalTitle.classList.remove('open'));
    });
  }

  private openPhotoModal(item: PlacedItemData): void {
    const modal = this.container.querySelector('#modal-photo') as HTMLElement;
    const inputName = this.container.querySelector('#input-person-name') as HTMLInputElement;
    const inputDed = this.container.querySelector('#input-dedication') as HTMLInputElement;
    const inputFile = this.container.querySelector('#input-photo-file') as HTMLInputElement;
    const dropZone = this.container.querySelector('#photo-drop-zone') as HTMLElement;
    const previewImg = this.container.querySelector('#photo-preview-img') as HTMLImageElement;
    const placeholder = this.container.querySelector('#photo-upload-placeholder') as HTMLElement;
    const btnClose = this.container.querySelector('#btn-modal-photo-close');
    const btnCancel = this.container.querySelector('#btn-modal-photo-cancel');
    const btnSave = this.container.querySelector('#btn-modal-photo-save');

    let currentPhotoUrl = item.customData?.photoUrl || '';
    if (inputName) inputName.value = item.customData?.personName || '';
    if (inputDed) inputDed.value = item.customData?.dedication || '';

    if (currentPhotoUrl) {
      previewImg.src = currentPhotoUrl;
      previewImg.classList.remove('photo-preview-hidden');
      placeholder.style.display = 'none';
    } else {
      previewImg.classList.add('photo-preview-hidden');
      placeholder.style.display = 'flex';
    }

    dropZone.onclick = () => inputFile.click();

    inputFile.onchange = () => {
      if (inputFile.files && inputFile.files[0]) {
        const file = inputFile.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          currentPhotoUrl = e.target?.result as string;
          previewImg.src = currentPhotoUrl;
          previewImg.classList.remove('photo-preview-hidden');
          placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    };

    const closeModal = () => modal.classList.remove('open');
    (btnClose as HTMLElement)?.addEventListener('click', closeModal);
    (btnCancel as HTMLElement)?.addEventListener('click', closeModal);

    (btnSave as HTMLElement)?.addEventListener('click', () => {
      this.editor.updateSelectedItemCustomData({
        photoUrl: currentPhotoUrl,
        personName: inputName.value.trim() || 'Ser Querido',
        dedication: inputDed.value.trim() || 'Siempre en nuestro recuerdo',
      });
      closeModal();
    });

    modal.classList.add('open');
  }

  private openSkullModal(item: PlacedItemData): void {
    const modal = this.container.querySelector('#modal-skull') as HTMLElement;
    const inputName = this.container.querySelector('#input-skull-name') as HTMLInputElement;
    const btnClose = this.container.querySelector('#btn-modal-skull-close');
    const btnCancel = this.container.querySelector('#btn-modal-skull-cancel');
    const btnSave = this.container.querySelector('#btn-modal-skull-save');

    if (inputName) inputName.value = item.customData?.personName || 'MÉXICO';

    const closeModal = () => modal.classList.remove('open');
    (btnClose as HTMLElement)?.addEventListener('click', closeModal);
    (btnCancel as HTMLElement)?.addEventListener('click', closeModal);

    (btnSave as HTMLElement)?.addEventListener('click', () => {
      this.editor.updateSelectedItemCustomData({
        personName: inputName.value.trim().toUpperCase() || 'MÉXICO',
      });
      closeModal();
    });

    modal.classList.add('open');
  }
}
