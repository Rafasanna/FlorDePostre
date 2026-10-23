# Catálogo actual y decisiones de compatibilidad

Auditoría del código estable `7557dd8`, antes de diseñar el esquema. No se consultaron servicios reales. Los nombres de pestañas son roles deducidos de sus variables y cabeceras; los títulos reales y los registros en vivo requieren un respaldo autorizado.

## Estructura e infraestructura

React 19 + Vite 7 + React Router 7; `src/main.jsx` monta `App.jsx`. `App` contiene carga, caché, composición de campañas, carrito y WhatsApp; `components/` contiene los configuradores y secciones; `pages/` las páginas secundarias; `data/` los respaldos estáticos; `utils/` imágenes y temporalidad. `public/images/` contiene marca, fotos, carruseles y recursos. `review/visual-refresh/` tiene capturas previas. No hay API, autenticación ni base de datos. `vercel.json` reescribe rutas a index.html. El repositorio ya versiona `.env.local`, node_modules y dist: no se eliminan en esta etapa. Los valores actuales de `.env.local` son URLs públicas CSV de Sheets; no se copian a documentación.

## Once datasets de Sheets

`src/services/googleSheets.js`: CSV con comillas escapadas y saltos de línea; cabeceras normalizadas sin acentos, espacios ni signos. Identifica filas de cabecera aunque haya filas introductorias. Números admiten formatos AR y separadores mixtos. ID explícito o slug del nombre (ese fallback puede colisionar; migración debe bloquearlo y requerir ID explícito). Variables observadas localmente:

| Variable | Rol | gid |
|---|---|---|
| VITE_SHEET_MENU_URL | Menú diario | 1490818731 |
| VITE_SHEET_SIN_TACC_URL | Sin TACC | 764242179 |
| VITE_SHEET_POSTRES_URL | Postres | 1201682680 |
| VITE_SHEET_POSTRES_TAMANOS_URL | Tamaños de postres | 1795036793 |
| VITE_SHEET_POSTRES_CONFIG_URL | Relación postre / tamaño / precio | 2090554344 |
| VITE_SHEET_CAMPANAS_URL | Campañas | 1798736270 |
| VITE_SHEET_ESPECIALES_URL | Productos especiales | 934049467 |
| VITE_SHEET_TORTAS_TAMANOS_URL | Tamaños de tortas | 663359618 |
| VITE_SHEET_TORTAS_COBERTURAS_URL | Coberturas | 965424166 |
| VITE_SHEET_TORTAS_RELLENOS_URL | Rellenos y adicionales de relleno | 2044657615 |
| VITE_SHEET_TORTAS_EXTRAS_URL | Decoración / extras | 1768737070 |

## Productos, categorías e imágenes

Menú: id, nombre, descripción, precio, categoría, imágenes, disponible, stock, reservado, destacado, sinTacc, esLimitado, etiqueta, precioAnterior, precioOferta, tipoOferta, fechaInicio y fechaFin. Sin TACC tiene precio fijo y categoría forzada; su normalizador desactiva destacados/promociones. Categorías actuales: lista fija en `dailyProducts.js` más las utilizadas por las filas; no hay subcategorías ni IDs de categoría. `data/products.js` es un catálogo histórico: no es la fuente activa de App y contiene precios distintos; no importarlo como autoridad.

`imagenes` (URLs separadas por coma) tiene prioridad sobre `Imagen`; primera foto = principal. `productImages.js` acepta varios alias de respaldo, elimina duplicados y aplica f_auto/q_auto:good/w/c_limit para entrega Cloudinary. No existe subida ni borrado Cloudinary. No se debe derivar public_id automáticamente de URLs con transformaciones: conservar URL y completar metadatos mediante verificación del asset.

## Disponibilidad, campañas y destacados

`seasonal.js`: visibilidad = disponible y rango de fechas inclusivo, usando zona local del navegador. Reservado bloquea pedido pero puede seguir visible. Stock es informativo: no hay inventario transaccional. Destacado selecciona productos visibles. precioOferta vigente sustituye precio; precioAnterior es referencia visual, no base del cálculo. Fechas vacías no restringen. Mantener semántica existente; no convertir las fechas en UTC al importar.

Campañas: activa/active + fecha; App elige la primera activa. ID = slug de Evento. Especiales se vinculan por igualdad exacta de Evento, activo y visibilidad; categoría Especial, edición limitada, precio fijo. Si no hay especiales de Sheets para una campaña, se conservan sus productos locales. Importar relación explícita sin cambiar prioridad/orden.

## Postres

Productos sin precio directo. Catálogo de tamaños independiente con porciones, disponible y precioEstimado informativo. Configuración une postreId + sizeId y tiene precio/disponible propios. `resolvePostresWithSizes` solo ofrece tamaños disponibles con precio finito > 0; no usa precioEstimado como sustituto. Sin tamaños válidos permite consulta, pero no compra. `PostresSection` y `PostreConfigurator` usan ID del postre en URL y tamaño en carrito. Conservar ambos IDs y su par único.

## Tortas: autoridad real de precios

`data/tortasData.js` contiene `cakePriceOptions`: matriz de 4 opciones × 3 tamaños (merengue con 2 rellenos, buttercream con 2 o 3, fondant con 2). El precio se busca por nombre de tamaño normalizado, no por precioBaseEstimado de Sheets. Coberturas de Sheets NO determinan estas cuatro opciones. `CakeConfigurator` / `CakeSummary` fusionan rellenos y extras locales con Sheets por nombre normalizado; un faltante de Sheets puede volver a aparecer desde el respaldo local.

Total = precio de matriz + adicionales de rellenos seleccionados + adicionales de relleno separados + decoración. Se exige exactamente 2 o 3 rellenos según opción. Nutella/Oreos/nueces/frutos rojos/merenguitos van a grupo adicional por coincidencia normalizada de ID/nombre. Algunos extras tienen overrides fijos en código aunque Sheets tenga otro precio. Pisos falsos = Math.round(base × 0.25), no precioExtra. Decoración puede requerir cotización final y se pide 5 días antes; no domingos. El código conserva compatibilidad histórica al recalcular carrito, incluso con objetos de relleno capturados en la selección.

Decisión de esta etapa: matriz, alias, cantidades y overrides se respaldan como reglas versionadas y se muestran en lectura; no permitir su edición genérica. Los productos postre sí editan precios por tamaño. Una futura edición comercial de tortas requiere resolver la autoridad de overrides, validar el carrito contra IDs actuales y adaptar configurador/resumen conjuntamente. No cambiar reglas públicas ahora.

## IDs, carrito y WhatsApp

`App.jsx`: menú y Sin TACC se deduplican por id (gana menú). Especiales pueden pisar un ID en el mapa de carrito: debe tratarse como conflicto al migrar, nunca renombrarlo silenciosamente. Carrito está en memoria; daily usa product.id, postre product.id + configuracion.sizeId, torta usa product.id = torta-personalizada y configuración completa. cartItemId identifica selección para cantidades. Antes de enviar WhatsApp se revalida precio y disponibilidad; WhatsApp recibe texto con subtotales y detalles, no existe pedido persistido ni ventas almacenadas. Nunca inventar métricas de ventas.

## Caché y migración

Sheets: hasta 8s por solicitud; fallback de localStorage/sessionStorage y datos locales, con avisos. Postres usa caché v2 y separa productos/tamaños/configuración. No hay TTL. En modo Sheets conservar ese flujo. Adaptador Neon debe excluir cachés Sheets y respaldos estáticos y revalidar al enfocar/intervalo; respuesta API no-store y escrituras atómicas con revisión evitan catálogo obsoleto y edición perdida. El cambio de fuente exige validación completa y autorización, nunca doble escritura.
