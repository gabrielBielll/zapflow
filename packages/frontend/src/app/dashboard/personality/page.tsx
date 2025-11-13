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
import { updateAssistantSettings } from '@/services/coreApiService';
import { Loader2 } from 'lucide-react';

export default function PersonalityPage() {
  const { purpose, setPurpose, assistantId } = useChatbot(); // Supondo que o assistantId venha do contexto

  // Estados para todos os campos do formulário
  const [localPurpose, setLocalPurpose] = useState(purpose);
  const [tone, setTone] = useState([50]);
  const [style, setStyle] = useState([30]);
  const [useEmojis, setUseEmojis] = useState(true);
  const [beProactive, setBeProactive] = useState(false);
  const [additionalRules, setAdditionalRules] = useState('');
  const [ragEnabled, setRagEnabled] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Usar o ID do assistente do contexto quando estiver disponível.
    const currentAssistantId = assistantId || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // ID Fixo para teste

    // Compõe a string de personalidade
    const personalityString = `
      Propósito: ${localPurpose}
      Tom: ${tone[0] > 50 ? 'Formal' : 'Informal'} (Nível: ${tone[0]})
      Estilo: ${style[0] > 50 ? 'Ousado' : 'Cauteloso'} (Nível: ${style[0]})
      Comportamento:
      - Usar emojis: ${useEmojis ? 'Sim' : 'Não'}
      - Ser proativo: ${beProactive ? 'Sim' : 'Não'}
      Regras Adicionais: ${additionalRules || 'Nenhuma'}
    `.trim().replace(/\s+/g, ' ');

    try {
      await updateAssistantSettings(currentAssistantId, {
        personality: personalityString,
        ragEnabled: ragEnabled
      });

      // Atualiza o contexto global se necessário (apenas o propósito por enquanto)
      setPurpose(localPurpose);

      toast({
          title: "Personalidade salva!",
          description: "As configurações de personalidade do seu chatbot foram atualizadas.",
      })
    } catch(error) {
        toast({
            title: "Erro ao salvar",
            description: "Não foi possível salvar as configurações. Tente novamente.",
            variant: "destructive"
        })
    } finally {
        setIsSaving(false);
    }
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
          <TabsTrigger value="rules">Regras e RAG</TabsTrigger>
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
                        <Slider value={tone} onValueChange={setTone} max={100} step={1} />
                    </div>
                    <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <span>Cauteloso</span>
                            <span>Ousado</span>
                        </div>
                        <Slider value={style} onValueChange={setStyle} max={100} step={1} />
                    </div>
                </div>
              </div>
              <div>
                <Label className="text-lg font-semibold">Opções de Comportamento</Label>
                <div className="mt-4 space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="use-emojis" checked={useEmojis} onCheckedChange={(checked) => setUseEmojis(Boolean(checked))}/>
                        <Label htmlFor="use-emojis">Usar emojis nas respostas</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="be-proactive" checked={beProactive} onCheckedChange={(checked) => setBeProactive(Boolean(checked))}/>
                        <Label htmlFor="be-proactive">Ser proativo e sugerir ações</Label>
                    </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="rules" className="mt-0 space-y-8">
                <div>
                    <Label htmlFor="rules-textarea" className="text-lg font-semibold">Regras Adicionais</Label>
                    <Textarea
                        id="rules-textarea"
                        value={additionalRules}
                        onChange={(e) => setAdditionalRules(e.target.value)}
                        className="min-h-[200px] mt-2"
                        placeholder="Adicione regras específicas. Ex: 'Nunca ofereça descontos sem aprovação.'"
                    />
                </div>
                <div>
                    <Label className="text-lg font-semibold">Inteligência de Documentos (RAG)</Label>
                     <div className="flex items-center space-x-2 mt-4">
                        <Checkbox id="rag-enabled" checked={ragEnabled} onCheckedChange={(checked) => setRagEnabled(Boolean(checked))}/>
                        <Label htmlFor="rag-enabled">Permitir que o chatbot use documentos da base de conhecimento para responder.</Label>
                    </div>
                </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
       <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
        </div>
    </div>
  );
}
