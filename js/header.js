/**
 * Script para controlar o cabeçalho padrão em todas as páginas
 * Gerencia: menu responsivo, navegação ativa, estado de login
 */

document.addEventListener('DOMContentLoaded', function() {
    // Configurar o menu responsivo para dispositivos móveis
    setupMobileMenu();
    
    // Marcar o item de navegação atual com base na URL
    highlightActiveNavItem();
    
    // Inicializar simulação do estado de login (para fins de demonstração)
    setupLoginState();
});

/**
 * Configura o menu mobile com eventos de clique
 */
function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // Fechar menu ao clicar em um link (para mobile)
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });
}

/**
 * Destaca o item de navegação ativo com base na URL atual
 */
function highlightActiveNavItem() {
    // Obter o caminho da URL atual (sem domínio, apenas o caminho relativo)
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();
    
    // Obter todos os links de navegação
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Remover qualquer classe ativa existente
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Adicionar classe ativa com base na URL atual
    if (currentPage === '' || currentPage === 'index.html') {
        // Estamos na página inicial
        const homeLink = document.querySelector('.nav-links a[href="index.html"]');
        if (homeLink) homeLink.classList.add('active');
    } else {
        // Para outras páginas, verificar o link correspondente
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || href.split('.')[0] === currentPage.split('.')[0]) {
                link.classList.add('active');
            }
        });
    }
    
    // Tratar os links especiais (features, how-it-works) apenas na página inicial
    if (currentPage === '' || currentPage === 'index.html') {
        const featuresLink = document.querySelector('.nav-links a[href="#features"]');
        const howItWorksLink = document.querySelector('.nav-links a[href="#how-it-works"]');
        
        // Adicionar event listeners para esses links na página inicial
        if (featuresLink) {
            featuresLink.addEventListener('click', function() {
                document.querySelector('#features').scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        if (howItWorksLink) {
            howItWorksLink.addEventListener('click', function() {
                document.querySelector('#how-it-works').scrollIntoView({ behavior: 'smooth' });
            });
        }
    }
    
    // Mostrar ou ocultar o botão "Vamos Criar" com base na página atual
    const createButton = document.querySelector('.create-btn');
    if (createButton) {
        if (currentPage === 'create.html') {
            createButton.parentElement.style.display = 'none';
        } else {
            createButton.parentElement.style.display = 'list-item';
        }
    }
}

/**
 * Configura simulação de estado de login (para fins de demonstração)
 */
function setupLoginState() {
    // Verificar localStorage para um token simulado
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName') || 'Usuário';
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    // Elementos de UI para gerenciar
    const loginLinks = document.querySelectorAll('.login-link');
    const userInfo = document.querySelector('.user-info');
    const userNameElement = userInfo ? userInfo.querySelector('.user-name') : null;
    const adminLink = document.querySelector('.admin-link');
    
    // Atualizar UI com base no estado de login
    if (isLoggedIn) {
        // Esconder links de login/cadastro
        loginLinks.forEach(link => {
            link.style.display = 'none';
        });
        
        // Mostrar informações do usuário
        if (userInfo) {
            userInfo.style.display = 'list-item';
            if (userNameElement) userNameElement.textContent = userName;
        }
        
        // Mostrar link de admin se for admin
        if (adminLink && isAdmin) {
            adminLink.style.display = 'list-item';
        }
    } else {
        // Mostrar links de login/cadastro
        loginLinks.forEach(link => {
            link.style.display = 'list-item';
        });
        
        // Esconder informações do usuário
        if (userInfo) userInfo.style.display = 'none';
        
        // Esconder link de admin
        if (adminLink) adminLink.style.display = 'none';
    }
    
    // Adicionar handler para redirect de login/cadastro para auth.html
    // Compatibilidade com login.html e register.html para auth.html
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
        window.location.href = 'auth.html' + (window.location.pathname.includes('register.html') ? '#register' : '');
    }
}

// Adicionar função para realizar login do usuário
function loginUser(email, password) {
    // Aqui seria a integração com uma API real de autenticação
    // Para demonstração, vamos simular um login bem-sucedido
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', email.split('@')[0]);
    localStorage.setItem('userEmail', email);
    
    // Simular usuário admin para demo (se email contiver "admin")
    if (email.toLowerCase().includes('admin')) {
        localStorage.setItem('isAdmin', 'true');
    } else {
        localStorage.setItem('isAdmin', 'false');
    }
    
    return true; // Login bem-sucedido
}

// Adicionar função para cadastrar novo usuário
function registerUser(name, email, password) {
    // Aqui seria a integração com uma API real de cadastro
    // Para demonstração, vamos simular um cadastro bem-sucedido
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isAdmin', 'false');
    
    return true; // Cadastro bem-sucedido
}

// Adicionar função para logout do usuário
function logoutUser() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    
    // Redirecionar para a página inicial após logout
    window.location.href = 'index.html';
}

// Exportar funções para uso em outras páginas
window.authFunctions = {
    loginUser,
    registerUser,
    logoutUser
};