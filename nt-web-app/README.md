# NOVO TEMPO – Sistema de Gestão de Eventos Corporativos

Projeto web desenvolvido para gerenciamento de eventos internos (palestras, seminários, cursos e workshops) da TV Novo Tempo — Canal da Esperança.

O sistema permite cadastrar eventos, acompanhar a participação dos colaboradores, controlar check-ins e check-outs, coletar avaliações e fornecer ao time administrativo uma visão analítica completa sobre engajamento.

## 🛠 Tecnologias Utilizadas

- HTML5
- CSS3 (Flexbox, Grid, Glassmorphism e Responsividade)
- JavaScript (ES6+)
- Chart.js 4.x (gráficos e visualizações)
- Font Awesome 6.x (ícones)
- Google Fonts — Montserrat / Inter
- Live Server (VS Code) — servidor local de desenvolvimento

## 📌 Funcionalidades

- Dashboard do colaborador com saudação dinâmica e barra de engajamento
- Cards de eventos com modal de detalhes
- Check-in com controle de tempo (liberado X minutos antes do início)
- Check-out com avaliação (curtir / descurtir / feedback escrito)
- Sistema de pontuação por avaliação de eventos
- Ranking de colaboradores mais engajados (carrossel)
- Dashboard administrativo com KPIs, gráficos e tabela de eventos
- Criação e edição de eventos via modal
- Sidebar responsiva com menu hierárquico
- Editor de tema em runtime (cores personalizáveis pelo admin)
- Busca global na topbar

## 💾 Armazenamento

O projeto utiliza **MockAPI** (dados em memória) para simular o backend.
Não possui banco de dados externo nesta fase — preparado para integração futura com API REST em Kotlin + Spring Boot.

## 🚀 Como Executar

**Visão do Colaborador**
1. Abra a pasta `src/` no VS Code.
2. Clique com o botão direito em `index.html` → **Open with Live Server**.

**Visão do Administrador**
1. Abra a pasta `public/admin/` no VS Code.
2. Clique com o botão direito em `admin-dashboard.html` → **Open with Live Server**.

> ⚠️ Sempre abra o Live Server a partir da pasta correta para os caminhos de imagens funcionarem.

## 📂 Estrutura

- `src/index.html` – Tela de login do colaborador
- `src/dashboard.html` – Dashboard do colaborador
- `src/styles/dashboard.css` – Estilos do dashboard do colaborador
- `src/js/dashboard.js` – Lógica principal do colaborador
- `public/admin/admin-dashboard.html` – Painel administrativo
- `public/admin/css/admin-modern.css` – Estilos do painel admin
- `public/admin/js/admin-modern.js` – Lógica e MockAPI do admin
- `src/assets/` – Imagens dos eventos
- `public/Logo_Novo_Tempo.png` – Logo oficial

## 📎 Observações

Este projeto é focado em frontend e organização de interface.
Foi desenvolvido sem uso de frameworks (React, Vue, Angular), utilizando apenas JavaScript puro.
O backend em Kotlin + Spring Boot está planejado para uma fase futura — o padrão MockAPI garante que não haverá retrabalho no frontend na integração.

---

Projeto desenvolvido para uso interno da TV Novo Tempo — Canal da Esperança.
