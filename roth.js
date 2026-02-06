// --- DATA (S&P 500 total returns, dividends reinvested) ---
const years = [];
for (let y = 1985; y <= 2024; y++) years.push(y);

const sp500 = [
  31.73, 18.67, 5.25, 16.61, 31.69, -3.10, 30.47, 7.62, 10.08, 1.32,
  37.58, 22.96, 33.36, 28.58, 21.04, -9.10, -11.89, -22.10, 28.68, 10.88,
  4.91, 15.79, 5.49, -37.00, 26.46, 15.06, 2.11, 16.00, 32.39, 13.69,
  1.38, 11.96, 21.83, -4.38, 31.49, 18.40, 28.71, -18.11, 26.29, 25.02
];

// --- STATE ---
const divTaxRate = 15;  // fixed — you're working & earning income during accumulation
let capGainsRate = 15;  // toggleable — depends on income at retirement
const divYield = 2.0;   // S&P 500 historical average ~2%

// --- CALCULATIONS ---

// Roth: no taxes ever — just compound
function calcRoth(returns) {
  const vals = [10000];
  for (let i = 0; i < returns.length; i++) {
    vals.push(vals[i] * (1 + returns[i] / 100));
  }
  return vals;
}

// Brokerage: dividends taxed each year (reduces reinvestment)
// Total return already includes dividends. We subtract the tax on dividends.
// newBalance = balance * (1 + totalReturn) - balance * divYield * taxRate
// Cost basis grows by after-tax reinvested dividends each year.
function calcBrokerage(returns, divPct, taxPct) {
  const vals = [10000];
  const bases = [10000];
  const divTaxes = [];

  for (let i = 0; i < returns.length; i++) {
    const bal = vals[i];
    const cb = bases[i];

    const divTax = bal * (divPct / 100) * (taxPct / 100);
    divTaxes.push(divTax);

    const newBal = bal * (1 + returns[i] / 100) - divTax;
    vals.push(Math.max(0, newBal));

    const afterTaxDiv = bal * (divPct / 100) * (1 - taxPct / 100);
    bases.push(cb + afterTaxDiv);
  }

  return { vals, bases, divTaxes };
}

// After-tax value if you sold at each year
function calcAfterTax(vals, bases, taxPct) {
  return vals.map((v, i) => {
    const gains = Math.max(0, v - bases[i]);
    return v - gains * (taxPct / 100);
  });
}

// --- INITIAL CALCS ---
const rothVals = calcRoth(sp500);
// Brokerage always uses 15% div tax (working years), cap gains rate is separate
let brok = calcBrokerage(sp500, divYield, divTaxRate);
let afterTax = calcAfterTax(brok.vals, brok.bases, capGainsRate);

function fmt(n) { return '$' + Math.round(n).toLocaleString(); }

// --- CHART ---
const labels = ['1984', ...years.map(String)];
const ctx = document.getElementById('chart').getContext('2d');

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels,
    datasets: [
      {
        label: 'Roth IRA — you keep',
        data: [...rothVals],
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74,222,128,0.08)',
        fill: true, tension: 0.25, pointRadius: 0, pointHitRadius: 10, borderWidth: 2.5,
      },
      {
        label: 'Brokerage — you keep',
        data: [...afterTax],
        borderColor: '#f87171',
        backgroundColor: 'rgba(248,113,113,0.06)',
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
  const rothFinal = rothVals[40];
  const brokFinal = brok.vals[40];
  const brokAfterTax = afterTax[40];
  const capGainsTax = brokFinal - brokAfterTax;
  const totalDivTax = brok.divTaxes.reduce((a, b) => a + b, 0);
  const totalTax = totalDivTax + capGainsTax;
  const advantage = rothFinal - brokAfterTax;

  el.innerHTML = `
    <div class="card roth-card">
      <div class="label">Roth IRA — You Keep</div>
      <div class="value">${fmt(rothFinal)}</div>
      <div class="gain">$0 taxes ever</div>
    </div>
    <div class="card brok-card">
      <div class="label">Brokerage — You Keep</div>
      <div class="value">${fmt(brokAfterTax)}</div>
      <div class="gain">${fmt(totalTax)} lost to taxes</div>
    </div>
    <div class="card adv-card">
      <div class="label">Roth Advantage</div>
      <div class="value">${fmt(advantage)}</div>
      <div class="gain">${fmt(totalDivTax)} div drag + ${fmt(capGainsTax)} cap gains</div>
    </div>`;
}

// --- TABLE ---
function renderTable() {
  const tableEl = document.getElementById('table');
  let html = `<thead><tr>
    <th>Year</th><th>Age</th><th>S&P 500</th>
    <th>Roth — You Keep</th><th>Brokerage — You Keep</th><th>Gap</th>
  </tr></thead><tbody>`;

  for (let i = 0; i < 40; i++) {
    const age = 25 + i;
    const r = sp500[i];
    const rc = r >= 0 ? 'pos' : 'neg';
    const gap = rothVals[i + 1] - afterTax[i + 1];
    html += `<tr>
      <td>${years[i]}</td>
      <td>${age}</td>
      <td class="${rc}">${r >= 0 ? '+' : ''}${r.toFixed(2)}%</td>
      <td>${fmt(rothVals[i + 1])}</td>
      <td>${fmt(afterTax[i + 1])}</td>
      <td class="neg">${fmt(gap)}</td>
    </tr>`;
  }
  const finalGap = rothVals[40] - afterTax[40];
  html += `<tr style="font-weight:700;border-top:2px solid #2a2d35">
    <td colspan="3">Final</td>
    <td>${fmt(rothVals[40])}</td>
    <td>${fmt(afterTax[40])}</td>
    <td class="neg">${fmt(finalGap)}</td>
  </tr>`;
  html += '</tbody>';
  tableEl.innerHTML = html;
}

// --- UPDATE ---
function update() {
  // Brokerage accumulation always uses 15% div tax (working years)
  // Only recalc brokerage if needed — div drag doesn't change with toggle
  afterTax = calcAfterTax(brok.vals, brok.bases, capGainsRate);

  chart.data.datasets[1].data = [...afterTax];
  chart.update();

  renderCards();
  renderTable();
}

function setTaxRate(rate) {
  capGainsRate = rate;
  document.querySelectorAll('#tax-toggles .toggle-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.val) === rate);
  });
  update();
}

// --- INIT ---
update();
