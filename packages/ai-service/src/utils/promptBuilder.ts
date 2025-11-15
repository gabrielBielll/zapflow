import { KnowledgeBase } from '../knowledge/deepSaudeKnowledge';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export class PromptBuilder {
  /**
   * Constrói um prompt aprimorado incluindo a base de conhecimento estática
   */
  static buildPromptWithKnowledge(
    query: string, 
    history: ChatMessage[], 
    knowledge: KnowledgeBase
  ): string {
    const { clinicInfo, rules } = knowledge;
    
    // Formatar histórico da conversa
    const formattedHistory = this.formatChatHistory(history);
    
    // Template do prompt com base de conhecimento
    const prompt = `Você é um assistente de atendimento da ${clinicInfo.name}, uma ${clinicInfo.description}.

REGRAS IMPORTANTES:
- Responda SOMENTE com informações presentes na base de conhecimento abaixo
- Se a informação solicitada não estiver disponível, responda exatamente: "${rules.unavailableResponse}"
- Não invente valores, horários, políticas ou meios de pagamento
- Use linguagem clara, objetiva e em ${rules.language}
- Mantenha um tom ${rules.tone}

INFORMAÇÕES DA CLÍNICA:
- Modalidade: ${clinicInfo.modality}
- Horário de atendimento: ${clinicInfo.schedule}
- Preços por sessão de psicoterapia online: ${clinicInfo.prices.join(", ")} por sessão

${formattedHistory ? `Histórico da conversa:\n${formattedHistory}\n` : ''}
Pergunta do usuário: ${query}

Resposta:`;

    return prompt;
  }

  /**
   * Formata o histórico da conversa para inclusão no prompt
   */
  private static formatChatHistory(history: ChatMessage[]): string {
    if (!history || history.length === 0) {
      return '';
    }

    return history
      .map(msg => {
        const role = msg.role === 'user' ? 'Usuário' : 'Assistente';
        return `${role}: ${msg.content}`;
      })
      .join('\n');
  }

  /**
   * Cria um prompt simples sem base de conhecimento (fallback)
   */
  static buildSimplePrompt(query: string, history: ChatMessage[]): string {
    const formattedHistory = this.formatChatHistory(history);
    
    const prompt = `Você é um assistente útil e amigável.

${formattedHistory ? `Histórico da conversa:\n${formattedHistory}\n` : ''}
Pergunta do usuário: ${query}

Resposta:`;

    return prompt;
  }

  /**
   * Valida se os parâmetros do prompt são válidos
   */
  static validatePromptParams(query: string, knowledge?: KnowledgeBase): boolean {
    if (!query || query.trim().length === 0) {
      return false;
    }

    if (knowledge) {
      return !!(knowledge.clinicInfo && knowledge.rules);
    }

    return true;
  }
}