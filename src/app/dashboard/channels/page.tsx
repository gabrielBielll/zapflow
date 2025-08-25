import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plug, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function ChannelsPage() {
  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Canais</h1>
        <p className="text-muted-foreground">Conecte seu chatbot a diferentes plataformas de mensagem.</p>
      </header>

      <Card className="text-center flex flex-col items-center justify-center p-12 border-dashed">
        <div className="flex items-center justify-center mb-4">
            <MessageSquare className="h-16 w-16 text-green-500"/>
            <Plug className="h-10 w-10 text-muted-foreground -ml-4 -mr-2" />
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-primary" />
            </div>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Nenhum canal vinculado</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Conecte seu chatbot a canais como WhatsApp para começar a interagir com seus clientes.
        </p>
        <Button asChild>
          <Link href="#">Vincular canal</Link>
        </Button>
      </Card>
    </div>
  );
}
