'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChatbot } from '@/context/ChatbotContext';
import { FileText, Link as LinkIcon, Database } from 'lucide-react';
import { AddKnowledgeSheet } from '@/components/add-knowledge-sheet';

export default function KnowledgePage() {
  const { knowledgeFiles } = useChatbot();

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Base de Conhecimento</h1>
        <p className="text-muted-foreground">Gerencie os documentos e links que alimentam a inteligência do seu chatbot.</p>
      </header>

      {knowledgeFiles.length === 0 ? (
        <Card className="text-center flex flex-col items-center justify-center p-12 border-dashed">
            <Database className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Sua base de conhecimento está vazia</h2>
            <p className="text-muted-foreground mb-6">Adicione arquivos ou URLs para que seu chatbot possa aprender.</p>
            <AddKnowledgeSheet />
        </Card>
      ) : (
        <div>
          <div className="flex justify-end mb-4">
            <AddKnowledgeSheet />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {knowledgeFiles.map((file) => (
              <Card key={file.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-start gap-3">
                    {file.type === 'URL' ? <LinkIcon className="h-6 w-6 text-primary mt-1 flex-shrink-0" /> : <FileText className="h-6 w-6 text-primary mt-1 flex-shrink-0" />}
                    <span className='truncate w-full' title={file.name}>{file.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-sm text-muted-foreground">
                    <p>Tipo: {file.type}</p>
                    <p>Tamanho: {file.size}</p>
                  </div>
                </CardContent>
                <CardFooter>
                    <Badge variant={file.status === 'Processado' ? 'default' : 'secondary'} className={file.status === 'Processado' ? 'bg-green-600' : ''}>
                        {file.status}
                    </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
