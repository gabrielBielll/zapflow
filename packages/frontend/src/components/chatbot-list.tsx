'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Assistant {
  id: string;
  name: string;
  purpose: string;
  created_at: string;
  updated_at: string;
}

export function ChatbotList() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssistants() {
      try {
        const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:8080';
        const response = await fetch(`${CORE_API_URL}/api/v1/frontend/assistants`);
        if (!response.ok) {
          throw new Error('Failed to fetch assistants');
        }
        const data = await response.json();
        setAssistants(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchAssistants();
  }, []);

  return (
    <div className="p-4">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Meus Assistentes</h2>
            <Button asChild>
                <Link href="/create">Novo Chatbot</Link>
            </Button>
        </div>
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-4">
        {assistants.map((assistant) => (
          <Card key={assistant.id}>
            <CardHeader>
              <CardTitle>{assistant.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{assistant.purpose}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
