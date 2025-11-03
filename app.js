// ... keeping existing code above ...
function renderStatusChart(){
  const ctx=document.getElementById("statusChart").getContext("2d");
  const counts={};
  pendenciasData.forEach(item=>{const days=calculateDaysElapsed(item.data_inclusao,item.data_escrituracao);const status=calculateStatus(days,item.data_escrituracao);counts[status]=(counts[status]||0)+1;});
  const labels=Object.keys(counts);
  const data=Object.values(counts);
  if(statusChart){statusChart.data.labels=labels;statusChart.data.datasets[0].data=data;statusChart.update();}
  else{statusChart=new Chart(ctx,{type:"pie",data:{labels,datasets:[{data,backgroundColor:["#00AA00","#0066CC","#FFAA00","#FF0000","#808080"]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}}}})}

function renderColaboradorChart(){
  const ctx=document.getElementById("colaboradorChart").getContext("2d");
  const counts={}; colaboradores.forEach(n=>{counts[n]=pendenciasData.filter(p=>p.colaborador===n && !p.data_escrituracao).length;});
  const labels=Object.keys(counts); const data=Object.values(counts);
  if(colaboradorChart){colaboradorChart.data.labels=labels;colaboradorChart.data.datasets[0].data=data;colaboradorChart.update();}
  else{colaboradorChart=new Chart(ctx,{type:"bar",data:{labels,datasets:[{label:"Pendências Ativas",data,backgroundColor:"#1FB8CD"}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:"y",plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}}})}

function renderTemporalEvolutionChart(){
  const ctx=document.getElementById("temporalChart").getContext("2d");
  const labels=[]; const series=[];
  for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);labels.push(d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}));const open=pendenciasData.filter(item=>{const inc=new Date(item.data_inclusao);return inc<=d && (!item.data_escrituracao || new Date(item.data_escrituracao)>d);}).length;series.push(open);}  
  if(temporalChart){temporalChart.data.labels=labels;temporalChart.data.datasets[0].data=series;temporalChart.update();}
  else{temporalChart=new Chart(ctx,{type:"line",data:{labels,datasets:[{label:"Pendências Abertas",data:series,borderColor:"#1FB8CD",backgroundColor:"rgba(31, 184, 205, 0.1)",fill:true,tension:.4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}})}
