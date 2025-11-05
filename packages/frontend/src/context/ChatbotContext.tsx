'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Skill, KnowledgeFile } from '@/types';

interface ChatbotContextType {
  name: string;
  setName: (name: string) => void;
  purpose: string;
  setPurpose: (purpose: string) => void;
  skills: Skill[];
  addSkill: (skill: Omit<Skill, 'id' | 'enabled'>) => void;
  toggleSkill: (id: string) => void;
  knowledgeFiles: KnowledgeFile[];
  addKnowledgeFile: (file: Omit<KnowledgeFile, 'id' | 'status'>) => void;
  addKnowledgeUrl: (url: string) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('Meu Chatbot');
  const [purpose, setPurpose] = useState(
    'Este chatbot foi criado para ajudar os clientes com suas dúvidas sobre nossos produtos e serviços. Ele deve ser amigável, prestativo e sempre buscar a melhor solução para o usuário.'
  );
  const [skills, setSkills] = useState<Skill[]>([]);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);

  const addSkill = useCallback((skill: Omit<Skill, 'id' | 'enabled'>) => {
    setSkills((prev) => [...prev, { ...skill, id: Date.now().toString(), enabled: true }]);
  }, []);

  const toggleSkill = useCallback((id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  const addKnowledgeFile = useCallback((file: Omit<KnowledgeFile, 'id' | 'status'>) => {
    setKnowledgeFiles((prev) => [
      ...prev,
      { ...file, id: Date.now().toString(), status: 'Processado' },
    ]);
  }, []);

  const addKnowledgeUrl = useCallback((url: string) => {
    setKnowledgeFiles((prev) => [
        ...prev,
        {
            id: Date.now().toString(),
            name: url,
            type: "URL",
            size: "N/A",
            status: "Processado"
        }
    ])
  }, [])

  const value = { name, setName, purpose, setPurpose, skills, addSkill, toggleSkill, knowledgeFiles, addKnowledgeFile, addKnowledgeUrl };

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
}
