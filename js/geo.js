// Utilitários de geometria: formas arredondadas e junção de malhas estáticas.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const caixaR = (w, h, d, r = 0.02, s = 3) => new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2.01, h / 2.01, d / 2.01));

// Perfil girado: pts = [[raio, y], ...]
export const torno = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// Perfil suave por Catmull-Rom
export function tornoSuave(pts, seg = 48, div = 40) {
  const curva = new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y)));
  return new THREE.LatheGeometry(curva.getPoints(div), seg);
}

export function malha(geo, mat, x = 0, y = 0, z = 0, sombra = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = sombra; m.receiveShadow = true;
  return m;
}

function normalizar(g) {
  let n = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k);
  if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((n.attributes.position.count) * 2), 2));
  if (!n.attributes.normal) n.computeVertexNormals();
  n.morphAttributes = {};
  return n;
}

// Junta geometrias estáticas por material: menos chamadas de desenho.
export class Lote {
  constructor() { this.porMat = new Map(); }
  add(geo, mat, matriz) {
    const g = normalizar(geo);
    g.applyMatrix4(matriz);
    if (!this.porMat.has(mat)) this.porMat.set(mat, []);
    this.porMat.get(mat).push(g);
  }
  // Absorve um Object3D inteiro (já posicionado no mundo).
  absorver(obj) {
    obj.updateMatrixWorld(true);
    obj.traverse((o) => { if (o.isMesh) this.add(o.geometry, o.material, o.matrixWorld); });
  }
  construir(sombra = true) {
    const g = new THREE.Group();
    for (const [mat, lista] of this.porMat) {
      for (let i = 0; i < lista.length; i += 400) {
        const geo = mergeGeometries(lista.slice(i, i + 400), false);
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = sombra && !mat.transparent; m.receiveShadow = true;
        g.add(m);
      }
    }
    this.porMat.clear();
    return g;
  }
}

// Junta os filhos diretos de um grupo por material (para partes que se movem juntas).
export function fundirFilhos(grupo) {
  const porMat = new Map();
  const manter = [];
  for (const o of [...grupo.children]) {
    if (o.isMesh && !o.userData.manter) {
      o.updateMatrix();
      if (!porMat.has(o.material)) porMat.set(o.material, []);
      const g = normalizar(o.geometry); g.applyMatrix4(o.matrix);
      porMat.get(o.material).push(g);
      grupo.remove(o);
    } else manter.push(o);
  }
  for (const [mat, lista] of porMat) {
    const m = new THREE.Mesh(mergeGeometries(lista, false), mat);
    m.castShadow = true; m.receiveShadow = true;
    grupo.add(m);
  }
}
