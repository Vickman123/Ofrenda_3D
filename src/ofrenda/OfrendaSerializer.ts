import type { OfrendaData, PlacedItemData } from '../types/ofrenda';

const STORAGE_KEY = 'ofrendas3d_saved_state_v1';

export class OfrendaSerializer {
  /**
   * Genera el estado inicial tradicional para un usuario nuevo.
   */
  public static createDefaultOfrenda(): OfrendaData {
    const now = Date.now();
    const items: PlacedItemData[] = [
      // Nivel 3 (Superior): Marco de homenaje central
      {
        instanceId: 'item-initial-frame',
        templateId: 'marco_foto',
        position: [0, 1.08, -0.65],
        rotationY: 0,
        scale: 1.15,
        level: 3,
        customData: {
          personName: 'Nuestros Ancestros',
          dedication: 'Con amor y eterno recuerdo',
        },
      },
      // Nivel 3: Flanqueado por dos veladoras
      {
        instanceId: 'item-initial-candle-top-l',
        templateId: 'veladora_vaso',
        position: [-0.35, 1.08, -0.65],
        rotationY: 0,
        scale: 1.0,
        level: 3,
      },
      {
        instanceId: 'item-initial-candle-top-r',
        templateId: 'veladora_vaso',
        position: [0.35, 1.08, -0.65],
        rotationY: 0,
        scale: 1.0,
        level: 3,
      },

      // Nivel 2 (Medio): Calaverita de azúcar, Ramillete de Cempasúchil y Pan de Muerto
      {
        instanceId: 'item-initial-skull',
        templateId: 'calaverita_azucar',
        position: [0, 0.72, -0.25],
        rotationY: 0,
        scale: 1.05,
        level: 2,
        customData: {
          personName: 'MÉXICO',
        },
      },
      {
        instanceId: 'item-initial-bread',
        templateId: 'pan_de_muerto',
        position: [-0.42, 0.72, -0.25],
        rotationY: 0.3,
        scale: 1.0,
        level: 2,
      },
      {
        instanceId: 'item-initial-bouquet-r',
        templateId: 'ramo_cempasuchil',
        position: [0.42, 0.72, -0.25],
        rotationY: -0.2,
        scale: 1.05,
        level: 2,
      },

      // Nivel 1 (Inferior): Copalero con humo, flores de cempasúchil y cazuela de mole
      {
        instanceId: 'item-initial-copal',
        templateId: 'copalero_incienso',
        position: [0, 0.36, 0.2],
        rotationY: 0,
        scale: 1.0,
        level: 1,
      },
      {
        instanceId: 'item-initial-mole',
        templateId: 'cazuela_mole',
        position: [-0.48, 0.36, 0.2],
        rotationY: 0,
        scale: 1.0,
        level: 1,
      },
      {
        instanceId: 'item-initial-jarrito',
        templateId: 'jarrito_barro',
        position: [0.48, 0.36, 0.2],
        rotationY: 0.4,
        scale: 1.0,
        level: 1,
      },

      // Nivel 0 (Suelo): Flores de cempasúchil y cirios altos
      {
        instanceId: 'item-initial-flower-ground-l',
        templateId: 'flor_cempasuchil',
        position: [-0.65, 0.005, 0.65],
        rotationY: 0.5,
        scale: 1.1,
        level: 0,
      },
      {
        instanceId: 'item-initial-flower-ground-r',
        templateId: 'flor_cempasuchil',
        position: [0.65, 0.005, 0.65],
        rotationY: -0.4,
        scale: 1.1,
        level: 0,
      },
      {
        instanceId: 'item-initial-cirio-l',
        templateId: 'cirio_tradicional',
        position: [-0.95, 0.005, 0.5],
        rotationY: 0,
        scale: 1.1,
        level: 0,
      },
      {
        instanceId: 'item-initial-cirio-r',
        templateId: 'cirio_tradicional',
        position: [0.95, 0.005, 0.5],
        rotationY: 0,
        scale: 1.1,
        level: 0,
      },
    ];

    return {
      version: '1.0.0',
      id: `ofrenda-${Math.random().toString(36).substring(2, 9)}`,
      title: 'Ofrenda a la Memoria',
      dedication: 'A quienes iluminaron nuestro camino y viven en nuestro recuerdo.',
      theme: 'noche_velas',
      items,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Guarda los datos en el almacenamiento local del navegador.
   */
  public static saveToLocalStorage(data: OfrendaData): void {
    try {
      data.updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[Ofrendas 3D] Error al guardar en localStorage:', err);
    }
  }

  /**
   * Carga los datos desde localStorage o devuelve la ofrenda inicial si no existe.
   */
  public static loadFromLocalStorage(): OfrendaData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('[Ofrendas 3D] Error al leer de localStorage:', err);
    }
    return this.createDefaultOfrenda();
  }

  /**
   * Exporta la ofrenda como una URL compartible con payload en Base64.
   */
  public static generateShareUrl(data: OfrendaData): string {
    const compactPayload = {
      t: data.title,
      d: data.dedication,
      th: data.theme,
      it: data.items.map((it) => ({
        id: it.instanceId,
        tid: it.templateId,
        p: it.position,
        r: it.rotationY,
        s: it.scale,
        lvl: it.level,
        cd: it.customData,
      })),
    };

    const json = JSON.stringify(compactPayload);
    // Codificación segura para URL
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const url = new URL(window.location.href);
    url.hash = `share=${b64}`;
    return url.toString();
  }

  /**
   * Intenta importar una ofrenda compartida desde el hash de la URL actual.
   */
  public static parseFromUrl(): OfrendaData | null {
    try {
      const hash = window.location.hash;
      if (!hash.startsWith('#share=')) return null;

      const b64 = hash.replace('#share=', '');
      const json = decodeURIComponent(escape(atob(b64)));
      const raw = JSON.parse(json);

      const items: PlacedItemData[] = raw.it.map((item: any) => ({
        instanceId: item.id,
        templateId: item.tid,
        position: item.p,
        rotationY: item.r,
        scale: item.s,
        level: item.lvl,
        customData: item.cd,
      }));

      return {
        version: '1.0.0',
        id: `shared-${Date.now()}`,
        title: raw.t || 'Ofrenda Compartida',
        dedication: raw.d || '',
        theme: raw.th || 'noche_velas',
        items,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } catch (err) {
      console.warn('[Ofrendas 3D] Error al parsear URL compartida:', err);
      return null;
    }
  }
}
