// Corte em close: a câmera desce sobre a tábua, guias aparecem no ingrediente e o jogador
// risca cada corte com o mouse. Inspirado nos gestos do Chama Azul.
import * as THREE from 'three';
import { M, cor } from './materiais.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const matGuia = new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
const matGuiaAtiva = new THREE.MeshBasicMaterial({ color: 0xd6f3ff, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide });

export function facaChef() {
  const g = new THREE.Group();
  const forma = new THREE.Shape();
  forma.moveTo(0, 0); forma.lineTo(0.2, 0.0); forma.quadraticCurveTo(0.235, 0.004, 0.25, 0.022);
  forma.quadraticCurveTo(0.19, 0.042, 0.0, 0.046); forma.lineTo(0, 0);
  const lamina = new THREE.ExtrudeGeometry(forma, { depth: 0.0018, bevelEnabled: true, bevelThickness: 0.0008, bevelSize: 0.0007, bevelSegments: 2, curveSegments: 24 });
  lamina.translate(0, -0.046, -0.0009);
  const aco = new THREE.MeshStandardMaterial({ color: 0xe8ecf0, metalness: 1, roughness: 0.16 });
  g.add(new THREE.Mesh(lamina, aco));
  const cabo = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.1, 6, 16), new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.35 }));
  cabo.rotation.z = Math.PI / 2; cabo.scale.set(1, 1, 0.7); cabo.position.set(-0.065, -0.028, 0);
  g.add(cabo);
  const bolster = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.012, 16), M('inoxPolido'));
  bolster.rotation.z = Math.PI / 2; bolster.position.set(-0.004, -0.028, 0); bolster.scale.set(1, 1, 0.75);
  g.add(bolster);
  for (const x of [-0.04, -0.075, -0.105]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.018, 10), M('ouro')); r.rotation.x = Math.PI / 2; r.position.set(x, -0.028, 0); g.add(r); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export class Corte3D {
  constructor(renderer, camera, cena, som) {
    Object.assign(this, { renderer, camera, cena, som });
    renderer.localClippingEnabled = true;
    this.ativo = false;
    this.ray = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.faca = facaChef(); this.faca.visible = false; cena.add(this.faca);
    const c = renderer.domElement;
    c.addEventListener('pointermove', (e) => this.mover(e));
    c.addEventListener('pointerdown', (e) => { if (this.ativo && e.button === 0) { this.mover(e); this.inicio = this.pontoPlano(); } });
    c.addEventListener('pointerup', (e) => { if (this.ativo && e.button === 0) { this.mover(e); this.soltar(); } });
  }

  mover(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }
  pontoPlano() {
    this.ray.setFromCamera(this.mouse, this.camera);
    const p = new THREE.Vector3();
    return this.ray.ray.intersectPlane(this.plano, p) ? p : null;
  }

  // obj: malha da comida no mundo; n: número de cortes; aoFim(q | null)
  iniciar(obj, n, titulo, dica, aoFim, aoAviso) {
    this.aoFim = aoFim; this.aviso = aoAviso; this.titulo = titulo; this.dicaTxt = dica;
    obj.updateMatrixWorld(true);
    const caixa = new THREE.Box3().setFromObject(obj);
    this.caixa = caixa;
    const tam = caixa.getSize(new THREE.Vector3()), centro = caixa.getCenter(new THREE.Vector3());
    this.L = tam.x; this.W = Math.max(tam.z, 0.03);
    this.topo = caixa.max.y;
    this.plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(this.topo + 0.004));
    // Posições dos cortes, da ponta direita para a esquerda
    const ini = caixa.min.x + this.L * 0.08, fim = caixa.max.x - this.L * 0.08;
    this.espaco = (fim - ini) / n;
    this.cortes = []; for (let i = 0; i < n; i++) this.cortes.push(fim - this.espaco * (i + 0.5));
    this.feitos = 0; this.notas = [];
    // Fatias: cópias da malha recortadas por planos, que se afastam a cada corte
    const limites = [-Infinity, ...[...this.cortes].sort((a, b) => a - b), Infinity];
    this.obj = obj; obj.visible = false;
    this.fatias = [];
    for (let s = 0; s < limites.length - 1; s++) {
      const guardado = []; obj.traverse((o) => { guardado.push([o, o.userData]); o.userData = {}; });
      const copia = obj.clone(true);
      for (const [o, u] of guardado) o.userData = u;
      const pA = new THREE.Plane(new THREE.Vector3(1, 0, 0), -limites[s]);
      const pB = new THREE.Plane(new THREE.Vector3(-1, 0, 0), limites[s + 1]);
      copia.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.clippingPlanes = [pA, pB].filter((p) => Number.isFinite(p.constant)); o.material.clipShadows = true; o.material.side = THREE.DoubleSide; } });
      obj.matrixWorld.decompose(copia.position, copia.quaternion, copia.scale);
      copia.visible = true;
      this.cena.add(copia);
      this.fatias.push({ obj: copia, a: limites[s], b: limites[s + 1], pA, pB, dx: 0 });
    }
    // Guias
    this.guias = this.cortes.map((x) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(this.W * 1.4, tam.y * 1.5 + 0.01), matGuia);
      m.rotation.y = Math.PI / 2; m.position.set(x, caixa.min.y + tam.y * 0.6, centro.z); m.renderOrder = 5;
      this.cena.add(m); return m;
    });
    this.marcar();
    // Câmera
    this.camAntes = { pos: this.camera.position.clone(), quat: this.camera.quaternion.clone() };
    this.camAlvoPos = centro.clone().add(new THREE.Vector3(0, 0.25, 0.13));
    this.camAlvoQuat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(this.camAlvoPos, centro, new THREE.Vector3(0, 1, 0)));
    this.tCam = 0;
    this.faca.visible = true; this.descida = 0;
    if (document.pointerLockElement) document.exitPointerLock();
    this.ativo = true;
  }

  marcar() { this.guias.forEach((g, i) => { g.material = i === this.feitos ? matGuiaAtiva : matGuia; g.visible = i >= this.feitos; }); }

  soltar() {
    const ini = this.inicio, fim = this.pontoPlano();
    this.inicio = null;
    if (!ini || !fim || this.feitos >= this.cortes.length) return;
    const dx = fim.x - ini.x, dz = fim.z - ini.z, comp = Math.hypot(dx, dz);
    if (comp < this.W * 0.5) return this.aviso('Risque o corte inteiro, de ponta a ponta.');
    if (Math.abs(dz) < Math.abs(dx) * 1.1) return this.aviso('Esse corte é atravessado: de cima pra baixo na tela.');
    const alvo = this.cortes[this.feitos];
    const xm = (ini.x + fim.x) / 2;
    const erro = Math.abs(xm - alvo) / this.espaco;
    const torto = Math.abs(dx) / Math.max(1e-4, Math.abs(dz));
    const nota = clamp(1 - erro * 1.3 - Math.max(0, torto - 0.15) * 0.8);
    this.notas.push(nota);
    // Separa as fatias à direita do corte
    for (const f of this.fatias) if (f.a >= alvo - 1e-6) { f.dx += 0.007; f.obj.position.x += 0.007; f.pA.constant = -(f.a + f.dx); f.pB.constant = f.b + f.dx; }
    this.feitos++;
    this.descida = 1;
    this.som.corte();
    this.aviso(nota >= 0.85 ? 'Corte preciso!' : nota >= 0.6 ? 'Bom corte.' : 'Saiu, mas irregular.');
    this.marcar();
    if (this.feitos >= this.cortes.length) setTimeout(() => this.encerrar(this.notas.reduce((a, b) => a + b, 0) / this.notas.length), 450);
  }

  encerrar(q) {
    if (!this.ativo) return;
    this.ativo = false;
    for (const f of this.fatias) this.cena.remove(f.obj);
    for (const g of this.guias) { this.cena.remove(g); g.geometry.dispose(); }
    this.fatias = []; this.guias = [];
    this.obj.visible = true;
    this.faca.visible = false;
    this.camera.position.copy(this.camAntes.pos); this.camera.quaternion.copy(this.camAntes.quat);
    const f = this.aoFim; this.aoFim = null;
    f && f(q);
  }

  update(dt) {
    if (!this.ativo) return false;
    this.tCam = Math.min(1, this.tCam + dt * 3);
    const k = 1 - Math.pow(1 - this.tCam, 3);
    this.camera.position.lerpVectors(this.camAntes.pos, this.camAlvoPos, k);
    this.camera.quaternion.slerpQuaternions(this.camAntes.quat, this.camAlvoQuat, k);
    const p = this.pontoPlano();
    if (p) {
      this.descida = Math.max(0, this.descida - dt * 4);
      const alto = this.inicio ? 0.01 : 0.035;
      this.faca.position.set(p.x, this.topo + 0.046 + alto - this.descida * 0.04, p.z + 0.02);
      this.faca.rotation.set(0, Math.PI / 2, this.inicio ? -0.12 : -0.3);
    }
    return true;
  }
}
