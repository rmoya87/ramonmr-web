export function detectWebGL() {
    try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'));
    }
    catch {
        return false;
    }
}
export function showWebGLFailure(root, en) {
    const title = en ? 'Driving mode needs WebGL' : 'El modo conducción necesita WebGL';
    const body = en
        ? 'This browser or device cannot run the 3D driving view. Use the regular website to read all content.'
        : 'Este navegador o dispositivo no puede mostrar la vista 3D. Usa la web normal para leer todo el contenido.';
    const home = en ? 'Regular website' : 'Web normal';
    root.innerHTML = `<div class="webgl-fail" style="padding:32px;max-width:520px;margin:10vh auto;text-align:center;color:#e6e9e6">
    <h2 style="color:#f0e2c0">${title}</h2>
    <p>${body}</p>
    <p><a href="/" style="color:#d7e4d9">${home}</a></p>
  </div>`;
}
