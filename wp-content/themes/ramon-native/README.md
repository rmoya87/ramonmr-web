# Ramón Native: versión local de bloques

Paquete de trabajo para una instalación WordPress aislada. No activar ni importar en ramonmr.com o en una base de datos compartida. No se ha cambiado el sitio público.

## Qué contiene

- Tema de bloques: plantillas, cabecera, pie y patrones editables.
- Ramón Content: registro del portfolio bajo su tipo original ohio_portfolio.
- Contenido portable: páginas, artículos, proyectos, dos formularios, medios locales y comentarios públicos.
- Importador que remapea IDs, imágenes, enlaces, consultas y metadatos.
- Aspecto público de SEO y consentimiento. No incluye credenciales, analytics privado ni configuración privada de producción.

El tema solo no convierte los contenidos antiguos de Ohio o WPBakery. Es necesario importar el contenido convertido en una copia aislada.

## Edición

Navigation, Query Loop, imágenes, títulos, columnas, comentarios y formularios de búsqueda usan bloques core. La paleta, tipografías, tamaños y espaciados se editan en Estilos y en cada bloque. Se probaron cambios de color, tipografía, radio y padding guardados desde las APIs nativas del editor; los valores iniciales se restauraron.

Las pestañas del CV y los carruseles usan JavaScript propio sobre grupos de bloques editables. Sus controles, recortes, algunas geometrías e iconos no son controles core independientes. No se afirma que cada píxel de CSS tenga una opción en el editor.

## Dependencias

WordPress de bloques, PHP 8.1 o superior, Ramón Content, Contact Form 7, Rank Math SEO y Complianz. Se probó en WordPress 7.1.3 con PHP 8.3. No se ha certificado la versión mínima declarada del tema en WordPress 6.6.

## Importación segura

1. Crear una instalación nueva con base de datos propia, sin relación con otros portales.
2. Instalar los plugins necesarios y el tema. No retirar plugins del sitio público.
3. Copiar la carpeta del contenido portable junto con sus uploads.
4. Ejecutar `php import.php /ruta/wordpress` para ver el plan sin escritura.
5. Solo en el banco aislado, declarar `RAMON_NATIVE_ISOLATED_IMPORT` como true en wp-config.php.
6. Ejecutar `php import.php /ruta/wordpress --apply-isolated`.
7. Configurar el aspecto público de los plugins con `php plugin-config.php /ruta/wordpress`.
8. Seleccionar y activar el tema solo en esa copia. Configurar enlaces permanentes y revisar la navegación.

El importador no activa el tema. Sí crea o actualiza contenido, medios, taxonomías, comentarios y opciones de Lectura en la base de la copia. La segunda importación reutiliza sus IDs marcados. No ejecutar sobre una base compartida aunque se añada la constante.

## Límites antes de un despliegue

El correo real necesita configuración y una prueba autorizada. Las pruebas locales interceptaron los envíos y no enviaron mensajes. El consentimiento se probó con aceptar, rechazar y cambiar estadísticas, pero los servicios reales, cookies y fundamentos legales necesitan una revisión del sitio de destino. No es una auditoría legal.

Las etiquetas blancas de Contacto se conservan por decisión del propietario. Dos GIF externos de Fireart ya están rotos en el artículo público y se conservan sus referencias, sin inventar sustitutos.

Las imágenes proceden del sitio público y conservan sus derechos originales. El paquete no concede licencias nuevas.

Antes de usarlo en producción: copia independiente, revisión visual, revisión de SEO y redirects, correo, cookies, respaldo y restauración probada. El despliegue requiere aprobación aparte.

## Verificación de esta revisión

64 documentos públicos convertidos: 16 páginas, 33 artículos y 15 proyectos. Se preservan además dos formularios, 239 adjuntos de la biblioteca con sus derivados y 39 comentarios públicos. El banco receptor trae un comentario de ejemplo de WordPress que no pertenece al export.

128 revisiones de rutas a 1440 y 390 píxeles no mostraron desbordamiento horizontal. Las galerías del portfolio conservan sus variantes de una, dos, tres y seis columnas, y las imágenes originales. La revisión visual no constituye una identidad matemática de todos los píxeles entre motores y versiones.

La serialización del paquete y las plantillas pasó el parser del editor sin bloques inválidos. Contacto validó campos y aceptación; el formulario de comentario guardó un comentario pendiente de moderación que se retiró después de la prueba. Navigation, pestañas, carruseles, acordeones, búsqueda, listas y paginación se probaron en la copia receptora.

SEO: títulos, descripciones, campos sociales, canonicals y grafos públicos comprobados con remapeo al destino. Los proyectos sin grafo publicado en el origen no reciben uno inventado. Sitemap verificado con respuestas XML del destino.

Accesibilidad: no es una certificación AA. Se conservan decisiones visuales del original y jerarquías de contenido heredadas. El chequeo de muestra mantiene avisos de orden de títulos en artículos y un aviso de landmark del enlace de salto de WordPress. Las etiquetas blancas de Contacto son una excepción conocida y aprobada para esta revisión.

Los formularios del paquete llevan `skip_mail: on` y direcciones example.invalid. No envían correo al instalarlos. Para un despliegue autorizado hay que configurar remitente, destinatario y mensajes, comprobar la entregabilidad y retirar ese bloqueo de forma deliberada. Los mensajes del envío local son los del plugin de pruebas, no una prueba de recepción real ni de una suscripción conectada.
