# ramonmr-web

Código propio de [ramonmr.com](https://ramonmr.com). WordPress, base de datos, medios y plugins de terceros siguen en IONOS y no se incluyen aquí.

## Código actual

- `wp-content/themes/ramon-native/`: tema nativo en producción.
- `wp-content/plugins/ramon-site/`: plugin Ramon Site 1.1.2.
- `docs/source-manifest.json`: hashes de los 383 archivos capturados de producción el 13 de octubre de 2026.
- `wp-content/themes/ohio-child/`: código histórico conservado; no lo despliega Actions.

Los archivos de imagen del tema son parte del tema. La biblioteca de medios de WordPress (`uploads`) no está en el repositorio. Los README internos del tema pueden contener notas de pruebas anteriores; no son resultados de la verificación actual.

## Publicación

[Deploy own code to IONOS](https://github.com/rmoya87/ramonmr-web/actions/workflows/deploy-ionos.yml) publica únicamente el tema nativo y Ramon Site. Se ejecuta al subir cambios a sus carpetas en `main`. La ejecución manual arranca por defecto con `dry_run=true`, que compara sin escribir.

Antes de cambiar `main`, revisar el diff, probar PHP y el resultado visual. Un push de código propio a `main` puede cambiar producción. No usar otro portal como entorno de pruebas.

El workflow comprueba sintaxis PHP, fija la clave del servidor SFTP, verifica la carpeta del sitio y evita sobrescribir código que haya cambiado fuera del despliegue. Guarda una copia de los archivos modificados, verifica las subidas por lectura y sustituye cada archivo mediante rename. No es una transacción de todo el sitio: si falla, intenta restaurar los archivos ya sustituidos y el fallo debe revisarse.

No borra archivos antiguos de producción. No cambia WordPress, DB, plugins ajenos, `wp-config.php`, `.htaccess`, `1-ramon-image-alias.php`, el mapa privado de alias ni la biblioteca de medios. Comprueba que las tres rutas ES, EN y contacto respondan. La comprobación HTTP no sustituye la revisión visual ni prueba un envío de formulario.

## Copias y vuelta atrás

Las copias de código modificado quedan en `.ramon-deploy-backups/<timestamp>` en la cuenta SFTP limitada al sitio, con permisos privados. `deployed-manifest.json` registra la última versión comprobada. Si falla una publicación, el workflow intenta volver a los bytes anteriores. Para una reversión voluntaria, revertir el commit de código, revisar y publicar de nuevo. No lanzar dos despliegues a la vez; el workflow los serializa.

El repositorio no es una copia completa restaurable del sitio. La base de datos, medios, configuración y copias completas se gestionan fuera del repositorio. No subir contraseñas, SQL, cookies, backups completos ni datos privados.

El workflow de importación inicial solo expande el paquete y manifiesto específicos de aquella captura. El paquete ya se importó; no volver a ejecutarlo.
