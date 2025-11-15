'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatbot } from '@/context/ChatbotContext';
import { Send } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

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

const BotMessage = ({ text, isLoading = false }: { text: string; isLoading?: boolean }) => (
    <div className="flex justify-start mb-4">
        <Avatar>
            <AvatarFallback>B</AvatarFallback>
        </Avatar>
        <div className={`ml-2 py-3 px-4 bg-card rounded-br-3xl rounded-tr-3xl rounded-tl-xl border ${isLoading ? 'animate-pulse' : ''}`}>
            {isLoading ? (
                <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            ) : (
                text
            )}
        </div>
    </div>
)

export function ChatSimulation() {
  const { name } = useChatbot();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou o assistente da Deep Saúde. Como posso te ajudar hoje?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto scroll para a última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Chama nosso AI Service local
      const response = await fetch('http://localhost:4000/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistant_id: 'deep-saude-assistant',
          query: userMessage.text,
          history: messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            content: msg.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Desculpe, não consegui processar sua mensagem.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <aside className="w-96 flex-shrink-0 border-l border-border bg-card flex flex-col">
      <header className="p-4 border-b flex items-center gap-4">
        <Avatar>
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{name}</h2>
          <p className="text-sm text-green-500">Online • Deep Saúde</p>
        </div>
      </header>
      
      <ScrollArea className="flex-grow p-6" ref={scrollAreaRef}>
        <div className="flex flex-col">
          {messages.map((message) => (
            message.sender === 'user' ? (
              <UserMessage key={message.id} text={message.text} />
            ) : (
              <BotMessage key={message.id} text={message.text} />
            )
          ))}
          {isLoading && (
            <BotMessage text="Pensando..." isLoading={true} />
          )}
        </div>
      </ScrollArea>
      
      <footer className="p-4 border-t">
        <div className="relative">
          <Input 
            placeholder="Digite uma mensagem..." 
            className="pr-12" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </aside>
  );
}
