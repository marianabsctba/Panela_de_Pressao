// Prepara os modelos CC0 do Quaternius para a web (roda uma vez, fora do jogo).
// Uso: node tools/preparar_modelos.mjs <pasta "Universal Base Characters[Standard]"> <pasta "Universal Animation Library[Standard]">
// Saída em modelos/: corpos e cabelos em .gltf + .bin, texturas JPG 1024, e animacoes.glb só com os clipes usados.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, basename } from 'node:path';

const [baseChars, baseAnim] = process.argv.slice(2);
const SAIDA = 'modelos';
mkdirSync(SAIDA, { recursive: true });

function jpg(origem, destino, tam = 1024) {
  if (existsSync(destino)) return;
  const ps = `Add-Type -AssemblyName System.Drawing; $i=[System.Drawing.Image]::FromFile('${origem.replace(/'/g, "''")}'); $b=New-Object System.Drawing.Bitmap ${tam},${tam}; $g=[System.Drawing.Graphics]::FromImage($b); $g.InterpolationMode='HighQualityBicubic'; $g.DrawImage($i,0,0,${tam},${tam}); $c=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|?{$_.MimeType -eq 'image/jpeg'}; $p=New-Object System.Drawing.Imaging.EncoderParameters 1; $p.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[long]85); $b.Save('${destino.replace(/'/g, "''")}',$c,$p); $i.Dispose(); $b.Dispose()`;
  execFileSync('powershell', ['-NoProfile', '-Command', ps]);
}

function gltf(origem, nome, texDir, opcoes = {}) {
  const g = JSON.parse(readFileSync(origem, 'utf8'));
  const dir = origem.slice(0, origem.lastIndexOf('/') + 1) || './';
  for (const m of g.meshes) for (const p of m.primitives) {
    for (const k of Object.keys(p.attributes)) if (!['POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0'].includes(k)) delete p.attributes[k];
  }
  for (const m of g.materials || []) { if (m.pbrMetallicRoughness) delete m.pbrMetallicRoughness.metallicRoughnessTexture; if (opcoes.semNormal) delete m.normalTexture; }
  for (const img of g.images || []) {
    const png = img.uri;
    const novo = png.replace(/(_png)?\.png$/i, '.jpg');
    let fonte = join(dir, png);
    if (!existsSync(fonte)) fonte = join(texDir, png.replace('_png.png', '.png'));
    jpg(fonte, join(SAIDA, novo), /Eye/.test(png) ? 256 : 1024);
    img.uri = novo;
  }
  const bin = g.buffers[0].uri;
  copyFileSync(join(dir, bin), join(SAIDA, nome + '.bin'));
  g.buffers[0].uri = nome + '.bin';
  writeFileSync(join(SAIDA, nome + '.gltf'), JSON.stringify(g));
  console.log('ok', nome);
}

const corpos = join(baseChars, 'Base Characters/Godot - UE/').replace(/\\/g, '/');
const tex = join(baseChars, 'Base Characters/Textures');
gltf(corpos + 'Superhero_Male_FullBody.gltf', 'humano_m', tex);
gltf(corpos + 'Superhero_Female_FullBody.gltf', 'humano_f', tex);
const cab = join(baseChars, 'Hairstyles/Origin at 0/glTF (Godot)/').replace(/\\/g, '/');
for (const h of ['Hair_Buns', 'Hair_Buzzed', 'Hair_BuzzedFemale', 'Hair_Long', 'Hair_SimpleParted', 'Hair_Beard', 'Eyebrows_Female', 'Eyebrows_Regular']) gltf(cab + h + '.gltf', h.toLowerCase(), cab, { semNormal: true });

// Animações: mantém só os clipes usados e descarta a malha do manequim.
const CLIPES = ['Idle_Loop', 'Idle_Talking_Loop', 'Walk_Loop', 'Walk_Formal_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop', 'Interact', 'PickUp_Table', 'Dance_Loop', 'Idle_Torch_Loop', 'Spell_Simple_Idle_Loop', 'Hit_Head', 'Push_Loop', 'Fixing_Kneeling'];
const glb = readFileSync(join(baseAnim, 'Unreal-Godot/UAL1_Standard.glb'));
const lenJ = glb.readUInt32LE(12);
const J = JSON.parse(glb.slice(20, 20 + lenJ).toString());
const binIni = 20 + lenJ + 8;
const B = glb.slice(binIni);
J.animations = J.animations.filter((a) => CLIPES.includes(a.name));
const usados = new Set();
for (const a of J.animations) for (const s of a.samplers) { usados.add(s.input); usados.add(s.output); }
const TAM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const COMP = { 5126: 4, 5123: 2, 5125: 4, 5121: 1, 5122: 2, 5120: 1 };
const partes = []; let off = 0;
const novosViews = []; const novosAcc = []; const mapa = {};
[...usados].sort((a, b) => a - b).forEach((ai) => {
  const acc = J.accessors[ai];
  const bv = J.bufferViews[acc.bufferView];
  const n = acc.count * TAM[acc.type] * COMP[acc.componentType];
  const ini = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  partes.push(B.slice(ini, ini + n));
  const pad = (4 - (n % 4)) % 4; if (pad) partes.push(Buffer.alloc(pad));
  novosViews.push({ buffer: 0, byteOffset: off, byteLength: n });
  off += n + pad;
  mapa[ai] = novosAcc.length;
  novosAcc.push({ ...acc, bufferView: novosViews.length - 1, byteOffset: 0 });
});
for (const a of J.animations) for (const s of a.samplers) { s.input = mapa[s.input]; s.output = mapa[s.output]; }
for (const nd of J.nodes) { delete nd.mesh; delete nd.skin; }
delete J.meshes; delete J.skins; delete J.materials; delete J.textures; delete J.images; delete J.samplers;
J.accessors = novosAcc; J.bufferViews = novosViews; J.buffers = [{ byteLength: off }];
const json = Buffer.from(JSON.stringify(J)); const padJ = (4 - (json.length % 4)) % 4;
const jsonP = Buffer.concat([json, Buffer.alloc(padJ, 0x20)]);
const binP = Buffer.concat(partes);
const cab2 = Buffer.alloc(12); cab2.writeUInt32LE(0x46546c67, 0); cab2.writeUInt32LE(2, 4); cab2.writeUInt32LE(12 + 8 + jsonP.length + 8 + binP.length, 8);
const hj = Buffer.alloc(8); hj.writeUInt32LE(jsonP.length, 0); hj.writeUInt32LE(0x4e4f534a, 4);
const hb = Buffer.alloc(8); hb.writeUInt32LE(binP.length, 0); hb.writeUInt32LE(0x004e4942, 4);
writeFileSync(join(SAIDA, 'animacoes.glb'), Buffer.concat([cab2, hj, jsonP, hb, binP]));
console.log('animacoes.glb', J.animations.map((a) => a.name).join(', '), (binP.length / 1e6).toFixed(2), 'MB');
console.log(basename(SAIDA), 'pronto');
