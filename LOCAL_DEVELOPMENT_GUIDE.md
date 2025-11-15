# 🚀 Guia de Desenvolvimento Local - ZapFlow

Este guia permite rodar o projeto localmente apontando para os serviços de produção (banco de dados, APIs externas) para economizar recursos do Render durante o desenvolvimento.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Java 11+ instalado (para o core-api Clojure)
- Leiningen instalado (para Clojure)
- Git configurado

## 🔧 Configuração Inicial

### 1. Clone e Instale Dependências

```bash
# Clone o repositório
git clone https://github.com/gabrielBielll/zapflow.git
cd zapflow

# Instale dependências do frontend
cd packages/frontend
npm install

# Instale dependências do ai-service
cd ../ai-service
npm install

# Volte para a raiz
cd ../..
```

### 2. Configuração das Variáveis (Já Hardcodadas)

As variáveis de ambiente já estão hardcodadas nos arquivos para apontar para produção:

#### Core API (Clojure)
- **Arquivo**: `packages/core-api/src/core_api/core.clj`
- **Banco**: CockroachDB de produção
- **Porta**: 8080

#### AI Service (Node.js)
- **Arquivo**: `packages/ai-service/src/index.ts`
- **Gemini API**: Chave de produção configurada
- **Porta**: 4000

#### Frontend (Next.js)
- **Arquivo**: `packages/frontend/src/config/environment.ts`
- **APIs**: Apontando para serviços de produção no Render

## 🚀 Como Executar Localmente

### 1. Executar Core API (Backend Clojure)

```bash
# Terminal 1 - Core API
cd packages/core-api

# Executar em modo desenvolvimento
lein run

# OU compilar e executar JAR
lein uberjar
java -jar target/uberjar/core-api-0.1.0-SNAPSHOT-standalone.jar
```

**Acesso**: http://localhost:8080

### 2. Executar AI Service (Serviço de IA)

```bash
# Terminal 2 - AI Service
cd packages/ai-service

# Executar em modo desenvolvimento
npm run dev

# OU executar em produção
npm run build
npm start
```

**Acesso**: http://localhost:4000

### 3. Executar Frontend (Next.js)

```bash
# Terminal 3 - Frontend
cd packages/frontend

# Executar em modo desenvolvimento
npm run dev

# OU executar em produção
npm run build
npm start
```

**Acesso**: http://localhost:3000

## 🔄 Alternando Entre Local e Produção

### Para usar serviços LOCAIS em vez de produção:

#### 1. Core API (`packages/core-api/src/core_api/core.clj`)
```clojure
;; Comentar linha de produção e descomentar local:
;; (def db-spec "postgresql://zapflow:i7cI3Qj40rJ2uO_wA12nuA@...")
(def db-spec "postgresql://zapflow:zapflow123@localhost:5432/zapflow")

;; (def ai-service-url "https://zapflow-ai-service.onrender.com")
(def ai-service-url "http://localhost:4000")
```

#### 2. AI Service (`packages/ai-service/src/index.ts`)
```typescript
// Comentar linha de produção:
// process.env.GOOGLE_GENAI_API_KEY = "AIzaSyBOKeSudS26b5J0xKL_sKOEqX7Z2zgzUm0";

// Usar variável de ambiente local:
// process.env.GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;
```

#### 3. Frontend (`packages/frontend/src/config/environment.ts`)
```typescript
// Comentar linhas de produção e descomentar locais:
// export const CORE_API_URL = 'https://zflow-core-api.onrender.com';
export const CORE_API_URL = 'http://localhost:8080';

// export const GATEWAY_URL = 'https://zapflow-gateway.onrender.com';
export const GATEWAY_URL = 'http://localhost:5001';
```

## 🔍 Verificação de Funcionamento

### 1. Testar Core API
```bash
curl http://localhost:8080/api/v1/frontend/assistants
```

### 2. Testar AI Service
```bash
curl -X POST http://localhost:4000/health
```

### 3. Testar Frontend
- Acesse: http://localhost:3000
- Crie um assistente
- Verifique se conecta com o banco de produção

## 📊 Monitoramento

### Logs do Core API
- Conexão com banco CockroachDB
- Migrações executadas
- Requests HTTP

### Logs do AI Service
- Conexão com Gemini API
- Processamento de documentos
- Geração de respostas

### Logs do Frontend
- Chamadas para APIs
- Erros de conexão
- Estado dos componentes

## 🔧 Troubleshooting

### Erro de Conexão com Banco
```
ERRO ao conectar com o banco: No suitable driver found
```
**Solução**: Verificar se o PostgreSQL driver está no classpath

### Erro de API Key
```
Error: API key not found
```
**Solução**: Verificar se a chave do Gemini está configurada corretamente

### Erro de CORS
```
Access to fetch blocked by CORS policy
```
**Solução**: Verificar configuração de CORS no core-api

## 🔄 Voltando para Render (Quando os Minutos Renovarem)

### 1. Fazer Push das Mudanças
```bash
git add .
git commit -m "Update: local development changes"
git push origin main
```

### 2. Deploy Automático
- Render detecta mudanças no repositório
- Deploy automático é executado
- Serviços ficam disponíveis novamente

### 3. Verificar Deploys
- Core API: https://zflow-core-api.onrender.com
- AI Service: https://zapflow-ai-service.onrender.com
- Frontend: https://zapflow-frontend-j6kp.onrender.com

## 📝 Notas Importantes

1. **Banco de Dados**: Sempre usa produção (CockroachDB)
2. **Gemini API**: Usa chave de produção hardcodada
3. **Arquivos Modificados**: Não fazer commit das chaves hardcodadas
4. **Desenvolvimento**: Sempre testar localmente antes do push
5. **Recursos**: Economiza minutos do Render durante desenvolvimento

## 🔐 Segurança

- ⚠️ **NUNCA** fazer commit das chaves hardcodadas para repositório público
- 🔒 Usar `.env.local` para desenvolvimento se necessário
- 🛡️ Manter chaves de produção seguras
- 🔄 Rotacionar chaves periodicamente

## 📞 Suporte

Em caso de problemas:
1. Verificar logs de cada serviço
2. Testar conexões individualmente
3. Verificar configurações de rede/firewall
4. Consultar documentação do Render

---

**Desenvolvido com ❤️ para economizar recursos e acelerar o desenvolvimento!**