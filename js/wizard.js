/**
 * Infinity Maker - Wizard Interface
 * Script para controlar o funcionamento do wizard passo a passo
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do wizard
    const wizardSteps = document.querySelectorAll('.wizard-step');
    const wizardPanels = document.querySelectorAll('.wizard-panel');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const generateBtn = document.getElementById('generate-btn');
    
    // Variáveis de controle
    let currentStep = 1;
    const totalSteps = wizardSteps.length;
    const uploadedImages = {};
    const selectedStyles = {}; // Ainda mantemos esse objeto para compatibilidade, mas vamos preenchê-lo automaticamente
    const customizations = {};
    let creationMode = 'combined'; // Modo padrão: combinado
    const defaultStyle = 'disney-infinity'; // Estilo padrão para todos os personagens
    
    // Inicialização de eventos
    initializeUploadSlots();
    initializeNavigation();
    initializeStyleSelection();
    initializeSuggestionTags();
    initializeCreationModes();
    
    /**
     * Inicializa os slots de upload de imagens
     */
    function initializeUploadSlots() {
        const uploadSlots = document.querySelectorAll('.upload-slot');
        
        uploadSlots.forEach((slot, index) => {
            const uploadArea = slot.querySelector('.upload-area');
            const fileInput = slot.querySelector('.file-input');
            const imagePreview = slot.querySelector('.image-preview');
            const previewImg = imagePreview.querySelector('img');
            const removeBtn = imagePreview.querySelector('.remove-btn');
            const slotNumber = index + 1;
            
            // Evento de clique na área de upload
            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });
            
            // Evento de arrastar e soltar
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                if (e.dataTransfer.files.length > 0) {
                    handleFileUpload(e.dataTransfer.files[0], slotNumber, previewImg, imagePreview);
                }
            });
            
            // Evento de seleção de arquivo
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    handleFileUpload(fileInput.files[0], slotNumber, previewImg, imagePreview);
                }
            });
            
            // Evento de remoção de imagem
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Remover a imagem do objeto de controle
                delete uploadedImages[slotNumber];
                
                // Esconder a prévia e mostrar a área de upload
                imagePreview.style.display = 'none';
                uploadArea.style.display = 'flex';
                
                // Limpar o input de arquivo
                fileInput.value = '';
                
                // Verificar se podemos avançar
                checkNextButton();
            });
        });
    }
    
    /**
     * Manipula o upload de um arquivo
     */
    function handleFileUpload(file, slotNumber, previewImg, imagePreview) {
        // Verificar se é uma imagem
        if (!file.type.match('image.*')) {
            alert('Por favor, selecione uma imagem válida.');
            return;
        }
        
        // Verificar o tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5MB.');
            return;
        }
        
        // Criar leitor de arquivo para prévia
        const reader = new FileReader();
        reader.onload = function(e) {
            // Atualizar a prévia
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
            
            // Ocultar área de upload
            const uploadArea = previewImg.closest('.upload-slot').querySelector('.upload-area');
            uploadArea.style.display = 'none';
            
            // Armazenar imagem no objeto de controle
            uploadedImages[slotNumber] = {
                dataUrl: e.target.result,
                file: file,
                name: file.name
            };
            
            // Verificar se podemos avançar
            checkNextButton();
        };
        
        reader.readAsDataURL(file);
    }
    
    /**
     * Inicializa os botões de navegação do wizard
     */
    function initializeNavigation() {
        // Botão anterior
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                goToStep(currentStep - 1);
            }
        });
        
        // Botão próximo
        nextBtn.addEventListener('click', () => {
            if (validateCurrentStep()) {
                if (currentStep < totalSteps) {
                    // Preparar o próximo passo antes de avançar
                    prepareNextStep(currentStep + 1);
                    goToStep(currentStep + 1);
                }
            }
        });
        
        // Botão de geração
        generateBtn.addEventListener('click', () => {
            // Iniciar geração com base no modo selecionado
            if (creationMode === 'combined') {
                startCombinedGeneration();
            } else {
                startIndividualGeneration();
            }
        });
    }
    
    /**
     * Inicializa a seleção de estilos
     */
    function initializeStyleSelection() {
        // Opções de estilo
        const styleOptions = document.querySelectorAll('.style-option');
        styleOptions.forEach(option => {
            option.addEventListener('click', function() {
                const selectedPhotoItem = document.querySelector('.photo-item.active');
                if (selectedPhotoItem) {
                    const photoId = selectedPhotoItem.getAttribute('data-photo');
                    const style = this.getAttribute('data-style');
                    
                    // Atualizar a seleção visual
                    styleOptions.forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');
                    
                    // Armazenar o estilo selecionado
                    selectedStyles[photoId] = style;
                    
                    // Atualizar o badge de estilo no item da foto
                    selectedPhotoItem.querySelector('.style-badge').textContent = getStyleName(style);
                    
                    // Verificar se podemos avançar
                    checkNextButton();
                }
            });
        });
        
        // Botão de aplicar para todas
        const applyAllBtn = document.getElementById('apply-all-btn');
        applyAllBtn.addEventListener('click', () => {
            const selectedOption = document.querySelector('.style-option.selected');
            if (selectedOption) {
                const style = selectedOption.getAttribute('data-style');
                
                // Aplicar o estilo a todas as fotos
                const photoItems = document.querySelectorAll('.photo-item');
                photoItems.forEach(item => {
                    const photoId = item.getAttribute('data-photo');
                    selectedStyles[photoId] = style;
                    
                    // Atualizar o badge de estilo
                    item.querySelector('.style-badge').textContent = getStyleName(style);
                });
                
                // Verificar se podemos avançar
                checkNextButton();
            } else {
                alert('Por favor, selecione um estilo primeiro.');
            }
        });
    }
    
    /**
     * Inicializa as tags de sugestão para personalização
     */
    function initializeSuggestionTags() {
        const suggestionTags = document.querySelectorAll('.suggestion-tag');
        
        suggestionTags.forEach(tag => {
            tag.addEventListener('click', function() {
                const suggestion = this.getAttribute('data-suggestion');
                const activeCustomization = document.querySelector('.customization-item.active');
                
                if (activeCustomization) {
                    const textarea = activeCustomization.querySelector('textarea');
                    const currentText = textarea.value.trim();
                    
                    // Adicionar a sugestão ao texto atual
                    if (currentText) {
                        textarea.value = currentText + ', ' + suggestion;
                    } else {
                        textarea.value = suggestion;
                    }
                    
                    // Salvar a personalização
                    const photoId = activeCustomization.getAttribute('data-photo');
                    customizations[photoId] = textarea.value;
                }
            });
        });
    }
    
    /**
     * Inicializa os modos de criação
     */
    function initializeCreationModes() {
        const creationModes = document.querySelectorAll('.creation-mode');
        const combinedSettings = document.getElementById('combined-settings');
        
        creationModes.forEach(mode => {
            mode.addEventListener('click', function() {
                // Remover classe ativa de todos os modos
                creationModes.forEach(m => m.classList.remove('active'));
                
                // Adicionar classe ativa ao modo clicado
                this.classList.add('active');
                
                // Atualizar modo selecionado
                creationMode = this.id.replace('-mode', '');
                
                // Mostrar/ocultar configurações combinadas
                if (creationMode === 'combined') {
                    combinedSettings.style.display = 'block';
                } else {
                    combinedSettings.style.display = 'none';
                }
            });
        });
    }
    
    /**
     * Vai para um passo específico do wizard
     */
    function goToStep(step) {
        // Atualizar passos
        wizardSteps.forEach((stepEl, index) => {
            const stepNum = index + 1;
            
            if (stepNum < step) {
                stepEl.classList.add('completed');
                stepEl.classList.remove('active');
            } else if (stepNum === step) {
                stepEl.classList.add('active');
                stepEl.classList.remove('completed');
            } else {
                stepEl.classList.remove('active', 'completed');
            }
        });
        
        // Atualizar painéis
        wizardPanels.forEach((panel, index) => {
            const panelStep = index + 1;
            
            if (panelStep === step) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
        
        // Atualizar botões
        prevBtn.disabled = step === 1;
        
        // Mostrar/ocultar botões baseado no passo atual
        if (step === totalSteps - 1) {
            nextBtn.style.display = 'none';
            generateBtn.style.display = 'block';
        } else if (step === totalSteps) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            generateBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'block';
            generateBtn.style.display = 'none';
        }
        
        // Atualizar passo atual
        currentStep = step;
        
        // Verificar se podemos avançar
        checkNextButton();
    }
    
    /**
     * Valida o passo atual
     */
    function validateCurrentStep() {
        switch (currentStep) {
            case 1: // Upload de Fotos
                if (Object.keys(uploadedImages).length === 0) {
                    alert('Por favor, faça upload de pelo menos uma foto.');
                    return false;
                }
                
                // Automaticamente aplicar o estilo padrão para todas as fotos carregadas
                Object.keys(uploadedImages).forEach(photoId => {
                    selectedStyles[photoId] = defaultStyle;
                });
                
                return true;
                
            case 2: // Personalização (anteriormente passo 3)
                // A personalização é opcional, então sempre retorna true
                return true;
                
            case 3: // Modo de Criação (anteriormente passo 4)
                // Verificar se há configurações específicas para validar
                if (creationMode === 'combined') {
                    const sceneDescription = document.getElementById('scene-description').value.trim();
                    if (!sceneDescription) {
                        alert('Por favor, forneça uma descrição para a cena combinada.');
                        return false;
                    }
                }
                return true;
                
            default:
                return true;
        }
    }
    
    /**
     * Prepara o próximo passo antes de avançar
     */
    function prepareNextStep(nextStep) {
        switch (nextStep) {
            case 2: // Preparar Personalização (anteriormente passo 3)
                prepareCustomizationStep();
                break;
                
            case 3: // Preparar Modo de Criação (anteriormente passo 4)
                // Não é necessário preparação específica aqui
                break;
                
            case 4: // Preparar Resultado (anteriormente passo 5)
                // Atualizar o título com base no modo de criação
                const resultTitle = document.getElementById('result-title');
                if (creationMode === 'combined') {
                    resultTitle.textContent = 'Sua Cena Combinada de Colecionáveis';
                } else {
                    resultTitle.textContent = 'Seus Personagens Colecionáveis';
                }
                break;
                
            default:
                break;
        }
    }
    
    /**
     * Prepara o passo de seleção de estilos
     */
    function prepareStyleStep() {
        const photosContainer = document.querySelector('.photos-container');
        photosContainer.innerHTML = '';
        
        // Criar um item para cada foto carregada
        Object.keys(uploadedImages).forEach(slotNumber => {
            const image = uploadedImages[slotNumber];
            
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.setAttribute('data-photo', slotNumber);
            
            photoItem.innerHTML = `
                <img src="${image.dataUrl}" alt="Foto ${slotNumber}">
                <p>Foto ${slotNumber}</p>
                <div class="style-badge">Nenhum estilo selecionado</div>
            `;
            
            // Se já tiver um estilo selecionado, atualize o badge
            if (selectedStyles[slotNumber]) {
                photoItem.querySelector('.style-badge').textContent = getStyleName(selectedStyles[slotNumber]);
            }
            
            // Adicionar evento de clique para selecionar a foto
            photoItem.addEventListener('click', function() {
                // Remover classe ativa de todos os itens
                document.querySelectorAll('.photo-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Adicionar classe ativa ao item clicado
                this.classList.add('active');
                
                // Se já tiver um estilo selecionado, atualizar a interface
                const photoId = this.getAttribute('data-photo');
                if (selectedStyles[photoId]) {
                    // Encontrar e selecionar o estilo correspondente
                    const styleOption = document.querySelector(`.style-option[data-style="${selectedStyles[photoId]}"]`);
                    if (styleOption) {
                        document.querySelectorAll('.style-option').forEach(opt => {
                            opt.classList.remove('selected');
                        });
                        styleOption.classList.add('selected');
                    }
                } else {
                    // Limpar seleção de estilo
                    document.querySelectorAll('.style-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                }
            });
            
            photosContainer.appendChild(photoItem);
        });
        
        // Selecionar o primeiro item por padrão
        const firstItem = photosContainer.querySelector('.photo-item');
        if (firstItem) {
            firstItem.click();
        }
    }
    
    /**
     * Prepara o passo de personalização
     */
    function prepareCustomizationStep() {
        const customizationContainer = document.querySelector('.customization-container');
        customizationContainer.innerHTML = '';
        
        // Criar um item para cada foto com estilo selecionado
        Object.keys(selectedStyles).forEach(photoId => {
            const image = uploadedImages[photoId];
            const style = selectedStyles[photoId];
            
            const customizationItem = document.createElement('div');
            customizationItem.className = 'customization-item';
            customizationItem.setAttribute('data-photo', photoId);
            
            customizationItem.innerHTML = `
                <img src="${image.dataUrl}" alt="Foto ${photoId}">
                <h5>Foto ${photoId}</h5>
                <div class="style-badge">${getStyleName(style)}</div>
                <textarea placeholder="Adicione instruções de personalização aqui...">${customizations[photoId] || ''}</textarea>
            `;
            
            // Adicionar evento de clique para selecionar o item
            customizationItem.addEventListener('click', function() {
                // Remover classe ativa de todos os itens
                document.querySelectorAll('.customization-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Adicionar classe ativa ao item clicado
                this.classList.add('active');
            });
            
            // Adicionar evento para salvar a personalização ao digitar
            const textarea = customizationItem.querySelector('textarea');
            textarea.addEventListener('input', function() {
                const photoId = customizationItem.getAttribute('data-photo');
                customizations[photoId] = this.value;
            });
            
            customizationContainer.appendChild(customizationItem);
        });
        
        // Selecionar o primeiro item por padrão
        const firstItem = customizationContainer.querySelector('.customization-item');
        if (firstItem) {
            firstItem.click();
        }
    }
    
    /**
     * Inicia o processo de geração para o modo individual
     */
    function startIndividualGeneration() {
        // Mostrar o container de carregamento
        const loadingContainer = document.querySelector('.loading-container');
        const resultsContainer = document.querySelector('.results-container');
        const shareAllContainer = document.querySelector('.share-all-container');
        const combinedResultContainer = document.querySelector('.combined-result-container');
        
        loadingContainer.style.display = 'block';
        resultsContainer.style.display = 'none';
        shareAllContainer.style.display = 'none';
        combinedResultContainer.style.display = 'none';
        
        // Atualizar mensagem de carregamento
        document.getElementById('loading-message').textContent = 'Criando seus personagens Colecionáveis...';
        
        // Avançar para o último passo
        goToStep(totalSteps);
        
        // Obter o número total de imagens
        const totalImages = Object.keys(selectedStyles).length;
        
        // Simulação do progresso de geração
        let processedImages = 0;
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        // Iniciar o processamento simulado
        processNextImage();
        
        function processNextImage() {
            if (processedImages < totalImages) {
                processedImages++;
                
                // Atualizar progresso
                const progress = (processedImages / totalImages) * 100;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `Processando imagem ${processedImages} de ${totalImages}...`;
                
                // Simular tempo de processamento
                setTimeout(processNextImage, 1500);
            } else {
                // Processamento concluído
                finishIndividualGeneration();
            }
        }
    }
    
    /**
     * Finaliza o processo de geração individual e mostra os resultados
     */
    function finishIndividualGeneration() {
        // Esconder o container de carregamento
        const loadingContainer = document.querySelector('.loading-container');
        const resultsContainer = document.querySelector('.results-container');
        const shareAllContainer = document.querySelector('.share-all-container');
        
        loadingContainer.style.display = 'none';
        resultsContainer.style.display = 'grid';
        shareAllContainer.style.display = 'flex';
        
        // Criar os cards de resultado
        resultsContainer.innerHTML = '';
        
        // Criar um card para cada foto processada
        Object.keys(selectedStyles).forEach(photoId => {
            const image = uploadedImages[photoId];
            const style = selectedStyles[photoId];
            const customization = customizations[photoId] || '';
            
            // Selecionar uma imagem de exemplo com base no estilo
            let resultImageUrl = '';
            switch (style) {
                case 'disney-infinity':
                    resultImageUrl = 'https://public.youware.com/users-website-assets/prod/1a438276-778a-4875-844d-32b322bf37c0/ga1b4b3c672e044cff52b6095da75425f357b6917fddb53a16db2fbd8cf529f5537030b4ef081dbe994c71c37db3d8b428da5d1d9e294af86faa7c6940985a5ab_640.jpg';
                    break;
                case 'superhero':
                    resultImageUrl = 'https://public.youware.com/users-website-assets/prod/1a438276-778a-4875-844d-32b322bf37c0/g891a0f439ca4192d6798b35b5761e7e8e2b8bffd6e940e1cdb3c40c7a8cd0bc53da790ad016998acc18a95a0b5fe796c98a0645136924f806623efac81321226_640.jpg';
                    break;
                case 'fantasy':
                    resultImageUrl = 'https://public.youware.com/users-website-assets/prod/1a438276-778a-4875-844d-32b322bf37c0/gc1632a2cd5fb8ad3384b1fd604244dd66a614f2a5edd97b05a0b7e19ffc4c4b11a6d2e67310c9b1e08c91c0873e007481cfaba86464503a0c4b6bb89059bb525_640.jpg';
                    break;
            }
            
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            
            resultCard.innerHTML = `
                <img src="${resultImageUrl}" alt="Personagem ${photoId}">
                <div class="result-content">
                    <h4>Personagem ${photoId}</h4>
                    <p>
                        <strong>Estilo:</strong> ${getStyleName(style)}<br>
                        ${customization ? `<strong>Personalização:</strong> ${customization}<br>` : ''}
                    </p>
                    <div class="result-actions">
                        <button class="btn btn-sm download-btn" data-url="${resultImageUrl}" data-id="${photoId}">
                            <i class="fas fa-download"></i> Baixar
                        </button>
                        <button class="btn btn-sm share-btn" data-url="${resultImageUrl}" data-id="${photoId}">
                            <i class="fas fa-share-alt"></i> Compartilhar
                        </button>
                    </div>
                </div>
            `;
            
            resultsContainer.appendChild(resultCard);
        });
        
        // Adicionar eventos aos botões
        initializeResultButtons();
    }
    
    /**
     * Inicia o processo de geração para o modo combinado
     */
    function startCombinedGeneration() {
        // Mostrar o container de carregamento
        const loadingContainer = document.querySelector('.loading-container');
        const resultsContainer = document.querySelector('.results-container');
        const shareAllContainer = document.querySelector('.share-all-container');
        const combinedResultContainer = document.querySelector('.combined-result-container');
        
        loadingContainer.style.display = 'block';
        resultsContainer.style.display = 'none';
        shareAllContainer.style.display = 'none';
        combinedResultContainer.style.display = 'none';
        
        // Atualizar mensagem de carregamento
        document.getElementById('loading-message').textContent = 'Criando sua cena combinada de Colecionáveis...';
        
        // Avançar para o último passo
        goToStep(totalSteps);
        
        // Obter informações da cena
        const sceneDescription = document.getElementById('scene-description').value;
        // Usar o estilo padrão sempre
        const sceneStyle = defaultStyle;
        
        // Obter o número total de imagens para referência
        const totalImages = Object.keys(uploadedImages).length;
        
        // Atualizar progresso inicialmente
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        progressFill.style.width = '10%';
        progressText.textContent = 'Preparando geração com IA...';
        
        // Gerar imagem real com IA
        generateRealCombinedImage(sceneDescription, sceneStyle, totalImages)
            .then(imagePath => {
                finishCombinedGeneration(sceneDescription, sceneStyle, imagePath);
            })
            .catch(error => {
                console.error('Erro na geração:', error);
                // Fallback para o método de simulação anterior
                simulateCombinedGeneration(sceneDescription, sceneStyle, totalImages);
            });
    }
    
    /**
     * Gera uma imagem real usando IA baseada nas imagens carregadas
     */
    async function generateRealCombinedImage(sceneDescription, sceneStyle, totalImages) {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        // Criar prompt detalhado baseado nas imagens e configurações
        const stylePrompts = {
            'disney-infinity': 'Disney Infinity style 3D figurines with characteristic proportions, plastic toy appearance, and circular base platforms',
            'superhero': 'Disney Infinity superhero figurines with heroic poses, colorful costumes, and dynamic action stances',
            'fantasy': 'Disney Infinity fantasy figurines with medieval elements, magical accessories, and adventure themes'
        };
        
        const basePrompt = stylePrompts[sceneStyle] || stylePrompts['disney-infinity'];
        
        // Construir prompt completo
        let fullPrompt = `${basePrompt}, ${sceneDescription}. `;
        fullPrompt += `A group scene featuring ${totalImages} characters together in the Disney Infinity toy style. `;
        fullPrompt += 'High quality, detailed 3D rendering, vibrant colors, clean background, professional lighting. ';
        fullPrompt += 'Each character should have the distinctive Disney Infinity figurine look with smooth plastic surfaces and stylized proportions.';
        
        // Atualizar progresso
        progressFill.style.width = '30%';
        progressText.textContent = 'Enviando para IA...';
        
        try {
            // Fazer chamada para API de geração de imagem
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    width: 1024,
                    height: 1024,
                    model: 'flux.1-dev'
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro na API de geração');
            }
            
            // Atualizar progresso
            progressFill.style.width = '60%';
            progressText.textContent = 'IA processando imagem...';
            
            const result = await response.json();
            
            // Atualizar progresso
            progressFill.style.width = '90%';
            progressText.textContent = 'Finalizando...';
            
            // Retornar caminho da imagem gerada
            return result.imagePath;
            
        } catch (error) {
            console.error('Erro na geração de imagem:', error);
            throw error;
        }
    }
    
    /**
     * Simulação de geração como fallback
     */
    function simulateCombinedGeneration(sceneDescription, sceneStyle, totalImages) {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        // Iniciar animação de progresso simulado
        let progress = 30;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress > 100) {
                clearInterval(progressInterval);
                finishCombinedGeneration(sceneDescription, sceneStyle);
            } else {
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `Processando cena combinada com ${totalImages} personagens...`;
            }
        }, 400);
    }
    
    /**
     * Finaliza o processo de geração combinada e mostra o resultado
     */
    function finishCombinedGeneration(sceneDescription, sceneStyle, generatedImagePath) {
        // Esconder o container de carregamento
        const loadingContainer = document.querySelector('.loading-container');
        const combinedResultContainer = document.querySelector('.combined-result-container');
        
        loadingContainer.style.display = 'none';
        combinedResultContainer.style.display = 'block';
        
        // Usar a imagem gerada se disponível, caso contrário selecionar uma imagem de exemplo com base no estilo
        let resultImageUrl = '';
        
        if (generatedImagePath) {
            resultImageUrl = generatedImagePath;
        } else {
            // Fallback para imagens exemplo
            switch (sceneStyle) {
                case 'disney-infinity':
                    resultImageUrl = 'https://public.youware.com/users-website-assets/prod/1a438276-778a-4875-844d-32b322bf37c0/ga1b4b3c672e044cff52b6095da75425f357b6917fddb53a16db2fbd8cf529f5537030b4ef081dbe994c71c37db3d8b428da5d1d9e294af86faa7c6940985a5ab_640.jpg';
                    break;
                case 'superhero':
                    resultImageUrl = 'https://public.youware.com/users-website-assets/prod/1a438276-778a-4875-844d-32b322bf37c0/g891a0f439ca4192d6798b35b5761e7e8e2b8bffd6e940e1cdb3c40c7a8cd0bc53da790ad016998acc18a95a0b5fe796c98a0645136924f806623efac81321226_640.jpg';
                    break;
                case 'fantasy':
                    resultImageUrl = 'https://public.youware.com/users-website-assets/prod/1a438276-778a-4875-844d-32b322bf37c0/gc1632a2cd5fb8ad3384b1fd604244dd66a614f2a5edd97b05a0b7e19ffc4c4b11a6d2e67310c9b1e08c91c0873e007481cfaba86464503a0c4b6bb89059bb525_640.jpg';
                    break;
            }
        }
        
        // Atualizar a imagem combinada
        const combinedImage = document.getElementById('combined-image');
        combinedImage.src = resultImageUrl;
        
        // Atualizar a descrição da cena
        document.getElementById('combined-description').textContent = sceneDescription;
        
        // Adicionar eventos aos botões
        initializeCombinedButtons(resultImageUrl);
    }
    
    /**
     * Inicializa os botões nos cards de resultado individual
     */
    function initializeResultButtons() {
        // Botões de download
        const downloadButtons = document.querySelectorAll('.download-btn');
        downloadButtons.forEach(button => {
            button.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                const id = this.getAttribute('data-id');
                downloadImage(url, `personagem-disney-infinity-${id}.jpg`);
            });
        });
        
        // Botões de compartilhamento
        const shareButtons = document.querySelectorAll('.share-btn');
        shareButtons.forEach(button => {
            button.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                shareImage(url);
            });
        });
        
        // Botão de baixar todos
        const downloadAllBtn = document.getElementById('download-all-btn');
        downloadAllBtn.addEventListener('click', function() {
            downloadButtons.forEach(button => {
                button.click();
            });
        });
        
        // Botão de compartilhar todos
        const shareAllBtn = document.getElementById('share-all-btn');
        shareAllBtn.addEventListener('click', function() {
            alert('Funcionalidade de compartilhar todos será implementada em breve!');
        });
        
        // Botão de criar mais
        const createMoreBtn = document.getElementById('create-more-btn');
        createMoreBtn.addEventListener('click', function() {
            // Resetar o wizard e voltar para o primeiro passo
            resetWizard();
        });
    }
    
    /**
     * Inicializa os botões para o resultado combinado
     */
    function initializeCombinedButtons(imageUrl) {
        // Botão de download
        const downloadCombinedBtn = document.getElementById('download-combined-btn');
        downloadCombinedBtn.addEventListener('click', function() {
            downloadImage(imageUrl, 'personagens-combinados-disney-infinity.jpg');
        });
        
        // Botão de compartilhamento
        const shareCombinedBtn = document.getElementById('share-combined-btn');
        shareCombinedBtn.addEventListener('click', function() {
            shareImage(imageUrl);
        });
        
        // Botão de criar mais
        const createMoreCombinedBtn = document.getElementById('create-more-combined-btn');
        createMoreCombinedBtn.addEventListener('click', function() {
            // Resetar o wizard e voltar para o primeiro passo
            resetWizard();
        });
    }
    
    /**
     * Verifica se o botão "Próximo" deve ser habilitado
     */
    function checkNextButton() {
        switch (currentStep) {
            case 1: // Upload de Fotos
                nextBtn.disabled = Object.keys(uploadedImages).length === 0;
                break;
                
            case 2: // Escolha de Estilos
                const photoCount = Object.keys(uploadedImages).length;
                const styleCount = Object.keys(selectedStyles).length;
                nextBtn.disabled = styleCount < photoCount;
                break;
                
            default:
                nextBtn.disabled = false;
                break;
        }
    }
    
    /**
     * Retorna o nome amigável de um estilo
     */
    function getStyleName(styleCode) {
        const styleNames = {
            'disney-infinity': 'Colecionável Clássico',
            'superhero': 'Super-Herói',
            'fantasy': 'Fantasia'
        };
        
        return styleNames[styleCode] || styleCode;
    }
    
    /**
     * Função para baixar uma imagem
     */
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
    
    /**
     * Função para compartilhar uma imagem
     */
    function shareImage(url) {
        if (navigator.share) {
            navigator.share({
                title: 'Meu Personagem Disney Infinity',
                text: 'Veja o personagem Disney Infinity que criei com o Infinity Maker!',
                url: url
            }).catch(err => {
                console.error('Erro ao compartilhar:', err);
            });
        } else {
            // Fallback para navegadores que não suportam a API Web Share
            alert(`Link da imagem copiado: ${url}`);
            
            // Copiar URL para a área de transferência
            const tempInput = document.createElement('input');
            document.body.appendChild(tempInput);
            tempInput.value = url;
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        }
    }
    
    /**
     * Reseta o wizard para o estado inicial
     */
    function resetWizard() {
        // Resetar variáveis
        currentStep = 1;
        
        // Manter imagens carregadas, mas resetar estilos e personalizações
        Object.keys(selectedStyles).forEach(key => {
            delete selectedStyles[key];
        });
        
        Object.keys(customizations).forEach(key => {
            delete customizations[key];
        });
        
        // Resetar UI
        document.querySelectorAll('.wizard-step').forEach((step, index) => {
            if (index === 0) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        
        document.querySelectorAll('.wizard-panel').forEach((panel, index) => {
            panel.classList.toggle('active', index === 0);
        });
        
        // Mostrar/ocultar botões
        prevBtn.style.display = 'block';
        prevBtn.disabled = true;
        nextBtn.style.display = 'block';
        nextBtn.disabled = false;
        generateBtn.style.display = 'none';
        
        // Verificar botão próximo
        checkNextButton();
    }
});