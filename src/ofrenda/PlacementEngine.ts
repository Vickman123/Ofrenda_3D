import * as THREE from 'three';
import { OfrendaAltar } from './OfrendaAltar';
import type { ItemTemplate, PlacedItemData } from '../types/ofrenda';

/**
 * PlacementEngine calcula posiciones inteligentes, simétricas y armoniosas
 * para cada elemento añadido a la ofrenda tradicional.
 */
export class PlacementEngine {
  private altar: OfrendaAltar;

  constructor(altar: OfrendaAltar) {
    this.altar = altar;
  }

  /**
   * Determina la mejor posición automática para un nuevo elemento.
   */
  public calculateAutoPosition(
    template: ItemTemplate,
    existingItems: PlacedItemData[]
  ): { position: [number, number, number]; level: number } {
    let targetLevel = template.recommendedLevel || 1;

    // Si el nivel superior (3) ya tiene más de 3 objetos, distribuir hacia niveles inferiores
    const itemsOnTarget = existingItems.filter((it) => it.level === targetLevel);
    if (targetLevel === 3 && itemsOnTarget.length >= 3 && template.category !== 'marcos') {
      targetLevel = 2;
    }

    const itemsOnChosenLevel = existingItems.filter((it) => it.level === targetLevel);
    const count = itemsOnChosenLevel.length;

    const y = this.altar.getLevelY(targetLevel);
    const z = this.altar.getLevelZ(targetLevel);

    // Calcular distribución simétrica a lo largo del eje X (ancho del escalón)
    const levelInfo = this.altar.levels[targetLevel];
    const usableWidth = levelInfo.width * 0.78;

    let x = 0;
    if (template.category === 'marcos' && count === 0) {
      x = 0; // El primer retrato al centro
    } else {
      // Patrón alternado simétrico: centro, derecha (+), izquierda (-), etc.
      const stepIndex = count + 1;
      const isRight = stepIndex % 2 === 1;
      const slotNum = Math.ceil(stepIndex / 2);
      const spacing = Math.min(0.24, usableWidth / Math.max(4, stepIndex + 1));

      x = (isRight ? 1 : -1) * (slotNum * spacing);
      // Mantener dentro de los límites del escalón
      x = Math.max(-usableWidth / 2, Math.min(usableWidth / 2, x));
    }

    // Pequeño desplazamiento natural en Z para dar profundidad
    const zJitter = ((count % 3) - 1) * 0.04;

    return {
      position: [Number(x.toFixed(3)), Number(y.toFixed(3)), Number((z + zJitter).toFixed(3))],
      level: targetLevel,
    };
  }

  /**
   * Recalcula la posición Y y Z de un objeto cuando el usuario lo cambia de nivel.
   */
  public moveItemToLevel(item: PlacedItemData, newLevel: number): void {
    const clampedLevel = Math.max(0, Math.min(3, newLevel));
    item.level = clampedLevel;
    item.position[1] = this.altar.getLevelY(clampedLevel);
    item.position[2] = this.altar.getLevelZ(clampedLevel);

    // Limitar X al ancho del nuevo escalón
    const levelInfo = this.altar.levels[clampedLevel];
    const halfW = (levelInfo.width * 0.8) / 2;
    item.position[0] = Math.max(-halfW, Math.min(halfW, item.position[0]));
  }
}
