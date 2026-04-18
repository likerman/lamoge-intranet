# Intranet de LaMoGe

Sitio estatico y liviano para la intranet de LaMoGe. Esta version esta pensada para publicarse directamente con Apache, sin frameworks, sin dependencias y sin proceso de compilacion.

## Proposito

El proyecto funciona como pagina de inicio para servicios internos, documentacion y enlaces de administracion del laboratorio. El objetivo es mantener una base simple, legible y facil de actualizar.

## Estructura del proyecto

- `index.html`: estructura principal de la pagina y contenido visible.
- `styles.css`: estilos del sitio, diseno responsive y componentes visuales.
- `script.js`: JavaScript minimo. Actualmente solo completa el ano del pie.
- `assets/`: imagenes y recursos estaticos.
- `lamoge_logo.pdf`: archivo fuente del logo provisto para referencia.

## Como editar contenido

### Cambiar textos

Edite el contenido directamente en `index.html`.

Las secciones mas habituales para ajustar son:

- encabezado del sitio
- aviso de acceso restringido
- texto principal de la portada
- tarjetas de servicios
- bloque de recursos
- informacion de soporte y pie de pagina

### Cambiar enlaces

Cada tarjeta de servicio usa un enlace placeholder y un comentario `TODO`.

Busque en `index.html` lineas como estas:

```html
<!-- TODO: Reemplazar con la URL real de JupyterLab -->
<a class="card-button" href="#">Abrir servicio</a>
```

Reemplace `href="#"` por la URL o ruta real del servicio o la documentacion correspondiente.

### Cambiar imagenes o logo

Los recursos visuales estan en `assets/`.

- `assets/lamoge-logo.png`: logo usado actualmente en la cabecera
- `assets/lamoge-mark.svg`: marca geometrica auxiliar creada para el proyecto

Si se reemplaza el logo, conviene mantener el mismo nombre de archivo o actualizar la referencia en `index.html`.

## Despliegue en Apache

Este proyecto no requiere instalacion. Para publicarlo, copie los archivos al directorio que Apache usa para servir `/intranet`.

Ejemplo de contenido a copiar:

- `index.html`
- `styles.css`
- `script.js`
- `assets/`

Si el servidor ya publica la ruta `https://.../intranet`, basta con copiar o sincronizar estos archivos dentro del directorio servido por Apache para esa ruta.

En este entorno, el directorio de despliegue es:

```text
/home/jl/LaMoGe/var/www/html/intranet
```

Despues de copiar los archivos, recargue el sitio en el navegador para verificar que:

- cargue la pagina principal
- se vean las imagenes de `assets/`
- funcionen los enlaces actualizados

## Mantenimiento

- Mantenga el proyecto sin herramientas de build.
- Evite agregar dependencias si no son necesarias.
- Use comentarios `TODO` para enlaces o textos pendientes.
- Si se agregan nuevas secciones, mantenga la misma estructura simple: HTML semantico, CSS claro y JavaScript minimo.
