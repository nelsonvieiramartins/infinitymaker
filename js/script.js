// Definição de constantes para a API da OpenAI
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';
const OPENAI_API_KEY = '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';

// Elementos do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Funcionalidade de menu mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    
    // Sistema de Upload de Imagens
    const uploadContainer = document.getElementById('upload-container');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const previewImage = document.getElementById('preview-image');
    const generateBtn = document.getElementById('generate-btn');
    const resultSection = document.getElementById('result-section');
    const resultContainer = document.getElementById('result-container');
    const uploadForm = document.getElementById('upload-form');
    
    // Inicializar sistema de upload
    if (uploadContainer && fileInput) {
        uploadContainer.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Sistema de seleção de estilo
    const styleOptions = document.querySelectorAll('.style-option');
    styleOptions.forEach(option => {
        option.addEventListener('click', function() {
            styleOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Processar o formulário de upload
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Formulários de autenticação
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Verificar autenticação para páginas protegidas
    checkAuth();
});

// Função para manipular a seleção de arquivo
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const previewContainer = document.getElementById('preview-container');
    const previewImage = document.getElementById('preview-image');
    
    // Verificar se é uma imagem
    if (!file.type.match('image.*')) {
        alert('Por favor, selecione uma imagem.');
        return;
    }
    
    // Mostrar a imagem prévia
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Função para lidar com o envio do formulário
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('file-input');
    const promptInput = document.getElementById('prompt-input');
    const generateBtn = document.getElementById('generate-btn');
    const resultSection = document.getElementById('result-section');
    const resultContainer = document.getElementById('result-container');
    
    // Verificar se há um arquivo
    if (!fileInput.files[0]) {
        alert('Por favor, faça upload de uma foto para transformar.');
        return;
    }
    
    // Alterando o texto do botão e desabilitando
    generateBtn.textContent = 'Transformando...';
    generateBtn.disabled = true;
    
    try {
        // Preparar o arquivo para envio
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            const base64Image = e.target.result.split(',')[1];
            
            // Obter estilo selecionado
            const selectedStyle = document.querySelector('.style-option.active').getAttribute('data-style');
            
            // Preparar personalizações adicionais
            const customizations = promptInput.value.trim();
            
            // Chamar a API OpenAI
            await generateDisneyInfinityCharacter(selectedStyle, customizations, base64Image, resultContainer);
            
            // Exibir os resultados
            resultSection.style.display = 'block';
            
            // Rolagem suave até os resultados
            resultSection.scrollIntoView({ behavior: 'smooth' });
            
            // Resetar o botão
            generateBtn.textContent = 'Transformar em Personagem Disney Infinity';
            generateBtn.disabled = false;
        };
        
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Erro ao processar a imagem:', error);
        alert('Ocorreu um erro ao processar a imagem. Por favor, tente novamente.');
        
        // Resetar o botão
        generateBtn.textContent = 'Transformar em Personagem Disney Infinity';
        generateBtn.disabled = false;
    }
}

// Função para gerar personagens Disney Infinity usando a API da OpenAI
async function generateDisneyInfinityCharacter(style, customizations, imageBase64, resultContainer) {
    try {
        // Mostrar mensagem de carregamento
        resultContainer.innerHTML = '<div class="loading">Transformando sua foto em personagem Disney Infinity, por favor aguarde...</div>';
        
        // Criar prompts específicos baseados no estilo
        let basePrompt = '';
        
        switch(style) {
            case 'disney-infinity':
                basePrompt = 'Transform this person into a Disney Infinity 3D character figure. Make it look like a collectible toy figure with Disney Infinity style: rounded features, simplified proportions, smooth textures, vibrant colors, and sitting on a circular base platform like the actual Disney Infinity figures. The character should have the characteristic toy-like appearance with slightly exaggerated features and a friendly expression.';
                break;
            case 'superhero':
                basePrompt = 'Transform this person into a Disney Infinity superhero character figure. Create a 3D toy-like figure with superhero costume, cape if appropriate, heroic pose, sitting on the characteristic Disney Infinity circular base. Maintain the Disney Infinity aesthetic: smooth textures, vibrant colors, rounded features, and collectible figure appearance.';
                break;
            case 'fantasy':
                basePrompt = 'Transform this person into a Disney Infinity fantasy character figure. Create a 3D toy-like figure with fantasy elements like armor, weapons, magical accessories, sitting on the Disney Infinity circular base. Use the Disney Infinity style: rounded proportions, smooth textures, vibrant fantasy colors, and collectible toy appearance.';
                break;
        }
        
        // Adicionar personalizações
        if (customizations) {
            basePrompt += ` Additional customizations: ${customizations}.`;
        }
        
        basePrompt += ' High quality, detailed 3D render, studio lighting, collectible figure style.';
        
        // Prepara os dados para a requisição - Usando DALL-E 3
        const payload = {
            model: "dall-e-3",
            prompt: basePrompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            response_format: "url"
        };
        
        // Faz a requisição para a API da OpenAI
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro na API: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`);
        }
        
        const data = await response.json();
        
        // Verificar se a resposta contém as imagens geradas
        if (!data.data || !data.data.length) {
            throw new Error('Nenhuma imagem foi gerada pela API');
        }
        
        // Limpar resultados anteriores
        resultContainer.innerHTML = '';
        
        // Processar e exibir o personagem gerado
        const generatedCharacter = data.data[0];
        
        const resultHTML = `
            <div class="character-result">
                <div class="character-showcase">
                    <img src="${generatedCharacter.url}" alt="Seu Personagem Disney Infinity" class="character-image">
                    <div class="character-info">
                        <h3>Seu Personagem Disney Infinity</h3>
                        <p class="character-style">Estilo: ${getStyleName(style)}</p>
                        ${customizations ? `<p class="character-customizations">Personalizações: ${customizations}</p>` : ''}
                        <div class="character-actions">
                            <button class="btn download-btn" data-url="${generatedCharacter.url}">
                                <i class="fas fa-download"></i> Baixar em Alta Resolução
                            </button>
                            <button class="btn share-btn" data-url="${generatedCharacter.url}">
                                <i class="fas fa-share-alt"></i> Compartilhar
                            </button>
                            <button class="btn print-btn" data-url="${generatedCharacter.url}">
                                <i class="fas fa-print"></i> Preparar para Impressão 3D
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="character-variants">
                    <h4>Quer tentar estilos diferentes?</h4>
                    <div class="variant-buttons">
                        <button class="btn btn-outline regenerate-btn" data-style="disney-infinity">Estilo Clássico</button>
                        <button class="btn btn-outline regenerate-btn" data-style="superhero">Super-Herói</button>
                        <button class="btn btn-outline regenerate-btn" data-style="fantasy">Fantasia</button>
                    </div>
                </div>
            </div>
        `;
        
        resultContainer.innerHTML = resultHTML;
        
        // Adicionar event listeners para os botões
        const downloadBtn = document.querySelector('.download-btn');
        downloadBtn.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            downloadImage(url, 'personagem-disney-infinity.png');
        });
        
        const shareBtn = document.querySelector('.share-btn');
        shareBtn.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            shareCharacter(url);
        });
        
        const printBtn = document.querySelector('.print-btn');
        printBtn.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            preparePrint3D(url);
        });
        
        // Botões de regeneração
        const regenerateBtns = document.querySelectorAll('.regenerate-btn');
        regenerateBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const newStyle = this.getAttribute('data-style');
                const fileInput = document.getElementById('file-input');
                const promptInput = document.getElementById('prompt-input');
                
                if (fileInput.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const base64Image = e.target.result.split(',')[1];
                        generateDisneyInfinityCharacter(newStyle, promptInput.value.trim(), base64Image, resultContainer);
                    };
                    reader.readAsDataURL(fileInput.files[0]);
                }
            });
        });
        
        // Salvar no histórico
        saveToHistory({
            style: style,
            customizations: customizations,
            result: generatedCharacter.url,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro ao gerar personagem:', error);
        resultContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ops! Algo deu errado</h3>
                <p>Erro ao gerar seu personagem Disney Infinity: ${error.message}</p>
                <p>Por favor, tente novamente. Se o problema persistir, entre em contato com nosso suporte.</p>
                <button class="btn retry-btn" onclick="location.reload()">Tentar Novamente</button>
            </div>
        `;
    }
}

// Função auxiliar para obter nome do estilo
function getStyleName(style) {
    const styleNames = {
        'disney-infinity': 'Disney Infinity Clássico',
        'superhero': 'Super-Herói Disney Infinity',
        'fantasy': 'Fantasia Disney Infinity'
    };
    return styleNames[style] || 'Personalizado';
}

// Função para compartilhar o personagem
function shareCharacter(url) {
    if (navigator.share) {
        navigator.share({
            title: 'Meu Personagem Disney Infinity',
            text: 'Confira meu personagem Disney Infinity criado com o Infinity Maker!',
            url: url
        })
        .then(() => console.log('Compartilhamento bem-sucedido'))
        .catch((error) => console.log('Erro ao compartilhar', error));
    } else {
        // Fallback para navegadores que não suportam a API Web Share
        const shareText = `Confira meu personagem Disney Infinity criado com o Infinity Maker! ${url}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Link copiado para a área de transferência! Cole em suas redes sociais.');
            });
        } else {
            // Fallback mais antigo
            const tempInput = document.createElement('input');
            document.body.appendChild(tempInput);
            tempInput.value = shareText;
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            alert('Link copiado para a área de transferência! Cole em suas redes sociais.');
        }
    }
}

// Função para preparar impressão 3D
function preparePrint3D(url) {
    alert('Funcionalidade de impressão 3D em desenvolvimento! Em breve você poderá baixar arquivos STL do seu personagem.');
}

// Função para download de imagem
function downloadImage(url, filename) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const a = document.createElement('a');
            const objectUrl = URL.createObjectURL(blob);
            a.href = objectUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);
        })
        .catch(error => {
            console.error('Erro ao baixar a imagem:', error);
            alert('Não foi possível baixar a imagem. Tente novamente mais tarde.');
        });
}

// Funções de autenticação (simuladas para esta demonstração)
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Simulação de login
    if (email && password) {
        // Em um caso real, você verificaria as credenciais com o servidor
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify({
            email: email,
            name: email.split('@')[0],
            role: email.includes('admin') ? 'admin' : 'user'
        }));
        
        // Redirecionar com base no papel
        if (email.includes('admin')) {
            window.location.href = 'admin/dashboard.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    // Simulação de registro
    if (name && email && password) {
        // Em um caso real, você enviaria os dados para o servidor
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify({
            name: name,
            email: email,
            role: 'user'
        }));
        
        window.location.href = 'index.html';
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentPath = window.location.pathname;
    
    // Verificar páginas protegidas
    if (currentPath.includes('admin/') && !isLoggedIn) {
        window.location.href = '../login.html';
        return;
    }
    
    // Atualizar interface com base no status de login
    updateUI(isLoggedIn);
}

function updateUI(isLoggedIn) {
    const loginLinks = document.querySelectorAll('.login-link');
    const userInfo = document.querySelectorAll('.user-info');
    const adminLinks = document.querySelectorAll('.admin-link');
    
    if (isLoggedIn) {
        const user = JSON.parse(localStorage.getItem('user'));
        
        loginLinks.forEach(link => link.style.display = 'none');
        userInfo.forEach(info => {
            info.style.display = 'block';
            const nameElem = info.querySelector('.user-name');
            if (nameElem) nameElem.textContent = user.name;
        });
        
        if (user.role === 'admin') {
            adminLinks.forEach(link => link.style.display = 'block');
        } else {
            adminLinks.forEach(link => link.style.display = 'none');
        }
    } else {
        loginLinks.forEach(link => link.style.display = 'block');
        userInfo.forEach(info => info.style.display = 'none');
        adminLinks.forEach(link => link.style.display = 'none');
    }
}

// Funções para histórico (simuladas)
function saveToHistory(data) {
    const history = JSON.parse(localStorage.getItem('characterHistory') || '[]');
    history.push(data);
    localStorage.setItem('characterHistory', JSON.stringify(history));
}

function getHistory() {
    return JSON.parse(localStorage.getItem('characterHistory') || '[]');
}

// Funções para o painel de administração
function loadAdminStats() {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;
    
    // Simulando estatísticas
    const stats = {
        totalUsers: 125,
        totalCharacters: 1872,
        activeUsers: 45,
        apiCalls: 3254
    };
    
    // Atualizar os valores no DOM
    for (const [key, value] of Object.entries(stats)) {
        const elem = document.getElementById(`stat-${key}`);
        if (elem) elem.textContent = value;
    }
}

function loadAdminTable() {
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody) return;
    
    // Simulando dados da tabela
    const users = [
        { id: 1, name: 'João Silva', email: 'joao@example.com', status: 'active', date: '2023-10-15', characters: 24 },
        { id: 2, name: 'Maria Santos', email: 'maria@example.com', status: 'active', date: '2023-09-22', characters: 47 },
        { id: 3, name: 'Pedro Oliveira', email: 'pedro@example.com', status: 'inactive', date: '2023-08-30', characters: 12 },
        { id: 4, name: 'Ana Costa', email: 'ana@example.com', status: 'pending', date: '2023-10-01', characters: 8 },
        { id: 5, name: 'Carlos Pereira', email: 'carlos@example.com', status: 'active', date: '2023-07-15', characters: 36 }
    ];
    
    // Limpar tabela
    tableBody.innerHTML = '';
    
    // Preencher tabela com dados
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="status status-${user.status}">${user.status}</span></td>
            <td>${user.date}</td>
            <td>${user.characters}</td>
            <td>
                <button class="btn btn-sm edit-btn" data-id="${user.id}">Editar</button>
                <button class="btn btn-sm delete-btn" data-id="${user.id}">Excluir</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Adicionar event listeners para os botões
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            alert(`Editar usuário ID: ${userId}`);
        });
    });
    
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            if (confirm(`Tem certeza que deseja excluir o usuário ID: ${userId}?`)) {
                alert(`Usuário ID: ${userId} excluído com sucesso!`);
                this.closest('tr').remove();
            }
        });
    });
}

// Inicializar as funções do admin quando necessário
if (window.location.pathname.includes('admin/')) {
    document.addEventListener('DOMContentLoaded', function() {
        loadAdminStats();
        loadAdminTable();
    });
}