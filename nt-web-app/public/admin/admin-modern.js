// admin-modern.js
// MockAPI pattern — quando quiser trocar para backend, substitua Api.* por fetchs reais
class MockAPI {
  constructor(){
    this.nextId = 6;
    this.events = [
      { id:1, title:"Palestra: Cultura de Inovação", type:"Palestra", start_at:"2025-09-01T10:00:00", location:"Auditório", status:"published" },
      { id:2, title:"Seminário Segurança", type:"Seminário", start_at:"2025-09-10T14:00:00", location:"Sala 203", status:"draft" },
      { id:3, title:"Workshop Vendas", type:"Workshop", start_at:"2025-09-15T09:00:00", location:"Online", status:"published" },
      { id:4, title:"Treinamento RH", type:"Treinamento", start_at:"2025-09-18T13:00:00", location:"Sala 1", status:"published" },
      { id:5, title:"Seminário Saúde", type:"Seminário", start_at:"2025-09-25T09:00:00", location:"Auditório B", status:"published" }
    ];
  }
  async listEvents(){ await this._wait(); return JSON.parse(JSON.stringify(this.events)); }
  async getEvent(id){ await this._wait(); return JSON.parse(JSON.stringify(this.events.find(e=>e.id==id))); }
  async createEvent(payload){ await this._wait(); const ev = {...payload, id:this.nextId++}; this.events.unshift(ev); return ev; }
  async updateEvent(id,payload){ await this._wait(); const i=this.events.findIndex(e=>e.id==id); this.events[i] = {...this.events[i], ...payload}; return this.events[i]; }
  async deleteEvent(id){ await this._wait(); this.events = this.events.filter(e=>e.id!=id); return true; }
  _wait(ms=220){ return new Promise(r=>setTimeout(r,ms)); }
}
const Api = new MockAPI();

// Charts state
let mainChart, deviceChart, miniChart;

document.addEventListener('DOMContentLoaded', async () => {
  // UI refs
  const sidebar = document.querySelector('.sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const createBtn = document.getElementById('createEventBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const eventsBody = document.querySelector('#eventsTable tbody');
  const modal = document.getElementById('eventModal');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const eventForm = document.getElementById('eventForm');
  const themeBtn = document.getElementById('themeBtn');
  const themeModal = document.getElementById('themeModal');
  const closeTheme = document.getElementById('closeTheme');
  const applyTheme = document.getElementById('applyTheme');

  // toggle sidebar
  sidebarToggle.addEventListener('click', ()=> {
    if (window.innerWidth < 760) sidebar.classList.toggle('open');
    else sidebar.classList.toggle('collapsed');
  });

  // modal handlers
  function openModal(edit=false, ev=null){
    modal.classList.add('active');
    document.getElementById('modalTitle').textContent = edit ? 'Editar Evento' : 'Criar Evento';
    if(edit && ev){
      document.getElementById('eventId').value = ev.id;
      document.getElementById('title').value = ev.title;
      document.getElementById('type').value = ev.type;
      document.getElementById('start_at').value = toLocalInput(ev.start_at);
      document.getElementById('location').value = ev.location;
    } else {
      eventForm.reset();
      document.getElementById('eventId').value = '';
    }
  }
  function closeModalFn(){ modal.classList.remove('active'); }

  createBtn.addEventListener('click', ()=> openModal(false));
  closeModal.addEventListener('click', closeModalFn);
  cancelBtn.addEventListener('click', (e)=>{ e.preventDefault(); closeModalFn(); });

  // theme modal
  themeBtn.addEventListener('click', ()=> themeModal.classList.add('active'));
  closeTheme.addEventListener('click', ()=> themeModal.classList.remove('active'));
  applyTheme.addEventListener('click', ()=> {
    const t = {
      primary: document.getElementById('inp_primary').value,
      accent: document.getElementById('inp_accent').value,
      bg: document.getElementById('inp_bg').value,
      card: document.getElementById('inp_card').value
    };
    applyThemeVars(t);
    themeModal.classList.remove('active');
  });

  // apply theme variables
  function applyThemeVars(t){
    const root = document.documentElement;
    root.style.setProperty('--primary', t.primary);
    root.style.setProperty('--primary-500', shade(t.primary, -12));
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--bg-grad-a', t.bg);
    root.style.setProperty('--bg-grad-b', shade(t.bg, -8));
    root.style.setProperty('--card', hexToRgba(t.card, 0.04));
  }

  // helpers for color manipulation (small)
  function hexToRgba(hex, a=0.04){
    const c = hex.replace('#','');
    const r = parseInt(c.substring(0,2),16);
    const g = parseInt(c.substring(2,4),16);
    const b = parseInt(c.substring(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }
  function shade(hex, percent){
    // simple darken/lighten
    const num = parseInt(hex.replace("#",""),16), amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (clamp(R)*0x10000) + (clamp(G)*0x100) + clamp(B)).toString(16).slice(1);
    function clamp(v){ return Math.max(0, Math.min(255, v)); }
  }

  /* ========== load data & render ========== */
  async function load(){
    const events = await Api.listEvents();
    renderEventsTable(events);
    updateKPIs(events);
    renderAllCharts(events);
  }

  function renderEventsTable(events){
    eventsBody.innerHTML = '';
    events.slice(0,6).forEach(ev => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(ev.title)}</strong></td>
        <td>${ev.type}</td>
        <td>${formatDate(ev.start_at)}</td>
        <td>${escapeHtml(ev.location)}</td>
        <td><span class="${ev.status==='published'?'pill green':'pill muted'}">${ev.status}</span></td>
        <td style="text-align:right">
          <button class="icon-btn view" data-id="${ev.id}" title="Ver"><i class="fas fa-eye"></i></button>
          <button class="icon-btn edit" data-id="${ev.id}" title="Editar"><i class="fas fa-pen"></i></button>
          <button class="icon-btn del" data-id="${ev.id}" title="Excluir"><i class="fas fa-trash"></i></button>
        </td>
      `;
      eventsBody.appendChild(tr);
    });

    // actions
    eventsBody.querySelectorAll('.view').forEach(b => b.addEventListener('click', async (e)=>{
      const id = b.getAttribute('data-id');
      const ev = await Api.getEvent(Number(id));
      alert(`${ev.title}\n\nTipo: ${ev.type}\nLocal: ${ev.location}\nData: ${formatDate(ev.start_at)}`);
    }));
    eventsBody.querySelectorAll('.edit').forEach(b => b.addEventListener('click', async ()=>{
      const id = b.getAttribute('data-id');
      const ev = await Api.getEvent(Number(id));
      openModal(true, ev);
    }));
    eventsBody.querySelectorAll('.del').forEach(b => b.addEventListener('click', async ()=>{
      const id = b.getAttribute('data-id');
      if(!confirm('Excluir evento?')) return;
      await Api.deleteEvent(Number(id));
      await load();
    }));
  }

  function updateKPIs(events){
    document.getElementById('kpiTotal').textContent = events.length;
    // participation mock
    document.getElementById('kpiAvg').textContent = '68%';
    document.getElementById('metricA').textContent = '68.4K';
    document.getElementById('metricB').textContent = '85,247';
  }

  function renderAllCharts(events){
    // main chart (line+bar mix) - demo data
    const ctx = document.getElementById('mainChart').getContext('2d');
    mainChart?.destroy();
    mainChart = new Chart(ctx, {
      type:'bar',
      data:{
        labels:['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
        datasets:[
          { type:'line', label:'Engajamento', data:[30,45,28,60,80,55,40,72,58,48,35,28], borderColor:getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#FFD600', backgroundColor:'rgba(255,214,102,0.06)', tension:0.35, fill:true, yAxisID:'y' },
          { type:'bar', label:'Eventos', data:[6,8,5,9,12,7,6,10,8,7,5,3], backgroundColor:getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#0057A3', borderRadius:6 }
        ]
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}
    });

    // mini sparklines
    const miniCtx = document.getElementById('miniSparklines').getContext('2d');
    miniChart?.destroy();
    miniChart = new Chart(miniCtx, {
      type:'line',
      data:{ labels:[1,2,3,4,5,6,7], datasets:[{ data:[8,12,9,15,18,12,20], borderColor:getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#0057A3', backgroundColor:'rgba(0,87,163,0.09)', fill:true, tension:0.4 }]},
      options:{plugins:{legend:{display:false}},elements:{point:{radius:0}},scales:{x:{display:false},y:{display:false}},maintainAspectRatio:false}
    });

    // device donut
    const dctx = document.getElementById('deviceChart').getContext('2d');
    deviceChart?.destroy();
    deviceChart = new Chart(dctx, {
      type:'doughnut',
      data:{ labels:['Desktop','Mobile','Tablet'], datasets:[{ data:[55,27,18], backgroundColor:[getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#0057A3','#10b981',getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#FFD600'] }]},
      options:{plugins:{legend:{display:false}},cutout:'68%'}
    });

    // update small legend percentages
    document.getElementById('desktopPct').textContent = '55%';
    document.getElementById('mobilePct').textContent = '27%';
    document.getElementById('tabletPct').textContent = '18%';
  }

  // form submit (create/edit)
  eventForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
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
    closeModalFn();
    await load();
  });

  // refresh
  refreshBtn.addEventListener('click', load);

  // initial load
  await load();
});

/* ================== util helpers ================== */
function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function formatDate(iso){ if(!iso) return ''; const d=new Date(iso); if(isNaN(d)) return iso; return d.toLocaleString('pt-BR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}); }
function toLocalInput(iso){ if(!iso) return ''; const d=new Date(iso); if(isNaN(d)) return ''; const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }
function toISO(local){ if(!local) return null; const d=new Date(local); if(isNaN(d)) return null; return d.toISOString(); }