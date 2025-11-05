'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useChatbot } from '@/context/ChatbotContext';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function PersonalityPage() {
  const { purpose, setPurpose } = useChatbot();
  const [localPurpose, setLocalPurpose] = useState(purpose);
  const { toast } = useToast();

  const handleSave = () => {
    setPurpose(localPurpose);
    toast({
        title: "Personalidade salva!",
        description: "As configurações de personalidade do seu chatbot foram atualizadas.",
    })
  };

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Personalidade</h1>
        <p className="text-muted-foreground">Ajuste fino do comportamento e tom do seu chatbot.</p>
      </header>
      <Tabs defaultValue="purpose">
        <TabsList>
          <TabsTrigger value="purpose">Propósito</TabsTrigger>
          <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          <TabsTrigger value="rules">Regras adicionais</TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <CardContent className="p-6">
            <TabsContent value="purpose" className="mt-0">
                <Label htmlFor="purpose-textarea" className="text-lg font-semibold">Propósito do Chatbot</Label>
                <Textarea
                    id="purpose-textarea"
                    value={localPurpose}
                    onChange={(e) => setLocalPurpose(e.target.value)}
                    className="min-h-[200px] mt-2"
                    placeholder="Descreva o principal objetivo do seu chatbot..."
                />
                 <p className="text-sm text-muted-foreground mt-2">{localPurpose.length}/999</p>
            </TabsContent>
            <TabsContent value="behavior" className="mt-0 space-y-8">
              <div>
                <Label className="text-lg font-semibold">Tom de voz</Label>
                <div className="mt-4 space-y-6">
                    <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <span>Informal</span>
                            <span>Formal</span>
                        </div>
                        <Slider defaultValue={[50]} max={100} step={1} />
                    </div>
                    <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <span>Cauteloso</span>
                            <span>Ousado</span>
                        </div>
                        <Slider defaultValue={[30]} max={100} step={1} />
                    </div>
                </div>
              </div>
              <div>
                <Label className="text-lg font-semibold">Opções de Comportamento</Label>
                <div className="mt-4 space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="use-emojis" defaultChecked/>
                        <Label htmlFor="use-emojis">Usar emojis nas respostas</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="be-proactive"/>
                        <Label htmlFor="be-proactive">Ser proativo e sugerir ações</Label>
                    </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="rules" className="mt-0">
                <Label htmlFor="rules-textarea" className="text-lg font-semibold">Regras Adicionais</Label>
                <Textarea
                    id="rules-textarea"
                    className="min-h-[200px] mt-2"
                    placeholder="Adicione regras específicas. Ex: 'Nunca ofereça descontos sem aprovação.'"
                />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
       <div className="flex justify-end">
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </div>
    </div>
  );
}
