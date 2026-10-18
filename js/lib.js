'use strict';
/* ===== Utilidades compartidas: elecciones municipales (concejales, diputaciones y cabildos) ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (x, d = 1) => (x * 100).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }) + '%';
const nf = (x, d = 0) => Number(x).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });
const pts = x => { const t = nf(Math.abs(x) * 100, 1); return (Math.abs(x) * 100 < 0.05 ? '' : x > 0 ? '+' : '−') + t };
const Q = new URLSearchParams(location.search);
/* respaldo: si el visor no conserva la cadena de consulta, el destino se recupera de sessionStorage (una sola vez) */
try { const n = JSON.parse(sessionStorage.getItem('nav') || 'null'); sessionStorage.removeItem('nav');
  if (n && n.page === location.pathname.split('/').pop() && ![...Q].length) for (const k in n.q) Q.set(k, n.q[k]) } catch (e) { }
function nav(u) { try { const [pg, qs] = u.split('?'); sessionStorage.setItem('nav', JSON.stringify({ page: pg, q: Object.fromEntries(new URLSearchParams(qs || '')) })) } catch (e) { } location.href = u }
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey) return; const h = a.getAttribute('href'); if (h && !/^(https?:|#|mailto:)/.test(h)) { try { const [pg, qs] = h.split('?'); sessionStorage.setItem('nav', JSON.stringify({ page: pg, q: Object.fromEntries(new URLSearchParams(qs || '')) })) } catch (x) { } } }, true);
const ELEC = Q.get('e') || '2023-05';
const BASE = 'datos/' + ELEC + '/';
const jget = u => new Promise((ok, ko) => {
  const w = (window.__J = window.__J || {});
  if (w[u]) return ok(w[u]);
  const sc = document.createElement('script'); sc.src = u + '.js';
  sc.onload = () => w[u] ? ok(w[u]) : ko(new Error(u + ' vacío')); sc.onerror = () => ko(new Error(u + ' no encontrado'));
  document.head.appendChild(sc);
});
const bk = pid => Math.floor(+pid / 9);
const loadProv = async pid => (await jget(BASE + 'prov_b' + bk(pid) + '.json'))[pid];
const loadAllProv = async () => { const o = {}; for (let b = 0; b < 6; b++) Object.assign(o, await jget(BASE + 'prov_b' + b + '.json')); return o };
const loadSec = async pid => { if (!G.sections) return null; try { return (await jget(BASE + 'sec_b' + bk(pid) + '.json'))[pid] || {} } catch (e) { return {} } };
const loadMunMap = async pid => (await jget('mapas/mun.json'))[pid];
const loadPJMap = async pid => { try { return (await jget('mapas/pj_b' + bk(pid) + '.json'))[pid] || null } catch (e) { return null } };
const loadSecMap = async pid => { if (!G.sections || !G.mapyear) return null; try { return (await jget('mapas/sec/' + G.mapyear + '/b' + bk(pid) + '.json'))[pid] || null } catch (e) { return null } };
const loadGov = async () => { try { return (await jget('datos/gov.json'))[ELEC] || {} } catch (e) { return {} } };
const AUTONOMAS = { '51': '51001', '52': '52001' };
const DEF_PROV = '28', DEF_MUN = '28079';
let G = null, NP = 0, LI = 0, GOV = {};

function notesHTML() {
  const src = G.sections ? 'Ministerio del Interior: resultados de las elecciones municipales por mesa. Cada mesa se agrega por sección censal, municipio y provincia; el voto de residentes en el extranjero no se computa en municipales.'
    : 'Ministerio del Interior: resultados de las elecciones municipales por municipio. De esta elección no hay datos por mesa, así que no se puede bajar a sección censal.';
  const my = G.sections ? `<div><b>Mapas.</b> Las secciones censales se dibujan con el seccionado del INE de ${G.mapyear}${G.year < 2007 ? ' (el más antiguo disponible; algunas secciones han cambiado desde entonces y no tienen polígono)' : ''}; los municipios, con los límites actuales, por lo que un municipio desaparecido, fusionado o muy pequeño puede no aparecer dibujado.</div>` : '<div><b>Mapas.</b> Los municipios se dibujan con los límites actuales: un municipio desaparecido, fusionado o muy pequeño puede no aparecer dibujado.</div>';
  return `<div><b>Fuente.</b> ${src}</div>${my}`
    + `<div><b>Partidos.</b> Las candidaturas se agrupan por familia política según sus siglas y nombre; las listas que no encajan en ninguna familia (agrupaciones de electores, partidos locales) se muestran como «Candidaturas locales» y, dentro de cada municipio, con su nombre. En mapas y rankings cada lista local cuenta por separado.</div>`
    + `<div><b>Gobiernos.</b> El partido o partidos de gobierno de cada diputación y cabildo se marcan como «estimado» cuando se han deducido (gobierna la lista con más representantes) y sin esa marca cuando están contrastados. Los apoyos externos no se muestran.</div>`
    + (G.notas || []).map(n => `<div>${esc(n)}</div>`).join('');
}
function href(page, params) { const u = new URLSearchParams(params || {}); if (Q.get('e')) u.set('e', Q.get('e')); const s = u.toString(); return page + (s ? '?' + s : '') }
const hProv = (id, view) => AUTONOMAS[id] ? href('municipio.html', { m: AUTONOMAS[id] }) : href('provincia.html', view ? { p: id, v: view } : { p: id });
const hMun = (id, view) => href('municipio.html', view ? { m: id, v: view } : { m: id });
const hCab = id => href('cabildo.html', { i: id });
const ISLN = { '35-1': 'Gran Canaria', '35-2': 'Lanzarote', '35-3': 'Fuerteventura', '38-4': 'Tenerife', '38-5': 'La Palma', '38-6': 'La Gomera', '38-7': 'El Hierro' };

async function loadG() {
  G = await jget(BASE + 'general.json'); NP = G.parties.length; LI = G.parties.findIndex(p => p.k === 'LOC');
  G.pi = {}; G.prov.forEach((p, j) => G.pi[p.id] = j);
  const css = f => G.parties.map(p => `--c-${p.k}:${f(p)};`).join('');
  const st = document.createElement('style');
  st.textContent = `:root{${css(p => p.c)}}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${css(p => p.d)}}}:root[data-theme="dark"]{${css(p => p.d)}}`;
  document.head.appendChild(st);
  document.body.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs id="sdefs"></defs></svg>');
  GOV = await loadGov();
  return G;
}
const pcol = i => `var(--c-${G.parties[i].k})`;
const swatch = i => `<span class="sw" style="background:${pcol(i)}"></span>`;
const pname = i => G.parties[i].n;

/* ---- entradas de resultados (partidos nacionales + listas locales con nombre) ---- */
function ents(r, l) { const o = []; for (const x of r) o.push({ i: x[0], v: x[1], s: x[2], n: null }); for (const x of l) o.push({ i: LI, v: x[1], s: x[2], n: x[0] }); return o }
const en = e => e.n || pname(e.i);
function vec(E) { const g = new Array(NP).fill(0); for (const e of E) g[e.i] += e.v; return g }
function svec(E) { const g = new Array(NP).fill(0); for (const e of E) g[e.i] += e.s; return g }
/* ganador por votos ('v') o por concejales/representantes ('s'); cada lista local cuenta por separado */
function win(E, bl, by) {
  let t = bl, S = 0; for (const e of E) { t += e.v; S += e.s }
  if (!E.length) return null;
  const a = E.slice().sort(by === 's' ? (x, y) => y.s - x.s || y.v - x.v : (x, y) => y.v - x.v);
  const w = a[0], s = a[1] || null; if (w.v <= 0 && w.s <= 0) return null;
  const m = by === 's' ? (S ? (w.s - (s ? s.s : 0)) / S : 0) : (w.v - (s ? s.v : 0)) / t;
  return { w: w.i, e: w, s: s ? s.i : -1, se: s, m, sh: t ? w.v / t : 0, valid: t, S };
}
function winOf(v, bl) {
  let b = -1, s = -1, t = bl; for (let i = 0; i < v.length; i++) { t += v[i]; if (b < 0 || v[i] > v[b]) { s = b; b = i } else if (s < 0 || v[i] > v[s]) s = i }
  if (b < 0 || v[b] <= 0) return null;
  return { w: b, s: s < 0 ? -1 : s, m: (v[b] - (s < 0 ? 0 : v[s])) / t, sh: v[b] / t, valid: t };
}
function shade(w, m, m0 = 0.30) { return `fill:${pcol(w)};fill-opacity:${(0.32 + 0.68 * Math.min(1, Math.max(0, m) / m0)).toFixed(2)}` }
function shares(v, bl) { let t = bl; for (const x of v) t += x; return { valid: t, row: v.map(x => x / t) } }
function mkMun(m) {
  const E = ents(m[5], m[6]); const o = { c3: m[0], n: m[1], censo: m[2], bl: m[3], nu: m[4], E, pj: m[7], isl: m[8] };
  o.v = vec(E); o.conc = svec(E); o.valid = E.reduce((a, e) => a + e.v, 0) + m[3];
  o.part = o.censo ? (o.valid + m[4]) / o.censo : 0;
  if (m[9]) { o.cab = { bl: m[9][0], nu: m[9][1], E: ents(m[9][2], m[9][3]) }; o.cab.v = vec(o.cab.E) }
  return o;
}

/* ---- D'Hondt con umbral (sobre voto válido, con blancos) ---- */
function dhT(t, seats, thr) {
  const out = new Array(t.length).fill(0), el = []; for (let k = 0; k < t.length; k++) if (t[k] >= thr) el.push(k);
  for (let n = 0; n < seats; n++) { let b = -1, bq = -1; for (const k of el) { const q = t[k] / (out[k] + 1); if (q > bq) { bq = q; b = k } } if (b < 0) break; out[b]++ }
  return out;
}
function seatsAt(row, k, x, seats, thr) {
  const rest = 1 - row[k], f = rest > 0 ? (1 - x) / rest : 0, t = new Array(row.length);
  for (let i = 0; i < row.length; i++) t[i] = i === k ? x : row[i] * f;
  return dhT(t, seats, thr)[k];
}
function needShare(row, k, seats, target, thr) {
  if (target < 1 || target > seats) return null;
  if (seatsAt(row, k, 0.999, seats, thr) < target) return null;
  let lo = 0, hi = 0.999;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (seatsAt(row, k, mid, seats, thr) >= target) hi = mid; else lo = mid }
  return hi;
}
/* análisis D'Hondt de un partido judicial, una diputación o un cabildo: lista de entradas {i,v,s,n} */
function analyzeE(E, bl, seats, thr) {
  const L = E.filter(e => e.v > 0).sort((a, b) => b.v - a.v);
  let t0 = bl; for (const e of L) t0 += e.v;
  const row = L.map(e => e.v / t0), es = dhT(row, seats, thr);
  const q = []; for (let k = 0; k < row.length; k++) if (row[k] >= thr) for (let d = 1; d <= seats + 1; d++) q.push({ k, d, q: row[k] / d });
  q.sort((a, b) => b.q - a.q);
  const Q2 = q.slice(0, seats + 3).map((x, i) => ({ ...x, n: i + 1, won: i < seats }));
  return { L, row, es, valid: t0, q: Q2, lastW: Q2.filter(x => x.won).slice(-1)[0] || null, firstO: Q2.find(x => !x.won) || null, seats, thr };
}
const wnE = e => `<span class="wn">${swatch(e.i)}${esc(en(e))}</span>`;

/* ---- gobiernos de diputaciones y cabildos ---- */
function govOf(bid) {
  const g = GOV[bid]; if (!g) return null;
  const parts = g.g.map(x => { const i = x.k === 'LOC' ? LI : G.parties.findIndex(p => p.k === x.k); return i < 0 ? null : { i, n: x.n || pname(i) } }).filter(Boolean);
  return parts.length ? { parts, est: !g.v, maj: !!g.m } : null;
}
const govHTML = g => g ? `<div class="gov">${g.parts.map(p => `<span class="gp"><i style="background:${pcol(p.i)}"></i>${esc(p.n)}</span>`).join('')}${g.est ? '<span class="est" title="Deducido: gobierna la lista con más representantes">estimado</span>' : ''}</div>` : '';
let _sid = 0; const _st = {};
function stripeFill(idxs, sw = 7) {
  if (!idxs.length) return 'var(--track)';
  if (idxs.length === 1) return pcol(idxs[0]);
  const key = idxs.join('_') + '/' + sw; if (_st[key]) return `url(#${_st[key]})`;
  const id = 'st' + (++_sid), n = idxs.length, W = sw * n;
  $('#sdefs').insertAdjacentHTML('beforeend', `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${W}" height="${W}" patternTransform="rotate(45)">${idxs.map((i, k) => `<rect x="${k * sw}" y="0" width="${sw}" height="${W}" style="fill:${pcol(i)}"/>`).join('')}</pattern>`);
  _st[key] = id; return `url(#${id})`;
}
const govFill = (g, sw) => g ? stripeFill(g.parts.map(p => p.i), sw) : 'var(--track)';
function seatBar(list, total, cls = '') {
  const t = total || list.reduce((a, x) => a + x.s, 0);
  return `<div class="sbar ${cls}" role="img" aria-label="Reparto de ${t} representantes">${list.filter(x => x.s > 0).map(x => `<i style="width:${x.s / t * 100}%;background:${pcol(x.i)}" title="${esc(x.n || pname(x.i))}: ${x.s}">${x.s}</i>`).join('')}<u class="mk" title="Mayoría absoluta: ${Math.floor(t / 2) + 1}"></u></div>`;
}
function seatList(E) { return E.filter(e => e.s > 0).map(e => ({ i: e.i, s: e.s, n: en(e) })).sort((a, b) => b.s - a.s) }

/* ---- migas de pan y selectores ---- */
function crumbs(list) {
  $('#crumbs').innerHTML = list.map((c, i) => {
    const last = i === list.length - 1, lab = c.l ? `<small>${esc(c.l)}</small>` : '';
    return (i ? '<span class="sep">/</span>' : '') + (c.h && !last ? `<a href="${c.h}">${lab}${esc(c.t)}</a>` : `<span class="${last ? 'cur' : ''}">${lab}${esc(c.t)}</span>`);
  }).join('');
}
const provOpts = sel => G.prov.slice().sort((a, b) => a.n.localeCompare(b.n, 'es')).map(p => `<option value="${p.id}"${p.id === sel ? ' selected' : ''}>${esc(p.n)}</option>`).join('');
function setPill() { const k = $('#kick'); if (k) k.firstElementChild.textContent = `${G.title} · ${G.date}` }

/* ---- barra fija: elección, provincia y municipio ---- */
async function mountBar(curProv, curMun) {
  const el = $('#bar'); if (!el) return;
  el.className = 'ctrl fixbar'; el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'Elección, provincia y municipio');
  el.innerHTML = `<label class="fld" for="elecSel"><span class="lbl">Elecciones</span><select id="elecSel"></select></label>
    <label class="fld" for="provSel"><span class="lbl">Provincia</span><select id="provSel"></select></label>
    <label class="fld srch" for="munq"><span class="lbl">Municipio</span><input id="munq" list="munlist" placeholder="Busca un municipio…" autocomplete="off"><datalist id="munlist"></datalist></label>`;
  const EL = await jget('datos/elecciones.json');
  $('#elecSel').innerHTML = EL.map(x => `<option value="${x.id}"${x.id === ELEC ? ' selected' : ''}>${esc(x.label)}</option>`).join('');
  const here = location.pathname.split('/').pop() || 'index.html';
  $('#elecSel').onchange = e => nav(e.target.value === EL[0].id ? 'index.html' : 'index.html?e=' + e.target.value);
  $('#provSel').innerHTML = (curProv ? '' : '<option value="">Elige…</option>') + provOpts(curProv || '');
  $('#provSel').onchange = e => { if (e.target.value) nav(hProv(e.target.value)) };
  let MUNS = null; const inp = $('#munq'), dl = $('#munlist');
  if (curMun) { inp.value = curMun; inp.addEventListener('focus', () => { inp.value = ''; inp.placeholder = curMun }); inp.addEventListener('blur', () => { if (!inp.value) inp.value = curMun }) }
  inp.addEventListener('focus', async () => {
    if (MUNS) return; MUNS = await jget(BASE + 'municipios.json'); MUNS.forEach(m => m.label = `${m[1]} · ${G.prov[G.pi[m[0].slice(0, 2)]].n}`);
    dl.innerHTML = MUNS.map(m => `<option value="${esc(m.label)}"></option>`).join('');
  }, { once: true });
  inp.addEventListener('change', () => { if (!MUNS) return; const m = MUNS.find(x => x.label === inp.value); if (m) nav(hMun(m[0])) });
}
function hoverFront(svg) { svg.onmouseover = e => { const p = e.target.closest && e.target.closest('path[data-m],path[data-k]'); if (p && !svg.classList.contains('nob') && p.parentNode.lastElementChild !== p) p.parentNode.appendChild(p) } }

/* ---- barras de voto con concejales opcionales ---- */
function voteBars(sel, v, bl, nu, o = {}) {
  const { valid, row } = shares(v, bl), idx = row.map((x, i) => i).filter(i => v[i] > 0).sort((a, b) => v[b] - v[a]);
  const top = idx.slice(0, o.maxShow || 12), mx = Math.max(0.05, Math.ceil(row[top[0]] * 20) / 20);
  const rest = idx.slice(top.length).reduce((a, i) => a + v[i], 0);
  const extra = i => { const p = []; if (o.conc) p.push(`${nf(o.conc[i])} concejales`); if (o.dips && o.dips[i] > 0) p.push(`${nf(o.dips[i])} diputados prov.`); if (o.ins && o.ins[i] > 0) p.push(`${nf(o.ins[i])} cons. insulares`); return p.length ? ' · ' + p.join(' · ') : '' };
  $(sel).innerHTML = top.map(i => `<div class="prow"><div class="top"><span class="nm">${swatch(i)}${esc(pname(i))}</span><span class="pc">${fmt(row[i])}</span></div><div class="bar"><i style="width:${row[i] / mx * 100}%;background:${pcol(i)}"></i></div><div class="ft">${nf(v[i])} votos${extra(i)}</div></div>`).join('')
    + (rest > 0 ? `<div class="prow"><div class="top"><span class="nm"><span class="sw" style="background:var(--faint)"></span>Resto de candidaturas</span><span class="pc">${fmt(rest / valid)}</span></div><div class="bar"><i style="width:${rest / valid / mx * 100}%;background:var(--faint)"></i></div><div class="ft">${nf(rest)} votos</div></div>` : '')
    + `<div class="prow"><div class="top"><span class="nm"><span class="sw" style="background:var(--rule)"></span>En blanco</span><span class="pc">${fmt(bl / valid)}</span></div><div class="bar"><i style="width:${bl / valid / mx * 100}%;background:var(--rule)"></i></div><div class="ft">${nf(bl)} votos · nulos ${nf(nu)}</div></div>`;
}

/* ---- panel de detalle al pasar el ratón / fijar con clic ---- */
function unitPanelHTML(d) {
  const E = d.E, vc = E.reduce((a, e) => a + e.v, 0), valid = vc + d.bl, vt = valid + d.nu, w = win(E, d.bl, 'v');
  const ref = d.ref, rvalid = ref ? ref.v.reduce((a, b) => a + b, 0) + ref.bl : 0;
  const idx = E.slice().sort((a, b) => b.v - a.v).filter(e => e.v > 0);
  const show = idx.slice(0, 8), rest = idx.slice(8);
  const row = e => { const sh = e.v / valid, rs = ref && rvalid && !e.n ? ref.v[e.i] / rvalid : null, df = rs === null ? null : (sh - rs) * 100;
    return `<tr><td>${wnE(e)}</td><td class="num">${nf(e.v)}</td><td class="num"><b>${fmt(sh)}</b></td>${d.showS ? `<td class="num">${e.s ? nf(e.s) : '–'}</td>` : ''}${ref ? `<td class="num">${df === null ? '–' : (df > 0 ? '+' : df < 0 ? '−' : '') + nf(Math.abs(df), 1)}</td>` : ''}</tr>` };
  let rows = show.map(row).join('');
  if (rest.length) { const ov = rest.reduce((a, e) => a + e.v, 0); rows += `<tr><td>Otras candidaturas (${rest.length})</td><td class="num">${nf(ov)}</td><td class="num"><b>${fmt(ov / valid)}</b></td>${d.showS ? '<td></td>' : ''}${ref ? '<td></td>' : ''}</tr>` }
  rows += `<tr><td>En blanco</td><td class="num">${nf(d.bl)}</td><td class="num"><b>${fmt(d.bl / valid)}</b></td>${d.showS ? '<td></td>' : ''}${ref ? '<td></td>' : ''}</tr>`;
  const sl = d.showS ? seatList(E) : [];
  return `${d.action ? `<p class="up-act"><button type="button" class="btnlk" id="upact">${d.action.label}</button></p>` : ''}<div class="up-h"><h3>${esc(d.title)}</h3><div class="meta">${d.meta || ''}</div></div>
  <div class="kpis k3"><div><b>${d.censo ? fmt(vt / d.censo) : '–'}</b><span>participación (${nf(vt)} votantes de ${nf(d.censo)} electores)</span></div>
  <div><b>${w ? esc(en(w.e)) : '–'}</b><span>${w ? `más votado, con ${fmt(w.sh)} (${nf(w.e.v)} votos)` : 'sin votos a candidaturas'}</span></div>
  <div><b>${w && w.se ? nf(w.e.v - w.se.v) : '–'}</b><span>${w && w.se ? `votos de ventaja sobre ${esc(en(w.se))} (${nf(w.m * 100, 1)} pts)` : ''}</span></div></div>
  ${sl.length ? seatBar(sl, d.seats) : ''}
  <div class="tw"><table class="pt mt prt vt"><thead><tr><th>Candidatura</th><th>Votos</th><th>% voto</th>${d.showS ? `<th>${d.sLabel || 'Concejales'}</th>` : ''}${ref ? `<th title="Diferencia en puntos con ${esc(d.refName)}">Dif.</th>` : ''}</tr></thead><tbody>${rows}</tbody></table></div>
`;
}
function attachPanel(svg, selector, keyAttr, getData, hint) {
  let host = document.getElementById('upanel');
  if (!host) { host = document.createElement('div'); host.id = 'upanel'; host.className = 'upanel'; (document.getElementById('mapnote') || svg).insertAdjacentElement('afterend', host) }
  let pinned = null;
  const render = key => {
    if (!key) { host.innerHTML = `<p class="note up-hint">${hint}</p>`; return }
    const d = getData(key); if (!d) { host.innerHTML = ''; return }
    host.innerHTML = unitPanelHTML(d); const b = host.querySelector('#upact'); if (b) b.onclick = d.action.run;
  };
  const els = [...svg.querySelectorAll(selector)];
  const setPin = key => { pinned = key; els.forEach(p => p.classList.toggle('pin', key !== null && p.dataset[keyAttr] === key)); const pp = key && els.find(p => p.dataset[keyAttr] === key); if (pp) pp.parentNode.appendChild(pp); render(pinned) };
  els.forEach(p => {
    const k = p.dataset[keyAttr];
    p.onmouseenter = () => { if (pinned !== k) render(k) };
    p.onmouseleave = () => render(pinned);
    p.onclick = () => setPin(pinned === k ? null : k);
    p.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPin(pinned === k ? null : k) } };
  });
  render(null);
  return { pin: setPin };
}

/* ---- pestañas ---- */
function showTab(id) {
  document.querySelectorAll('.tabs [role=tab]').forEach(b => { const on = b.id === 'tab-' + id; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1 });
  document.querySelectorAll('.panel[role=tabpanel]').forEach(p => { p.hidden = p.id !== 'p-' + id });
}
function mountTabs() {
  const tabs = [...document.querySelectorAll('.tabs [role=tab]')];
  tabs.forEach((b, i) => { b.onclick = () => showTab(b.id.slice(4));
    b.onkeydown = e => { const j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : -1; if (j >= 0) { e.preventDefault(); tabs[j].focus(); showTab(tabs[j].id.slice(4)) } } });
}

/* ---- bloque "Elige un partido" con tabla de los 10 primeros/últimos ---- */
function partyBlock(host, o) {
  const st = o.state = o.state || { party: o.ps[0], ord: 'pct_desc' };
  const ORD = { pct_desc: '% más alto del partido', pct_asc: '% más bajo del partido', v_desc: 'Más votos del partido', v_asc: 'Menos votos del partido' };
  const pv = o.parent.v, pvalid = pv.reduce((a, b) => a + b, 0) + o.parent.bl;
  const cell = (sh, v, hi) => `<td class="num pc${hi ? ' hi' : ''}">${fmt(sh)}<small>${nf(v)}</small></td>`;
  const draw = () => {
    const i = st.party, valid = u => u.v.reduce((a, b) => a + b, 0) + u.bl;
    const U = o.units.map(u => ({ u, valid: valid(u) })).filter(x => x.valid > 0).map(x => ({ ...x, pct: x.u.v[i] / x.valid, vt: x.u.v[i] }));
    const keyf = { pct_desc: (a, b) => b.pct - a.pct, pct_asc: (a, b) => a.pct - b.pct, v_desc: (a, b) => b.vt - a.vt, v_asc: (a, b) => a.vt - b.vt }[st.ord];
    const sorted = U.slice().sort((a, b) => keyf(a, b) || b.u.censo - a.u.censo), top = sorted.slice(0, 10);
    const byPct = U.slice().sort((a, b) => b.pct - a.pct), best = byPct[0], worst = byPct[byPct.length - 1];
    const won = o.units.filter(u => { const w = winOf(u.v, u.bl); return w && w.w === i }).length;
    host.innerHTML = `<h2>Elige un partido</h2><p class="note">${o.note}</p>
    ${o.modes ? `<div class="seg2" role="group" aria-label="Nivel de la tabla">${o.modes.map(x => `<button type="button" data-mode="${x.id}" aria-pressed="${x.id === o.mode}">${x.label}</button>`).join('')}</div>` : ''}
    <div class="chips" role="group" aria-label="Partido">${o.ps.map(j => `<button type="button" class="chip" style="--c:${pcol(j)}" data-p="${j}" aria-pressed="${j === i}"><i></i>${esc(pname(j))} <small>${o.chipSub(j)}</small></button>`).join('')}</div>
    <div class="kpis"><div><b style="color:${pcol(i)}">${fmt(pv[i] / pvalid)}</b><span>del voto ${o.parentName} (${nf(pv[i])} votos)</span></div>
      <div><b>${nf(won)}</b><span>${o.unitsPl} donde es el más votado, de ${nf(o.units.length)}</span></div>
      <div><b>${best ? fmt(best.pct) : '–'}</b><span>mejor resultado: ${best ? esc(best.u.name) : ''}</span></div>
      <div><b>${worst ? fmt(worst.pct) : '–'}</b><span>peor resultado: ${worst ? esc(worst.u.name) : ''}</span></div></div>
    <div class="toolrow"><label class="fld sel" style="margin:0"><span class="lbl">Ordenar ${o.unitsPl}</span><select id="pbord">${Object.keys(ORD).map(k => `<option value="${k}"${k === st.ord ? ' selected' : ''}>${ORD[k]}</option>`).join('')}</select></label></div>
    <div class="tw"><table class="pt mt pbt"><thead><tr><th class="stk">${o.unitName}</th><th>Electores</th><th>Particip.</th><th>Más votado</th><th>% ganador</th><th>Ventaja</th>${o.ps.map(j => `<th class="${j === i ? 'hi' : ''}"><span class="wn">${swatch(j)}${esc(pname(j))}</span></th>`).join('')}<th>En blanco</th><th>Nulos</th></tr></thead><tbody>${top.map(({ u, valid }) => { const w = winOf(u.v, u.bl);
      return `<tr class="rw" data-key="${esc(u.key)}"><td class="stk">${esc(u.name)}</td><td class="num">${nf(u.censo)}</td><td class="num">${fmt(u.part)}</td><td>${w ? `<span class="wn">${swatch(w.w)}${esc(pname(w.w))}</span>` : '–'}</td><td class="num">${w ? fmt(w.sh) : '–'}</td><td class="num">${w ? nf(w.m * 100, 1) + ' pts' : '–'}</td>${o.ps.map(j => cell(u.v[j] / valid, u.v[j], j === i)).join('')}${cell(u.bl / valid, u.bl)}<td class="num">${nf(u.nu)}</td></tr>` }).join('')}</tbody></table></div>
    <p class="note" style="margin:10px 0 0">Se muestran ${top.length} de ${nf(U.length)} ${o.unitsPl}. ${o.ord_note || ''}</p>`;
    host.querySelectorAll('.chip').forEach(b => b.onclick = () => { st.party = +b.dataset.p; draw() });
    host.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => o.onMode(b.dataset.mode));
    host.querySelector('#pbord').onchange = e => { st.ord = e.target.value; draw() };
    if (o.onRow) host.querySelectorAll('tr.rw').forEach(r => { r.onclick = () => o.onRow(r.dataset.key); r.style.cursor = 'pointer' });
  };
  draw();
}

/* ---- tooltip inmediato en los mapas ---- */
(() => {
  let tt = null, cur = null;
  const box = () => tt || (tt = document.getElementById('tt'));
  const pos = e => { const t = box(); if (!t) return; const w = t.offsetWidth, h = t.offsetHeight; let x = e.clientX + 14, y = e.clientY + 16; if (x + w > innerWidth - 8) x = e.clientX - w - 14; if (y + h > innerHeight - 8) y = e.clientY - h - 14; t.style.left = Math.max(4, x) + 'px'; t.style.top = Math.max(4, y) + 'px' };
  const SEL = 'svg.mapsvg path, svg.mapsvg rect, svg.pmap path, svg.natmap path, svg.natmap rect';
  document.addEventListener('mouseover', e => {
    const el = e.target.closest && e.target.closest(SEL);
    if (!el || !box()) return;
    const ti = el.querySelector(':scope > title');
    if (ti) { el.dataset.tt = ti.textContent; ti.remove() }
    if (!el.dataset.tt) return;
    cur = el; const t = box(); t.style.maxWidth = '340px'; t.textContent = el.dataset.tt; t.style.display = 'block'; pos(e);
  });
  document.addEventListener('mousemove', e => { if (cur) pos(e) });
  document.addEventListener('mouseout', e => { if (cur && !(e.relatedTarget && cur.contains(e.relatedTarget)) && e.target.closest && e.target.closest('svg') && (!e.relatedTarget || !e.relatedTarget.closest || e.relatedTarget.closest(SEL) !== cur)) { const t = box(); if (t) t.style.display = 'none'; cur = null } });
})();

/* Juntas Generales (Araba/Bizkaia/Gipuzkoa): terminología y umbral propios */
const FORAL = new Set(['01', '20', '48']);
const isF = pid => FORAL.has(pid);
const THR = pid => isF(pid) ? 0.03 : 0.05;
const THRT = pid => isF(pid) ? '3 %' : '5 %';
const CAP = t => t.charAt(0).toUpperCase() + t.slice(1);
const PJW = (pid, pl) => isF(pid) ? (pl ? 'circunscripciones' : 'circunscripción') : (pl ? 'partidos judiciales' : 'partido judicial');
const DIPN = pid => isF(pid) ? 'Juntas Generales' : 'Diputación provincial';
const DIPR = pid => isF(pid) ? 'junteros' : 'diputados provinciales';
