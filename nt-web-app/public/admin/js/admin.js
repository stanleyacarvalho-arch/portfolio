// admin.js
// - MockAPI: in-memory (simula fetch). Para integrar ao backend, substitua os métodos por fetch().
// - UI: render tabelas, charts (Chart.js), modais, theme editor (aplica live e opcionalmente salva local).

/* ================= MockAPI (troque futuramente por chamadas reais) ================= */
const useMock = true; // se false, implementa fetchs reais aqui
class MockAPI {
  constructor(){
    this.nextId = 5;
    this.events = [
      { id:1, title:"Palestra: Cultura de Inovação", type:"Palestra", start_at:"2025-09-01T10:00:00", location:"Auditório", status:"published" },
      { id:2, title:"Seminário Segurança", type:"Seminário", start_at:"2025-09-10T14:00:00", location:"Sala 203", status:"draft" },
      { id:3, title:"Workshop de Vendas", type:"Workshop", start_at:"2025-09-15T09:00:00", location:"Online", status:"published" },
      { id:4, title:"Treinamento RH", type:"Treinamento", start_at:"2025-09-18T13:00:00", location:"Sala 1", status:"published" }
    ];
  }
  async listEvents(){ await this._delay(); return JSON.parse(JSON.stringify(this.events)); }
  async getEvent(id){ await this._delay(); return JSON.parse(JSON.stringify(this.events.find(e=>e.id==id))); }
  async createEvent(payload){ await this._delay(); const ev={...payload,id:this.nextId++}; this.events.unshift(ev); return ev; }
  async updateEvent(id,payload){ await this._delay(); const i=this.events.findIndex(e=>e.id==id); if(i<0) throw new Error('Not found'); this.events[i]= {...this.events[i], ...payload}; return this.events[i]; }
  async deleteEvent(id){ await this._delay(); this.events = this.events.filter(e=>e.id!=id); return true; }
  _delay(ms=220){ return new Promise(r=>setTimeout(r,ms)); }
}
const Api = useMock ? new MockAPI() : null; // futuramente substitua por wrapper http

/* ================= UI helpers & state ================= */
let monthlyChart, deviceChart, typeChart;

document.addEventListener('DOMContentLoaded', async () => {
  // elements
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const themeBtn = document.getElementById('themeBtn');
  const themeModal = document.getElementById('themeModal');
  const closeThemeModal = document.getElementById('closeThemeModal');
  const applyThemeBtn = document.getElementById('applyThemeBtn');
  const saveThemeBtn = document.getElementById('saveThemeBtn');
  const resetThemeBtn = document.getElementById('resetThemeBtn');
  const presets = Array.from(document.querySelectorAll('.preset'));

  const eventModal = document.getElementById('eventModal');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const eventForm = document.getElementById('eventForm');

  const refreshBtn = document.getElementById('refreshBtn');
  const createEventBtn = document.getElementById('createEventBtn');
  const filterSearch = document.getElementById('filterSearch');
  const filterStatus = document.getElementById('filterStatus');

  // sidebar toggle
  sidebarToggle.addEventListener('click', () => {
    if (window.innerWidth < 680) sidebar.classList.toggle('visible'); else sidebar.classList.toggle('collapsed');
  });

  // modal open/close
  function showModal(){ eventModal.classList.add('active'); }
  function hideModal(){ eventModal.classList.remove('active'); eventForm.reset(); document.getElementById('eventId').value = ''; }
  createEventBtn.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Criar Evento';
    showModal();
  });
  closeModal.addEventListener('click', hideModal);
  cancelBtn.addEventListener('click', (e)=>{ e.preventDefault(); hideModal(); });

  // theme modal
  themeBtn.addEventListener('click', ()=> themeModal.classList.add('active'));
  closeThemeModal.addEventListener('click', ()=> themeModal.classList.remove('active'));

  // read/apply theme
  function applyThemeObj(t){
    if(!t) return;
    const root = document.documentElement;
    Object.entries(t).forEach(([k,v]) => root.style.setProperty(`--${k}`, v));
  }

  // load saved theme (optional)
  const THEME_KEY = 'nt_theme_v1';
  const savedRaw = localStorage.getItem(THEME_KEY);
  if (savedRaw) {
    try{ applyThemeObj(JSON.parse(savedRaw)); // fill inputs
      const s = JSON.parse(savedRaw);
      document.getElementById('inp_primary').value = s.primary;
      document.getElementById('inp_accent').value = s.accent;
      document.getElementById('inp_bg').value = s.bg;
      document.getElementById('inp_card').value = s.card;
    }catch(e){ console.warn(e); }
  }

  applyThemeBtn.addEventListener('click', ()=>{
    const t = {
      primary: document.getElementById('inp_primary').value,
      accent: document.getElementById('inp_accent').value,
      bg: document.getElementById('inp_bg').value,
      card: document.getElementById('inp_card').value
    };
    applyThemeObj(t);
    alert('Tema aplicado (visual). Use "Salvar local" se quiser persistir neste navegador.');
  });
  saveThemeBtn.addEventListener('click', ()=>{
    const t = {
      primary: document.getElementById('inp_primary').value,
      accent: document.getElementById('inp_accent').value,
      bg: document.getElementById('inp_bg').value,
      card: document.getElementById('inp_card').value
    };
    localStorage.setItem(THEME_KEY, JSON.stringify(t));
    alert('Tema salvo localmente (apenas neste navegador).');
  });
  resetThemeBtn.addEventListener('click', ()=>{
    const def = { primary:"#0057A3", accent:"#FFD600", bg:"#071026", card:"#0b1220" };
    document.getElementById('inp_primary').value = def.primary;
    document.getElementById('inp_accent').value = def.accent;
    document.getElementById('inp_bg').value = def.bg;
    document.getElementById('inp_card').value = def.card;
    applyThemeObj(def);
    localStorage.removeItem(THEME_KEY);
    alert('Tema restaurado para padrão.');
  });
  presets.forEach(p => p.addEventListener('click', ()=>{
    const t = JSON.parse(p.getAttribute('data-theme'));
    document.getElementById('inp_primary').value = t.primary;
    document.getElementById('inp_accent').value = t.accent;
    document.getElementById('inp_bg').value = t.bg;
    document.getElementById('inp_card').value = t.card;
    applyThemeObj(t);
  }));

  /* ================= Data flow: load + render ================= */
  async function loadAndRender(){
    const events = useMock ? await Api.listEvents() : await fetchEventsFromServer();
    renderTable(events);
    updateKPIs(events);
    renderCharts(events);
  }

  // render tabela
  function renderTable(events){
    const tbody = document.querySelector('#eventsTable tbody');
    const q = (filterSearch.value || '').toLowerCase();
    const status = filterStatus.value;

    const filtered = events.filter(e => {
      const matchesQ = !q || (e.title && e.title.toLowerCase().includes(q)) || (e.location && e.location.toLowerCase().includes(q));
      const matchesStatus = !status || e.status === status;
      return matchesQ && matchesStatus;
    });

    tbody.innerHTML = '';
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="muted">Nenhum evento encontrado.</td></tr>';
      return;
    }
    filtered.sort((a,b) => new Date(b.start_at) - new Date(a.start_at));
    filtered.slice(0,8).forEach(ev => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ev.id}</td>
        <td><strong>${escapeHtml(ev.title)}</strong></td>
        <td>${ev.type || ''}</td>
        <td>${formatDate(ev.start_at)}</td>
        <td>${escapeHtml(ev.location || '')}</td>
        <td><span class="status-pill ${ev.status==='published'?'status-published':'status-draft'}">${ev.status || ''}</span></td>
        <td style="text-align:right">
          <button class="btn" data-action="view" data-id="${ev.id}"><i class="fas fa-eye"></i></button>
          <button class="btn" data-action="edit" data-id="${ev.id}"><i class="fas fa-pen"></i></button>
          <button class="btn" data-action="delete" data-id="${ev.id}"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // KPIs
  function updateKPIs(events){
    document.getElementById('kpi-total').textContent = events.length;
    document.getElementById('kpi-published').textContent = events.filter(e=>e.status==='published').length;
    document.getElementById('kpi-drafts').textContent = events.filter(e=>e.status==='draft').length;
    const now = new Date();
    const in30 = new Date(now.getTime() + 30*24*60*60*1000);
    document.getElementById('kpi-upcoming').textContent = events.filter(e=>{
      const d = new Date(e.start_at);
      return d >= now && d <= in30;
    }).length;
  }

  // charts
  function renderCharts(events){
    // monthly demo
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const monthlyData = [12,25,18,35,50,20,18,30,22,18,12,8];

    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChart?.destroy();
    monthlyChart = new Chart(monthlyCtx, {
      type:'bar',
      data:{ labels:months, datasets:[{ label:'Receita', data:monthlyData, backgroundColor:'rgba(0,87,163,0.9)', borderRadius:6 }] },
      options:{ plugins:{legend:{display:false}}, responsive:true, maintainAspectRatio:false, scales:{y:{beginAtZero:true}} }
    });

    // device doughnut
    const deviceCtx = document.getElementById('deviceChart').getContext('2d');
    deviceChart?.destroy();
    deviceChart = new Chart(deviceCtx, {
      type:'doughnut',
      data:{ labels:['Desktop','Tablet','Mobile'], datasets:[{ data:[55,18,27], backgroundColor:['#4aa9ff','#ffd166','#ff6b6b'] }] },
      options:{ plugins:{legend:{position:'bottom'}}, cutout:'60%', responsive:true, maintainAspectRatio:false }
    });

    // type line
    const counts = {};
    events.forEach(e=> counts[e.type] = (counts[e.type]||0)+1);
    const labels = Object.keys(counts);
    const values = Object.values(counts);
    const typeCtx = document.getElementById('typeChart').getContext('2d');
    typeChart?.destroy();
    typeChart = new Chart(typeCtx, {
      type:'line',
      data:{ labels, datasets:[{ label:'Eventos', data:values, borderColor:getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#FFD600', backgroundColor:'rgba(255,214,102,0.08)', tension:0.35, fill:true }] },
      options:{ plugins:{legend:{display:false}}, responsive:true, maintainAspectRatio:false, scales:{y:{beginAtZero:true}} }
    });
  }

  // load initial
  await loadAndRender();

  // actions
  refreshBtn.addEventListener('click', loadAndRender);

  // table action delegation (view/edit/delete)
  document.querySelector('#eventsTable tbody').addEventListener('click', async (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    if(action === 'view'){
      const ev = await Api.getEvent(Number(id));
      alert(`Evento: ${ev.title}\nTipo: ${ev.type}\nLocal: ${ev.location}\nData: ${formatDate(ev.start_at)}`);
    } else if(action === 'edit'){
      const ev = await Api.getEvent(Number(id));
      document.getElementById('modalTitle').textContent = 'Editar Evento';
      document.getElementById('eventId').value = ev.id;
      document.getElementById('title').value = ev.title;
      document.getElementById('type').value = ev.type;
      // convert to local datetime-local value
      document.getElementById('start_at').value = toLocalInput(ev.start_at);
      document.getElementById('location').value = ev.location;
      showModal();
    } else if(action === 'delete'){
      if(!confirm('Confirma exclusão?')) return;
      await Api.deleteEvent(Number(id));
      await loadAndRender();
    }
  });

  // create / update submit
  eventForm.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const id = document.getElementById('eventId').value;
    const payload = {
      title: document.getElementById('title').value,
      type: document.getElementById('type').value,
      start_at: toISO(document.getElementById('start_at').value),
      location: document.getElementById('location').value,
      status: 'published'
    };
    if(id){
      await Api.updateEvent(Number(id), payload);
    } else {
      await Api.createEvent(payload);
    }
    hideModal();
    await loadAndRender();
  });

  // filters
  filterSearch.addEventListener('input', debounce(()=> loadAndRender(), 250));
  filterStatus.addEventListener('change', loadAndRender);

}); // DOMContentLoaded

/* ================= Utilities ================= */
function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g, (m)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function formatDate(iso){
  if(!iso) return '';
  const d = new Date(iso);
  if(isNaN(d)) return iso;
  return d.toLocaleString('pt-BR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
}
function toLocalInput(iso){
  if(!iso) return '';
  const d = new Date(iso);
  if(isNaN(d)) return '';
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function toISO(local){
  if(!local) return null;
  const d = new Date(local);
  if(isNaN(d)) return null;
  return d.toISOString();
}
function debounce(fn,wait=200){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),wait) } }