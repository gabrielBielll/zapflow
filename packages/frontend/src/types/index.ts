export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'FAQ' | 'Transferência';
  enabled: boolean;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  type: string;
  size: string;
  status: 'Processado' | 'Pendente' | 'Falhou';
}
