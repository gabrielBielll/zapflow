'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatbot } from '@/context/ChatbotContext';
import { Send } from 'lucide-react';

const UserMessage = ({ text }: { text: string }) => (
    <div className="flex justify-end mb-4">
        <div className="mr-2 py-3 px-4 bg-primary text-primary-foreground rounded-bl-3xl rounded-tl-3xl rounded-tr-xl">
            {text}
        </div>
        <Avatar>
            <AvatarFallback>U</AvatarFallback>
        </Avatar>
    </div>
)

const BotMessage = ({ text }: { text: string }) => (
    <div className="flex justify-start mb-4">
        <Avatar>
            <AvatarFallback>B</AvatarFallback>
        </Avatar>
        <div className="ml-2 py-3 px-4 bg-card rounded-br-3xl rounded-tr-3xl rounded-tl-xl border">
            {text}
        </div>
    </div>
)

export function ChatSimulation() {
  const { name } = useChatbot();

  return (
    <aside className="w-96 flex-shrink-0 border-l border-border bg-card flex flex-col">
      <header className="p-4 border-b flex items-center gap-4">
        <Avatar>
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{name}</h2>
          <p className="text-sm text-green-500">Online</p>
        </div>
      </header>
      <ScrollArea className="flex-grow p-6">
        <div className="flex flex-col">
            <BotMessage text="Olá! Como posso te ajudar hoje?" />
            <UserMessage text="Gostaria de saber sobre os planos." />
            <BotMessage text={`Claro! O ${name} pode te ajudar com isso. Nossos planos são...`} />
        </div>
      </ScrollArea>
      <footer className="p-4 border-t">
        <div className="relative">
          <Input placeholder="Digite uma mensagem..." className="pr-12" />
          <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </aside>
  );
}
