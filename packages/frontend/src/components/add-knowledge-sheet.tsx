'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, Link as LinkIcon, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { useChatbot } from '@/context/ChatbotContext';
import { useRef, useState } from 'react';
import { Input } from './ui/input';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem } from './ui/form';
import { uploadFile } from '@/services/coreApiService';

const urlSchema = z.object({
  urls: z.array(z.object({ value: z.string().url('Por favor, insira uma URL válida.') })),
});

export function AddKnowledgeSheet() {
  const { addKnowledgeFile, addKnowledgeUrl } = useChatbot();
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      urls: [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'urls',
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // TODO: O endpoint precisa retornar os metadados do arquivo para exibirmos corretamente
      await uploadFile(file);
      // Simulação, já que o endpoint não retorna os dados
      addKnowledgeFile({ name: file.name, type: file.type, size: `${(file.size / 1024 / 1024).toFixed(2)} MB` });
      setOpen(false);
    } catch (error) {
      // TODO: Adicionar um tratamento de erro mais robusto (ex: toast notification)
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      // Limpa o input para permitir o upload do mesmo arquivo novamente
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleAddUrls = (data: z.infer<typeof urlSchema>) => {
    data.urls.forEach(url => {
      if(url.value) {
        addKnowledgeUrl(url.value)
      }
    });
    form.reset({ urls: [{ value: '' }] });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar conteúdo
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Adicionar à Base de Conhecimento</SheetTitle>
          <SheetDescription>
            Faça upload de arquivos ou adicione URLs para treinar seu chatbot.
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="file" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file"><UploadCloud className="mr-2 h-4 w-4"/>Arquivo</TabsTrigger>
            <TabsTrigger value="url"><LinkIcon className="mr-2 h-4 w-4"/>URL</TabsTrigger>
          </TabsList>
          <TabsContent value="file">
            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
              {isUploading ? (
                <>
                  <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    Enviando arquivo...
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Aguarde enquanto processamos o documento.
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    Arraste e solte arquivos aqui
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Suporta PDF, TXT (max 5MB)
                  </p>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.txt"
                  />
                  <Button type="button" variant="outline" className="mt-4" onClick={handleFileSelect} disabled={isUploading}>
                    Ou clique para selecionar
                  </Button>
                </>
              )}
            </div>
             <SheetFooter className="mt-6">
                <SheetClose asChild>
                    <Button variant="outline" disabled={isUploading}>Cancelar</Button>
                </SheetClose>
            </SheetFooter>
          </TabsContent>
          <TabsContent value="url">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddUrls)} className="space-y-4 pt-6">
                 {fields.map((field, index) => (
                   <FormField
                     key={field.id}
                     control={form.control}
                     name={`urls.${index}.value`}
                     render={({ field }) => (
                       <FormItem>
                         <div className="flex items-center gap-2">
                            <FormControl>
                                <Input {...field} placeholder="https://exemplo.com/faq" />
                            </FormControl>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                         </div>
                       </FormItem>
                     )}
                   />
                ))}
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => append({ value: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Adicionar outra URL
                </Button>

                <SheetFooter className="pt-6">
                    <SheetClose asChild>
                        <Button variant="outline" type='button'>Cancelar</Button>
                    </SheetClose>
                  <Button type="submit">Adicionar URLs</Button>
                </SheetFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
