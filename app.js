/* El Niño 2026–27 problem map. Everything is driven by data/problems.json. */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const US_ID = 'P_US';
const LK = {active:'works on it', partial:'partly', planned:'proposed niche'};

fetch('data/problems.json').then(r => r.json()).then(start).catch(e => {
  document.body.insertAdjacentHTML('afterbegin', '<p style="padding:16px">Could not load data/problems.json. If you opened this file directly, serve the folder instead, for example <code>python3 -m http.server</code>.</p>');
  console.error(e);
});

function start(D){
  const M = D.meta;
  const LAYERS = M.layers;
  const NAT = Object.fromEntries(Object.entries(M.natures).map(([k,v]) => [k, {...v, c:`var(--${v.color})`}]));
  const L0 = M.labels[0].id, L1 = M.labels[1].id;
  const byId = new Map(D.problems.map(p => [p.id, p]));
  const partners = new Map(D.partners.map(p => [p.id, p]));
  const impMax = Math.max(...Object.keys(M.impacts).map(Number));
  const degMax = Math.max(...Object.keys(M.degrees).map(Number));

  document.title = M.title;
  $('#title').textContent = M.title;
  $('#subtitle').textContent = M.subtitle;
  $('#status').innerHTML = `As of ${esc(M.asOf)}. ${esc(M.status)} Sources and methodology are in the repository docs.`;
  $('#foot').innerHTML = esc(M.impactNote);

  /* ---------- indexes ---------- */
  const byProb = new Map(D.problems.map(p => [p.id, []]));
  D.links.forEach(l => byProb.get(l.n).push(l));
  const adj = new Map(D.problems.map(p => [p.id, new Set()]));
  D.edges.forEach(e => { adj.get(e.a).add(e.b); adj.get(e.b).add(e.a); });
  D.problems.forEach(p => {
    const L = byProb.get(p.id);
    const act = L.filter(l => l.k==='active' || l.k==='partial');
    p.cov = {act, plan:L.filter(l => l.k==='planned'), level: act.length>=3 ? 2 : act.length>=1 ? 1 : 0};
  });

  /* ---------- state ---------- */
  const S = {tab:'graph', labels:new Set(), nats:new Set(), imp:1, layer:'', q:'', sel:null, cm:'label', sort:{k:'id', d:1}};
  const match = p => {
    if (S.labels.size){
      const ok = (S.labels.has(L0) && p.labels.includes(L0)) || (S.labels.has(L1) && p.labels.includes(L1)) || (S.labels.has(M.verifyLabel) && p.verify);
      if (!ok) return false;
    }
    if (S.nats.size && !S.nats.has(p.nat)) return false;
    if (p.imp < S.imp) return false;
    if (S.layer && p.layer !== S.layer) return false;
    if (S.q){ const q = S.q.toLowerCase(); if (!(p.id.toLowerCase().startsWith(q) || p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q))) return false; }
    return true;
  };
  const filtered = () => D.problems.filter(match);
  const idCmp = (a,b) => a.id.localeCompare(b.id, undefined, {numeric:true});

  /* ---------- header and filters ---------- */
  function stats(){
    const P = D.problems;
    const gap = P.filter(p => p.cov.level===0 && p.imp>=3).length;
    const items = [
      [P.length, 'problems'],
      [P.filter(p => p.labels.includes(L0)).length, L0.toLowerCase()],
      [P.filter(p => p.labels.includes(L1)).length, L1.toLowerCase()],
      [P.filter(p => p.verify).length, 'need verification'],
      [D.partners.length-1, 'organisations'],
      [gap, 'high-impact problems with nobody found']
    ];
    $('#stats').innerHTML = items.map(([n,t]) => `<div class="stat"><b>${n}</b><span>${t}</span></div>`).join('');
  }
  function chip(parent, html, pressed, cb, color){
    const b = document.createElement('button'); b.type='button'; b.className='chip'; b.setAttribute('aria-pressed', pressed);
    b.innerHTML = (color ? `<i style="--c:${color}"></i>` : '') + html;
    b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); cb(on); };
    parent.appendChild(b); return b;
  }
  function filters(){
    const fl = $('#f-label');
    [...M.labels.map(l => [l.id, `[${l.id}]`, l.desc]), [M.verifyLabel, `[${M.verifyLabel}]`, 'Needs a primary-source check.']].forEach(([k,t,d]) => {
      const b = chip(fl, t, false, on => { on ? S.labels.add(k) : S.labels.delete(k); render(); }); b.title = d;
    });
    const fn = $('#f-nat');
    Object.entries(NAT).forEach(([k,v]) => { const b = chip(fn, v.name, false, on => { on ? S.nats.add(k) : S.nats.delete(k); render(); }, v.c); b.title = v.desc; });
    const sl = $('#f-layer'); sl.innerHTML = '<option value="">all</option>' + Object.entries(LAYERS).map(([k,v]) => `<option value="${k}">${k}. ${v}</option>`).join('');
    sl.onchange = () => { S.layer = sl.value; render(); };
    const si = $('#f-imp');
    si.innerHTML = '<option value="1">any</option>' + [2,3,4].map(i => `<option value="${i}">${M.impacts[i].toLowerCase()}${i<4?' or higher':' only'}</option>`).join('');
    si.onchange = e => { S.imp = +e.target.value; render(); };
    $('#f-q').oninput = e => { S.q = e.target.value.trim(); render(); };
    $('#f-reset').onclick = () => {
      S.labels.clear(); S.nats.clear(); S.imp = 1; S.layer = ''; S.q = '';
      document.querySelectorAll('.bar .chip[aria-pressed]').forEach(b => b.setAttribute('aria-pressed', 'false'));
      si.value = '1'; sl.value = ''; $('#f-q').value = ''; render();
    };
  }

  /* ---------- small renderers ---------- */
  const labelBadges = p => p.labels.map(l => `<span class="badge ${l===L0?'b-l0':'b-l1'}">${esc(l)}</span>`).join('') + (p.verify ? `<span class="badge b-q">${esc(M.verifyLabel)}</span>` : '');
  const natDot = k => `<span class="nat"><i style="background:${NAT[k].c}"></i>${NAT[k].name}</span>`;
  const bars = (n,max) => `<span class="bars" title="${n} of ${max}">${Array.from({length:max}, (_,i) => `<s class="${i<n?'on':''}"></s>`).join('')}</span>`;
  const partnerNames = p => p.cov.act.map(l => partners.get(l.p).name).join(', ') || '—';
  const classText = p => p.cls.map(c => `${c} (${M.classes[c].split(' (')[0]})`).join(', ');

  /* ---------- detail ---------- */
  function detail(){
    const el = $('#detail'), id = S.sel;
    if (!id){
      el.innerHTML = `<h2>Select a node</h2><p class="small">Click a problem or an organisation in the graph, matrix or table to see labels, the nature of its uncertainty, impact, who works on it and what it is connected to.</p>
      <div class="dsec"><span class="lab">How to read the scores</span>
      <dl class="kv"><dt>Uncertainty</dt><dd>${Object.entries(M.degrees).map(([k,v]) => `${k} ${v.toLowerCase()}`).join(' · ')}</dd><dt>Impact</dt><dd>${[4,3,2,1].map(k => `${k} ${M.impacts[k].toLowerCase()}`).join(' · ')}</dd></dl></div>`;
      return;
    }
    if (id.startsWith('P_')){
      const h = partners.get(id), L = D.links.filter(l => l.p === id);
      el.innerHTML = `<div class="dh"><h2>${esc(h.name)}</h2></div><p class="small">${esc(h.kind)}</p><p class="dsec">${esc(h.note)}</p>
        <div class="dsec"><span class="lab">Problems (${L.length})</span><div class="plist">${L.map(l => { const p = byId.get(l.n); return `<button class="mi" data-go="${p.id}"><i style="background:${NAT[p.nat].c}"></i><b>${p.id}</b><span>${esc(p.title)}<span class="tag ${l.k==='planned'?'pl':''}">${LK[l.k]}</span>${l.v?'<span class="tag">unverified</span>':''}</span></button>`; }).join('')}</div></div>`;
      bindGo(el); return;
    }
    const p = byId.get(id), c = p.cov, related = [...adj.get(id)].map(x => byId.get(x)).sort(idCmp);
    const wl = [...byProb.get(id)].sort((a,b) => ({active:0,partial:1,planned:2}[a.k]) - ({active:0,partial:1,planned:2}[b.k]));
    el.innerHTML = `
      <div class="dh"><span class="id">${p.id}</span><h2>${esc(p.title)}</h2></div>
      <div style="margin-top:6px">${labelBadges(p)}</div>
      <p class="dsec">${esc(p.text)}</p>
      <dl class="kv dsec">
        <dt>Layer</dt><dd>${p.layer}. ${LAYERS[p.layer]}</dd>
        ${p.cls.length ? `<dt>Constraint</dt><dd>${classText(p)}</dd>` : ''}
        <dt>Nature</dt><dd>${natDot(p.nat)}</dd>
        <dt>Uncertainty</dt><dd>${bars(p.deg,degMax)} ${M.degrees[p.deg]}</dd>
        <dt>Impact</dt><dd>${bars(p.imp,impMax)} ${M.impacts[p.imp]}</dd>
      </dl>
      <p class="note dsec">${NAT[p.nat].desc} ${NAT[p.nat].reduce}</p>
      <div class="dsec"><span class="lab">Who works on it</span>
        ${wl.length ? `<ul class="plist">${wl.map(l => `<li><button class="plink" data-go="${l.p}">${esc(partners.get(l.p).name)}</button><span class="tag ${l.k==='planned'?'pl':''}">${LK[l.k]}</span>${l.v?'<span class="tag">unverified</span>':''}</li>`).join('')}</ul>` : '<p class="small">Nobody found. A gap.</p>'}
      </div>
      ${related.length ? `<div class="dsec"><span class="lab">Connected problems</span><div class="rel">${related.map(r => `<button data-go="${r.id}" title="${esc(r.title)}">${r.id}</button>`).join('')}</div></div>` : ''}`;
    bindGo(el);
  }
  const bindGo = el => el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => select(b.dataset.go));
  function select(id){ S.sel = id; render(); }

  /* ---------- graph ---------- */
  let G = null, built = false, builtW = 0;
  function nodeColor(p){
    if (S.cm==='nat') return NAT[p.nat].c;
    if (S.cm==='cov') return ['var(--cov0)','var(--cov1)','var(--cov2)'][p.cov.level];
    if (p.labels.length===2) return 'var(--both)';
    return p.labels[0]===L0 ? 'var(--l0)' : 'var(--l1)';
  }
  function legend(){
    let items;
    if (S.cm==='nat') items = Object.values(NAT).map(v => [v.c, v.name]);
    else if (S.cm==='cov') items = [['var(--cov0)','nobody'],['var(--cov1)','1–2 organisations'],['var(--cov2)','3 or more']];
    else items = [['var(--l0)', L0.toLowerCase()],['var(--l1)', L1.toLowerCase()],['var(--both)','both']];
    $('#legend').innerHTML = '<span class="lab">Colour</span>' + items.map(([c,t]) => `<span><i style="background:${c}"></i>${t}</span>`).join('');
  }
  function buildGraph(){
    const svg = d3.select('#svg'); svg.selectAll('*').remove();
    const w = $('#gwrap').clientWidth || 800;
    const h = Math.round(Math.max(520, Math.min(780, w * 0.8)));
    svg.attr('viewBox', [0,0,w,h]).attr('height', h);
    const nodes = [
      ...D.problems.map(p => ({id:p.id, t:'p', p, r:4.5 + p.imp*2.4})),
      ...D.partners.map(x => ({id:x.id, t:'h', h:x, w:Math.max(56, x.name.length*6.1+14), r:20}))
    ];
    const links = [
      ...D.links.map(l => ({source:l.p, target:l.n, k:l.k})),
      ...D.edges.map(e => ({source:e.a, target:e.b, k:'pp'}))
    ];
    const keys = Object.keys(LAYERS);
    const ang = k => (keys.indexOf(k)/keys.length)*Math.PI*2 - Math.PI/2;
    const cx = w/2, cy = h/2, rx = w*0.34, ry = h*0.34;
    let seed = 7; const rnd = () => (seed = (seed*16807) % 2147483647) / 2147483647;
    nodes.forEach(n => {
      if (n.t==='p'){ n.x = cx + Math.cos(ang(n.p.layer))*rx; n.y = cy + Math.sin(ang(n.p.layer))*ry; }
      else { n.x = cx + (rnd()-.5)*60; n.y = cy + (rnd()-.5)*60; }
    });
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(l => l.k==='pp' ? 42 : 100).strength(l => l.k==='pp' ? 0.18 : (l.k==='planned' ? 0.04 : 0.1)))
      .force('charge', d3.forceManyBody().strength(d => d.t==='h' ? -420 : -48))
      .force('x', d3.forceX(d => d.t==='p' ? cx + Math.cos(ang(d.p.layer))*rx : cx).strength(d => d.t==='p' ? 0.07 : 0.03))
      .force('y', d3.forceY(d => d.t==='p' ? cy + Math.sin(ang(d.p.layer))*ry : cy).strength(d => d.t==='p' ? 0.07 : 0.03))
      .force('collide', d3.forceCollide(d => d.t==='h' ? d.w/2 + 4 : d.r + 2.5))
      .stop();
    for (let i = 0; i < 320; i++) sim.tick();
    nodes.forEach(n => { n.x = Math.max(30, Math.min(w-30, n.x)); n.y = Math.max(20, Math.min(h-20, n.y)); });

    const root = svg.append('g');
    const zoom = d3.zoom().scaleExtent([.4,4]).on('zoom', e => root.attr('transform', e.transform));
    svg.call(zoom).on('dblclick.zoom', null);
    const gl = root.append('g'), gn = root.append('g');
    const link = gl.selectAll('line').data(links).join('line').attr('class', d => 'link l-' + d.k);
    const node = gn.selectAll('g').data(nodes).join('g')
      .attr('class', d => 'node ' + (d.t==='p' ? 'n-p' : 'n-h' + (d.id===US_ID ? ' us' : '')))
      .attr('tabindex', 0)
      .on('click', (e,d) => { e.stopPropagation(); select(d.id); })
      .on('keydown', (e,d) => { if (e.key==='Enter' || e.key===' '){ e.preventDefault(); select(d.id); } })
      .call(d3.drag().on('start', (e,d) => { if (!e.active) sim.alphaTarget(.2).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e,d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e,d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
    node.filter(d => d.t==='p').each(function(d){
      const g = d3.select(this);
      g.append('circle').attr('class','sel').attr('r', d.r + 3.5).attr('display','none');
      g.append('circle').attr('class','base').attr('r', d.r);
      g.append('circle').attr('class','qring').attr('r', d.r + 2.6).attr('display', d.p.verify ? null : 'none');
      g.append('text').text(d.id);
      g.append('title').text(d.id + ' ' + d.p.title);
    });
    node.filter(d => d.t==='h').each(function(d){
      const g = d3.select(this);
      g.append('rect').attr('x', -d.w/2).attr('y', -11).attr('width', d.w).attr('height', 22).attr('rx', 5);
      g.append('text').text(d.h.name.length > 34 ? d.h.name.slice(0,32) + '…' : d.h.name);
      g.append('title').text(d.h.name);
    });
    const tick = () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    };
    sim.on('tick', tick); tick();
    svg.on('click', () => { S.sel = null; render(); });
    G = {svg, node, link, sim, zoom};
    $('#g-reset').onclick = () => svg.transition().duration(250).call(zoom.transform, d3.zoomIdentity);
  }
  function styleGraph(){
    if (!G) return;
    const showH = $('#t-hold').checked, showPP = $('#t-pp').checked, showU = $('#t-us').checked, sel = S.sel;
    let near = null;
    if (sel){
      near = new Set([sel]);
      D.links.forEach(l => { if (l.p===sel) near.add(l.n); if (l.n===sel) near.add(l.p); });
      D.edges.forEach(e => { if (e.a===sel) near.add(e.b); if (e.b===sel) near.add(e.a); });
    }
    G.node.style('display', d => d.t==='h' ? ((showH && (d.id!==US_ID || showU)) ? null : 'none') : null)
      .classed('fdim', d => d.t==='p' && !match(d.p))
      .classed('dim', d => near && !near.has(d.id));
    G.node.filter(d => d.t==='p').select('circle.base').attr('fill', d => nodeColor(d.p));
    G.node.filter(d => d.t==='p').select('circle.sel').attr('display', d => d.id===sel ? null : 'none');
    G.link.style('display', d => {
      if (d.k==='pp') return showPP ? null : 'none';
      if (!showH) return 'none';
      if ((d.source.id===US_ID || d.k==='planned') && !showU) return 'none';
      return null;
    }).classed('dim', d => near && !(near.has(d.source.id) && near.has(d.target.id) && (d.source.id===sel || d.target.id===sel)))
      .classed('hot', d => sel && (d.source.id===sel || d.target.id===sel))
      .classed('fdim', d => (d.source.t==='p' && !match(d.source.p)) || (d.target.t==='p' && !match(d.target.p)));
  }

  /* ---------- matrix ---------- */
  function matrix(){
    let h = '';
    for (let imp = impMax; imp >= 1; imp--){
      h += `<div class="ax y">${M.impacts[imp]}</div>`;
      for (let deg = 1; deg <= degMax; deg++){
        const cell = D.problems.filter(p => p.imp===imp && p.deg===deg).sort(idCmp);
        const pr = imp >= 3 && deg >= 2 && imp + deg >= 6;
        h += `<div class="cell ${pr?'pr':''}"><h3><span>${cell.length}</span></h3>` +
          cell.map(p => `<button class="mi ${match(p)?'':'off'}" data-go="${p.id}"><i style="background:${NAT[p.nat].c}"></i><b>${p.id}</b><span>${esc(p.title)}</span></button>`).join('') + '</div>';
      }
    }
    h += '<div></div>' + Object.entries(M.degrees).map(([d,t]) => `<div class="ax">${d}. ${t}</div>`).join('');
    $('#mx').innerHTML = h; bindGo($('#mx'));
    $('#natdefs').innerHTML = Object.values(NAT).map(v => `<div><b><i style="background:${v.c}"></i>${v.name}</b>${v.desc} ${v.reduce}</div>`).join('');
  }

  /* ---------- table ---------- */
  const COLS = [
    ['id','ID', p => p.id, idCmp],
    ['title','Problem', p => esc(p.title), (a,b) => a.title.localeCompare(b.title)],
    ['lab','Labels', labelBadges, (a,b) => a.labels.join().localeCompare(b.labels.join())],
    ['cls','Constraint', p => p.cls.join(', ') || '—', (a,b) => a.cls.join().localeCompare(b.cls.join())],
    ['nat','Nature', p => natDot(p.nat), (a,b) => a.nat.localeCompare(b.nat)],
    ['deg','Uncertainty', p => bars(p.deg,degMax), (a,b) => a.deg - b.deg],
    ['imp','Impact', p => bars(p.imp,impMax), (a,b) => a.imp - b.imp],
    ['par','Who works on it', p => esc(partnerNames(p)), (a,b) => a.cov.act.length - b.cov.act.length]
  ];
  function table(){
    const th = $('#tbl thead'), tb = $('#tbl tbody');
    th.innerHTML = '<tr>' + COLS.map(c => `<th data-k="${c[0]}">${c[1]}${S.sort.k===c[0] ? (S.sort.d>0 ? ' ▲' : ' ▼') : ''}</th>`).join('') + '</tr>';
    th.querySelectorAll('th').forEach(t => t.onclick = () => { S.sort = {k:t.dataset.k, d: S.sort.k===t.dataset.k ? -S.sort.d : 1}; table(); });
    const col = COLS.find(c => c[0]===S.sort.k);
    const rows = filtered().sort((a,b) => col[3](a,b)*S.sort.d || idCmp(a,b));
    tb.innerHTML = rows.map(p => `<tr class="tr" data-go="${p.id}" aria-selected="${S.sel===p.id}">${COLS.map((c,i) => `<td${i===0?' class="mono"':''}>${c[2](p)}</td>`).join('')}</tr>`).join('') || '<tr><td colspan="8" class="small">Nothing matches these filters.</td></tr>';
    tb.querySelectorAll('[data-go]').forEach(r => r.onclick = () => select(r.dataset.go));
  }

  /* ---------- coverage ---------- */
  function gaps(){
    const P = filtered();
    const sortF = (a,b) => b.imp - a.imp || b.deg - a.deg || idCmp(a,b);
    const g0 = P.filter(p => p.cov.level===0).sort(sortF);
    const hi = g0.filter(p => p.imp>=3), lo = g0.filter(p => p.imp<3);
    const row = p => `<button class="gi" data-go="${p.id}"><b>${p.id}</b><span>${esc(p.title)}${p.cov.plan.length ? '<span class="tag pl">proposed niche</span>' : ''}</span><span>${natDot(p.nat)} ${bars(p.imp,impMax)}</span></button>`;
    const covd = P.filter(p => p.cov.level>0).sort(sortF);
    const lay = Object.keys(LAYERS).map(k => { const a = D.problems.filter(p => p.layer===k); return [k, a.length, a.filter(p => p.cov.level>0).length]; });
    const none = '<p class="small">Nothing under the current filters.</p>';
    $('#gaps').innerHTML = `
      <div class="gh"><h2>High or critical impact, nobody found (${hi.length})</h2><span class="small">The best places to add value. A “proposed niche” tag means the idea is already on the list.</span></div>
      <div class="gl">${hi.map(row).join('') || none}</div>
      <div class="gh"><h2>Moderate or low impact, nobody found (${lo.length})</h2></div>
      <div class="gl">${lo.map(row).join('') || none}</div>
      <div class="gh"><h2>At least one organisation on it (${covd.length})</h2></div>
      <div class="gl">${covd.map(p => `<button class="gi" data-go="${p.id}"><b>${p.id}</b><span>${esc(p.title)}<span class="small"> · ${esc(partnerNames(p))}</span></span><span>${bars(p.imp,impMax)}</span></button>`).join('') || none}</div>
      <div class="gh"><h2>Coverage by layer</h2></div>
      <div class="gl">${lay.map(([k,n,c]) => `<div class="gi"><b>${k}</b><span>${LAYERS[k]}</span><span class="mono">${c} of ${n}</span></div>`).join('')}</div>
      <p class="note" style="margin-top:14px">“Nobody found” means no organisation was found working on the problem in the public sources collected so far. It does not prove nobody is. Treat each gap as a question to ask.</p>`;
    bindGo($('#gaps'));
  }

  /* ---------- orchestration ---------- */
  const TABS = ['graph','matrix','table','gaps'];
  function showTab(){
    TABS.forEach(t => { $('#v-'+t).hidden = S.tab !== t; });
    document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.t === S.tab));
  }
  function render(){
    showTab();
    $('#f-count').textContent = `${filtered().length} of ${D.problems.length} problems`;
    if (S.tab==='graph'){
      const w = $('#gwrap').clientWidth;
      if (!built || builtW !== w){ buildGraph(); built = true; builtW = w; }
      legend(); styleGraph();
    }
    if (S.tab==='matrix') matrix();
    if (S.tab==='table') table();
    if (S.tab==='gaps') gaps();
    detail();
  }
  document.querySelectorAll('.tab').forEach(b => b.onclick = () => { S.tab = b.dataset.t; try { history.replaceState(null, '', '#' + S.tab); } catch(e) {} render(); });
  document.querySelectorAll('[data-cm]').forEach(b => b.onclick = () => { S.cm = b.dataset.cm; document.querySelectorAll('[data-cm]').forEach(x => x.setAttribute('aria-pressed', x === b)); render(); });
  ['t-hold','t-pp','t-us'].forEach(i => $('#'+i).onchange = styleGraph);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (S.tab==='graph'){ built = false; render(); } }, 200); });
  try { const h = location.hash.slice(1); if (TABS.includes(h)) S.tab = h; } catch(e) {}
  stats(); filters(); render();
}
