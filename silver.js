// --- DATA ---
const years = [];
for (let y = 1985; y <= 2024; y++) years.push(y);

// S&P 500 total returns (dividends reinvested)
const sp500 = [
  31.73, 18.67, 5.25, 16.61, 31.69, -3.10, 30.47, 7.62, 10.08, 1.32,
  37.58, 22.96, 33.36, 28.58, 21.04, -9.10, -11.89, -22.10, 28.68, 10.88,
  4.91, 15.79, 5.49, -37.00, 26.46, 15.06, 2.11, 16.00, 32.39, 13.69,
  1.38, 11.96, 21.83, -4.38, 31.49, 18.40, 28.71, -18.11, 26.29, 25.02
];

// Silver year-end spot prices (USD/oz), 1984–2024
// Sources: LBMA London Fix, historical records
const silverPrices = [
  6.31,   // 1984 (start)
  5.94, 5.34, 6.80, 6.12, 5.63,   // 1985–1989
  4.07, 3.91, 3.69, 5.21, 4.78,   // 1990–1994
  5.18, 4.82, 6.06, 5.04, 5.33,   // 1995–1999
  4.57, 4.52, 4.73, 5.97, 6.82,   // 2000–2004
  8.83, 12.90, 14.76, 10.79, 16.99, // 2005–2009
  30.63, 28.18, 30.23, 19.50, 15.97, // 2010–2014
  13.83, 15.94, 16.87, 15.49, 17.85, // 2015–2019
  26.49, 23.35, 23.94, 24.09, 29.52  // 2020–2024
];

// --- CALCULATIONS ---
function calcSP(returns) {
  const vals = [10000];
  for (let i = 0; i < returns.length; i++) {
    vals.push(vals[i] * (1 + returns[i] / 100));
  }
  return vals;
}

// Silver: buy ounces at start, hold them
const ouncesOwned = 10000 / silverPrices[0];
const silverGrowth = silverPrices.map(p => ouncesOwned * p);

const spGrowth = calcSP(sp500);

function fmt(n) { return '$' + Math.round(n).toLocaleString(); }
function cagrCalc(start, end, yrs) { return ((Math.pow(end / start, 1 / yrs) - 1) * 100).toFixed(2); }

// --- CHART ---
const labels = ['1984', ...years.map(String)];
const ctx = document.getElementById('chart').getContext('2d');

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels,
    datasets: [
      {
        label: 'S&P 500',
        data: [...spGrowth],
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74,222,128,0.08)',
        fill: true, tension: 0.25, pointRadius: 0, pointHitRadius: 10, borderWidth: 2.5,
      },
      {
        label: 'Silver',
        data: [...silverGrowth],
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148,163,184,0.08)',
        fill: true, tension: 0.25, pointRadius: 0, pointHitRadius: 10, borderWidth: 2.5,
      }
    ]
  },
  options: {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e2028',
        titleColor: '#fff',
        bodyColor: '#ccc',
        borderColor: '#333',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(c) { return c.dataset.label + ': ' + fmt(c.parsed.y); }
        }
      }
    },
    scales: {
      x: { ticks: { color: '#555', maxTicksLimit: 20 }, grid: { color: '#1e2028' } },
      y: { ticks: { color: '#555', callback: v => '$' + (v / 1000).toFixed(0) + 'k' }, grid: { color: '#1e2028' } }
    }
  }
});

// --- CARDS ---
function renderCards() {
  const el = document.getElementById('cards');
  const spFinal = spGrowth[40];
  const agFinal = silverGrowth[40];
  const diff = spFinal - agFinal;
  const spCagr = cagrCalc(10000, spFinal, 40);
  const agCagr = cagrCalc(10000, agFinal, 40);

  el.innerHTML = `
    <div class="card sp">
      <div class="label">S&P 500</div>
      <div class="value">${fmt(spFinal)}</div>
      <div class="gain">${spCagr}% CAGR</div>
    </div>
    <div class="card silver-card">
      <div class="label">Silver</div>
      <div class="value">${fmt(agFinal)}</div>
      <div class="gain">${agCagr}% CAGR</div>
    </div>
    <div class="card diff-card">
      <div class="label">S&P 500 Advantage</div>
      <div class="value">${fmt(diff)}</div>
      <div class="gain">${Math.round(spFinal / agFinal)}x more with stocks</div>
    </div>`;
}

// --- TABLE ---
function renderTable() {
  const tableEl = document.getElementById('table');
  let html = `<thead><tr>
    <th>Year</th><th>S&P 500 Return</th><th>S&P 500 Value</th>
    <th>Silver $/oz</th><th>Silver Value</th>
  </tr></thead><tbody>`;

  for (let i = 0; i < 40; i++) {
    const r = sp500[i];
    const rc = r >= 0 ? 'pos' : 'neg';
    const silverReturn = ((silverPrices[i + 1] - silverPrices[i]) / silverPrices[i] * 100);
    const src = silverReturn >= 0 ? 'pos' : 'neg';
    html += `<tr>
      <td>${years[i]}</td>
      <td class="${rc}">${r >= 0 ? '+' : ''}${r.toFixed(2)}%</td>
      <td>${fmt(spGrowth[i + 1])}</td>
      <td class="${src}">${silverPrices[i + 1].toFixed(2)} (${silverReturn >= 0 ? '+' : ''}${silverReturn.toFixed(1)}%)</td>
      <td>${fmt(silverGrowth[i + 1])}</td>
    </tr>`;
  }
  html += `<tr style="font-weight:700;border-top:2px solid #2a2d35">
    <td>Final</td>
    <td colspan="2">${fmt(spGrowth[40])}</td>
    <td colspan="2">${fmt(silverGrowth[40])}</td>
  </tr>`;
  html += '</tbody>';
  tableEl.innerHTML = html;
}

// --- INIT ---
renderCards();
renderTable();
