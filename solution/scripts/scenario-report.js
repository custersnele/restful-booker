1// Bouwt een overzichtspagina met alle positieve en negatieve scenario's
// uit het Newman JSON-rapport.
// Gebruik: node scenario-report.js <newman-report.json> <output.html>
const fs = require('fs');

const [input, output] = process.argv.slice(2);
const report = JSON.parse(fs.readFileSync(input, 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

const typeOf = name => /\(negatief\)/.test(name) ? 'negatief'
  : /\(positief/.test(name) ? 'positief'
  : /edge case/.test(name) ? 'edge case' : 'overig';

const rows = report.run.executions.map(ex => {
  const assertions = ex.assertions || [];
  const failed = assertions.filter(a => a.error);
  return {
    name: ex.item.name,
    type: typeOf(ex.item.name),
    request: `${ex.request.method} ${ex.request.url.path.join('/')}`,
    status: ex.response ? ex.response.code : '-',
    passed: assertions.length - failed.length,
    total: assertions.length,
    failures: failed.map(a => a.error.message),
    ok: failed.length === 0 && !!ex.response,
  };
});

const count = type => {
  const r = rows.filter(x => x.type === type);
  return `${r.filter(x => x.ok).length}/${r.length}`;
};

const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Restful-Booker - scenario's</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 1000px; padding: 0 1rem; color: #222; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: .45rem .6rem; text-align: left; vertical-align: top; }
  th { background: #f3f3f3; }
  .pass { color: #0a7d2c; font-weight: 600; } .fail { color: #b3261e; font-weight: 600; }
  .tag { padding: .1rem .5rem; border-radius: 1rem; font-size: .85em; }
  .positief { background: #e3f5e8; } .negatief { background: #fde8e6; } .edge { background: #fff4d6; }
  code { background: #f6f6f6; padding: 0 .25rem; }
</style></head><body>
<h1>Restful-Booker - positieve en negatieve scenario's</h1>
<p>Run: ${esc(new Date(report.run.timings.started).toISOString())} &middot; Positief geslaagd: <b>${count('positief')}</b>
 &middot; Negatief geslaagd: <b>${count('negatief')}</b> &middot; Edge case: <b>${count('edge case')}</b></p>
<p><a href="report.html">Volledig Newman-rapport</a></p>
<table><thead><tr><th>Scenario</th><th>Type</th><th>Request</th><th>Status</th><th>Assertions</th><th>Resultaat</th></tr></thead><tbody>
${rows.map(r => `<tr>
  <td>${esc(r.name)}</td>
  <td><span class="tag ${r.type === 'edge case' ? 'edge' : r.type}">${esc(r.type)}</span></td>
  <td><code>${esc(r.request)}</code></td><td>${r.status}</td><td>${r.passed}/${r.total}</td>
  <td class="${r.ok ? 'pass' : 'fail'}">${r.ok ? 'Geslaagd' : 'Gefaald'}${r.failures.map(f => `<br><small>${esc(f)}</small>`).join('')}</td>
</tr>`).join('\n')}
</tbody></table></body></html>`;

fs.writeFileSync(output, html);
console.log(`Written ${output}`);
