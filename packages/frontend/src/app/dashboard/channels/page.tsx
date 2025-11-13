'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, MessageSquare, Plug, QrCode } from 'lucide-react';
import { getQRCode } from '@/services/gatewayService';
import Image from 'next/image';

export default function ChannelsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false); // Simulando o status da conexão

  const handleConnect = async () => {
    setIsLoading(true);
    setQrCode(null);
    try {
      const qrCodeData = await getQRCode();
      setQrCode(qrCodeData);
    } catch (error) {
      // TODO: Adicionar um tratamento de erro mais robusto (ex: toast notification)
      console.error('Failed to connect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Canais</h1>
        <p className="text-muted-foreground">Conecte seu chatbot a diferentes plataformas de mensagem.</p>
      </header>

      {isConnected ? (
        <Card className="text-center flex flex-col items-center justify-center p-12 bg-green-50 border-green-200">
           <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
               <MessageSquare className="h-10 w-10 text-green-600" />
           </div>
           <h2 className="text-2xl font-semibold mb-2 text-green-800">WhatsApp Conectado</h2>
           <p className="text-green-600 mb-6 max-w-sm">
            Seu chatbot está pronto para interagir com seus clientes no WhatsApp.
           </p>
           <Button variant="destructive">Desconectar</Button>
        </Card>
      ) : (
        <Card className="text-center flex flex-col items-center justify-center p-12 border-dashed">

          {!qrCode && !isLoading && (
            <>
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
            </>
          )}

          {isLoading && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Gerando QR Code...</h2>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Aguarde um momento. Estamos preparando tudo para a conexão.
              </p>
            </>
          )}

          {qrCode && !isLoading && (
            <>
                <div className="flex items-center justify-center mb-4">
                    <QrCode className="h-12 w-12 text-primary"/>
                </div>
                <h2 className="text-2xl font-semibold mb-2">Escaneie para Conectar</h2>
                <p className="text-muted-foreground mb-6 max-w-sm">
                    Abra o WhatsApp no seu celular e escaneie o código abaixo para vincular seu número.
                </p>
                <div className="p-4 border rounded-md">
                    <Image
                        src={qrCode}
                        alt="QR Code do WhatsApp"
                        width={256}
                        height={256}
                    />
                </div>
            </>
          )}

          <Button onClick={handleConnect} disabled={isLoading} className="mt-6">
            {isLoading ? "Aguarde..." : (qrCode ? "Gerar Novo Código" : "Vincular Canal")}
          </Button>
        </Card>
      )}
    </div>
  );
}
