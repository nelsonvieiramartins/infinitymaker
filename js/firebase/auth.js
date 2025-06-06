// Importando as funções do Firebase Auth
import { auth } from './config.js';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// Provedores para autenticação social
const googleProvider = new GoogleAuthProvider();
// Configurar com parâmetros mais básicos para evitar problemas
googleProvider.addScope('email');
googleProvider.addScope('profile');
// Configuração mais simples
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

const facebookProvider = new FacebookAuthProvider();
// Adicionar escopos para Facebook (opcional)
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

// Função para criar um novo usuário com email e senha
export const registerWithEmailAndPassword = async (name, email, password) => {
  try {
    // Criar o usuário
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Adicionar o nome de exibição ao usuário
    await updateProfile(user, { displayName: name });
    
    console.log('Usuário registrado com sucesso:', user);
    return user;
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    let errorMessage = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este email já está sendo usado por outra conta.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'O email fornecido é inválido.';
    }
    
    throw new Error(errorMessage);
  }
};

// Função para fazer login com email e senha
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login bem-sucedido:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    let errorMessage = 'Ocorreu um erro ao fazer login. Tente novamente.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado. Verifique seu email.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Senha incorreta. Tente novamente.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'O email fornecido é inválido.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'Esta conta foi desativada.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
    }
    
    throw new Error(errorMessage);
  }
};

// Função para verificar se a configuração está correta
const verifyFirebaseConfig = () => {
  try {
    // Verificar se a configuração básica existe
    if (!auth || !auth.app) {
      throw new Error('Firebase Auth não foi inicializado');
    }
    
    const config = auth.app.options;
    if (!config.apiKey || !config.authDomain || !config.projectId) {
      throw new Error('Configuração do Firebase incompleta');
    }
    
    console.log('Configuração Firebase verificada:', {
      apiKey: config.apiKey ? 'OK' : 'MISSING',
      authDomain: config.authDomain || 'MISSING',
      projectId: config.projectId || 'MISSING'
    });
    
    return true;
  } catch (error) {
    console.error('Erro na verificação da configuração:', error);
    return false;
  }
};

// Função para fazer login com Google - versão simplificada e mais robusta
export const signInWithGoogle = async () => {
  try {
    console.log('=== INICIANDO LOGIN COM GOOGLE ===');
    
    // Verificar configuração primeiro
    if (!verifyFirebaseConfig()) {
      throw new Error('Configuração do Firebase incorreta. Entre em contato com o administrador.');
    }
    
    // Log do ambiente
    console.log('Domínio atual:', window.location.hostname);
    console.log('URL completa:', window.location.href);
    console.log('User Agent:', navigator.userAgent);
    
    // Limpar estado anterior
    sessionStorage.removeItem('googleAuthAttempt');
    
    // Verificar se estamos em um ambiente seguro (HTTPS ou localhost)
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
    
    if (!isSecure && window.location.hostname !== 'localhost') {
      throw new Error('A autenticação com Google requer uma conexão segura (HTTPS).');
    }
    
    // Tentar popup primeiro
    try {
      console.log('Tentando autenticação via popup...');
      
      // Criar um novo provider a cada tentativa para evitar cache
      const freshGoogleProvider = new GoogleAuthProvider();
      freshGoogleProvider.addScope('email');
      freshGoogleProvider.addScope('profile');
      freshGoogleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, freshGoogleProvider);
      
      if (result && result.user) {
        console.log('✅ Login Google bem-sucedido:', result.user.email);
        return result.user;
      } else {
        throw new Error('Resposta inválida do Google');
      }
      
    } catch (popupError) {
      console.error('❌ Erro no popup:', popupError);
      
      // Análise detalhada do erro
      if (popupError.code === 'auth/popup-blocked') {
        console.log('🚫 Popup bloqueado pelo navegador');
        throw new Error('O popup foi bloqueado pelo navegador. Permita popups para este site e tente novamente.');
      } else if (popupError.code === 'auth/popup-closed-by-user') {
        console.log('🚫 Popup fechado pelo usuário');
        throw new Error('A janela de login foi fechada. Tente novamente.');
      } else if (popupError.code === 'auth/cancelled-popup-request') {
        console.log('🚫 Solicitação de popup cancelada');
        throw new Error('Login cancelado. Tente novamente.');
      } else if (popupError.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        console.error('🚫 Domínio não autorizado:', domain);
        throw new Error(`Este domínio (${domain}) não está autorizado no Firebase. Configure o domínio no Console do Firebase.`);
      } else if (popupError.code === 'auth/operation-not-allowed') {
        console.error('🚫 Operação não permitida');
        throw new Error('A autenticação com Google não está habilitada. Configure no Console do Firebase.');
      } else if (popupError.code === 'auth/internal-error') {
        console.error('🚫 Erro interno do Firebase');
        throw new Error('Erro de configuração do Firebase. Verifique as credenciais no Console.');
      } else {
        // Para outros erros, propagar a mensagem original
        throw new Error(popupError.message || 'Erro desconhecido durante a autenticação.');
      }
    }
    
  } catch (error) {
    console.error('=== ERRO FINAL ===');
    console.error('Código:', error.code);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    
    // Retornar erro mais amigável
    throw new Error(error.message || 'Não foi possível fazer login com o Google. Tente novamente mais tarde.');
  }
};

// Função para verificar resultado de redirecionamento
export const checkRedirectResult = async () => {
  try {
    console.log('Verificando resultado de redirecionamento...');
    // Verificar se tínhamos uma tentativa de login pendente
    const authAttempt = sessionStorage.getItem('googleAuthAttempt');
    
    // Log para diagnóstico
    console.log('Tentativa de autenticação detectada:', authAttempt ? 'Sim' : 'Não');
    
    try {
      // Obter resultado do redirecionamento
      console.log('Chamando getRedirectResult...');
      const result = await getRedirectResult(auth);
      console.log('Resultado do redirecionamento:', result ? 'Obtido' : 'Nulo');
      
      // Limpar flag de tentativa de login
      sessionStorage.removeItem('googleAuthAttempt');
      
      if (result && result.user) {
        console.log('Login por redirecionamento bem-sucedido:', result.user.email);
        // Verifica se possui credenciais para Google (diagnóstico)
        if (GoogleAuthProvider.credentialFromResult(result)) {
          console.log('Credenciais Google válidas obtidas');
        }
        return result.user;
      } else if (authAttempt) {
        // Se tínhamos uma tentativa, mas não temos resultado, provavelmente houve um erro
        console.warn('Tentativa de login detectada, mas sem resultado. Possível erro ou cancelamento pelo usuário.');
        // Em alguns casos o Firebase não retorna erro, apenas resultado nulo
        if (window.location.href.includes('firebaseError')) {
          const errorParam = new URLSearchParams(window.location.search).get('firebaseError');
          console.error('Erro detectado na URL:', errorParam);
        }
      }
      return null;
    } catch (redirectError) {
      console.error('Erro ao processar getRedirectResult:', redirectError);
      
      // Tratar o erro específico
      if (redirectError.code === 'auth/credential-already-in-use') {
        console.warn('Credencial já em uso. Possível conflito de contas.');
        throw new Error('Este email do Google já está sendo usado por outra conta. Tente fazer login diretamente.');
      }
      
      // Propagar o erro para ser tratado no catch principal
      throw redirectError;
    }
  } catch (error) {
    console.error('Erro ao processar resultado do redirecionamento:', error);
    console.error('Código:', error.code);
    console.error('Mensagem:', error.message);
    
    // Limpar flag de tentativa
    sessionStorage.removeItem('googleAuthAttempt');
    
    // Verificar problemas específicos de configuração
    if (error.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      throw new Error(`Este site (${currentDomain}) não está autorizado no Firebase Console. Entre em contato com o administrador.`);
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('A autenticação com Google não está habilitada no Firebase Console. Entre em contato com o administrador.');
    } else if (error.code === 'auth/credential-already-in-use') {
      throw new Error('Este email do Google já está sendo usado por outra conta. Tente fazer login diretamente.');
    } else {
      throw new Error(`Erro ao processar login: ${error.message}`);
    }
  }
};

// Função para fazer login com Facebook
export const signInWithFacebook = async () => {
  try {
    console.log('Iniciando login com Facebook...');
    const result = await signInWithPopup(auth, facebookProvider);
    console.log('Login Facebook bem-sucedido:', result.user);
    return result.user;
  } catch (error) {
    console.error('Erro ao fazer login com Facebook:', error);
    console.log('Código de erro:', error.code);
    console.log('Mensagem de erro:', error.message);
    
    // Tentar método alternativo com redirecionamento se o popup falhar
    try {
      console.log('Tentando método alternativo com redirecionamento...');
      await signInWithRedirect(auth, facebookProvider);
      return null;
    } catch (redirectError) {
      console.error('Erro ao fazer login com Facebook (redirect):', redirectError);
      throw new Error('Não foi possível fazer login com o Facebook. Tente novamente.');
    }
  }
};

// Função para fazer logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('Usuário desconectado com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw new Error('Erro ao fazer logout. Tente novamente.');
  }
};

// Função para enviar email de redefinição de senha
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Email de redefinição de senha enviado');
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de redefinição:', error);
    let errorMessage = 'Erro ao enviar email de redefinição de senha.';
    
    if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'Não existe uma conta com este email.';
    }
    
    throw new Error(errorMessage);
  }
};

// Função para verificar o estado de autenticação do usuário
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};