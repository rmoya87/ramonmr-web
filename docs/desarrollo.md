# Desarrollo

1. Crear una rama para cada cambio.
2. Revisar el diff y comprobar que no lleva claves, datos de producción ni código de terceros no previsto.
3. Probar con WordPress, Ohio y las dependencias instaladas por separado. No usar otro portal como entorno de pruebas sin autorización.
4. Revisar el resultado visual y el funcionamiento afectado.
5. Aprobar el cambio antes de llevarlo a main.
6. Publicar en IONOS por separado, comprobar la web y conservar una vía de vuelta atrás.

## Base inicial

El tema hijo se importa sin corregir su código ni estilos. Quedan para cambios separados:

- Las etiquetas del formulario de contacto tienen poco contraste.
- `functions.php` desactiva globalmente JS y CSS de Contact Form 7.
- Hay personalizaciones de WooCommerce, incluida la finalización automática de pedidos. Revisarlas antes de cambiarlas o reutilizarlas.

El repositorio no es una copia completa restaurable del sitio. La base de datos y los medios se respaldan aparte y deben mantenerse privados.
