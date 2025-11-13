'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getConversationHistory } from '@/services/coreApiService';
import { useChatbot } from '@/context/ChatbotContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface Conversation {
  id: string;
  sender: string;
  message: string;
  response: string;
  created_at: string;
}

export default function DashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { assistantId } = useChatbot();

  useEffect(() => {
    const fetchConversations = async () => {
      // TODO: Usar o ID do assistente do contexto quando estiver disponível.
      const currentAssistantId = assistantId || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // ID Fixo para teste

      try {
        setIsLoading(true);
        setError(null);
        const data = await getConversationHistory(currentAssistantId);
        setConversations(data);
      } catch (err) {
        setError('Falha ao carregar o histórico de conversas.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [assistantId]);

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral e conversas recentes do seu chatbot.</p>
      </header>

      {/* TODO: Adicionar cards de métricas aqui */}

      <Card>
        <CardHeader>
          <CardTitle>Conversas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Remetente</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Resposta</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((convo) => (
                  <TableRow key={convo.id}>
                    <TableCell><Badge variant="outline">{convo.sender}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate">{convo.message}</TableCell>
                    <TableCell className="max-w-xs truncate">{convo.response}</TableCell>
                    <TableCell>{new Date(convo.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
