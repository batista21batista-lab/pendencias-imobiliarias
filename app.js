// pendencias-imobiliarias - app.js (Fixed)
// Author: batista21batista-lab
// Description: Core JS for dashboard, charts, filtering and reports
// Accessibility: keyboard-friendly controls; ARIA updates; responsive charts

/* ==========================
   Global state and constants
   ========================== */
let statusChart = null;
let colaboradorChart = null;
let temporalChart = null;

// Main data array - this will be updated when CSV is imported
let pendenciasData = window.pendenciasData || [
  { id: 1, cliente: "Cliente A", colaborador: "Ana", data_inclusao: "2025-10-02", data_escrituracao: null, tipo: "ITBI" },
  { id: 2, cliente: "Cliente B", colaborador: "Bruno", data_inclusao: "2025-09-20", data_escrituracao: "2025-10-10", tipo: "Registro" },
  { id: 3, cliente: "Cliente C", colaborador: "Ana", data_inclusao: "2025-09-28", data_escrituracao: null, tipo: "Contrato" },
];

let colaboradores = Array.from(new Set(pendenciasData.map(p => p.colaborador))).sort();

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

function today() {
  return new Date();
}

/* ==========================
   Tab Navigation Handler
   ========================== */
function initTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      this.classList.add('active');
      const activeContent = document.getElementById(targetTab);
      if (activeContent) {
        activeContent.classList.add('active');
      }
    });
  });
}

/* ==========================
   CSV Import Handler
   ========================== */
function initCSVImport() {
  const fileInput = document.getElementById('csvFileInput');
  const importBtn = document.getElementById('importBtn');
  
  if (!fileInput || !importBtn) return;
  
  importBtn.addEventListener('click', function() {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const csv = event.target.result;
        const rows = csv.split('\n').filter(row => row.trim());
        
        if (rows.length < 2) {
          alert('CSV deve ter header e dados');
          return;
        }
        
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        const newData = [];
        
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].split(',').map(v => v.trim());
          const record = {};
          
          headers.forEach((header, idx) => {
            record[header] = values[idx] || '';
          });
          
          newData.push(record);
        }
        
        // Update global data
        pendenciasData = newData;
        colaboradores = Array.from(new Set(pendenciasData.map(p => p.colaborador || 'N/A'))).sort();
        
        // Refresh all visualizations
        renderDashboard();
        updateCharts();
        renderReports();
        
        alert('CSV importado com sucesso! Dados atualizados.');
      } catch (error) {
        alert('Erro ao importar CSV: ' + error.message);
      }
    };
    reader.readAsText(file);
  });
}

/* ==========================
   Dashboard Rendering
   ========================== */
function renderDashboard() {
  // Update KPIs
  const totalPendencias = pendenciasData.length;
  const concluidas = pendenciasData.filter(p => p.data_escrituracao).length;
  const pendentes = totalPendencias - concluidas;
  
  const totalElement = document.getElementById('total-pendencias');
  const conclElement = document.getElementById('concluidas');
  const pendElement = document.getElementById('pendentes');
  
  if (totalElement) totalElement.textContent = totalPendencias;
  if (conclElement) conclElement.textContent = concluidas;
  if (pendElement) pendElement.textContent = pendentes;
}

/* ==========================
   Charts
   ========================== */
function updateCharts() {
  updateStatusChart();
  updateColaboradorChart();
  updateTemporalChart();
}

function updateStatusChart() {
  const concluidas = pendenciasData.filter(p => p.data_escrituracao).length;
  const pendentes = pendenciasData.length - concluidas;
  
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;
  
  if (statusChart) statusChart.destroy();
  
  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pendentes', 'Concluídas'],
      datasets: [{
        data: [pendentes, concluidas],
        backgroundColor: ['#ff6b6b', '#51cf66']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function updateColaboradorChart() {
  const colabData = {};
  colaboradores.forEach(colab => {
    colabData[colab] = pendenciasData.filter(p => p.colaborador === colab).length;
  });
  
  const ctx = document.getElementById('colaboradorChart');
  if (!ctx) return;
  
  if (colaboradorChart) colaboradorChart.destroy();
  
  colaboradorChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(colabData),
      datasets: [{
        label: 'Pendências por Colaborador',
        data: Object.values(colabData),
        backgroundColor: '#4ecdc4'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: true } }
    }
  });
}

function updateTemporalChart() {
  // Group by month
  const monthlyData = {};
  pendenciasData.forEach(p => {
    const month = p.data_inclusao ? p.data_inclusao.substring(0, 7) : 'Unknown';
    monthlyData[month] = (monthlyData[month] || 0) + 1;
  });
  
  const ctx = document.getElementById('temporalChart');
  if (!ctx) return;
  
  if (temporalChart) temporalChart.destroy();
  
  temporalChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(monthlyData).sort(),
      datasets: [{
        label: 'Pendências por Mês',
        data: Object.keys(monthlyData).sort().map(m => monthlyData[m]),
        borderColor: '#9b59b6',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: true } }
    }
  });
}

/* ==========================
   Reports Rendering
   ========================== */
function renderReports() {
  const tableBody = document.querySelector('#relatorio-table tbody');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  pendenciasData.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.id || ''}</td>
      <td>${item.cliente || ''}</td>
      <td>${item.colaborador || ''}</td>
      <td>${item.data_inclusao || ''}</td>
      <td>${item.data_escrituracao || 'Aberta'}</td>
      <td>${item.tipo || ''}</td>
    `;
    tableBody.appendChild(row);
  });
}

/* ==========================
   Initialization
   ========================== */
function init() {
  // Initialize event listeners
  initTabNavigation();
  initCSVImport();
  
  // Render initial dashboard
  renderDashboard();
  updateCharts();
  renderReports();
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
