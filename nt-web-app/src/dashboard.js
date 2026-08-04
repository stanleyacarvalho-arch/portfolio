// ================= Configuração de Check-in =================
const minMinutesBeforeCheckin = 5; // pode vir do admin futuramente

function canCheckin(eventStartDateTime) {
  const now = new Date();
  const start = new Date(eventStartDateTime);
  const diffMs = start - now;
  const diffMin = diffMs / 60000;
  return diffMin <= minMinutesBeforeCheckin;
}

// ================= Dados de Eventos (mock) =================
const eventsData = {
  0: {
    type: 'Palestra',
    title: 'Inovação e Tecnologia',
    date: '25 de Agosto, 2024',
    time: '14:00 - 16:00',
    startDateTime: '2024-08-25T14:00:00',
    location: 'Auditório Principal',
    capacity: '45 de 50 vagas',
    description:
      'Este evento abordará as principais tendências em inovação e tecnologia, com foco em transformação digital e impacto nos negócios. Palestrantes renomados compartilharão insights sobre IA, automação e futuro do trabalho.',
    image: 'assets/evento0.jpeg',
    farewellMessage: 'Obrigado por participar! Continue inovando conosco. Até a próxima!',
  },
  1: {
    type: 'Curso',
    title: 'Gestão de Projetos',
    date: '28 de Agosto, 2024',
    time: '09:00 - 17:00',
    startDateTime: '2024-08-28T09:00:00',
    location: 'Sala de Treinamento',
    capacity: '12 de 15 vagas',
    description:
      'Curso intensivo sobre metodologias ágeis e gestão de projetos. Aprenda técnicas práticas para liderar equipes, gerenciar recursos e entregar resultados de qualidade no prazo.',
    image: 'assets/evento1.jpeg',
    farewellMessage: 'Parabéns por concluir o curso! Aplique os conhecimentos e tenha sucesso!',
  },
  2: {
    type: 'Seminário',
    title: 'Sustentabilidade Corporativa',
    date: '02 de Setembro, 2024',
    time: '08:00 - 12:00',
    startDateTime: '2024-09-02T08:00:00',
    location: 'Centro de Convenções',
    capacity: '80 de 100 vagas',
    description:
      'Discussão sobre práticas sustentáveis no ambiente corporativo, responsabilidade social e impacto ambiental. Cases de sucesso e estratégias para implementação de políticas verdes.',
    image: 'assets/evento2.jpeg',
    farewellMessage: 'Obrigado pela participação! Juntos construímos um futuro mais sustentável!',
  },
};

// ================= Persistência & Estado de Feedback =================
// Estrutura: { [eventId]: { liked: true/false/null, comment: string, submitted: boolean, pointsAwarded: number } }
const FEEDBACK_STORAGE_KEY = 'eventsFeedbacks_v1';
let eventsFeedbacks = loadFeedbacksFromStorage();

function loadFeedbacksFromStorage() {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Erro ao carregar feedbacks do localStorage', e);
    return {};
  }
}

function saveFeedbacksToStorage() {
  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(eventsFeedbacks));
  } catch (e) {
    console.error('Erro ao salvar feedbacks no localStorage', e);
  }
}

// ================= Sistema de QR Code =================
class QRCheckSystem {
  constructor() {
    this.checkStatus = 'none'; // 'none', 'checked-in', 'checked-out'
    this.eventId = null;

    // callback que pode ser setado externamente: (eventId, newStatus) => {}
    this.onStateChange = null;

    // Elementos do modal de QR (existem no DOM do modal do evento)
    this.qrScanBtn = document.getElementById('qrScanBtn');
    this.qrModal = document.getElementById('qrModal');
    this.qrCloseBtn = document.getElementById('qrCloseBtn');
    this.qrBtnText = document.getElementById('qrBtnText');
    this.qrStatus = document.getElementById('qrStatus');
    this.qrModalTitle = document.getElementById('qrModalTitle');
    this.checkStatusMsg = document.getElementById('checkStatusMsg');
    this.farewellMsg = document.getElementById('farewellMsg');

    this.initListeners();
  }

  initListeners() {
    if (this.qrScanBtn) {
      this.qrScanBtn.addEventListener('click', () => {
        if (!this.qrScanBtn.disabled) this.openQRModal();
      });
    }
    if (this.qrCloseBtn) {
      this.qrCloseBtn.addEventListener('click', () => this.closeQRModal());
    }
  }

  setStatus(newStatus) {
    this.checkStatus = newStatus;
    this.updateCheckinButton();
    // notifica listener externo
    if (typeof this.onStateChange === 'function') {
      try {
        this.onStateChange(this.eventId, this.checkStatus);
      } catch (e) {
        console.error('onStateChange error', e);
      }
    }
  }

  initializeForEvent(eventId) {
    this.eventId = eventId;
    this.checkStatus = 'none';
    this.updateCheckinButton();
    this.hideFarewellMessage();
  }

  updateCheckinButton() {
    if (!this.qrScanBtn || !this.qrBtnText || !this.checkStatusMsg) return;

    if (this.checkStatus === 'none') {
      this.qrScanBtn.classList.remove('completed');
      this.qrScanBtn.disabled = false; // habilita por padrão; validação de horário ajusta depois
      this.qrBtnText.textContent = 'Escanear QR Code - Check-in';
      this.checkStatusMsg.textContent = '';
      this.checkStatusMsg.style.display = 'none';
      this.qrScanBtn.style.background = '#1976d2';
    } else if (this.checkStatus === 'checked-in') {
      this.qrScanBtn.classList.add('completed');
      this.qrScanBtn.disabled = false;
      this.qrBtnText.textContent = 'Escanear QR Code - Check-out';
      this.qrScanBtn.style.background = '#1976d2';
      this.checkStatusMsg.textContent = 'Check-in realizado com sucesso!';
      this.checkStatusMsg.style.display = 'block';
      this.checkStatusMsg.style.color = '#1976d2';
    } else if (this.checkStatus === 'checked-out') {
      this.qrScanBtn.classList.add('completed');
      this.qrScanBtn.disabled = true;
      this.qrBtnText.textContent = 'Check-out Realizado!';
      this.qrScanBtn.style.background = '#4caf50';
      this.checkStatusMsg.textContent = 'Check-out realizado com sucesso!';
      this.checkStatusMsg.style.display = 'block';
      this.checkStatusMsg.style.color = '#4caf50';
      this.showFarewellMessage();
    }
  }

  showFarewellMessage() {
    if (this.farewellMsg && this.eventId !== null && eventsData[this.eventId]) {
      const event = eventsData[this.eventId];
      this.farewellMsg.textContent =
        event.farewellMessage || 'Evento realizado com sucesso, até a próxima!';
      this.farewellMsg.style.display = 'block';
    }
  }

  hideFarewellMessage() {
    if (this.farewellMsg) this.farewellMsg.style.display = 'none';
  }

  openQRModal() {
    if (this.qrModal) this.qrModal.style.display = 'flex';
    if (this.qrStatus) this.qrStatus.textContent = '';

    if (this.qrModalTitle) {
      this.qrModalTitle.textContent =
        this.checkStatus === 'none'
          ? 'Escaneie o QR Code para Check-in'
          : 'Escaneie o QR Code para Check-out';
    }

    if (this.qrStatus) {
      this.qrStatus.innerHTML =
        this.checkStatus === 'none'
          ? '<button onclick="qrSystem.simulateCheckin()" style="margin:8px 8px 0 0; padding:8px 16px; background:#4caf50; color:white; border:none; border-radius:4px; cursor:pointer;">Simular Check-in</button>'
          : '<button onclick="qrSystem.simulateCheckout()" style="margin:8px 0 0 0; padding:8px 16px; background:#f44336; color:white; border:none; border-radius:4px; cursor:pointer;">Simular Check-out</button>';
    }
  }

  closeQRModal() {
    if (this.qrModal) this.qrModal.style.display = 'none';
  }

  simulateCheckin() {
    this.setStatus('checked-in');
    if (this.qrStatus) this.qrStatus.textContent = 'Check-in realizado com sucesso!';
    setTimeout(() => this.closeQRModal(), 1200);
  }

  simulateCheckout() {
    this.setStatus('checked-out');
    if (this.qrStatus) this.qrStatus.textContent = 'Check-out realizado com sucesso!';
    setTimeout(() => this.closeQRModal(), 1200);
  }
}

// Instância global (usada pelos botões simulados)
const qrSystem = new QRCheckSystem();

// ================= Engajamento =================
const engagementData = {
  goalTotal: 10,
  completed: 4,
  enrolled: 6,
  lastMonthCompleted: 3,
  avgEventsPerPeriod: 1,
  pointsTotal: 650,
  pointsThisMonth: 120,
  nextBadge: { name: 'Participante Ouro', pointsToGo: 35 },
  streakEvents: 3,
};

function pct(n, d) {
  if (!d || d === 0) return 0;
  return Math.round((n / d) * 100);
}

function computeEngagementComputed(data) {
  const progressPct = pct(data.completed, data.goalTotal);
  const comparison = progressPct - pct(data.lastMonthCompleted, data.goalTotal);
  const remaining = Math.max(data.goalTotal - data.completed, 0);
  const attendanceRate = pct(data.completed, data.enrolled);

  return {
    progressPct,
    comparison,
    remaining,
    projectionEvents: remaining,
    attendanceRate,
  };
}

function renderEngagement() {
  const c = engagementData;
  const r = computeEngagementComputed(c);

  // Texto principal
  const completedCountEl = document.getElementById('completedCount');
  const goalTotalEl = document.getElementById('goalTotal');
  const remainingEl = document.getElementById('remainingToGoal');
  if (completedCountEl) completedCountEl.textContent = c.completed;
  if (goalTotalEl) goalTotalEl.textContent = c.goalTotal;
  if (remainingEl) remainingEl.textContent = r.remaining;

  // Barra e percentual
  const fill = document.getElementById('progressFill');
  const label = document.getElementById('progressPercentLabel');
  if (fill) {
    setTimeout(() => {
      fill.style.width = `${r.progressPct}%`;
    }, 300);
    fill.setAttribute('data-label', `${r.progressPct}%`); // label interno (mobile)
  }
  if (label) label.textContent = `${r.progressPct}%`;

  // Comparativo vs mês passado
  const cmpEl = document.getElementById('progressComparison');
  const sign = r.comparison > 0 ? '+' : r.comparison < 0 ? '' : '';
  const arrow = r.comparison > 0 ? '▲' : r.comparison < 0 ? '▼' : '•';
  if (cmpEl) cmpEl.textContent = `${arrow} ${sign}${Math.abs(r.comparison)}% vs. mês passado`;

  // Projeção
  const projEl = document.getElementById('projectionText');
  if (projEl) projEl.textContent = `No ritmo atual, você atinge a meta em ${r.projectionEvents} ${r.projectionEvents === 1 ? 'evento' : 'eventos'}`;

  // KPIs
  const attendanceRateEl = document.getElementById('attendanceRate');
  const streakCountEl = document.getElementById('streakCount');
  const pointsTotalEl = document.getElementById('pointsTotal');
  const pointsThisMonthEl = document.getElementById('pointsThisMonth');
  const nextBadgeNameEl = document.getElementById('nextBadgeName');
  const nextBadgeDeltaEl = document.getElementById('nextBadgeDelta');

  if (attendanceRateEl) attendanceRateEl.textContent = `${r.attendanceRate}%`;
  if (streakCountEl) streakCountEl.textContent = c.streakEvents;
  if (pointsTotalEl) pointsTotalEl.textContent = c.pointsTotal;
  if (pointsThisMonthEl) pointsThisMonthEl.textContent = c.pointsThisMonth;
  if (nextBadgeNameEl) nextBadgeNameEl.textContent = c.nextBadge.name;
  if (nextBadgeDeltaEl) nextBadgeDeltaEl.textContent = `Faltam ${c.nextBadge.pointsToGo} pts`;
}

// ================= Minhas Participações =================
const participations = [
  {
    id: 'evt-01',
    title: 'Inovação e Tecnologia',
    type: 'Palestra',
    date: '25 de Agosto, 2024',
    place: 'Auditório Principal',
    points: 150,
    status: 'Concluído',
  },
  {
    id: 'evt-02',
    title: 'Gestão de Projetos',
    type: 'Curso',
    date: '28 de Agosto, 2024',
    place: 'Sala de Treinamento',
    points: 320,
    status: 'Concluído',
  },
  {
    id: 'evt-03',
    title: 'Sustentabilidade Corporativa',
    type: 'Seminário',
    date: '02 de Setembro, 2024',
    place: 'Centro de Convenções',
    points: 180,
    status: 'Concluído',
  },
];

function openParticipationsModal() {
  const modal = document.getElementById('participationsModal');
  const listEl = document.getElementById('participationsList');
  const totalEventsEl = document.getElementById('partTotalEvents');
  const totalPointsEl = document.getElementById('partTotalPoints');

  const totalEvents = participations.length;
  const totalPoints = participations.reduce((sum, p) => sum + (p.points || 0), 0);
  if (totalEventsEl) totalEventsEl.textContent = `${totalEvents}`;
  if (totalPointsEl) totalPointsEl.textContent = `${totalPoints} pts`;

  if (listEl) {
    listEl.innerHTML = participations
      .map(
        (p) => `
      <div class="participation-item">
        <div class="participation-main">
          <div class="participation-title">${p.title}</div>
          <div class="participation-meta"><i class="fas fa-tag"></i><span>${p.type}</span></div>
          <div class="participation-meta"><i class="fas fa-calendar-day"></i><span>${p.date}</span></div>
          <div class="participation-meta"><i class="fas fa-location-dot"></i><span>${p.place}</span></div>
          <span class="participation-status"><i class="fas fa-check-circle"></i> ${p.status}</span>
        </div>
        <div class="participation-score">${p.points} pts</div>
      </div>`
      )
      .join('');
  }

  modal?.classList.add('active');
}

function closeParticipationsModal() {
  const modal = document.getElementById('participationsModal');
  modal?.classList.remove('active');
}

// ================= Feedback: UI Helpers e Lógica =================
function getFeedbackElements() {
  return {
    section: document.getElementById('feedbackSection'),
    likeBtn: document.getElementById('likeBtn'),
    dislikeBtn: document.getElementById('dislikeBtn'),
    feedbackResult: document.getElementById('feedbackResult'),
    textarea: document.getElementById('feedbackTextarea'),
    sendBtn: document.getElementById('sendFeedbackBtn'),
    pointsNote: document.getElementById('feedbackPointsNote'),
  };
}

function resetFeedbackUI() {
  const el = getFeedbackElements();
  if (!el.section) return;
  el.likeBtn?.setAttribute('aria-pressed', 'false');
  el.dislikeBtn?.setAttribute('aria-pressed', 'false');
  el.likeBtn?.classList.remove('active');
  el.dislikeBtn?.classList.remove('active');
  if (el.textarea) el.textarea.value = '';
  if (el.sendBtn) {
    el.sendBtn.disabled = false;
    el.sendBtn.textContent = 'Envie sua avaliação';
  }
  if (el.feedbackResult) {
    el.feedbackResult.textContent = '';
  }
}

function disableFeedbackInputs() {
  const el = getFeedbackElements();
  if (!el.section) return;
  el.likeBtn?.setAttribute('aria-disabled', 'true');
  el.dislikeBtn?.setAttribute('aria-disabled', 'true');
  el.likeBtn?.setAttribute('disabled', 'true');
  el.dislikeBtn?.setAttribute('disabled', 'true');
  if (el.textarea) el.textarea.disabled = true;
  if (el.sendBtn) el.sendBtn.disabled = true;
}

function enableFeedbackInputs() {
  const el = getFeedbackElements();
  if (!el.section) return;
  el.likeBtn?.removeAttribute('aria-disabled');
  el.dislikeBtn?.removeAttribute('aria-disabled');
  el.likeBtn?.removeAttribute('disabled');
  el.dislikeBtn?.removeAttribute('disabled');
  if (el.textarea) el.textarea.disabled = false;
  if (el.sendBtn) el.sendBtn.disabled = false;
}

// Ao exibir feedback, carrega estado salvo (se houver)
function loadFeedbackForEvent(eventId) {
  const el = getFeedbackElements();
  if (!el.section) return;

  const data = eventsFeedbacks[eventId];
  if (!data) {
    resetFeedbackUI();
    enableFeedbackInputs();
    return;
  }

  // Se já submetido, bloquear inputs e mostrar resumo
  if (data.submitted) {
    // Mostrar resultado e bloquear
    if (data.liked === true) {
      el.feedbackResult.textContent = 'Você curtiu este evento.';
    } else if (data.liked === false) {
      el.feedbackResult.textContent = 'Você descurtiu este evento.';
    } else {
      el.feedbackResult.textContent = '';
    }
    if (el.textarea) el.textarea.value = data.comment || '';
    disableFeedbackInputs();
    if (el.sendBtn) {
      el.sendBtn.textContent = 'Avaliação enviada';
    }
  } else {
    // pré-submissão: marcar like/dislike se houver
    if (data.liked === true) {
      el.likeBtn?.setAttribute('aria-pressed', 'true');
      el.likeBtn?.classList.add('active');
    } else if (data.liked === false) {
      el.dislikeBtn?.setAttribute('aria-pressed', 'true');
      el.dislikeBtn?.classList.add('active');
    } else {
      el.likeBtn?.setAttribute('aria-pressed', 'false');
      el.dislikeBtn?.setAttribute('aria-pressed', 'false');
    }
    if (el.textarea) el.textarea.value = data.comment || '';
    enableFeedbackInputs();
    if (el.sendBtn) el.sendBtn.textContent = 'Envie sua avaliação';
  }
}

// Exibe a seção de feedback para o evento atual
function showFeedbackSection(eventId) {
  const el = getFeedbackElements();
  if (!el.section) return;
  el.section.style.display = 'block';
  loadFeedbackForEvent(eventId);
}

// Oculta seção
function hideFeedbackSection() {
  const el = getFeedbackElements();
  if (!el.section) return;
  el.section.style.display = 'none';
}

// ================= Modal de Evento =================
function openEventModal(index) {
  const event = eventsData[index];
  if (!event) return;

  const modal = document.getElementById('eventModal');
  const modalTitle = document.getElementById('modalTitle');
  const imgEl = document.getElementById('modalEventImage');
  const typeEl = document.getElementById('modalEventType');
  const titleEl = document.getElementById('modalEventTitle');
  const dateEl = document.getElementById('modalEventDate');
  const timeEl = document.getElementById('modalEventTime');
  const locationEl = document.getElementById('modalEventLocation');
  const capacityEl = document.getElementById('modalEventCapacity');
  const descEl = document.getElementById('modalEventDescription');

  if (modalTitle) modalTitle.textContent = 'Detalhes do Evento';
  if (imgEl) {
    imgEl.src = event.image || 'assets/evento0.jpeg';
    imgEl.alt = `Imagem do evento: ${event.title}`;
  }
  if (typeEl) typeEl.textContent = event.type || '';
  if (titleEl) titleEl.textContent = event.title || '';
  if (dateEl) dateEl.textContent = event.date || '';
  if (timeEl) timeEl.textContent = event.time || '';
  if (locationEl) locationEl.textContent = event.location || '';
  if (capacityEl) capacityEl.textContent = event.capacity || '';
  if (descEl) descEl.textContent = event.description || '';

  // Inicializa o sistema de QR e valida horário
  qrSystem.initializeForEvent(index);

  const qrScanBtn = document.getElementById('qrScanBtn');
  const checkStatusMsg = document.getElementById('checkStatusMsg');
  const allowed = canCheckin(event.startDateTime);

  if (qrScanBtn && checkStatusMsg) {
    if (!allowed) {
      qrScanBtn.disabled = true;
      qrScanBtn.style.background = '#bdbdbd';
      checkStatusMsg.textContent = `Check-in disponível a partir de ${minMinutesBeforeCheckin} minutos antes do evento.`;
      checkStatusMsg.style.display = 'block';
      checkStatusMsg.style.color = '#f44336';
    } else {
      qrScanBtn.disabled = false;
      qrScanBtn.style.background = '#1976d2';
      checkStatusMsg.textContent = '';
      checkStatusMsg.style.display = 'none';
    }
  }

  // Ao abrir modal, esconder seção de feedback (até que haja checkout)
  hideFeedbackSection();

  modal?.classList.add('active');
}

function closeEventModal() {
  const modal = document.getElementById('eventModal');
  modal?.classList.remove('active');
}

// ================= Feedback: Bindings & Handlers =================
function bindFeedbackActions() {
  const el = getFeedbackElements();
  if (!el.section) return;

  // Curtir
  el.likeBtn?.addEventListener('click', () => {
    if (el.likeBtn.disabled) return;
    const current = el.likeBtn.getAttribute('aria-pressed') === 'true';
    // Toggle: se já true, desmarca; se false, marca e desmarca dislike
    if (current) {
      el.likeBtn.setAttribute('aria-pressed', 'false');
      el.likeBtn.classList.remove('active');
    } else {
      el.likeBtn.setAttribute('aria-pressed', 'true');
      el.likeBtn.classList.add('active');
      el.dislikeBtn?.setAttribute('aria-pressed', 'false');
      el.dislikeBtn?.classList.remove('active');
    }
    // Salva estado temporário no objeto de evento atual
    const eid = qrSystem.eventId;
    if (eid !== null && eid !== undefined) {
      const existing = eventsFeedbacks[eid] || {};
      existing.liked = el.likeBtn.getAttribute('aria-pressed') === 'true' ? true : null;
      existing.submitted = existing.submitted || false;
      eventsFeedbacks[eid] = existing;
      saveFeedbacksToStorage();
    }
  });

  // Descurtir
  el.dislikeBtn?.addEventListener('click', () => {
    if (el.dislikeBtn.disabled) return;
    const current = el.dislikeBtn.getAttribute('aria-pressed') === 'true';
    if (current) {
      el.dislikeBtn.setAttribute('aria-pressed', 'false');
      el.dislikeBtn.classList.remove('active');
    } else {
      el.dislikeBtn.setAttribute('aria-pressed', 'true');
      el.dislikeBtn.classList.add('active');
      el.likeBtn?.setAttribute('aria-pressed', 'false');
      el.likeBtn?.classList.remove('active');
    }
    const eid = qrSystem.eventId;
    if (eid !== null && eid !== undefined) {
      const existing = eventsFeedbacks[eid] || {};
      existing.liked = el.dislikeBtn.getAttribute('aria-pressed') === 'true' ? false : null;
      existing.submitted = existing.submitted || false;
      eventsFeedbacks[eid] = existing;
      saveFeedbacksToStorage();
    }
  });

  // Enviar avaliação
  el.sendBtn?.addEventListener('click', () => {
    if (el.sendBtn.disabled) return;
    const eid = qrSystem.eventId;
    if (eid === null || eid === undefined) {
      el.feedbackResult.textContent = 'Erro: evento não selecionado.';
      return;
    }

    // Recupera estado atual
    const likedAttr = el.likeBtn?.getAttribute('aria-pressed');
    const dislikedAttr = el.dislikeBtn?.getAttribute('aria-pressed');
    let liked = null;
    if (likedAttr === 'true') liked = true;
    if (dislikedAttr === 'true') liked = false;

    const comment = el.textarea?.value?.trim() || '';

    // Simulação: preciso no mínimo de um like/dislike ou comentário para enviar
    if (liked === null && comment.length === 0) {
      el.feedbackResult.textContent = 'Por favor, deixe um comentário ou marque Curtir/Descurtir.';
      return;
    }

    // Simular envio (mock) e recompensa de pontos
    el.sendBtn.disabled = true;
    el.sendBtn.textContent = 'Enviando...';

    // Simular delay de rede
    setTimeout(() => {
      // calcular pontos ganhos por avaliação (ex.: 10 pts por avaliação)
      const pointsAwarded = 10;

      // Atualiza persistência local
      eventsFeedbacks[eid] = {
        liked,
        comment,
        submitted: true,
        pointsAwarded,
        submittedAt: new Date().toISOString(),
      };
      saveFeedbacksToStorage();

      // Atualiza engajamento (mock — apenas incrementa pontos)
      engagementData.pointsTotal = (engagementData.pointsTotal || 0) + pointsAwarded;
      engagementData.pointsThisMonth = (engagementData.pointsThisMonth || 0) + pointsAwarded;
      renderEngagement();

      // Feedback visual
      el.feedbackResult.style.color = '#16a34a';
      el.feedbackResult.textContent = `Avaliação enviada — você ganhou +${pointsAwarded} pts. Obrigado!`;
      el.sendBtn.textContent = 'Avaliação enviada';

      // bloquear inputs para evitar reenvio
      disableFeedbackInputs();
    }, 900);
  });
}

// ================= Boot/Bindings =================
document.addEventListener('DOMContentLoaded', () => {
  // Saudação dinâmica com “digitação”
  const greeting = document.getElementById('greeting');
  const now = new Date();
  const hour = now.getHours();
  const greetingText =
    hour < 12
      ? 'Bom dia, Alessandro Souza!'
      : hour < 18
      ? 'Boa tarde, Alessandro Souza!'
      : 'Boa noite, Alessandro Souza!';

  if (greeting) {
    greeting.textContent = '';
    let i = 0;
    function type() {
      if (i < greetingText.length) {
        greeting.textContent += greetingText.charAt(i);
        i++;
        setTimeout(type, 50);
      }
    }
    setTimeout(type, 300);
  }

  // Engajamento
  renderEngagement();

  // Carrossel do ranking
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  const rankingContainer = document.querySelector('.ranking-container');
  if (prevBtn && nextBtn && rankingContainer) {
    prevBtn.addEventListener('click', () =>
      rankingContainer.scrollBy({ left: -200, behavior: 'smooth' })
    );
    nextBtn.addEventListener('click', () =>
      rankingContainer.scrollBy({ left: 200, behavior: 'smooth' })
    );
  }

  // Menu toggle (placeholder)
  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () =>
      console.log('Menu clicado - implementar navegação futura')
    );
  }

  // Botões "Ver Detalhes" dos eventos
  const eventButtons = document.querySelectorAll('.event-btn');
  eventButtons.forEach((button, index) => {
    const idxAttr = button.getAttribute('data-index');
    const safeIndex = idxAttr !== null ? parseInt(idxAttr, 10) : index;

    button.addEventListener('click', () => {
      openEventModal(safeIndex);
    });
  });

  // Fechar modal de evento
  const closeModalBtn = document.getElementById('closeModal');
  const modalOverlay = document.getElementById('eventModal');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeEventModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeEventModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
      closeEventModal();
    }
  });

  // Minhas Participações
  const openPartBtn = document.getElementById('openParticipationsBtn');
  const closePartBtn = document.getElementById('closeParticipationsBtn');
  const participationsModal = document.getElementById('participationsModal');

  openPartBtn?.addEventListener('click', openParticipationsModal);
  closePartBtn?.addEventListener('click', closeParticipationsModal);
  participationsModal?.addEventListener('click', (e) => {
    if (e.target === participationsModal) closeParticipationsModal();
  });

  // Inicializa bindings de feedback
  bindFeedbackActions();

  // Reagir a mudanças de estado do QR (check-in / check-out)
  qrSystem.onStateChange = (eventId, newStatus) => {
    // quando houver checkout, mostrar feedback
    if (newStatus === 'checked-out') {
      // Mostra a seção de feedback e carrega estado
      showFeedbackSection(eventId);
    } else {
      // Para estados anteriores, esconder a seção (até o checkout)
      hideFeedbackSection();
    }
  };

  // Se o usuário abriu o modal para um evento que já tinha feedback submetido, exibir corretamente
  // (por exemplo, se você quer suportar reabrir o modal e ver que já avaliou)
  // Observação: o qrSystem.initializeForEvent é chamado por openEventModal,
  // e o evento onStateChange acima será acionado conforme alterações de estado.
});