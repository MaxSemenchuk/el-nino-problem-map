/* El Niño 2026–27 reading list. Driven by data/research.json; problem titles come from data/problems.json. */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

Promise.all([
  fetch('data/research.json').then(r => r.json()),
  fetch('data/problems.json').then(r => r.json()).catch(() => ({problems: []}))
]).then(([R, P]) => start(R, P)).catch(e => {
  $('#list').innerHTML = '<p>Could not load data/research.json. If you opened this file directly, serve the folder instead, for example <code>python3 -m http.server</code>.</p>';
  console.error(e);
});

function start(R, P){
  const M = R.meta;
  const titles = new Map(P.problems.map(p => [p.id, p.title]));
  const THEMES = M.themes;
  let active = 'all';
  try { const t = localStorage.getItem('research-theme'); if (t && THEMES.some(x => x.id === t)) active = t; } catch(e) {}

  $('#asof').textContent = `Reading list · ${M.asOf}`;
  $('#intro').innerHTML = esc(M.intro).replace('problems on the map', '<a href="problems.html">problems on the map</a>');
  $('#take').innerHTML = M.takeaways.map(t => `<div><strong>${esc(t.title)}</strong><p>${esc(t.text)}</p></div>`).join('');

  const ptag = id => titles.has(id)
    ? `<a class="ptag" href="problems.html?p=${encodeURIComponent(id)}" title="Open problem ${esc(id)} on the map"><b>${esc(id)}</b>${esc(titles.get(id))}</a>`
    : `<span class="ptag"><b>${esc(id)}</b></span>`;
  $('#gaps').innerHTML = M.gaps.map(g => `<li>${esc(g.text)} <span class="ptags">${g.problems.map(ptag).join('')}</span></li>`).join('');
  $('#foot').innerHTML = `${esc(M.method)} Data: <a href="data/research.json">data/research.json</a> (CC BY 4.0). Suggest a source, see <a href="https://github.com/MaxSemenchuk/el-nino-problem-map/blob/main/CONTRIBUTING.md">CONTRIBUTING</a>.`;

  function renderFilters(){
    const btns = [{id:'all', name:'All themes'}, ...THEMES];
    $('#filters').innerHTML = btns.map(b => {
      const n = b.id === 'all' ? R.items.length : R.items.filter(e => e.theme === b.id).length;
      return `<button type="button" id="f-${b.id}" data-id="${b.id}" aria-pressed="${active === b.id}">${esc(b.name)} · ${n}</button>`;
    }).join('');
  }
  function renderList(){
    $('#list').innerHTML = THEMES.filter(th => active === 'all' || th.id === active).map(th => {
      const items = R.items.filter(e => e.theme === th.id).sort((a, b) => (b.first ? 1 : 0) - (a.first ? 1 : 0));
      return `<section class="theme"><h2>${esc(th.name)}</h2><p>${esc(th.note)}</p>` + items.map(e => `
        <article class="entry" id="r-${esc(e.id)}">
          <h3><i class="dot ${e.status}" title="${e.status === 'checked' ? 'checked against the source' : 'found, not read in full'}"></i><a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a></h3>
          <div class="meta"><span>${esc(e.who)}</span><span>${esc(e.date)}</span>${e.first ? '<span class="first">read first</span>' : ''}</div>
          <p class="why">${esc(e.why)}</p>
          ${e.facts.length ? `<ul class="facts">${e.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
          <div class="ptags">${e.problems.map(ptag).join('')}</div>
        </article>`).join('') + '</section>';
    }).join('');
  }
  $('#filters').addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    active = b.dataset.id;
    try { localStorage.setItem('research-theme', active); } catch(e) {}
    renderFilters(); renderList();
  });
  // A link to one entry (#r-id) shows all themes so the entry exists.
  if (location.hash.startsWith('#r-')) active = 'all';
  renderFilters(); renderList();
  if (location.hash.startsWith('#r-')) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
}
