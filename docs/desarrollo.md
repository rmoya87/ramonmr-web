# Desarrollo y publicación

1. Crear una rama para cada cambio.
2. Revisar el diff. No incluir claves, datos privados, SQL, uploads, backups completos ni código comercial.
3. Probar WordPress y las dependencias por separado, con datos de prueba. No usar otro portal como entorno de pruebas sin autorización.
4. Comprobar sintaxis PHP, comportamiento afectado y resultado visual.
5. Revisar y aprobar antes de llevar el cambio a `main`. Cambios en `wp-content/themes/ramon-native/` o `wp-content/plugins/ramon-site/` activan publicación a producción por Actions.
6. Para comparar sin publicar, ejecutar `Deploy own code to IONOS` manualmente con `dry_run=true`.
7. Revisar el resultado de Actions y la web tras publicar. El HTTP 200 no prueba el diseño ni un envío de formulario.

## Código histórico

`wp-content/themes/ohio-child/` conserva la base anterior y queda fuera del despliegue automático. Sus notas sobre Contact Form 7, WooCommerce y contraste describen ese código histórico, no el tema nativo actual. No reutilizarlo sin revisar sus efectos.

## Protección de producción

El despliegue solo cubre el tema nativo y Ramon Site. No borra archivos antiguos ni modifica DB, WordPress, configuración de raíz, redirects, handler y mapa de alias, medios o plugins de terceros. Si encuentra código de producción distinto de su baseline y del cambio propuesto, para para que se revise el drift.

Las copias de archivos modificados se guardan de forma privada en `.ramon-deploy-backups/<timestamp>`. Ante un fallo intenta restaurar los archivos ya sustituidos. Una prueba simulada no equivale a haber demostrado rollback de un cambio real en producción. Para una reversión voluntaria, revertir el commit de código, revisar y publicar de nuevo. Revisar cualquier fallo del rollback antes de continuar.

El repositorio no es una copia completa restaurable del sitio. Base de datos, medios y configuración requieren sus propias copias privadas. Las limpiezas se revisan y autorizan aparte; no forman parte de publicar código.
