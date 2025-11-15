// Interface para a estrutura da base de conhecimento
export interface KnowledgeBase {
  clinicInfo: {
    name: string;
    description: string;
    modality: string;
    schedule: string;
    prices: string[];
  };
  rules: {
    unavailableResponse: string;
    language: string;
    tone: string;
  };
}

// Base de conhecimento estática da Deep Saúde
export const DEEP_SAUDE_KNOWLEDGE: KnowledgeBase = {
  clinicInfo: {
    name: "Deep Saúde",
    description: "clínica de psicologia online",
    modality: "Atendimento exclusivamente online",
    schedule: "Segunda a sexta, das 08:00 às 21:00",
    prices: ["R$ 100", "R$ 130", "R$ 200"]
  },
  rules: {
    unavailableResponse: "Informação não disponível no momento.",
    language: "pt-BR",
    tone: "profissional mas acessível"
  }
};

// Função helper para acessar informações específicas
export class DeepSaudeKnowledgeService {
  private knowledge: KnowledgeBase;

  constructor() {
    this.knowledge = DEEP_SAUDE_KNOWLEDGE;
  }

  getClinicInfo() {
    return this.knowledge.clinicInfo;
  }

  getRules() {
    return this.knowledge.rules;
  }

  getSchedule(): string {
    return this.knowledge.clinicInfo.schedule;
  }

  getPrices(): string {
    return this.knowledge.clinicInfo.prices.join(", ") + " por sessão";
  }

  getModality(): string {
    return this.knowledge.clinicInfo.modality;
  }

  getUnavailableResponse(): string {
    return this.knowledge.rules.unavailableResponse;
  }

  getFullKnowledgeBase(): KnowledgeBase {
    return this.knowledge;
  }
}