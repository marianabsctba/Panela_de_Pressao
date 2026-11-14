// Materiais PBR e texturas geradas em canvas (sem arquivos externos).
import * as THREE from 'three';

const cache = new Map();
let anisotropia = 4;
export function definirAnisotropia(a) { anisotropia = a; }

function canvas(w, h, desenhar) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  desenhar(c.getContext('2d'), w, h);
  return c;
}
function textura(c, repetir = [1, 1], cor = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repetir[0], repetir[1]);
  t.anisotropy = anisotropia;
  if (cor) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function ruido(ctx, w, h, a, tam = 1) {
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * a;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function inoxRugosidade() {
  return canvas(512, 512, (g, w, h) => {
    g.fillStyle = '#5a5a5a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2400; i++) {
      const y = Math.random() * h, v = 70 + Math.random() * 60;
      g.strokeStyle = `rgba(${v},${v},${v},0.35)`;
      g.lineWidth = Math.random() * 1.2;
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (Math.random() - 0.5) * 3); g.stroke();
    }
  });
}

export function M(nome) {
  if (cache.has(nome)) return cache.get(nome);
  let m;
  switch (nome) {
    case 'inox': {
      const r = textura(inoxRugosidade(), [2, 2], false);
      m = new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 1, roughness: 0.32, roughnessMap: r, envMapIntensity: 1.1 });
      break;
    }
    case 'inoxPolido': m = new THREE.MeshStandardMaterial({ color: 0xd2d6da, metalness: 1, roughness: 0.18 }); break;
    case 'inoxTampo': { const r = textura(inoxRugosidade(), [3, 1], false); m = new THREE.MeshStandardMaterial({ color: 0xb8bec4, metalness: 1, roughness: 0.42, roughnessMap: r, envMapIntensity: 0.8 }); break; }
    case 'inoxEscuro': m = new THREE.MeshStandardMaterial({ color: 0x6a7078, metalness: 1, roughness: 0.4 }); break;
    case 'ferro': m = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, metalness: 0.7, roughness: 0.55 }); break;
    case 'acoCarbono': m = new THREE.MeshStandardMaterial({ color: 0x2a2624, metalness: 0.85, roughness: 0.45 }); break;
    case 'vidroPreto': m = new THREE.MeshStandardMaterial({ color: 0x050608, metalness: 0.2, roughness: 0.06 }); break;
    case 'ouro': m = new THREE.MeshStandardMaterial({ color: 0xe3b33c, metalness: 1, roughness: 0.22, envMapIntensity: 1.3 }); break;
    case 'ouroFosco': m = new THREE.MeshStandardMaterial({ color: 0xc9992e, metalness: 1, roughness: 0.42 }); break;
    case 'ouroBrilho': m = new THREE.MeshStandardMaterial({ color: 0xffd36a, metalness: 1, roughness: 0.15, emissive: 0x6a4a08, emissiveIntensity: 0.6 }); break;
    case 'azulRoyal': m = new THREE.MeshStandardMaterial({ color: 0x0d2a7a, roughness: 0.55, metalness: 0.05 }); break;
    case 'azulProfundo': m = new THREE.MeshStandardMaterial({ color: 0x061a4a, roughness: 0.7 }); break;
    case 'azulLaca': m = new THREE.MeshStandardMaterial({ color: 0x0b2f8f, roughness: 0.2, metalness: 0.2 }); break;
    case 'azulNeon': m = new THREE.MeshStandardMaterial({ color: 0x2a6aff, emissive: 0x1a4aff, emissiveIntensity: 2.2 }); break;
    case 'ouroNeon': m = new THREE.MeshStandardMaterial({ color: 0xffd36a, emissive: 0xffb420, emissiveIntensity: 2.4 }); break;
    case 'parede': {
      const c = canvas(512, 512, (g, w, h) => {
        const grad = g.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a2470'); grad.addColorStop(1, '#061646');
        g.fillStyle = grad; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(227,179,60,0.18)'; g.lineWidth = 2;
        for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
        ruido(g, w, h, 10);
      });
      m = new THREE.MeshStandardMaterial({ map: textura(c, [8, 2]), roughness: 0.75 });
      break;
    }
    case 'piso': {
      // Ladrilho hidráulico creme, azul e dourado (4 x 4 ladrilhos por textura)
      const c = canvas(1024, 1024, (g, w, h) => {
        const T = 256;
        for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 4; tx++) {
          const x0 = tx * T, y0 = ty * T, cx = x0 + T / 2, cy = y0 + T / 2;
          const v = 214 + Math.random() * 10;
          const creme = 'rgb(' + v + ',' + (v - 8) + ',' + (v - 26) + ')'; g.fillStyle = creme; g.fillRect(x0, y0, T, T);
          g.fillStyle = '#16306e';
          for (const [qx, qy] of [[x0, y0], [x0 + T, y0], [x0, y0 + T], [x0 + T, y0 + T]]) { g.beginPath(); g.arc(qx, qy, T * 0.3, 0, Math.PI * 2); g.fill(); }
          g.fillStyle = creme;
          for (const [qx, qy] of [[x0, y0], [x0 + T, y0], [x0, y0 + T], [x0 + T, y0 + T]]) { g.beginPath(); g.arc(qx, qy, T * 0.2, 0, Math.PI * 2); g.fill(); }
          g.strokeStyle = '#16306e'; g.lineWidth = 10;
          g.beginPath(); g.arc(cx, cy, T * 0.22, 0, Math.PI * 2); g.stroke();
          g.fillStyle = '#c9992e';
          g.beginPath(); g.moveTo(cx, cy - T * 0.12); g.lineTo(cx + T * 0.12, cy); g.lineTo(cx, cy + T * 0.12); g.lineTo(cx - T * 0.12, cy); g.closePath(); g.fill();
          g.fillStyle = '#16306e'; g.beginPath(); g.arc(cx, cy, T * 0.04, 0, Math.PI * 2); g.fill();
          g.strokeStyle = 'rgba(40,40,60,0.35)'; g.lineWidth = 3; g.strokeRect(x0 + 1.5, y0 + 1.5, T - 3, T - 3);
        }
        ruido(g, w, h, 12);
      });
      const rug = canvas(256, 256, (g, w, h) => { g.fillStyle = '#b4b4b4'; g.fillRect(0, 0, w, h); ruido(g, w, h, 30); g.fillStyle = '#e6e6e6'; for (let i = 0; i <= 4; i++) { g.fillRect(i * 64 - 1, 0, 2, h); g.fillRect(0, i * 64 - 1, w, 2); } });
      m = new THREE.MeshStandardMaterial({ map: textura(c, [11, 8]), roughnessMap: textura(rug, [11, 8], false), roughness: 0.7, metalness: 0 });
      break;
    }
    case 'teto': m = new THREE.MeshStandardMaterial({ color: 0x050a1c, roughness: 0.95 }); break;
    case 'marmore': {
      const c = canvas(512, 512, (g, w, h) => {
        g.fillStyle = '#f2f0ec'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 26; i++) {
          g.strokeStyle = `rgba(${150 + Math.random() * 40},${140 + Math.random() * 40},${120},${0.15 + Math.random() * 0.3})`;
          g.lineWidth = Math.random() * 2.5;
          g.beginPath();
          let x = Math.random() * w, y = 0;
          g.moveTo(x, y);
          while (y < h) { x += (Math.random() - 0.5) * 50; y += 20 + Math.random() * 30; g.lineTo(x, y); }
          g.stroke();
        }
        g.strokeStyle = 'rgba(200,160,60,0.5)'; g.lineWidth = 1.2;
        for (let i = 0; i < 4; i++) { g.beginPath(); let x = Math.random() * w, y = 0; g.moveTo(x, y); while (y < h) { x += (Math.random() - 0.5) * 70; y += 40; g.lineTo(x, y); } g.stroke(); }
      });
      m = new THREE.MeshStandardMaterial({ map: textura(c, [1, 1]), roughness: 0.12, metalness: 0 });
      break;
    }
    case 'madeira': {
      const c = canvas(256, 512, (g, w, h) => {
        g.fillStyle = '#a8743e'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 90; i++) {
          g.strokeStyle = `rgba(${90 + Math.random() * 40},${50 + Math.random() * 20},20,${0.2 + Math.random() * 0.3})`;
          g.lineWidth = 1 + Math.random() * 3;
          const x = Math.random() * w;
          g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 10, h * 0.3, x - 10, h * 0.6, x + 5, h); g.stroke();
        }
        ruido(g, w, h, 14);
      });
      m = new THREE.MeshStandardMaterial({ map: textura(c), roughness: 0.6 });
      break;
    }
    case 'tabua': {
      const c = canvas(256, 256, (g, w, h) => { g.fillStyle = '#d6d4cc'; g.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { g.strokeStyle = `rgba(120,110,100,${Math.random() * 0.15})`; const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30); g.stroke(); } });
      m = new THREE.MeshStandardMaterial({ map: textura(c), roughness: 0.7 });
      break;
    }
    case 'porcelana': m = new THREE.MeshPhysicalMaterial({ color: 0xfbfbf8, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 }); break;
    case 'vidro': m = new THREE.MeshPhysicalMaterial({ color: 0xdde8f0, roughness: 0.03, metalness: 0, transmission: 0, transparent: true, opacity: 0.22, depthWrite: false }); break;
    case 'vidroGeladeira': m = new THREE.MeshPhysicalMaterial({ color: 0xbfe0ff, roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false }); break;
    case 'plasticoPreto': m = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.45 }); break;
    case 'borracha': m = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }); break;
    case 'oleo': m = new THREE.MeshPhysicalMaterial({ color: 0xd8a830, roughness: 0.05, transparent: true, opacity: 0.85, clearcoat: 1 }); break;
    case 'agua': m = new THREE.MeshPhysicalMaterial({ color: 0x9fd0ff, roughness: 0.02, transparent: true, opacity: 0.55, depthWrite: false }); break;
    case 'chamaAzul': m = new THREE.MeshBasicMaterial({ color: 0x4a8aff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }); break;
    case 'luzFria': m = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xd8eaff, emissiveIntensity: 1.6 }); break;
    case 'luzQuente': m = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe2a8, emissiveIntensity: 1.2 }); break;
    case 'resistencia': m = new THREE.MeshStandardMaterial({ color: 0x2a0a00, emissive: 0xff3a0a, emissiveIntensity: 0 }); break;
    case 'tecidoAzul': m = new THREE.MeshStandardMaterial({ color: 0x0d2266, roughness: 0.9 }); break;
    case 'veludoAzul': m = new THREE.MeshPhysicalMaterial({ color: 0x0a1a5a, roughness: 0.8, sheen: 1, sheenColor: new THREE.Color(0x4a6aff), sheenRoughness: 0.4 }); break;
    case 'caixaPapelao': m = new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.9 }); break;
    default: throw new Error('material ' + nome);
  }
  cache.set(nome, m);
  return m;
}

// Material colorido reaproveitado por cor.
export function cor(hex, rough = 0.6, metal = 0, extra = {}) {
  const k = `c${hex}_${rough}_${metal}_${JSON.stringify(extra)}`;
  if (cache.has(k)) return cache.get(k);
  const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal, ...extra });
  cache.set(k, m);
  return m;
}

// Textura com texto (placas, rótulos, letreiros).
export function texturaTexto(linhas, o = {}) {
  const w = o.w || 512, h = o.h || 128;
  const c = canvas(w, h, (g) => {
    if (o.fundo !== null) { g.fillStyle = o.fundo || '#0b1f5c'; g.fillRect(0, 0, w, h); }
    if (o.borda) { g.strokeStyle = o.borda; g.lineWidth = o.bordaL || 8; g.strokeRect(6, 6, w - 12, h - 12); }
    g.fillStyle = o.cor || '#f3c74a';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const ls = Array.isArray(linhas) ? linhas : [linhas];
    const tam = o.tam || Math.floor(h / (ls.length + 0.6));
    ls.forEach((l, i) => {
      let px = i === 0 ? tam : Math.floor(tam * 0.62);
      const fonte = () => `${i === 0 ? (o.peso || '800') : '500'} ${px}px ${o.fonte || '"Playfair Display", Georgia, serif'}`;
      g.font = fonte();
      while (px > 10 && g.measureText(l).width > w * 0.9) { px -= 2; g.font = fonte(); }
      if (o.sombra) { g.shadowColor = o.sombra; g.shadowBlur = 18; }
      g.fillText(l, w / 2, h / 2 + (i - (ls.length - 1) / 2) * tam * 1.05);
    });
  });
  const t = textura(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export function tatuagem() {
  if (cache.has('tattoo')) return cache.get('tattoo');
  const c = canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#d8a882'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(20,30,60,0.75)'; g.lineWidth = 4;
    for (let i = 0; i < 14; i++) {
      g.beginPath();
      const x = Math.random() * w, y = Math.random() * h, r = 10 + Math.random() * 30;
      if (i % 3 === 0) g.arc(x, y, r, 0, Math.PI * 2);
      else { g.moveTo(x, y); g.bezierCurveTo(x + r, y - r, x + 2 * r, y + r, x + 3 * r, y); }
      g.stroke();
    }
    g.font = 'bold 40px serif'; g.fillStyle = 'rgba(20,30,60,0.8)'; g.fillText('MÃE', 70, 140);
  });
  const m = new THREE.MeshStandardMaterial({ map: textura(c), roughness: 0.55 });
  cache.set('tattoo', m);
  return m;
}
