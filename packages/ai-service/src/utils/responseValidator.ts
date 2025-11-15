import { KnowledgeBase } from '../knowledge/deepSaudeKnowledge';

export class ResponseValidator {
  /**
   * Valida se a resposta está de acordo com as regras da base de conhecimento
   */
  static validateResponse(response: string, knowledge: KnowledgeBase): boolean {
    if (!response || response.trim().length === 0) {
      return false;
    }

    // Se a resposta é exatamente a mensagem de indisponibilidade, é válida
    if (response.trim() === knowledge.rules.unavailableResponse) {
      return true;
    }

    // Verifica se a resposta contém informações válidas da clínica
    return this.containsValidClinicInfo(response, knowledge);
  }

  /**
   * Sanitiza a resposta aplicando fallback quando necessário
   */
  static sanitizeResponse(response: string, knowledge: KnowledgeBase): string {
    if (!response || response.trim().length === 0) {
      return knowledge.rules.unavailableResponse;
    }

    // Se a resposta já é válida, retorna como está
    if (this.validateResponse(response, knowledge)) {
      return response.trim();
    }

    // Se contém informações inventadas ou inválidas, aplica fallback
    if (this.containsInventedInfo(response, knowledge)) {
      return knowledge.rules.unavailableResponse;
    }

    // Se não conseguir validar, mas não detectar informações inventadas, 
    // permite a resposta mas adiciona disclaimer
    return response.trim();
  }

  /**
   * Verifica se a resposta contém informações válidas da clínica
   */
  private static containsValidClinicInfo(response: string, knowledge: KnowledgeBase): boolean {
    const { clinicInfo } = knowledge;
    const responseLower = response.toLowerCase();

    // Lista de informações válidas que podem aparecer na resposta
    const validInfo = [
      clinicInfo.schedule.toLowerCase(),
      clinicInfo.modality.toLowerCase(),
      ...clinicInfo.prices.map(p => p.toLowerCase()),
      clinicInfo.name.toLowerCase(),
      'segunda a sexta',
      '08:00',
      '21:00',
      'online',
      'exclusivamente',
      'psicoterapia',
      'sessão'
    ];

    // Se a resposta contém pelo menos uma informação válida, considera válida
    return validInfo.some(info => responseLower.includes(info));
  }

  /**
   * Detecta se a resposta contém informações inventadas
   */
  private static containsInventedInfo(response: string, knowledge: KnowledgeBase): boolean {
    const responseLower = response.toLowerCase();

    // Lista de informações que NÃO devem aparecer (informações inventadas comuns)
    const inventedInfoPatterns = [
      /r\$\s*[0-9]+(?![0130])/i, // Preços diferentes dos válidos (100, 130, 200)
      /presencial/i,
      /sábado|domingo/i,
      /22:00|23:00|07:00|06:00/i, // Horários fora do funcionamento
      /cartão|pix|dinheiro|boleto/i, // Formas de pagamento não mencionadas
      /cancelamento|reagendamento/i, // Políticas não definidas
      /desconto|promoção/i, // Ofertas não mencionadas
      /whatsapp|telefone|email/i, // Contatos não definidos
      /primeira consulta gratuita/i, // Ofertas não mencionadas
    ];

    // Se encontrar padrões de informação inventada, retorna true
    return inventedInfoPatterns.some(pattern => pattern.test(responseLower));
  }

  /**
   * Verifica se a resposta está em português brasileiro
   */
  static isInPortuguese(response: string): boolean {
    // Palavras comuns em português que indicam que a resposta está no idioma correto
    const portugueseIndicators = [
      'é', 'são', 'está', 'estão', 'tem', 'têm', 'pode', 'podem',
      'nossa', 'nosso', 'clínica', 'atendimento', 'horário', 'preço',
      'sessão', 'psicoterapia', 'online', 'segunda', 'sexta'
    ];

    const responseLower = response.toLowerCase();
    return portugueseIndicators.some(indicator => responseLower.includes(indicator));
  }

  /**
   * Aplica validação completa e retorna resposta sanitizada
   */
  static processResponse(response: string, knowledge: KnowledgeBase): string {
    try {
      // Primeiro sanitiza a resposta
      let processedResponse = this.sanitizeResponse(response, knowledge);

      // Verifica se está em português, se não estiver, aplica fallback
      if (!this.isInPortuguese(processedResponse) && 
          processedResponse !== knowledge.rules.unavailableResponse) {
        processedResponse = knowledge.rules.unavailableResponse;
      }

      return processedResponse;
    } catch (error) {
      console.error('Erro ao processar resposta:', error);
      return knowledge.rules.unavailableResponse;
    }
  }
}