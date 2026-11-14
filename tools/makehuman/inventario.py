# Lista roupas do MPFB com etiquetas e faixa de altura coberta (0 = pés, 1 = topo da cabeça).
import os, glob
D = '/root/.config/blender/4.2/extensions/.user/user_default/mpfb/data/clothes'
for d in sorted(os.listdir(D)):
    mh = glob.glob(os.path.join(D, d, '*.mhclo'))
    if not mh:
        continue
    tags, obj = [], None
    for l in open(mh[0], encoding='utf-8', errors='ignore'):
        p = l.strip().split(' ', 1)
        if p[0] == 'tag' and len(p) > 1:
            tags.append(p[1].strip().lower())
        if p[0] == 'obj_file' and len(p) > 1:
            obj = os.path.join(D, d, p[1].strip())
    ys = []
    if obj and os.path.exists(obj):
        for l in open(obj, encoding='utf-8', errors='ignore'):
            if l.startswith('v '):
                ys.append(float(l.split()[2]))
    faixa = f'{(min(ys) + 8.6) / 17.2:.2f}-{(max(ys) + 8.6) / 17.2:.2f}' if ys else '?'
    print(f'{d:42s} {faixa:10s} {",".join(t for t in tags if t not in ("makehuman™", "makehuman"))[:60]}')
