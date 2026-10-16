import * as THREE from 'three';
import { VXRBridge } from '../core/vxrBridge';
import { OfrendaAltar } from '../ofrenda/OfrendaAltar';
import { ItemFactory, type UpdatableItem } from '../ofrenda/ItemFactory';
import { PlacementEngine } from '../ofrenda/PlacementEngine';
import { OfrendaSerializer } from '../ofrenda/OfrendaSerializer';
import { OFRENDA_CATALOG } from '../ofrenda/Catalog';
import { OFRENDA_THEMES } from '../ofrenda/Themes';
import type { OfrendaData, OfrendaTheme, PlacedItemData } from '../types/ofrenda';

export type EditorEvent = 
  | 'selectionChanged' 
  | 'ofrendaUpdated' 
  | 'themeChanged' 
  | 'historyChanged';

export type EditorListener = (event: EditorEvent, payload?: any) => void;

/**
 * OfrendaEditor orquesta la creación, edición, selección y persistencia
 * de la ofrenda 3D sobre la infraestructura de VXR Core.
 */
export class OfrendaEditor {
  public readonly bridge: VXRBridge;
  public readonly altar: OfrendaAltar;
  public readonly placement: PlacementEngine;

  private data: OfrendaData;
  private itemMeshes: Map<string, THREE.Group> = new Map();
  private itemUpdatables: Map<string, UpdatableItem> = new Map();

  private selectedId: string | null = null;
  private selectionHalo: THREE.Mesh | null = null;
  private listeners: Set<EditorListener> = new Set();

  /** Snapshot inmutable del estado inicial de la ofrenda */
  private initialSnapshot: string = '';

  /** Pilas de historial para Deshacer (Undo) y Rehacer (Redo) */
  private undoStack: string[] = [];
  private redoStack: string[] = [];

  constructor(containerSelector: string = '#app-viewport') {
    this.bridge = new VXRBridge(containerSelector);
    this.altar = new OfrendaAltar();
    this.placement = new PlacementEngine(this.altar);
    this.data = OfrendaSerializer.createDefaultOfrenda();

    this.createSelectionHalo();
  }

  /**
   * Inicializa la ofrenda, cargando datos locales o desde la URL y guardando el snapshot inicial.
   */
  public init(): void {
    // 1. Agregar el altar de 3 niveles a la escena de VXR
    this.bridge.addToScene(this.altar.group);

    // 2. Determinar estado de la ofrenda
    const urlData = OfrendaSerializer.parseFromUrl();
    if (urlData) {
      this.data = urlData;
      console.log('[Ofrendas 3D] Ofrenda cargada desde enlace compartido.');
    } else {
      this.data = OfrendaSerializer.loadFromLocalStorage();
    }

    // 3. Crear snapshot inmutable antes de cualquier modificación
    this.initialSnapshot = JSON.stringify(this.data);

    // 4. Aplicar tema lumínico inicial
    this.applyTheme(this.data.theme || 'casa_mexicana', false);

    // 5. Instanciar todos los objetos de la ofrenda en 3D
    this.rebuildAllItems();

    // 6. Conectar loop de actualización de VXR Core para animaciones suaves
    this.bridge.onUpdate((delta, elapsed) => {
      this.itemUpdatables.forEach((updatable) => {
        try {
          updatable.update(delta, elapsed);
        } catch {}
      });

      // Animar suavemente el halo de selección sin z-fighting
      if (this.selectionHalo && this.selectionHalo.visible) {
        this.selectionHalo.rotation.z += delta * 1.5;
      }
    });

    // 7. Conectar raycast de selección con clics del puntero
    this.setupPointerInteractions();

    // 8. Iniciar el renderizado
    this.bridge.start();
    this.notify('ofrendaUpdated', this.data);
    this.notify('historyChanged');
  }

  /**
   * Crea el indicador visual circular de selección con depthWrite desactivado.
   */
  private createSelectionHalo(): void {
    const haloGeo = new THREE.RingGeometry(0.12, 0.16, 28);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false, // Evita z-fighting con los manteles y escalones
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.selectionHalo = new THREE.Mesh(haloGeo, haloMat);
    this.selectionHalo.rotation.x = -Math.PI / 2;
    this.selectionHalo.visible = false;
    this.selectionHalo.name = 'Ofrenda_SelectionHalo';
    this.bridge.addToScene(this.selectionHalo);
  }

  /**
   * Guarda el estado actual en el historial para Deshacer.
   */
  private recordState(): void {
    const snapshot = JSON.stringify(this.data);
    this.undoStack.push(snapshot);
    if (this.undoStack.length > 25) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.notify('historyChanged');
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Deshacer el último cambio.
   */
  public undo(): boolean {
    if (this.undoStack.length === 0) return false;
    const current = JSON.stringify(this.data);
    this.redoStack.push(current);

    const prev = this.undoStack.pop()!;
    this.data = JSON.parse(prev);
    this.selectItem(null);
    this.rebuildAllItems();
    this.applyTheme(this.data.theme, false);
    this.save();
    this.bridge.playClickSound();
    this.notify('ofrendaUpdated', this.data);
    this.notify('historyChanged');
    return true;
  }

  /**
   * Rehacer el cambio deshecho.
   */
  public redo(): boolean {
    if (this.redoStack.length === 0) return false;
    const current = JSON.stringify(this.data);
    this.undoStack.push(current);

    const next = this.redoStack.pop()!;
    this.data = JSON.parse(next);
    this.selectItem(null);
    this.rebuildAllItems();
    this.applyTheme(this.data.theme, false);
    this.save();
    this.bridge.playClickSound();
    this.notify('ofrendaUpdated', this.data);
    this.notify('historyChanged');
    return true;
  }

  /**
   * Restablece la ofrenda a su estado inicial inmutable.
   */
  public resetToInitial(): void {
    if (!this.initialSnapshot) return;
    this.data = JSON.parse(this.initialSnapshot);
    this.undoStack = [];
    this.redoStack = [];
    this.selectItem(null);
    this.rebuildAllItems();
    this.applyTheme(this.data.theme, false);
    this.bridge.resetCamera();
    this.save();
    this.bridge.playSuccessSound();
    this.notify('ofrendaUpdated', this.data);
    this.notify('historyChanged');
  }

  /**
   * Crea una nueva ofrenda limpia con las mesas vacías sin objetos.
   */
  public createNewOfrenda(title?: string, dedication?: string, theme?: OfrendaTheme): void {
    this.data = OfrendaSerializer.createDefaultOfrenda();
    if (title && title.trim()) this.data.title = title.trim();
    if (dedication && dedication.trim()) this.data.dedication = dedication.trim();
    if (theme) this.data.theme = theme;
    this.initialSnapshot = JSON.stringify(this.data);
    this.undoStack = [];
    this.redoStack = [];
    this.selectItem(null);
    this.rebuildAllItems();
    this.applyTheme(this.data.theme || 'casa_mexicana', false);
    this.bridge.resetCamera();
    this.save();
    this.bridge.playSuccessSound();
    this.notify('ofrendaUpdated', this.data);
    this.notify('historyChanged');
  }

  /**
   * Reconstruye todos los elementos 3D a partir del estado de datos actual.
   */
  private rebuildAllItems(): void {
    // Limpiar mallas previas
    this.itemMeshes.forEach((mesh) => this.bridge.removeFromScene(mesh));
    this.itemUpdatables.forEach((updatable) => updatable.dispose());
    this.itemMeshes.clear();
    this.itemUpdatables.clear();

    // Instanciar cada item
    for (const itemData of this.data.items) {
      const { group, updatable } = ItemFactory.createItem(itemData);
      this.bridge.addToScene(group);
      this.itemMeshes.set(itemData.instanceId, group);
      if (updatable) {
        this.itemUpdatables.set(itemData.instanceId, updatable);
      }
    }
  }

  /**
   * Configura la selección interactiva mediante el raycasting nativo de VXR.
   */
  private setupPointerInteractions(): void {
    const dom = this.bridge.app.renderer.domElement;

    let downTime = 0;
    let downPos = { x: 0, y: 0 };

    dom.addEventListener('pointerdown', (e) => {
      downTime = Date.now();
      downPos = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      const duration = Date.now() - downTime;
      if (dist > 8 || duration > 400) return;

      const hits = this.bridge.raycastPointer(e);

      let foundInstanceId: string | null = null;
      for (const hit of hits) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== this.bridge.app.scene.nativeScene) {
          if (cur.userData && cur.userData.isOfrendaItem && cur.userData.instanceId) {
            foundInstanceId = cur.userData.instanceId;
            break;
          }
          cur = cur.parent;
        }
        if (foundInstanceId) break;
      }

      this.selectItem(foundInstanceId);
    });
  }

  /**
   * Agrega un nuevo objeto del catálogo con colocación inteligente.
   */
  public addItem(templateId: string, customData?: any): PlacedItemData | null {
    const template = OFRENDA_CATALOG.find((t) => t.id === templateId);
    if (!template) return null;

    this.recordState();

    const { position, level } = this.placement.calculateAutoPosition(template, this.data.items);
    const instanceId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: PlacedItemData = {
      instanceId,
      templateId,
      position,
      rotationY: 0,
      scale: template.defaultScale || 1.0,
      level,
      customData: customData || (templateId === 'calaverita_azucar' ? { personName: 'MÉXICO' } : undefined),
    };

    const { group, updatable } = ItemFactory.createItem(newItem);
    this.bridge.addToScene(group);
    this.itemMeshes.set(instanceId, group);
    if (updatable) {
      this.itemUpdatables.set(instanceId, updatable);
    }

    this.data.items.push(newItem);
    this.selectItem(instanceId);

    this.bridge.playSuccessSound();
    this.save();
    this.notify('ofrendaUpdated', this.data);

    return newItem;
  }

  /**
   * Selecciona un elemento y posiciona el halo visual.
   */
  public selectItem(instanceId: string | null): void {
    this.selectedId = instanceId;

    if (instanceId && this.itemMeshes.has(instanceId)) {
      const mesh = this.itemMeshes.get(instanceId)!;
      if (this.selectionHalo) {
        this.selectionHalo.position.set(mesh.position.x, mesh.position.y + 0.005, mesh.position.z);
        this.selectionHalo.scale.setScalar(mesh.scale.x * 1.15);
        this.selectionHalo.visible = true;
      }
      this.bridge.playClickSound();
    } else {
      if (this.selectionHalo) {
        this.selectionHalo.visible = false;
      }
    }

    this.notify('selectionChanged', this.getSelectedItem());
  }

  /**
   * Rota el objeto seleccionado en grados (ej: +45° o -45°).
   */
  public rotateSelectedItem(deltaDegrees: number = 45): void {
    if (!this.selectedId) {
      if (this.data.items.length > 0) {
        this.selectItem(this.data.items[0].instanceId);
      }
      return;
    }
    const item = this.data.items.find((i) => i.instanceId === this.selectedId);
    const mesh = this.itemMeshes.get(this.selectedId);
    if (!item || !mesh) return;

    this.recordState();
    item.rotationY = (item.rotationY + (deltaDegrees * Math.PI) / 180) % (Math.PI * 2);
    mesh.rotation.y = item.rotationY;

    this.bridge.playClickSound();
    this.save();
    this.notify('selectionChanged', item);
  }

  /**
   * Escala el objeto seleccionado cíclicamente o por factor.
   */
  public scaleSelectedItem(deltaFactor: number = 1.15): void {
    if (!this.selectedId) {
      if (this.data.items.length > 0) {
        this.selectItem(this.data.items[0].instanceId);
      }
      return;
    }
    const item = this.data.items.find((i) => i.instanceId === this.selectedId);
    const mesh = this.itemMeshes.get(this.selectedId);
    if (!item || !mesh) return;

    this.recordState();
    let newScale = Number((item.scale * deltaFactor).toFixed(2));
    if (newScale > 1.6) newScale = 0.8;
    if (newScale < 0.7) newScale = 1.0;
    item.scale = newScale;

    mesh.scale.setScalar(item.scale);
    if (this.selectionHalo) {
      this.selectionHalo.scale.setScalar(item.scale * 1.15);
    }

    this.bridge.playClickSound();
    this.save();
    this.notify('selectionChanged', item);
  }

  /**
   * Mueve el objeto seleccionado al siguiente nivel o a uno específico.
   */
  public moveSelectedItemLevel(targetLevel?: number): void {
    if (!this.selectedId) {
      if (this.data.items.length > 0) {
        this.selectItem(this.data.items[0].instanceId);
      }
      return;
    }
    const item = this.data.items.find((i) => i.instanceId === this.selectedId);
    const mesh = this.itemMeshes.get(this.selectedId);
    if (!item || !mesh) return;

    this.recordState();
    const nextLevel = targetLevel !== undefined ? targetLevel : (item.level + 1) % 4;
    this.placement.moveItemToLevel(item, nextLevel);
    mesh.position.set(item.position[0], item.position[1], item.position[2]);

    if (this.selectionHalo) {
      this.selectionHalo.position.set(mesh.position.x, mesh.position.y + 0.005, mesh.position.z);
    }

    this.bridge.playClickSound();
    this.save();
    this.notify('selectionChanged', item);
  }

  /**
   * Actualiza datos personalizados (fotografía, nombre, dedicatoria).
   */
  public updateSelectedItemCustomData(customData: { photoUrl?: string; personName?: string; dedication?: string }): void {
    if (!this.selectedId) return;
    const item = this.data.items.find((i) => i.instanceId === this.selectedId);
    if (!item) return;

    this.recordState();
    item.customData = { ...item.customData, ...customData };

    const oldMesh = this.itemMeshes.get(this.selectedId);
    if (oldMesh) this.bridge.removeFromScene(oldMesh);
    if (this.itemUpdatables.has(this.selectedId)) {
      this.itemUpdatables.get(this.selectedId)!.dispose();
      this.itemUpdatables.delete(this.selectedId);
    }

    const { group, updatable } = ItemFactory.createItem(item);
    this.bridge.addToScene(group);
    this.itemMeshes.set(this.selectedId, group);
    if (updatable) {
      this.itemUpdatables.set(this.selectedId, updatable);
    }

    this.selectItem(this.selectedId);
    this.bridge.playSuccessSound();
    this.save();
    this.notify('ofrendaUpdated', this.data);
  }

  /**
   * Elimina el objeto seleccionado de la ofrenda.
   */
  public deleteSelectedItem(): void {
    if (!this.selectedId) return;
    this.recordState();
    const id = this.selectedId;

    const mesh = this.itemMeshes.get(id);
    if (mesh) {
      this.bridge.removeFromScene(mesh);
      this.itemMeshes.delete(id);
    }

    if (this.itemUpdatables.has(id)) {
      this.itemUpdatables.get(id)!.dispose();
      this.itemUpdatables.delete(id);
    }

    this.data.items = this.data.items.filter((i) => i.instanceId !== id);
    this.selectItem(null);

    this.bridge.playClickSound();
    this.save();
    this.notify('ofrendaUpdated', this.data);
  }

  /**
   * Aplica un tema de ambiente lumínico con opción de registrar en el historial.
   */
  public applyTheme(themeKey: string, recordHistory: boolean = true): void {
    const config = OFRENDA_THEMES[themeKey] || OFRENDA_THEMES.casa_mexicana;
    if (recordHistory && this.data.theme !== themeKey) {
      this.recordState();
    }
    this.data.theme = themeKey as OfrendaTheme;
    this.bridge.applyTheme(config);
    this.save();
    this.notify('themeChanged', config);
  }

  /**
   * Alterna entre Casa Mexicana y Panteón Nocturno.
   */
  public toggleTheme(): void {
    const nextTheme = (this.data.theme === 'panteon_nocturno' || this.data.theme === 'noche_velas')
      ? 'casa_mexicana'
      : 'panteon_nocturno';
    this.applyTheme(nextTheme, true);
  }

  /**
   * Actualiza el título y dedicatoria general de la ofrenda.
   */
  public updateMetadata(title: string, dedication: string): void {
    this.recordState();
    this.data.title = title;
    this.data.dedication = dedication;
    this.save();
    this.notify('ofrendaUpdated', this.data);
  }

  /**
   * Genera el enlace público de compartición.
   */
  public getShareUrl(): string {
    return OfrendaSerializer.generateShareUrl(this.data);
  }

  /**
   * Guarda en almacenamiento local.
   */
  public save(): void {
    OfrendaSerializer.saveToLocalStorage(this.data);
  }

  /**
   * Obtiene el elemento seleccionado actualmente.
   */
  public getSelectedItem(): PlacedItemData | null {
    if (!this.selectedId) return null;
    return this.data.items.find((i) => i.instanceId === this.selectedId) || null;
  }

  public getData(): OfrendaData {
    return this.data;
  }

  public addListener(fn: EditorListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(event: EditorEvent, payload?: any): void {
    this.listeners.forEach((fn) => {
      try {
        fn(event, payload);
      } catch (err) {
        console.error('[Ofrendas 3D] Error en listener de editor:', err);
      }
    });
  }

  public dispose(): void {
    this.bridge.dispose();
  }
}
