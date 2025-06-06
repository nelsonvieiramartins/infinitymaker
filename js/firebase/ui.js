// Este arquivo gerencia a interface do usuário para autenticação
import { 
  registerWithEmailAndPassword, 
  loginWithEmailAndPassword, 
  signInWithGoogle, 
  signInWithFacebook,
  resetPassword,
  getCurrentUser,
  logoutUser,
  checkRedirectResult
} from './auth.js';

// Função para mostrar mensagens de erro ou sucesso
const showMessage = (message, isError = false) => {
  // Verifica se já existe uma mensagem na página
  let messageElement = document.querySelector('.auth-message');
  
  // Se não existe, criar o elemento
  if (!messageElement) {
    messageElement = document.createElement('div');
    messageElement.className = 'auth-message';
    
    // Adicionar o elemento à página, após o título da seção
    const authTabsElement = document.querySelector('.auth-tabs');
    if (authTabsElement) {
      authTabsElement.parentNode.insertBefore(messageElement, authTabsElement.nextSibling);
    } else {
      // Alternativa, tenta encontrar o elemento de mensagens
      const authMessagesElement = document.getElementById('auth-messages');
      if (authMessagesElement) {
        authMessagesElement.appendChild(messageElement);
      } else {
        // Último recurso, adicionar ao body
        document.body.appendChild(messageElement);
      }
    }
  }
  
  // Definir o tipo de mensagem (erro ou sucesso)
  messageElement.className = isError 
    ? 'auth-message auth-message-error' 
    : 'auth-message auth-message-success';
  
  // Definir o conteúdo e mostrar
  messageElement.textContent = message;
  messageElement.style.display = 'block';
  
  // Ocultar após alguns segundos
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 5000);
};

// Função para inicializar os eventos de UI
export const initAuthUI = async () => {
  // Adicionar estilos para mensagens
  addMessageStyles();
  
  try {
    console.log('Iniciando sistema de autenticação...');
    console.log('URL atual:', window.location.href);
    
    // Verificar se há algum erro na URL (para depuração)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
      const errorMsg = urlParams.get('error');
      console.error('Erro detectado na URL:', errorMsg);
      showMessage(`Erro na autenticação: ${errorMsg}`, true);
      
      // Limpar os parâmetros da URL para evitar exibir o erro novamente ao recarregar
      history.replaceState(null, '', window.location.pathname);
    }
    
    // Verificar se há resultado de redirecionamento pendente (login social)
    console.log('Verificando resultado de redirecionamento na inicialização...');
    try {
      const redirectUser = await checkRedirectResult();
      
      if (redirectUser) {
        console.log('Usuário autenticado por redirecionamento encontrado:', redirectUser.email);
        showMessage('Login realizado com sucesso!');
        updateUIBasedOnAuthState(redirectUser);
        
        // Redirecionar para página inicial
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
        
        return;
      } else {
        console.log('Nenhum resultado de redirecionamento encontrado');
        
        // Verificar se houve uma tentativa sem sucesso
        if (sessionStorage.getItem('googleAuthAttempt')) {
          console.warn('Tentativa de autenticação detectada, mas sem resultado bem-sucedido');
          
          // Verificar se há um erro específico para mostrar
          if (sessionStorage.getItem('authError')) {
            const authError = sessionStorage.getItem('authError');
            showMessage(`Erro na autenticação: ${authError}`, true);
            sessionStorage.removeItem('authError');
          } else {
            showMessage('Autenticação não concluída. Por favor, tente novamente.', true);
          }
          
          sessionStorage.removeItem('googleAuthAttempt');
        }
      }
    } catch (redirectError) {
      console.error('Erro durante processamento de redirecionamento:', redirectError);
      showMessage(`Erro na autenticação: ${redirectError.message}`, true);
    }
  } catch (error) {
    console.error('Erro ao inicializar autenticação:', error);
    showMessage(`Erro na inicialização: ${error.message}`, true);
  }
  
  // Verificar usuário atual
  try {
    const user = await getCurrentUser();
    updateUIBasedOnAuthState(user);
  } catch (error) {
    console.error('Erro ao verificar usuário atual:', error);
  }
  
  // Adicionar listeners para formulários de autenticação
  setupLoginForm();
  setupRegisterForm();
  setupSocialAuth();
  setupLogoutButton();
  setupPasswordReset();
  
  // Adicionar informações de diagnóstico ocultas na página
  addDiagnosticInfo();
};

// Função para atualizar a UI com base no estado de autenticação
export const updateUIBasedOnAuthState = (user) => {
  // Elementos que devem ser alterados
  const loginLinks = document.querySelectorAll('.login-link');
  const userInfo = document.querySelector('.user-info');
  const userNameElement = userInfo ? userInfo.querySelector('.user-name') : null;
  
  if (user) {
    // Usuário está logado
    console.log('Usuário logado:', user.displayName || user.email);
    
    // Armazenar dados do usuário para uso em outras partes do site
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', user.displayName || user.email.split('@')[0]);
    localStorage.setItem('userEmail', user.email);
    
    // Ocultar links de login/cadastro
    loginLinks.forEach(link => {
      link.style.display = 'none';
    });
    
    // Mostrar informação do usuário
    if (userInfo) {
      userInfo.style.display = 'list-item';
      if (userNameElement) {
        userNameElement.textContent = user.displayName || user.email.split('@')[0];
      }
    }
    
    // Redirecionar para página inicial se estivermos na página de autenticação
    if (window.location.pathname.includes('auth.html')) {
      window.location.href = 'index.html';
    }
  } else {
    // Usuário não está logado
    console.log('Nenhum usuário logado');
    
    // Limpar dados de autenticação
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    // Mostrar links de login/cadastro
    loginLinks.forEach(link => {
      link.style.display = 'list-item';
    });
    
    // Ocultar informação do usuário
    if (userInfo) {
      userInfo.style.display = 'none';
    }
  }
};

// Função para configurar o formulário de login
const setupLoginForm = () => {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obter valores do formulário
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Mostrar loader
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Entrando...';
    submitButton.disabled = true;
    
    try {
      // Fazer login com Firebase
      const user = await loginWithEmailAndPassword(email, password);
      showMessage('Login realizado com sucesso!');
      
      // Atualizar UI
      updateUIBasedOnAuthState(user);
      
      // Redirecionar para página inicial
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      // Restaurar botão
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  });
};

// Função para configurar o formulário de cadastro
const setupRegisterForm = () => {
  const registerForm = document.getElementById('register-form');
  if (!registerForm) return;
  
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obter valores do formulário
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    // Verificar se as senhas são iguais
    if (password !== passwordConfirm) {
      showMessage('As senhas não coincidem!', true);
      return;
    }
    
    // Verificar se os termos foram aceitos
    const termsChecked = document.getElementById('terms').checked;
    if (!termsChecked) {
      showMessage('Você precisa aceitar os termos de serviço para continuar.', true);
      return;
    }
    
    // Mostrar loader
    const submitButton = registerForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Criando conta...';
    submitButton.disabled = true;
    
    try {
      // Criar conta com Firebase
      const user = await registerWithEmailAndPassword(name, email, password);
      showMessage('Conta criada com sucesso!');
      
      // Atualizar UI
      updateUIBasedOnAuthState(user);
      
      // Redirecionar para página inicial
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      // Restaurar botão
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  });
};

// Função para configurar a autenticação social
const setupSocialAuth = () => {
  // Google - Botões separados para login e signup para melhor diagnóstico
  const googleLoginBtn = document.getElementById('google-login-btn');
  const googleSignupBtn = document.getElementById('google-signup-btn');
  
  // Função para processar clique no botão Google
  const handleGoogleAuth = async (button, actionType) => {
    try {
      // Desabilitar o botão e mostrar loader
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
      console.log(`Iniciando ${actionType} com Google via UI`);
      
      // Mostrar mensagem de feedback ao usuário
      showMessage(`Conectando ao Google...`, false);
      
      // Log para diagnóstico
      console.log('Navegador:', navigator.userAgent);
      console.log('URL atual:', window.location.href);
      
      // Remover quaisquer parâmetros da URL que possam interferir
      if (window.location.search) {
        history.replaceState(null, '', window.location.pathname);
      }
      
      // Tentar autenticação com Google
      const user = await signInWithGoogle();
      
      // Se o usuário for null, significa que houve redirecionamento
      if (!user) {
        console.log('Redirecionando para autenticação do Google...');
        return; // Não faz nada, pois o usuário será redirecionado
      }
      
      showMessage(`${actionType} com Google realizado com sucesso!`);
      updateUIBasedOnAuthState(user);
      
      // Redirecionar para página inicial
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } catch (error) {
      console.error(`Erro capturado na UI durante ${actionType} com Google:`, error);
      
      // Mensagem de erro mais amigável
      if (error.message.includes('não está autorizado')) {
        showMessage('Este site não está configurado corretamente para autenticação com Google. Entre em contato com o administrador.', true);
      } else if (error.message.includes('network')) {
        showMessage('Erro de conexão. Verifique sua internet e tente novamente.', true);
      } else {
        showMessage(error.message, true);
      }
    } finally {
      // Restaurar o botão
      button.disabled = false;
      button.innerHTML = '<i class="fab fa-google"></i> Google';
    }
  };
  
  // Configurar botão de login com Google
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
      await handleGoogleAuth(googleLoginBtn, 'Login');
    });
  }
  
  // Configurar botão de cadastro com Google
  if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', async () => {
      await handleGoogleAuth(googleSignupBtn, 'Cadastro');
    });
  }
  
  // Fallback para versões anteriores da página
  const otherGoogleButtons = document.querySelectorAll('.google-btn:not(#google-login-btn):not(#google-signup-btn)');
  otherGoogleButtons.forEach(button => {
    button.addEventListener('click', async () => {
      await handleGoogleAuth(button, 'Login');
    });
  });
  
  // Facebook
  const facebookButtons = document.querySelectorAll('.facebook-btn');
  facebookButtons.forEach(button => {
    button.addEventListener('click', async () => {
      try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        console.log('Iniciando login com Facebook via UI');
        
        // Mostrar mensagem de feedback
        showMessage('Conectando ao Facebook...', false);
        
        const user = await signInWithFacebook();
        
        // Se o usuário for null, significa que houve redirecionamento
        if (!user) {
          console.log('Redirecionando para autenticação do Facebook...');
          return; // Não faz nada, pois o usuário será redirecionado
        }
        
        showMessage('Login com Facebook realizado com sucesso!');
        updateUIBasedOnAuthState(user);
        
        // Redirecionar para página inicial
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } catch (error) {
        console.error('Erro capturado na UI durante login com Facebook:', error);
        showMessage(error.message, true);
      } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fab fa-facebook-f"></i> Facebook';
      }
    });
  });
};

// Função para configurar o botão de logout
const setupLogoutButton = () => {
  const logoutButtons = document.querySelectorAll('.logout-btn');
  logoutButtons.forEach(button => {
    button.addEventListener('click', async () => {
      try {
        await logoutUser();
        updateUIBasedOnAuthState(null);
        window.location.href = 'index.html';
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  });
};

// Função para configurar a redefinição de senha
const setupPasswordReset = () => {
  const resetLinks = document.querySelectorAll('.forgot-password');
  resetLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      if (!email) {
        showMessage('Digite seu email no campo acima para redefinir sua senha.', true);
        return;
      }
      
      try {
        await resetPassword(email);
        showMessage(`Email de redefinição de senha enviado para ${email}. Verifique sua caixa de entrada.`);
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  });
};

// Adicionar estilos CSS para mensagens
const addMessageStyles = () => {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .auth-message {
      padding: 12px 15px;
      margin: 10px 0 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      display: none;
      animation: fadeIn 0.3s ease;
    }
    
    .auth-message-success {
      background-color: rgba(38, 203, 124, 0.1);
      color: #26cb7c;
      border: 1px solid rgba(38, 203, 124, 0.2);
    }
    
    .auth-message-error {
      background-color: rgba(240, 52, 52, 0.1);
      color: #f03434;
      border: 1px solid rgba(240, 52, 52, 0.2);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .fa-spin {
      animation: fa-spin 2s infinite linear;
    }
    
    @keyframes fa-spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    
    .auth-diagnostic {
      display: none;
      margin-top: 40px;
      padding: 10px;
      border: 1px dashed #ddd;
      font-size: 12px;
      color: #999;
    }
    
    .auth-diagnostic.show {
      display: block;
    }
  `;
  
  document.head.appendChild(styleElement);
};

// Adicionar informações de diagnóstico ocultas na página
const addDiagnosticInfo = () => {
  // Criar elemento para informações de diagnóstico
  const diagnosticDiv = document.createElement('div');
  diagnosticDiv.className = 'auth-diagnostic';
  diagnosticDiv.id = 'auth-diagnostic';
  
  // Adicionar informações básicas
  diagnosticDiv.innerHTML = `
    <h4>Informações de Diagnóstico (para suporte técnico)</h4>
    <p>Domínio: ${window.location.hostname}</p>
    <p>URL: ${window.location.href}</p>
    <p>Navegador: ${navigator.userAgent}</p>
    <p>Firebase inicializado: ${typeof firebase !== 'undefined'}</p>
    <p>Timestamp: ${new Date().toISOString()}</p>
    <div id="auth-diagnostic-log"></div>
  `;
  
  // Adicionar no final da página
  const authMain = document.querySelector('.auth-main');
  if (authMain) {
    authMain.appendChild(diagnosticDiv);
    
    // Adicionar um pequeno link para mostrar/ocultar as informações de diagnóstico
    const toggleLink = document.createElement('a');
    toggleLink.href = '#';
    toggleLink.style.fontSize = '12px';
    toggleLink.style.color = '#999';
    toggleLink.style.display = 'block';
    toggleLink.style.textAlign = 'center';
    toggleLink.style.marginTop = '30px';
    toggleLink.textContent = 'Informações de diagnóstico';
    toggleLink.onclick = (e) => {
      e.preventDefault();
      diagnosticDiv.classList.toggle('show');
    };
    
    authMain.appendChild(toggleLink);
  }
  
  // Sobrescrever console.log para adicionar ao diagnóstico
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Função para adicionar log ao diagnóstico
  const addToDiagnosticLog = (message, type = 'log') => {
    const logDiv = document.getElementById('auth-diagnostic-log');
    if (logDiv) {
      const logEntry = document.createElement('p');
      logEntry.style.margin = '2px 0';
      logEntry.style.color = type === 'error' ? '#f03434' : type === 'warn' ? '#f39c12' : '#666';
      logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${type.toUpperCase()}: ${message}`;
      logDiv.appendChild(logEntry);
      
      // Limitar a quantidade de logs
      if (logDiv.children.length > 20) {
        logDiv.removeChild(logDiv.children[0]);
      }
    }
  };
  
  // Sobrescrever console.log
  console.log = function() {
    originalConsoleLog.apply(console, arguments);
    addToDiagnosticLog(Array.from(arguments).join(' '));
  };
  
  // Sobrescrever console.error
  console.error = function() {
    originalConsoleError.apply(console, arguments);
    addToDiagnosticLog(Array.from(arguments).join(' '), 'error');
  };
  
  // Sobrescrever console.warn
  console.warn = function() {
    originalConsoleWarn.apply(console, arguments);
    addToDiagnosticLog(Array.from(arguments).join(' '), 'warn');
  };
};