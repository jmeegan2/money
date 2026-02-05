// --- DATA ---
const years = [];
for (let y = 1985; y <= 2024; y++) years.push(y);

const sp500 = [
  31.73, 18.67, 5.25, 16.61, 31.69, -3.10, 30.47, 7.62, 10.08, 1.32,
  37.58, 22.96, 33.36, 28.58, 21.04, -9.10, -11.89, -22.10, 28.68, 10.88,
  4.91, 15.79, 5.49, -37.00, 26.46, 15.06, 2.11, 16.00, 32.39, 13.69,
  1.38, 11.96, 21.83, -4.38, 31.49, 18.40, 28.71, -18.11, 26.29, 25.02
];

const totalMkt = [
  31.73, 18.67, 5.25, 16.61, 31.69, -3.10, 30.47, 7.62,
  10.62, -0.17, 35.79, 20.96, 30.99, 23.26, 23.81, -10.57,
  -10.97, -20.96, 31.35, 12.52, 5.98, 15.51, 5.49, -37.04,
  28.70, 17.09, 0.96, 16.25, 33.35, 12.43, 0.29, 12.53,
  21.05, -5.26, 30.65, 20.87, 25.59, -19.60, 25.89, 23.61
];

const bonds = [
  22.10, 15.26, 2.76, 7.89, 14.53, 8.96, 16.00, 7.40, 9.75, -2.92,
  18.47, 3.63, 9.65, 8.69, -0.82, 11.63, 8.44, 10.26, 4.10, 4.34,
  2.43, 4.33, 6.97, 5.24, 5.93, 6.54, 7.84, 4.21, -2.02, 5.97,
  0.55, 2.65, 3.54, 0.01, 8.72, 7.51, -1.54, -13.01, 5.53, 1.25
];

// --- CALCULATIONS ---
function calcGrowth(returns) {
  const vals = [10000];
  for (let i = 0; i < returns.length; i++) {
    vals.push(vals[i] * (1 + returns[i] / 100));
  }
  return vals;
}

function calcAgeBonds(stockReturns, bondReturns, startAge, offset) {
  const vals = [10000];
  const blended = [];
  for (let i = 0; i < stockReturns.length; i++) {
    const age = startAge + i;
    const bondPct = Math.max(0, age - offset) / 100;
    const stockPct = 1 - bondPct;
    const ret = stockPct * stockReturns[i] + bondPct * bondReturns[i];
    blended.push(ret);
    vals.push(vals[i] * (1 + ret / 100));
  }
  return { vals, blended };
}

const spGrowth = calcGrowth(sp500);
const tmGrowth = calcGrowth(totalMkt);

function fmt(n) { return '$' + Math.round(n).toLocaleString(); }
function cagrCalc(start, end, yrs) { return ((Math.pow(end / start, 1 / yrs) - 1) * 100).toFixed(2); }

// --- CHART SETUP ---
const labels = ['1984', ...years.map(String)];
const ctx = document.getElementById('chart').getContext('2d');

let currentOffset = 10;
let ab = calcAgeBonds(totalMkt, bonds, 25, currentOffset);

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [
      {
        label: '100% S&P 500',
        data: spGrowth,
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74,222,128,0.08)',
        fill: true, tension: 0.25, pointRadius: 0, pointHitRadius: 10, borderWidth: 2.5,
      },
      {
        label: '100% Total US Market',
        data: tmGrowth,
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96,165,250,0.06)',
        fill: true, tension: 0.25, pointRadius: 0, pointHitRadius: 10, borderWidth: 2.5,
      },
      {
        label: 'Age minus 10',
        data: [...ab.vals],
        borderColor: '#facc15',
        backgroundColor: 'rgba(250,204,21,0.06)',
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
      y: { ticks: { color: '#555', callback: v => '$' + (v/1000).toFixed(0) + 'k' }, grid: { color: '#1e2028' } }
    }
  }
});

function renderCards() {
  const cardsEl = document.getElementById('cards');
  const bondLabel = 'Age minus ' + currentOffset;
  const results = [
    { cls: 'sp', label: '100% S&P 500', val: spGrowth[40] },
    { cls: 'tm', label: '100% Total US Market', val: tmGrowth[40] },
    { cls: 'ab', label: bondLabel, val: ab.vals[40] },
  ];
  cardsEl.innerHTML = '';
  results.forEach(r => {
    const gain = r.val - 10000;
    const c = cagrCalc(10000, r.val, 40);
    cardsEl.innerHTML += `
      <div class="card ${r.cls}">
        <div class="label">${r.label}</div>
        <div class="value">${fmt(r.val)}</div>
        <div class="gain">+${fmt(gain)} gain</div>
        <div class="cagr">${c}% CAGR</div>
      </div>`;
  });
}

function renderTable() {
  const tableEl = document.getElementById('table');
  let html = `<thead><tr>
    <th>Year</th><th>Age</th>
    <th>S&P 500 Return</th><th>S&P 500 Balance</th>
    <th>Total Mkt Return</th><th>Total Mkt Balance</th>
    <th>Bond Alloc %</th><th>Blended Return</th><th>Bond-Mix Balance</th>
  </tr></thead><tbody>`;
  for (let i = 0; i < 40; i++) {
    const age = 25 + i;
    const bondAlloc = Math.max(0, age - currentOffset);
    const spR = sp500[i], tmR = totalMkt[i], abR = ab.blended[i];
    const spC = spR >= 0 ? 'pos' : 'neg';
    const tmC = tmR >= 0 ? 'pos' : 'neg';
    const abC = abR >= 0 ? 'pos' : 'neg';
    html += `<tr>
      <td>${years[i]}</td>
      <td>${age}</td>
      <td class="${spC}">${spR >= 0 ? '+' : ''}${spR.toFixed(2)}%</td>
      <td>${fmt(spGrowth[i + 1])}</td>
      <td class="${tmC}">${tmR >= 0 ? '+' : ''}${tmR.toFixed(2)}%</td>
      <td>${fmt(tmGrowth[i + 1])}</td>
      <td>${bondAlloc}%</td>
      <td class="${abC}">${abR >= 0 ? '+' : ''}${abR.toFixed(2)}%</td>
      <td>${fmt(ab.vals[i + 1])}</td>
    </tr>`;
  }
  html += '</tbody>';
  tableEl.innerHTML = html;
}

function setMode(offset) {
  currentOffset = offset;
  ab = calcAgeBonds(totalMkt, bonds, 25, offset);

  chart.data.datasets[2].data = [...ab.vals];
  chart.data.datasets[2].label = 'Age minus ' + offset;
  chart.update();

  document.getElementById('legend-bond-label').textContent =
    offset === 10
      ? 'Age minus 10 (age 25 = 15% bonds \u2192 age 65 = 55% bonds)'
      : 'Age minus 20 (age 25 = 5% bonds \u2192 age 65 = 45% bonds)';

  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(offset));
  });

  renderCards();
  renderTable();
}

// initial render
setMode(10);
