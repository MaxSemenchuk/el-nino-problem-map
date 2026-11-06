/* Coordination funders page. Reads data/funders.json and data/problems.json. */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

Promise.all(['data/funders.json', 'data/problems.json'].map(u => fetch(u).then(r => r.json())))
  .then(([F, P]) => start(F, P))
  .catch(e => {
    document.body.insertAdjacentHTML('afterbegin', '<p style="padding:16px">Could not load the data files. If you opened this file directly, serve the folder instead, for example <code>python3 -m http.server</code>.</p>');
    console.error(e);
  });

function start(F, P){
  const M = F.meta, FN = M.functions, FITS = M.fits;
  const probs = new Map(P.problems.map(p => [p.id, p]));
  const S = {fit: 'all', fn: 'all', cov: 'all'};

  $('#figures').innerHTML = F.figures.map(f => `<div class="stat"><b>${esc(f.value)}</b><span>${esc(f.label)} · <a href="${f.src}">source</a></span></div>`).join('');

  const btn = (grp, key, val, label, on) => `<button type="button" id="${grp}-${val}" data-${key}="${val}" aria-pressed="${on}">${esc(label)}</button>`;
  $('#fit-filters').insertAdjacentHTML('beforeend', btn('fit','fit','all','All',true) + Object.entries(FITS).map(([k,v]) => btn('fit','fit',k,v,false)).join(''));
  $('#fn-filters').insertAdjacentHTML('beforeend', btn('fn','fn','all','All',true) + Object.entries(FN).map(([k,v]) => btn('fn','fn',k,v.name,false)).join(''));

  const chip = id => { const p = probs.get(id); return p ? `<a class="chip" href="problems.html?p=${encodeURIComponent(id)}" title="${esc(p.title)}">${esc(id)}</a>` : ''; };

  function list(){
    const items = F.funders.filter(f => (S.fit === 'all' || f.fit === S.fit) && (S.fn === 'all' || f.functions.includes(S.fn)));
    $('#list').innerHTML = items.map(f => `
      <article class="f" id="${f.id}">
        <div><h3>${esc(f.name)}${f.verify ? '<span class="verify">VERIFY</span>' : ''}</h3><div class="kind">${esc(f.kind)}</div></div>
        <span class="fit ${f.fit}">${esc(FITS[f.fit])}</span>
        <dl>
          <dt>What it funds</dt><dd>${esc(f.what)}</dd>
          <dt>Money and windows</dt><dd>${esc(f.money)}</dd>
          <dt>How to reach it</dt><dd>${esc(f.access)}</dd>
          <dt>Coordination work</dt><dd class="chips">${f.functions.map(k => `<span class="fn" title="${esc(FN[k].desc)}">${esc(FN[k].name)}</span>`).join('')}</dd>
          <dt>Problems it touches</dt><dd class="chips">${f.problems.map(chip).join('')}</dd>
          ${f.src.length ? `<dt>Sources</dt><dd class="src">${f.src.map(([t,u]) => `<a href="${u}">${esc(t)}</a>`).join('')}</dd>` : ''}
        </dl>
      </article>`).join('') || '<p class="small muted">No funder matches these filters.</p>';
  }

  const byProblem = new Map();
  F.funders.forEach(f => f.problems.forEach(id => { if (!byProblem.has(id)) byProblem.set(id, []); byProblem.get(id).push(f); }));

  function cov(){
    const L = P.meta.layers;
    let h = '', last = null;
    for (const p of P.problems){
      const fs = byProblem.get(p.id) || [];
      if (S.cov === 'gaps' && fs.length) continue;
      if (p.layer !== last){ last = p.layer; h += `<tr class="layer"><td colspan="4">${esc(L[p.layer] !== undefined ? `${p.layer}. ${L[p.layer]}` : p.layer)}</td></tr>`; }
      h += `<tr class="${fs.length ? '' : 'gap'}"><td class="id"><a href="problems.html?p=${encodeURIComponent(p.id)}">${esc(p.id)}</a></td><td>${esc(p.title)}</td><td class="n">${fs.length}</td><td class="who">${fs.map(f => `<a href="#${f.id}">${esc(f.name.split(/[:(,]/)[0].trim())}</a>`).join(', ') || '<span class="gapnote">No funder found</span>'}</td></tr>`;
    }
    $('#cov').innerHTML = h;
  }

  function wire(sel, key){
    document.querySelectorAll(`${sel} button`).forEach(b => b.onclick = () => {
      S[key] = b.dataset[key === 'cov' ? 'c' : key];
      document.querySelectorAll(`${sel} button`).forEach(x => x.setAttribute('aria-pressed', x === b));
      key === 'cov' ? cov() : list();
    });
  }
  wire('#fit-filters', 'fit'); wire('#fn-filters', 'fn'); wire('#cov-filters', 'cov');
  list(); cov();
  if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }
}
