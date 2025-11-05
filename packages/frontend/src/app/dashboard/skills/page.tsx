'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useChatbot } from '@/context/ChatbotContext';
import { Puzzle, Bot } from 'lucide-react';
import { AddSkillSheet } from '@/components/add-skill-sheet';

export default function SkillsPage() {
  const { skills, toggleSkill } = useChatbot();

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Habilidades</h1>
        <p className="text-muted-foreground">Adicione e gerencie as capacidades do seu chatbot.</p>
      </header>

      {skills.length === 0 ? (
        <Card className="text-center flex flex-col items-center justify-center p-12 border-dashed">
          <Puzzle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Você ainda não adicionou habilidades</h2>
          <p className="text-muted-foreground mb-6">Comece a adicionar funcionalidades para seu chatbot.</p>
          <AddSkillSheet />
        </Card>
      ) : (
        <div>
            <div className='flex justify-end mb-4'>
                <AddSkillSheet />
            </div>
            <div className="space-y-4">
            {skills.map((skill) => (
                <Card key={skill.id} className="flex items-center p-4">
                    <div className="flex-grow">
                    <h3 className="font-semibold">{skill.name}</h3>
                    <p className="text-sm text-muted-foreground">{skill.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Tipo: {skill.type}</p>
                    </div>
                    <Switch
                    checked={skill.enabled}
                    onCheckedChange={() => toggleSkill(skill.id)}
                    aria-label={`Ativar/desativar habilidade ${skill.name}`}
                    />
                </Card>
            ))}
            </div>
        </div>
      )}
    </div>
  );
}
