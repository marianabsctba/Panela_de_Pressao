// Primeira pessoa: olhar com o mouse, andar com colisão e mirar com raio.
import * as THREE from 'three';
import { cor } from './materiais.js';
import { LIMITES, MERCADO } from './estudio.js';

export class Jogador {
  constructor(camera, canvas, colisores) {
    this.cam = camera; this.canvas = canvas; this.col = colisores;
    this.yaw = 0; this.pitch = 0;
    this.teclas = new Set();
    this.travado = false;
    this.ray = new THREE.Raycaster(); this.ray.far = 2.7;
    this.passo = 0;
    camera.rotation.order = 'YXZ';
    this.altura = 1.66;
    // Braço e mão visíveis
    this.mao = new THREE.Group();
    this.mao.position.set(0.27, -0.3, -0.56);
    camera.add(this.mao);
    const braco = new THREE.Group();
    braco.position.set(0.3, -0.36, -0.36);
    const pele = cor(0xe0b090, 0.55);
    const ante = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.26, 6, 14), pele);
    ante.rotation.x = Math.PI / 2 - 0.25; ante.position.set(-0.03, 0.05, -0.05);
    const punho = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.07, 16), cor(0x0b2470, 0.8));
    punho.rotation.x = Math.PI / 2 - 0.25; punho.position.set(-0.03, 0.01, 0.1);
    const palma = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), pele);
    palma.scale.set(0.8, 0.45, 1.15); palma.position.set(-0.05, 0.08, -0.2);
    braco.add(ante, punho, palma);
    camera.add(braco);
    this.braco = braco;
    this.maoBase = this.mao.position.clone();
    this.bracoBase = braco.position.clone();

    document.addEventListener('mousemove', (e) => {
      if (!this.travado) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch -= e.movementY * 0.0022;
      this.pitch = Math.max(-1.45, Math.min(1.35, this.pitch));
    });
    document.addEventListener('pointerlockchange', () => { this.travado = document.pointerLockElement === canvas; if (this.aoMudarTrava) this.aoMudarTrava(this.travado); });
    window.addEventListener('keydown', (e) => this.teclas.add(e.code));
    window.addEventListener('keyup', (e) => this.teclas.delete(e.code));
    window.addEventListener('blur', () => this.teclas.clear());
  }

  travar() { try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* sem suporte */ } }
  soltar() { if (document.pointerLockElement) document.exitPointerLock(); }

  posicionar(x, z, yaw = 0) { this.cam.position.set(x, this.altura, z); this.yaw = yaw; this.pitch = -0.25; }

  livre(x, z) {
    const r = 0.28;
    const noMercado = z > 15;
    const lx = noMercado ? MERCADO.x : LIMITES.x;
    if (x < lx[0] || x > lx[1] || z < LIMITES.z[0] || z > MERCADO.z[1]) return false;
    for (const c of this.col) {
      const px = Math.max(c.minX, Math.min(x, c.maxX)), pz = Math.max(c.minZ, Math.min(z, c.maxZ));
      if ((x - px) ** 2 + (z - pz) ** 2 < r * r) return false;
    }
    return true;
  }

  update(dt, mover) {
    const c = this.cam;
    c.rotation.y = this.yaw; c.rotation.x = this.pitch;
    let fx = 0, fz = 0;
    if (mover) {
      const T = this.teclas;
      if (T.has('KeyW') || T.has('ArrowUp')) fz -= 1;
      if (T.has('KeyS') || T.has('ArrowDown')) fz += 1;
      if (T.has('KeyA') || T.has('ArrowLeft')) fx -= 1;
      if (T.has('KeyD') || T.has('ArrowRight')) fx += 1;
    }
    const n = Math.hypot(fx, fz);
    let andando = false;
    if (n > 0) {
      const vel = (this.teclas.has('ShiftLeft') || this.teclas.has('ShiftRight')) ? 5.2 : 3.0;
      fx /= n; fz /= n;
      const s = Math.sin(this.yaw), co = Math.cos(this.yaw);
      const dx = (fx * co + fz * s) * vel * dt, dz = (-fx * s + fz * co) * vel * dt;
      const x = c.position.x, z = c.position.z;
      if (this.livre(x + dx, z + dz)) { c.position.x += dx; c.position.z += dz; }
      else if (this.livre(x + dx, z)) c.position.x += dx;
      else if (this.livre(x, z + dz)) c.position.z += dz;
      andando = true;
      this.passo += dt * vel * 2.2;
    }
    const bob = andando ? Math.sin(this.passo) * 0.022 : 0;
    c.position.y = this.altura + Math.abs(bob) * 0.6;
    this.mao.position.set(this.maoBase.x + Math.cos(this.passo * 0.5) * (andando ? 0.008 : 0), this.maoBase.y + bob * 0.5, this.maoBase.z);
    this.braco.position.set(this.bracoBase.x, this.bracoBase.y + bob * 0.5 + (this.mexendo ? Math.sin(performance.now() / 90) * 0.02 : 0), this.bracoBase.z + (this.mexendo ? Math.cos(performance.now() / 90) * 0.02 : 0));
  }

  mirar(alvos) {
    this.ray.setFromCamera(new THREE.Vector2(0, 0), this.cam);
    const hits = this.ray.intersectObjects(alvos, true);
    for (const h of hits) {
      let o = h.object, ent = null;
      while (o) { if (o.userData.ent) ent = o.userData.ent; o = o.parent; }
      if (ent) return { ent, ponto: h.point, dist: h.distance };
    }
    return null;
  }
}
