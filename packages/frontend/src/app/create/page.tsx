'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useChatbot } from '@/context/ChatbotContext';
import { useEffect, useState } from 'react';

const formSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.').max(30, 'O nome deve ter no máximo 30 caracteres.'),
  purpose: z.string().min(1, 'O propósito é obrigatório.').max(999, 'O propósito deve ter no máximo 999 caracteres.'),
});

export default function CreateChatbotPage() {
  const router = useRouter();
  const { setName, setPurpose } = useChatbot();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      purpose: '',
    },
  });

  const nameValue = form.watch('name');
  const purposeValue = form.watch('purpose');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:8080';
      console.log('🔍 CORE_API_URL being used:', CORE_API_URL);
      console.log('🔍 Environment variable:', process.env.NEXT_PUBLIC_CORE_API_URL);
      const response = await fetch(`${CORE_API_URL}/api/v1/frontend/assistants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to create chatbot');
      }

      // Optionally, you can still use the context if other parts of the app need it instantly
      setName(values.name);
      setPurpose(values.purpose);

      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating chatbot:', error);
      // Here you could add some user-facing error handling, like a toast message
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Novo chatbot de IA generativa</CardTitle>
          <CardDescription className="text-center">
            Defina as informações básicas para começar a configurar seu assistente virtual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do chatbot</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Assistente de Vendas" {...field} />
                    </FormControl>
                    <div className="flex justify-between">
                      <FormDescription>Este será o nome público do seu chatbot.</FormDescription>
                      <span className="text-sm text-muted-foreground">{nameValue.length}/30</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propósito do chatbot</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o principal objetivo do seu chatbot. Por exemplo: 'Ajudar usuários a encontrar produtos em nosso site e responder perguntas sobre frete e devoluções.'"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between">
                     <FormDescription>Isso guiará o comportamento da IA.</FormDescription>
                     <span className="text-sm text-muted-foreground">{purposeValue.length}/999</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-4">
                <Button variant="outline" asChild>
                  <Link href="/">Cancelar</Link>
                </Button>
                <Button type="submit">Criar chatbot</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
