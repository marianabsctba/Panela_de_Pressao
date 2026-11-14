// Mexer em close: a câmera desce sobre a panela e o jogador faz círculos com o mouse.
// A velocidade do círculo vira a intensidade de mexer da simulação.
import * as THREE from 'three';
import { malhaFerramenta, interno } from './objetos.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

export class Mexer3D {
  constructor(renderer, camera, cena) {
    Object.assign(this, { renderer, camera, cena });
    this.ativo = false;
    this.ray = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.ferramentas = { fouet: malhaFerramenta('fouet'), colher: malhaFerramenta('colher') };
    for (const f of Object.values(this.ferramentas)) { f.visible = false; f.scale.setScalar(1.4); cena.add(f); }
    const c = renderer.domElement;
    c.addEventListener('pointermove', (e) => {
      if (!this.ativo) return;
      const r = c.getBoundingClientRect();
      this.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    });
  }

  // rec: recipiente; obj: malha dele; ferramenta: 'fouet' | 'colher' | null; aoMexer(forca, dt); aoSair()
  iniciar(rec, obj, ferramenta, forca, aoMexer, aoSair) {
    obj.updateMatrixWorld(true);
    // Medidas internas do recipiente (a caixa do objeto inclui peças invisíveis)
    const inn = interno(rec.rtipo);
    this.centro = obj.getWorldPosition(new THREE.Vector3());
    this.raio = Math.max(0.04, inn.r * 0.8);
    this.altura = this.centro.y + inn.fundo + Math.min(inn.alt, 0.06) * 0.6;
    this.centro.y = this.altura;
    this.plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.altura);
    this.rec = rec; this.forca = forca; this.aoMexer = aoMexer; this.aoSair = aoSair;
    this.ang = null; this.velAng = 0; this.voltas = 0;
    this.ferr = this.ferramentas[ferramenta] || this.ferramentas.colher;
    this.ferr.visible = true;
    this.camAntes = { pos: this.camera.position.clone(), quat: this.camera.quaternion.clone() };
    this.camAlvoPos = this.centro.clone().add(new THREE.Vector3(0, 0.36, 0.26));
    this.camAlvoQuat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(this.camAlvoPos, this.centro, new THREE.Vector3(0, 1, 0)));
    this.tCam = 0;
    this.mouse.set(0, 0);
    if (document.pointerLockElement) document.exitPointerLock();
    this.ativo = true;
  }

  sair() {
    if (!this.ativo) return;
    this.ativo = false;
    this.ferr.visible = false;
    this.camera.position.copy(this.camAntes.pos); this.camera.quaternion.copy(this.camAntes.quat);
    const f = this.aoSair; this.aoSair = null;
    f && f();
  }

  // Rotações por segundo (com sinal) do círculo atual
  get rps() { return Math.abs(this.velAng) / (Math.PI * 2); }

  update(dt) {
    if (!this.ativo) return false;
    this.tCam = Math.min(1, this.tCam + dt * 3);
    const k = 1 - Math.pow(1 - this.tCam, 3);
    this.camera.position.lerpVectors(this.camAntes.pos, this.camAlvoPos, k);
    this.camera.quaternion.slerpQuaternions(this.camAntes.quat, this.camAlvoQuat, k);
    this.ray.setFromCamera(this.mouse, this.camera);
    const p = new THREE.Vector3();
    if (this.ray.ray.intersectPlane(this.plano, p)) {
      // A ferramenta fica dentro da panela, mesmo que o mouse saia
      const d = new THREE.Vector2(p.x - this.centro.x, p.z - this.centro.z);
      if (d.length() > this.raio) d.setLength(this.raio);
      const a = Math.atan2(d.y, d.x);
      if (this.ang !== null && d.length() > this.raio * 0.25) {
        let da = a - this.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
        this.velAng += (da / Math.max(dt, 1e-3) - this.velAng) * Math.min(1, dt * 6);
        this.voltas += Math.abs(da) / (Math.PI * 2);
      } else this.velAng *= Math.exp(-dt * 3);
      this.ang = a;
      this.ferr.position.set(this.centro.x + d.x, this.altura + 0.02, this.centro.z + d.y);
      this.ferr.rotation.set(0, -a + Math.PI / 2, -1.25);
    }
    // Intensidade: até 2 voltas por segundo dá o máximo da ferramenta
    const forca = this.forca * clamp(this.rps / 2);
    if (forca > 0.02) this.aoMexer(forca, dt);
    return true;
  }
}
