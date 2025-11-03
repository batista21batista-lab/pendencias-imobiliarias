// pendencias-imobiliarias - app.js (Restored and optimized)
// Author: batista21batista-lab
// Description: Core JS for dashboard, charts, filtering and reports
// Accessibility: keyboard-friendly controls; ARIA updates; responsive charts
// Note: Dataset is expected to be provided or loaded; sample included for dev/testing

/* ==========================
   Global state and constants
   ========================== */
let statusChart = null;
let colaboradorChart = null;
let temporalChart = null;

// Sample dataset (keep minimal for demo). Replace with backend/source as needed.
// Each item: { id, cliente, colaborador, data_inclusao (YYYY-MM-DD), data_escrituracao (nullable), tipo }
const pendenciasData = window.pendenciasData || [
  { id: 1, cliente: "Cliente A", colaborador: "Ana", data_inclusao: "2025-10-02", data_escrituracao: null, tipo: "ITBI" },
  { id: 2, cliente: "Cliente B", colaborador: "Bruno", data_inclusao: "2025-09-20", data_escrituracao: "2025-10-10", tipo: "Registro" },
  { id: 3, cliente: "Cliente C", colaborador: "Ana", data_inclusao: "2025-09-28", data_escrituracao: null, tipo: "Contrato" },
];

const colaboradores = Array.from(new Set(pendenciasData.map(p => p.colaborador))).sort();

/* ==========================
   Utilities
   ========================== */
function parseISO(d) {
  return d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')) : null;
}

function diffInDays(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.floor((a - b) / ms);
}

function today() { return new Date(); }

function calculateDaysElapsed(dataInclusao, dataEscrituracao) {
  const start = parseISO(dataInclusao);
  const end = dataEscrituracao ? parseISO(dataEscrituracao) : today();
  if (!start || !end) return 0;
  return Math.max(0, diffInDays(end, start));
}

// Returns status bucket string used by charts and badges
function calculateStatus(daysElapsed, dataEscrituracao) {
  if (dataEscrituracao) return "Concluída";
  if (daysElapsed <= 7) return "No Prazo";
  if (daysElapsed <= 15) return "Atenção";
  if (daysElapsed <= 30) return "Atrasada";
  return "Crítica";
}

/* ==========================
   KPI + Dashboard rendering
   ========================== */
function updateKPIs() {
  const total = pendenciasData.length;
  const concluidas = pendenciasData.filter(p => !!p.data_escrituracao).length;
  const abertas = total - concluidas;

  const kpiTotal = document.getElementById('kpiTotal');
  const kpiAbertas = document.getElementById('kpiAbertas');
  const kpiConcluidas = document.getElementById('kpiConcluidas');

  if (kpiTotal) kpiTotal.textContent = total;
  if (kpiAbertas) kpiAbertas.textContent = abertas;
  if (kpiConcluidas) kpiConcluidas.textContent = concluidas;

  const live = document.getElementById('dashboardLiveRegion');
  if (live) live.textContent = `KPIs atualizados. Total ${total}, Abertas ${abertas}, Concluídas ${concluidas}.`;
}

function renderTable(rows = pendenciasData) {
  const tbody = document.getElementById('pendenciasTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  rows.forEach(item => {
    const tr = document.createElement('tr');
    const days = calculateDaysElapsed(item.data_inclusao, item.data_escrituracao);
    const status = calculateStatus(days, item.data_escrituracao);

    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${item.cliente}</td>
      <td>${item.colaborador}</td>
      <td><time datetime="${item.data_inclusao}">${new Date(item.data_inclusao).toLocaleDateString('pt-BR')}</time></td>
      <td>${item.data_escrituracao ? `<time datetime="${item.data_escrituracao}">${new Date(item.data_escrituracao).toLocaleDateString('pt-BR')}</time>` : '<span aria-label="Em aberto">—</span>'}</td>
      <td><span class="badge badge-${status.toLowerCase().replace(' ', '-')}">${status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function applyFilters() {
  const q = (document.getElementById('filtroBusca')?.value || '').toLowerCase();
  const colab = document.getElementById('filtroColaborador')?.value || '';
  const statusSel = document.getElementById('filtroStatus')?.value || '';

  const filtered = pendenciasData.filter(p => {
    const days = calculateDaysElapsed(p.data_inclusao, p.data_escrituracao);
    const status = calculateStatus(days, p.data_escrituracao);
    const matchesText = !q || `${p.id} ${p.cliente} ${p.colaborador} ${p.tipo}`.toLowerCase().includes(q);
    const matchesColab = !colab || p.colaborador === colab;
    const matchesStatus = !statusSel || status === statusSel;
    return matchesText && matchesColab && matchesStatus;
  });

  renderTable(filtered);
  renderStatusChart();
  renderColaboradorChart();
  renderTemporalEvolutionChart();
}

function bindFilters() {
  const wires = ['filtroBusca', 'filtroColaborador', 'filtroStatus'];
  wires.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', applyFilters);
  });

  const resetBtn = document.getElementById('btnResetFiltros');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    wires.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    applyFilters();
  });
}

/* ==========================
   Charts
   ========================== */
function renderStatusChart() {
  const ctx = document.getElementById('statusChart')?.getContext('2d');
  if (!ctx) return;
  const counts = {};
  pendenciasData.forEach(item => {
    const days = calculateDaysElapsed(item.data_inclusao, item.data_escrituracao);
    const status = calculateStatus(days, item.data_escrituracao);
    counts[status] = (counts[status] || 0) + 1;
  });
  const labels = Object.keys(counts);
  const data = Object.values(counts);

  if (statusChart) {
    statusChart.data.labels = labels;
    statusChart.data.datasets[0].data = data;
    statusChart.update();
  } else {
    statusChart = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: ['#00AA00', '#0066CC', '#FFAA00', '#FF0000', '#808080'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }
}

function renderColaboradorChart() {
  const ctx = document.getElementById('colaboradorChart')?.getContext('2d');
  if (!ctx) return;
  const counts = {};
  colaboradores.forEach(n => { counts[n] = pendenciasData.filter(p => p.colaborador === n && !p.data_escrituracao).length; });
  const labels = Object.keys(counts);
  const data = Object.values(counts);

  if (colaboradorChart) {
    colaboradorChart.data.labels = labels;
    colaboradorChart.data.datasets[0].data = data;
    colaboradorChart.update();
  } else {
    colaboradorChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Pendências Ativas', data, backgroundColor: '#1FB8CD' }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    });
  }
}

function renderTemporalEvolutionChart() {
  const ctx = document.getElementById('temporalChart')?.getContext('2d');
  if (!ctx) return;
  const labels = [];
  const series = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    const open = pendenciasData.filter(item => {
      const inc = parseISO(item.data_inclusao);
      return inc <= d && (!item.data_escrituracao || parseISO(item.data_escrituracao) > d);
    }).length;
    series.push(open);
  }

  if (temporalChart) {
    temporalChart.data.labels = labels;
    temporalChart.data.datasets[0].data = series;
    temporalChart.update();
  } else {
    temporalChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Pendências Abertas', data: series, borderColor: '#1FB8CD', backgroundColor: 'rgba(31, 184, 205, 0.1)', fill: true, tension: .4 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }
}

/* ==========================
   Reports & Exports
   ========================== */
function exportCSV() {
  const header = ['id','cliente','colaborador','data_inclusao','data_escrituracao','tipo'];
  const rows = pendenciasData.map(p => header.map(h => p[h] ?? ''));
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'pendencias.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ==========================
   Initialization
   ========================== */
function populateFilters() {
  const sel = document.getElementById('filtroColaborador');
  if (!sel) return;
  sel.innerHTML = '<option value="">Todos</option>' + colaboradores.map(c => `<option value="${c}">${c}</option>`).join('');
}

function loadDashboard() {
  populateFilters();
  updateKPIs();
  renderTable();
  renderStatusChart();
  renderColaboradorChart();
  renderTemporalEvolutionChart();
  bindFilters();

  // Bind export
  const btnExport = document.getElementById('btnExportCSV');
  if (btnExport) btnExport.addEventListener('click', exportCSV);
}

// DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadDashboard);
} else {
  loadDashboard();
}
