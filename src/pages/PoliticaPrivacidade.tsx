import { useEffect } from "react";

const PoliticaPrivacidade = () => {
  useEffect(() => {
    document.title = "Política de Privacidade – VetAgro AI";
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
            <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
              Política de Privacidade – VetAgro AI
            </h1>
            
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
              <p className="text-foreground font-medium">
                A VetAgro AI respeita a sua privacidade e está comprometida com a proteção dos dados pessoais de seus usuários, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).
              </p>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Coleta de informações</h2>
                <p>
                  Coletamos informações fornecidas diretamente pelo usuário, como nome, e-mail e dados profissionais, bem como informações geradas automaticamente durante o uso do aplicativo, incluindo dados de navegação, interações e uso de funcionalidades.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Uso das informações</h2>
                <p>As informações coletadas são utilizadas para:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Operar e melhorar as funcionalidades do aplicativo</li>
                  <li>Personalizar a experiência do usuário</li>
                  <li>Gerar relatórios técnicos e respostas baseadas em inteligência artificial</li>
                  <li>Gerenciar planos de assinatura e pagamentos</li>
                  <li>Cumprir obrigações legais e regulatórias</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Compartilhamento de dados</h2>
                <p>
                  Os dados pessoais não são vendidos. Poderão ser compartilhados apenas com serviços essenciais para o funcionamento do aplicativo, como:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Plataformas de pagamento (ex.: Mercado Pago)</li>
                  <li>Serviços de autenticação (ex.: Google)</li>
                  <li>Serviços de análise (ex.: Google Analytics)</li>
                </ul>
                <p className="mt-2">Sempre respeitando os limites legais.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Armazenamento e segurança</h2>
                <p>
                  Os dados são armazenados em ambientes seguros e protegidos por medidas técnicas e administrativas adequadas para evitar acessos não autorizados, vazamentos ou uso indevido.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Direitos do titular</h2>
                <p>O usuário pode, a qualquer momento:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Solicitar acesso, correção ou exclusão de seus dados</li>
                  <li>Revogar consentimentos concedidos</li>
                  <li>Solicitar informações sobre o tratamento de seus dados</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Cookies e tecnologias similares</h2>
                <p>
                  Utilizamos cookies e tecnologias semelhantes para melhorar a navegação, analisar métricas de uso e otimizar a experiência do usuário.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Alterações nesta política</h2>
                <p>
                  Esta Política de Privacidade pode ser atualizada a qualquer momento. A versão mais recente estará sempre disponível nesta página.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Contato</h2>
                <p>
                  Em caso de dúvidas, solicitações ou reclamações relacionadas à privacidade, entre em contato pelo e-mail:
                </p>
                <p className="mt-2">
                  <a 
                    href="mailto:marciaveterinaria9@gmail.com" 
                    className="text-primary hover:underline font-medium"
                  >
                    📧 marciaveterinaria9@gmail.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
  );
};

export default PoliticaPrivacidade;
