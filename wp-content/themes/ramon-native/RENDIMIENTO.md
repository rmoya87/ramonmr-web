# Rendimiento: medición local

11 de octubre de 2026. Producción no se ha cambiado.

Chrome, 390 x 900, tres contextos nuevos por ruta. Sin limitación de CPU ni red. PHP 8.3 y WordPress 7.1.3 en el mismo equipo. Observación 2,5 segundos después de load, sin scroll. Son resultados de laboratorio, no CrUX ni prueba de Core Web Vitals de producción.

| Mediana | Portada | CV |
|---|---:|---:|
| Peticiones | 36 | 20 |
| LCP observado (ms) | 596 | 624 |
| CLS observado | 0 | 0 |
| Exceso de tareas largas (ms) | 0 | 0 |
| Recursos decodificados (bytes) | 520.685 | 330.501 |

Las cifras incluyen los plugins presentes. Los bytes decodificados no equivalen a transferencia comprimida. No se afirma una mejora de tiempos frente al sitio público: hosting, versiones y carga no son iguales. Las tandas antiguas usaban otra versión de PHP y otros componentes, por lo que no son una comparación válida con esta versión.

Se usan WebP locales, imágenes responsive de WordPress, carga diferida, CSS minificado, JavaScript selectivo y defer. No hay constructor visual ni fuentes remotas de Google. La animación de portada conserva su movimiento. Navigation, Query, Comments y las opciones de aspecto son nativas.

Dos GIF remotos de Fireart ya fallan en el artículo original. No se sustituyeron por otra imagen ni se inventó su contenido.
