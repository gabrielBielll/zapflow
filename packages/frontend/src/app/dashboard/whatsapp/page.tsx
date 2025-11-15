'use client';

import { useState, useEffect } from 'react';
import { WhatsAppConnection } from '@/components/whatsapp-connection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, MessageCircle, Users } from 'lucide-react';

export default function WhatsAppPage() {
  const [assistants, setAssistants] = useState<any[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      const { CORE_API_URL } = await import('../../../config/environment');
      const response = await fetch(`${CORE_API_URL}/api/v1/frontend/assistants/`);
      if (response.ok) {
        const data = await response.json();
        setAssistants(data);
        if (data.length > 0) {
          setSelectedAssistant(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando assistentes...</p>
        </div>
      </div>
    );
  }

  if (assistants.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Conexão WhatsApp</h1>
          <p className="text-muted-foreground">
            Conecte seu WhatsApp para receber e responder mensagens automaticamente
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Nenhum assistente encontrado</CardTitle>
            <CardDescription>
              Você precisa criar um assistente antes de conectar o WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <a 
              href="/create" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Criar Assistente
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conexão WhatsApp</h1>
        <p className="text-muted-foreground">
          Conecte seu WhatsApp para receber e responder mensagens automaticamente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assistant Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Selecionar Assistente
            </CardTitle>
            <CardDescription>
              Escolha qual assistente será conectado ao WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assistants.map((assistant) => (
                <div
                  key={assistant.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAssistant === assistant.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedAssistant(assistant.id)}
                >
                  <h3 className="font-semibold">{assistant.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {assistant.purpose}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Criado em {new Date(assistant.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Connection */}
        <div>
          {selectedAssistant && (
            <WhatsAppConnection assistantId={selectedAssistant} />
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como conectar</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Selecione o assistente que você deseja conectar ao WhatsApp</li>
            <li>Clique em "Conectar WhatsApp" para gerar um QR code</li>
            <li>Abra o WhatsApp no seu celular</li>
            <li>Vá em Configurações → Aparelhos conectados → Conectar um aparelho</li>
            <li>Escaneie o QR code exibido na tela</li>
            <li>Aguarde a confirmação da conexão</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> Após conectar, todas as mensagens recebidas no seu WhatsApp 
              serão processadas automaticamente pelo assistente selecionado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}