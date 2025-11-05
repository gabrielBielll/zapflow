import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, GitBranch, Filter } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Novo chatbot</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Escolha o tipo de chatbot que melhor se adapta às suas necessidades. Você pode começar com um modelo de IA avançado ou uma solução mais simples.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        <Card className="lg:col-span-1 md:col-span-2 border-2 border-primary shadow-2xl transform hover:scale-105 transition-transform duration-300 flex flex-col">
          <CardHeader className="text-center">
            <Bot className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl">Chatbot de IA generativa</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col text-center">
            <CardDescription className="flex-grow mb-6">
              Crie um assistente virtual inteligente que entende, aprende e responde de forma natural. Ideal para atendimento ao cliente, vendas e suporte técnico complexo.
            </CardDescription>
            <Button asChild size="lg" className="w-full">
              <Link href="/create">Selecionar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col transform hover:scale-105 transition-transform duration-300">
          <CardHeader className="text-center">
            <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Chatbot baseado em fluxos</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col text-center">
            <CardDescription className="flex-grow mb-6">
              Desenhe conversas estruturadas com um construtor visual. Perfeito para qualificação de leads, agendamentos e pesquisas.
            </CardDescription>
            <Button variant="secondary" className="w-full" disabled>Selecionar</Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col transform hover:scale-105 transition-transform duration-300">
          <CardHeader className="text-center">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Triagem automatizada</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col text-center">
            <CardDescription className="flex-grow mb-6">
              Use regras simples para direcionar clientes para o departamento ou atendente certo, otimizando o tempo da sua equipe.
            </CardDescription>
            <Button variant="secondary" className="w-full" disabled>Selecionar</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
