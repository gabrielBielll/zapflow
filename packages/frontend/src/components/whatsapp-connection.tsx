'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Smartphone, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

interface WhatsAppConnectionProps {
  assistantId: string;
}

type ConnectionStatus = 'disconnected' | 'pending_qr' | 'ready' | 'error';

export function WhatsAppConnection({ assistantId }: WhatsAppConnectionProps) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [qrCode, setQrCode] = useState<string>('');
  const [channelId, setChannelId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const initializeConnection = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // First, create WhatsApp channel
      const channelResponse = await fetch(`http://localhost:8082/api/v1/frontend/assistants/${assistantId}/channels/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!channelResponse.ok) {
        const errorData = await channelResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${channelResponse.status}: Failed to create WhatsApp channel`);
      }

      const channelData = await channelResponse.json();
      const newChannelId = channelData.id;
      setChannelId(newChannelId);

      // Then, initialize session with gateway
      const sessionResponse = await fetch('http://localhost:8081/init-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel_id: newChannelId }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${sessionResponse.status}: Failed to initialize WhatsApp session`);
      }

      const sessionData = await sessionResponse.json();
      
      if (!sessionData.qr_string) {
        throw new Error('No QR code received from gateway');
      }
      
      // Generate QR code image
      const qrCodeDataUrl = await QRCode.toDataURL(sessionData.qr_string);
      setQrCode(qrCodeDataUrl);
      setStatus('pending_qr');
      
      // Start polling for status
      startStatusPolling(newChannelId);
      
    } catch (err) {
      console.error('WhatsApp connection error:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao conectar WhatsApp');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const startStatusPolling = (channelId: string) => {
    let pollAttempts = 0;
    const maxAttempts = 150; // 5 minutes with 2-second intervals
    
    const pollInterval = setInterval(async () => {
      pollAttempts++;
      
      try {
        const response = await fetch(`http://localhost:8081/status/${channelId}`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status);
          
          if (data.status === 'ready') {
            clearInterval(pollInterval);
            console.log('WhatsApp connected successfully');
          } else if (data.status === 'disconnected') {
            clearInterval(pollInterval);
            setError('Conexão WhatsApp foi perdida');
            setStatus('error');
          }
        } else {
          console.warn(`Status polling failed: HTTP ${response.status}`);
        }
      } catch (err) {
        console.error('Error polling status:', err);
        
        // If we've failed too many times, stop polling
        if (pollAttempts >= maxAttempts) {
          clearInterval(pollInterval);
          setError('Timeout: Não foi possível verificar o status da conexão');
          setStatus('error');
        }
      }
      
      // Stop polling after max attempts
      if (pollAttempts >= maxAttempts) {
        clearInterval(pollInterval);
        if (status === 'pending_qr') {
          setError('Timeout: QR code expirou. Tente conectar novamente.');
          setStatus('error');
        }
      }
    }, 2000);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'disconnected':
        return <Badge variant="secondary"><XCircle className="w-4 h-4 mr-1" />Desconectado</Badge>;
      case 'pending_qr':
        return <Badge variant="outline"><Loader2 className="w-4 h-4 mr-1 animate-spin" />Aguardando QR</Badge>;
      case 'ready':
        return <Badge variant="default"><CheckCircle className="w-4 h-4 mr-1" />Conectado</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'disconnected':
        return 'WhatsApp não está conectado. Clique em "Conectar" para gerar um QR code.';
      case 'pending_qr':
        return 'Escaneie o QR code abaixo com seu WhatsApp para conectar.';
      case 'ready':
        return 'WhatsApp conectado com sucesso! Seu assistente está pronto para receber mensagens.';
      case 'error':
        return `Erro na conexão: ${error}`;
      default:
        return 'Status desconhecido.';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Smartphone className="w-5 h-5" />
          Conexão WhatsApp
        </CardTitle>
        <CardDescription>
          Conecte seu WhatsApp para receber mensagens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          {getStatusBadge()}
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          {getStatusMessage()}
        </p>

        {status === 'pending_qr' && qrCode && (
          <div className="flex justify-center">
            <img 
              src={qrCode} 
              alt="QR Code para WhatsApp" 
              className="w-48 h-48 border rounded-lg"
            />
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex justify-center">
          {status === 'disconnected' || status === 'error' ? (
            <Button 
              onClick={initializeConnection} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Conectar WhatsApp'
              )}
            </Button>
          ) : status === 'ready' ? (
            <Button 
              variant="outline" 
              onClick={() => {
                setStatus('disconnected');
                setQrCode('');
                setChannelId('');
              }}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reconectar
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}