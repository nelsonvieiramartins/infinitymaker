// Script para diagnóstico e solução de problemas do Firebase Auth

// Função para verificar configuração do Firebase
export const diagnoseFirabaseConfig = () => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      domain: window.location.hostname,
      protocol: window.location.protocol,
      url: window.location.href,
      userAgent: navigator.userAgent,
      isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    },
    firebase: {},
    recommendations: []
  };

  try {
    // Verificar se Firebase está carregado
    if (typeof firebase === 'undefined') {
      results.firebase.loaded = false;
      results.recommendations.push('Firebase não está carregado. Verifique se os scripts do Firebase estão incluídos.');
    } else {
      results.firebase.loaded = true;
    }

    // Verificar Auth
    const auth = window.auth || null;
    if (!auth) {
      results.firebase.auth = false;
      results.recommendations.push('Firebase Auth não está inicializado.');
    } else {
      results.firebase.auth = true;
      
      // Verificar configuração
      const config = auth.app.options;
      results.firebase.config = {
        apiKey: config.apiKey ? 'OK' : 'MISSING',
        authDomain: config.authDomain || 'MISSING',
        projectId: config.projectId || 'MISSING'
      };
      
      if (!config.apiKey) {
        results.recommendations.push('API Key do Firebase está faltando.');
      }
      if (!config.authDomain) {
        results.recommendations.push('Auth Domain do Firebase está faltando.');
      }
      if (!config.projectId) {
        results.recommendations.push('Project ID do Firebase está faltando.');
      }
    }

    // Verificar HTTPS
    if (window.location.protocol !== 'https:' && !results.environment.isLocalhost) {
      results.recommendations.push('A autenticação com Google requer HTTPS em produção.');
    }

    // Verificar se é um domínio válido
    const domain = window.location.hostname;
    if (domain.includes('ngrok') || domain.includes('herokuapp') || domain.includes('vercel') || domain.includes('netlify')) {
      results.recommendations.push(`Domínio ${domain} precisa ser adicionado às origens autorizadas no Firebase Console.`);
    }

  } catch (error) {
    results.error = error.message;
    results.recommendations.push('Erro ao diagnosticar configuração: ' + error.message);
  }

  return results;
};

// Função para testar autenticação Google
export const testGoogleAuth = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
    error: null
  };

  try {
    results.steps.push('Iniciando teste de autenticação Google...');

    // Importar dependências
    const { auth } = await import('./config.js');
    const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js');

    results.steps.push('Dependências carregadas com sucesso');

    // Criar provider
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    results.steps.push('Provider Google criado');

    // Tentar autenticação
    const result = await signInWithPopup(auth, provider);

    if (result && result.user) {
      results.success = true;
      results.steps.push(`Autenticação bem-sucedida: ${result.user.email}`);
      results.user = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      };
    } else {
      results.error = 'Resultado inválido da autenticação';
      results.steps.push('Erro: Resultado inválido');
    }

  } catch (error) {
    results.error = error.message;
    results.steps.push(`Erro: ${error.message}`);
    
    // Análise específica do erro
    if (error.code === 'auth/unauthorized-domain') {
      results.steps.push('SOLUÇÃO: Adicione o domínio às origens autorizadas no Firebase Console');
    } else if (error.code === 'auth/operation-not-allowed') {
      results.steps.push('SOLUÇÃO: Habilite a autenticação Google no Firebase Console');
    } else if (error.code === 'auth/popup-blocked') {
      results.steps.push('SOLUÇÃO: Permita popups para este site');
    }
  }

  return results;
};

// Função para exibir informações de diagnóstico na tela
export const showDiagnosticInfo = () => {
  const diagnosis = diagnoseFirabaseConfig();
  
  const infoDiv = document.createElement('div');
  infoDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: white;
    border: 2px solid #333;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 400px;
    z-index: 10000;
    font-size: 12px;
    font-family: monospace;
  `;
  
  infoDiv.innerHTML = `
    <h3 style="margin: 0 0 10px 0; color: #333;">Diagnóstico Firebase</h3>
    <p><strong>Domínio:</strong> ${diagnosis.environment.domain}</p>
    <p><strong>Protocolo:</strong> ${diagnosis.environment.protocol}</p>
    <p><strong>Firebase Auth:</strong> ${diagnosis.firebase.auth ? '✅' : '❌'}</p>
    ${diagnosis.firebase.config ? `
      <p><strong>API Key:</strong> ${diagnosis.firebase.config.apiKey}</p>
      <p><strong>Auth Domain:</strong> ${diagnosis.firebase.config.authDomain}</p>
      <p><strong>Project ID:</strong> ${diagnosis.firebase.config.projectId}</p>
    ` : ''}
    
    ${diagnosis.recommendations.length > 0 ? `
      <h4 style="margin: 10px 0 5px 0; color: #d63384;">Recomendações:</h4>
      <ul style="margin: 0; padding-left: 15px;">
        ${diagnosis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    ` : ''}
    
    <button onclick="this.parentElement.remove()" style="
      margin-top: 10px;
      padding: 5px 10px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    ">Fechar</button>
    
    <button onclick="window.testGoogleAuth()" style="
      margin-top: 10px;
      margin-left: 5px;
      padding: 5px 10px;
      background: #0d6efd;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    ">Testar Google Auth</button>
  `;
  
  document.body.appendChild(infoDiv);
  
  // Adicionar função de teste ao window para acesso global
  window.testGoogleAuth = async () => {
    const results = await testGoogleAuth();
    alert(JSON.stringify(results, null, 2));
  };
};

// Adicionar comando de diagnóstico ao console
console.log('🔧 Para diagnosticar problemas do Firebase, execute: showDiagnosticInfo()');
window.showDiagnosticInfo = showDiagnosticInfo;