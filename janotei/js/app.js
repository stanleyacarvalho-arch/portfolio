// Função para garantir que só um checkbox da modalidade seja marcado
function toggleCheckboxExclusive(clickedCheckbox) {
  const checkboxes = document.querySelectorAll('input[name="modalidadeCampanha"]');
  checkboxes.forEach(cb => {
    if (cb !== clickedCheckbox) cb.checked = false;
  });
}

// ==== SISTEMA GLOBAL DA APLICAÇÃO ====

const AppState = {
  user: JSON.parse(localStorage.getItem('janotei_user')) || {
    id: 1,
    name: 'João Silva',
    email: 'joao.silva@email.com',
    avatar: null,
    role: 'admin',
    company: 'Hot Wheels Colecionáveis',
    phone: '(11) 9999-9999',
    memberSince: '2025-01-01'
  },

  products: JSON.parse(localStorage.getItem('janotei_products')) || [
    {
      id: 1,
      name: 'Hot Wheels Ferrari F40',
      category: 'Carros Esportivos',
      price: 15.99,
      stock: 5,
      status: 'active',
      images: ['ferrari-f40.jpg'],
      description: 'Miniatura colecionável da Ferrari F40',
      sku: 'HW-FER-001',
      createdAt: '2025-01-15'
    },
    {
      id: 2,
      name: 'Hot Wheels Lamborghini Huracán',
      category: 'Carros Esportivos',
      price: 18.50,
      stock: 3,
      status: 'active',
      images: ['lambo-huracan.jpg'],
      description: 'Miniatura colecionável da Lamborghini Huracán',
      sku: 'HW-LAM-002',
      createdAt: '2025-01-20'
    }
  ],

  categories: JSON.parse(localStorage.getItem('janotei_categories')) || [
    { id: 1, name: 'Carros Esportivos', description: 'Miniaturas de carros esportivos', status: 'active', productsCount: 15 },
    { id: 2, name: 'Carros Clássicos', description: 'Miniaturas de carros clássicos', status: 'active', productsCount: 8 },
    { id: 3, name: 'Caminhões', description: 'Miniaturas de caminhões', status: 'active', productsCount: 5 }
  ],

  // Métodos para salvar dados
  saveUser(userData) {
    this.user = { ...this.user, ...userData };
    localStorage.setItem('janotei_user', JSON.stringify(this.user));
    this.updateUserDisplay();
  },

  saveProducts(products) {
    this.products = products;
    localStorage.setItem('janotei_products', JSON.stringify(products));
  },

  saveCategories(categories) {
    this.categories = categories;
    localStorage.setItem('janotei_categories', JSON.stringify(categories));
  },

  // Adicionar produto
  addProduct(product) {
    const newProduct = {
      ...product,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.products.push(newProduct);
    this.saveProducts(this.products);
    return newProduct;
  },

  // Atualizar produto
  updateProduct(id, updates) {
    const index = this.products.findIndex(p => p.id == id);
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updates };
      this.saveProducts(this.products);
      return this.products[index];
    }
    return null;
  },

  // Deletar produto
  deleteProduct(id) {
    this.products = this.products.filter(p => p.id != id);
    this.saveProducts(this.products);
  },

  // Adicionar categoria
  addCategory(category) {
    const newCategory = {
      ...category,
      id: Date.now(),
      productsCount: 0
    };
    this.categories.push(newCategory);
    this.saveCategories(this.categories);
    return newCategory;
  },

  // Atualizar categoria
  updateCategory(id, updates) {
    const index = this.categories.findIndex(c => c.id == id);
    if (index !== -1) {
      this.categories[index] = { ...this.categories[index], ...updates };
      this.saveCategories(this.categories);
      return this.categories[index];
    }
    return null;
  },

  // Deletar categoria
  deleteCategory(id) {
    this.categories = this.categories.filter(c => c.id != id);
    this.saveCategories(this.categories);
  },

  // Atualizar display do usuário
  updateUserDisplay() {
    const nameElements = document.querySelectorAll('.profile-name, .user-name');
    const emailElements = document.querySelectorAll('.profile-email, .user-email');

    nameElements.forEach(el => el.textContent = this.user.name);
    emailElements.forEach(el => el.textContent = this.user.email);
  }
};

// ==== GERENCIAMENTO DE USUÁRIOS ====

const UserManager = {
  getUsers() {
    const users = localStorage.getItem('janotei_users');
    return users ? JSON.parse(users) : [];
  },

  saveUsers(users) {
    localStorage.setItem('janotei_users', JSON.stringify(users));
  },

  getUserById(id) {
    const users = this.getUsers();
    return users.find(u => u.id == id) || null;
  },

  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  },

  updateUser(id, updates) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id == id);
    if (index !== -1) {
      // Se updates.password for undefined, não altera a senha
      if (updates.password === undefined) {
        delete updates.password;
      }
      users[index] = { ...users[index], ...updates };
      this.saveUsers(users);
      return users[index];
    }
    return null;
  }
};

// ==== SISTEMA DE NAVEGAÇÃO ====

const Navigation = {
  pages: {
    'dashboard': 'dashboard.html',
    'produtos': 'produtos.html',
    'novo-produto': 'novo-produto.html',
    'editar-produto': 'editar-produto.html',
    'visualizar-produto': 'visualizar-produto.html',
    'categorias': 'categorias.html',
    'clientes': 'clientes.html',
    'relatorios': 'relatorios.html',
    'disparos': 'disparos-whatsapp.html',
    'nova-campanha': 'nova-campanha.html',
    'sobre': 'sobre.html',
    'mais': 'mais.html',
    'novo-usuario': 'novo-usuario.html',
    'editar-usuario': 'editar-usuario.html'
  },

  // Navegar para página
  goTo(page, params = {}) {
    if (this.pages[page]) {
      // Salvar parâmetros se necessário
      if (Object.keys(params).length > 0) {
        sessionStorage.setItem('navigationParams', JSON.stringify(params));
      }
      window.location.href = this.pages[page];
    } else {
      console.error('Página não encontrada:', page);
    }
  },

  // Obter parâmetros da navegação
  getParams() {
    const params = sessionStorage.getItem('navigationParams');
    if (params) {
      sessionStorage.removeItem('navigationParams');
      return JSON.parse(params);
    }
    return {};
  },

  // Configurar menu ativo
  setActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    const menuItems = document.querySelectorAll('.nav-item');

    menuItems.forEach(item => {
      const page = item.getAttribute('data-page');
      if (page === currentPage) {
        item.style.color = '#00b86b';
      }
    });
  },

  // Inicializar navegação
  init() {
    // Configurar todos os links do menu
    document.querySelectorAll('.nav-item').forEach(item => {
      const page = item.getAttribute('data-page');
      if (page) {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          this.goTo(page);
        });
      }
    });

    // Configurar breadcrumbs
    document.querySelectorAll('.breadcrumb a').forEach(link => {
      const page = link.getAttribute('data-page');
      if (page) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.goTo(page);
        });
      }
    });

    this.setActiveMenu();
  }
};

// ==== SISTEMA DE VALIDAÇÃO ====

const Validator = {
  rules: {
    required: (value) => value && value.toString().trim().length > 0,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value) => /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value),
    minLength: (value, min) => value && value.length >= min,
    maxLength: (value, max) => value && value.length <= max,
    number: (value) => !isNaN(value) && value > 0,
    decimal: (value) => /^\d+(\.\d{1,2})?$/.test(value)
  },

  messages: {
    required: 'Este campo é obrigatório',
    email: 'Digite um e-mail válido',
    phone: 'Digite um telefone válido',
    minLength: 'Mínimo de {min} caracteres',
    maxLength: 'Máximo de {max} caracteres',
    number: 'Digite um número válido',
    decimal: 'Digite um valor válido (ex: 10.50)'
  },

  // Validar campo individual
  validateField(input, rules) {
    const value = input.value;
    const errors = [];

    for (const rule of rules) {
      const [ruleName, ...params] = rule.split(':');

      if (ruleName === 'required' && !this.rules.required(value)) {
        errors.push(this.messages.required);
      } else if (value && this.rules[ruleName]) {
        if (params.length > 0) {
          if (!this.rules[ruleName](value, ...params)) {
            errors.push(this.messages[ruleName].replace(`{${Object.keys(this.messages)[0]}}`, params[0]));
          }
        } else if (!this.rules[ruleName](value)) {
          errors.push(this.messages[ruleName]);
        }
      }
    }

    return errors;
  },

  // Mostrar erro no campo
  showFieldError(input, errors) {
    this.clearFieldError(input);

    if (errors.length > 0) {
      input.style.borderColor = '#ff5252';

      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.style.cssText = `
      color: #ff5252;
      font-size: 0.8rem;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
      `;
      errorDiv.innerHTML = `
      <span class="material-icons" style="font-size: 14px;">error</span>
      ${errors[0]}
      `;

      input.parentNode.appendChild(errorDiv);
    } else {
      input.style.borderColor = '#00b86b';
    }
  },

  // Limpar erro do campo
  clearFieldError(input) {
    input.style.borderColor = '#333';
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  },

  // Validar formulário completo
  validateForm(form) {
    const inputs = form.querySelectorAll('[data-validate]');
    let isValid = true;

    inputs.forEach(input => {
      const rules = input.getAttribute('data-validate').split('|');
      const errors = this.validateField(input, rules);

      this.showFieldError(input, errors);

      if (errors.length > 0) {
        isValid = false;
      }
    });

    return isValid;
  },

  // Inicializar validação em tempo real
  init() {
    document.querySelectorAll('[data-validate]').forEach(input => {
      input.addEventListener('blur', () => {
        const rules = input.getAttribute('data-validate').split('|');
        const errors = this.validateField(input, rules);
        this.showFieldError(input, errors);
      });

      input.addEventListener('input', () => {
        // Limpar erro enquanto digita
        if (input.parentNode.querySelector('.field-error')) {
          this.clearFieldError(input);
        }
      });
    });
  }
};

// ==== SISTEMA DE LOADING ====

const LoadingManager = {
  // Criar overlay de loading
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(17, 17, 17, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
    `;

    overlay.innerHTML = `
    <div style="
    background: #181818;
    border-radius: 12px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 8px 32px rgba(0, 184, 107, 0.3);
    ">
    <div class="loading-spinner"></div>
    <div style="color: #fff; font-size: 1rem; font-weight: 600;">Carregando...</div>
    </div>
    `;

    return overlay;
  },

  // Mostrar loading
  show(message = 'Carregando...') {
    this.hide(); // Remove loading anterior se existir

    const overlay = this.createOverlay();
    overlay.querySelector('div:last-child').textContent = message;
    document.body.appendChild(overlay);

    // Adicionar CSS do spinner se não existir
    if (!document.querySelector('#loadingSpinnerCSS')) {
      const style = document.createElement('style');
      style.id = 'loadingSpinnerCSS';
      style.textContent = `
      .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #333;
      border-top: 3px solid #00b86b;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      }

      @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
      }
      `;
      document.head.appendChild(style);
    }
  },

  // Esconder loading
  hide() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.remove();
    }
  },

  // Loading em botão específico
  buttonLoading(button, loading = true, originalText = null) {
    if (loading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.innerHTML;
      }
      button.innerHTML = `
      <div style="
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 8px;
      "></div>
      Processando...
      `;
      button.disabled = true;
    } else {
      button.innerHTML = originalText || button.dataset.originalText || button.innerHTML;
      button.disabled = false;
      delete button.dataset.originalText;
    }
  }
};

// ==== SISTEMA DE NOTIFICAÇÕES ====

const Toast = {
  show(message, type = 'success', duration = 3000) {
    // Remove toast anterior se existir
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
      existingToast.remove();
    }

    const colors = {
      success: '#4caf50',
      error: '#ff5252',
      warning: '#ff9800',
      info: '#2196f3'
    };

    const icons = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    background: ${colors[type]};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    `;

    toast.innerHTML = `
    <span class="material-icons" style="font-size: 18px;">${icons[type]}</span>
    ${message}
    `;

    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);

    // Remover após duração
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, duration);
  }
};

// ==== UTILITÁRIOS ====

const Utils = {
  // Formatar moeda
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  // Formatar data
  formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  },

  // Gerar ID único
  generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  },

  // Debounce para busca
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// ==== FUNÇÕES PARA EDIÇÃO DE USUÁRIO (editar-usuario.html) ====

function loadUserIntoForm(userId, formElement) {
  const user = UserManager.getUserById(userId);
  if (!user) {
    Toast.show('Usuário não encontrado.', 'error');
    return false;
  }

  formElement.querySelector('input[name="fullName"]').value = user.name;
  formElement.querySelector('input[name="email"]').value = user.email;
  formElement.querySelector('select[name="userRole"]').value = user.role;

  // Status toggle
  const toggle = formElement.querySelector('#statusToggle');
  const label = formElement.querySelector('#statusLabel');
  if (user.status === 'ativo') {
    toggle.classList.add('active');
    label.textContent = 'Ativo';
  } else {
    toggle.classList.remove('active');
    label.textContent = 'Inativo';
  }

  return true;
}

function saveUserEdits(userId, formData, userStatus) {
  const updates = {
    name: formData.get('fullName'),
    email: formData.get('email'),
    role: formData.get('userRole'),
    status: userStatus ? 'ativo' : 'inativo'
  };

  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  if (password || confirmPassword) {
    if (password.length < 6) {
      Toast.show('A senha deve ter pelo menos 6 caracteres.', 'error');
      return false;
    }
    if (password !== confirmPassword) {
      Toast.show('As senhas não coincidem.', 'error');
      return false;
    }
    updates.password = password; // Atenção: senha em texto puro
  }

  const updatedUser = UserManager.updateUser(userId, updates);
  if (!updatedUser) {
    Toast.show('Erro ao atualizar usuário.', 'error');
    return false;
  }

  Toast.show('Usuário atualizado com sucesso!', 'success');
  return true;
}

// ==== INICIALIZAÇÃO ====

document.addEventListener('DOMContentLoaded', function() {
  // Inicializar sistemas
  Navigation.init();
  Validator.init();

  // Atualizar display do usuário
  AppState.updateUserDisplay();

  // Listener para o botão Nova Campanha na página disparos-whatsapp.html
  const btnNovaCampanha = document.getElementById('btnNovaCampanha');
  if (btnNovaCampanha) {
    btnNovaCampanha.addEventListener('click', () => {
      Navigation.goTo('nova-campanha');
    });
  }

  console.log('🚀 Sistema JANOTEI inicializado com sucesso!');
});