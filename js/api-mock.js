/**
 * API Mock para Infinity Maker
 * 
 * Este script mock simula as chamadas à API de geração de imagens que seriam
 * feitas em produção para um serviço real de geração com IA.
 */

// Mock da API para geração de imagens com IA
class ApiMock {
    constructor() {
        // Inicializar estado e configurações
        this.imageGenerationEndpoint = '/api/generate-image';
        this.defaultStyleImages = {
            'disney-infinity': '/images/disney_infinity_style_3d_figurines',
            'superhero': 'https://public.youware.com/users-website-assets/prod/1a438276-778a-4875-844d-32b322bf37c0/g891a0f439ca4192d6798b35b5761e7e8e2b8bffd6e940e1cdb3c40c7a8cd0bc53da790ad016998acc18a95a0b5fe796c98a0645136924f806623efac81321226_640.jpg',
            'fantasy': 'https://public.youware.com/users-website-assets/prod/1a438276-778a-4875-844d-32b322bf37c0/gc1632a2cd5fb8ad3384b1fd604244dd66a614f2a5edd97b05a0b7e19ffc4c4b11a6d2e67310c9b1e08c91c0873e007481cfaba86464503a0c4b6bb89059bb525_640.jpg',
        };
        
        // Inicializar interceptação de chamadas de API
        this.setupApiMock();
    }
    
    /**
     * Configura a interceptação de chamadas à API
     */
    setupApiMock() {
        // Interceptar solicitações fetch
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = function(url, options) {
            // Interceptar chamadas para a API de geração
            if (url === self.imageGenerationEndpoint) {
                return self.handleGenerateImageRequest(options);
            }
            
            // Passar outras solicitações para o fetch original
            return originalFetch.apply(this, arguments);
        };
    }
    
    /**
     * Manipula solicitações para a API de geração de imagens
     */
    handleGenerateImageRequest(options) {
        // Analisar o corpo da solicitação
        const requestBody = JSON.parse(options.body);
        const prompt = requestBody.prompt;
        const style = this.detectStyleFromPrompt(prompt);
        
        // Simular atraso de rede para tornar a experiência realista
        return new Promise((resolve) => {
            setTimeout(() => {
                // Criar resposta simulada com URL da imagem baseada no estilo
                const response = {
                    success: true,
                    imagePath: this.defaultStyleImages[style] || this.defaultStyleImages['disney-infinity'],
                    message: "Imagem gerada com sucesso!"
                };
                
                // Retornar resposta simulada
                resolve(new Response(JSON.stringify(response), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }));
            }, 2000); // Atraso simulado de 2 segundos
        });
    }
    
    /**
     * Detecta o estilo baseado no prompt
     */
    detectStyleFromPrompt(prompt) {
        // Verificar palavras-chave no prompt para determinar o estilo
        if (prompt.toLowerCase().includes('superhero') || 
            prompt.toLowerCase().includes('super-herói') || 
            prompt.toLowerCase().includes('super herói')) {
            return 'superhero';
        } else if (prompt.toLowerCase().includes('fantasy') || 
                  prompt.toLowerCase().includes('fantasia') || 
                  prompt.toLowerCase().includes('medieval')) {
            return 'fantasy';
        } else {
            return 'disney-infinity';
        }
    }
}

// Inicializar o mock da API quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    window.apiMock = new ApiMock();
});