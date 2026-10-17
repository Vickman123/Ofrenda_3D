# 🕯️ Ofrendas 3D

> Aplicación web creativa e interactiva en 3D y WebXR para crear, decorar y compartir ofrendas mexicanas tradicionales del Día de Muertos.

https://vickman123.github.io/Ofrenda_3D/

Desarrollada sobre la arquitectura de **VXR Core** (Framework-XVR) por Vickman123.

---

## 🌸 Características

- **Altar de 3 Niveles:** Estructura arquitectónica con manteles, cenefas de papel picado ondeante y tapete de flores de cempasúchil.
- **Catálogo Tradicional Mexicano:**
  - 🕯️ Veladoras de vaso con flamas animadas y luces cálidas titilantes.
  - 🔥 Cirios tradicionales altos.
  - 🌼 Flores de cempasúchil de veinte pétalos y ramilletes en barro cocido.
  - 💀 Calaveritas de azúcar con nombre personalizable en la frente.
  - 🥐 Pan de muerto esponjoso con azúcar y forma de huesos.
  - 🖼️ Marcos barrocos dorados con subida de fotografías de seres queridos y dedicatorias.
  - 🏺 Copaleros de barro con brasas encendidas y humo aromático.
  - 🍲 Cazuelas de mole poblano con ajonjolí.
  - ☕ Jarritos de barro para café de olla o atole.
  - 🍊 Platos con frutas de temporada (mandarinas, caña).
- **Colocación Inteligente:** Al tocar un objeto del catálogo, se ubica automáticamente en el nivel correspondiente con distribución simétrica y armoniosa.
- **Edición Rápida y Táctil:**
  - Selección por clic o toque usando `app.raycastPointer` de VXR Core.
  - Controles contextuales: Girar 45°, Cambiar tamaño, Mover entre niveles (Nivel 1, 2, 3 o Suelo), Eliminar.
  - Sonido procedural con feedback acústico inmediato (`XRAudio.playClick()`, `playSuccess()`).
- **Modos de Escenario / Iluminación:**
  - 🌌 *Noche de Velas:* Ambiente íntimo iluminado por veladoras bajo un cielo nocturno estrellado.
  - 🌅 *Atardecer Dorado:* Resplandor cálido de sol poniente sobre las flores.
  - 🔮 *Altar Místico:* Resplandor mágico con niebla morada y acentos de rosa mexicano.
- **Compatibilidad WebXR Inmersiva:** Botón "ENTER VR" nativo provisto por VXR Core para ver la ofrenda a escala real en visores Meta Quest o navegadores WebXR.
- **Compartir mediante Enlace Único:** Serialización compacta en URL Hash para compartir cualquier ofrenda personalizada con amigos y familiares sin necesidad de registro previo.

---

## 🚀 Inicio Rápido

### Requisitos
- **Node.js**: v18 o superior
- **Navegador**: Chrome, Edge, Safari, Firefox o Meta Quest Browser

### Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```

La aplicación estará disponible en `http://localhost:5173`.
