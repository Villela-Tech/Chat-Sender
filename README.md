# Sistema Sender
> Sistema Completo de Atendimento Multicanal via WhatsApp

# 📑 ÍNDICE GERAL

## 📚 1. DOCUMENTAÇÃO GERAL

* 🎯 **Visão Geral do Projeto**
   * Objetivos
   * Público-alvo
   * Funcionalidades principais
   * Arquitetura do sistema
   * Tecnologias utilizadas

* 🚀 **Atualizações e Versões**
   * Histórico de versões
   * Changelog
   * Roadmap
   * Correções e melhorias

## 💻 2. DOCUMENTAÇÃO TÉCNICA

* 🔧 **Arquitetura**
   * Frontend (React/TypeScript)
      * Estrutura de pastas
      * Componentes principais
      * Gerenciamento de estado
      * Rotas e navegação
   * Backend (Node.js)
      * Estrutura do projeto
      * APIs e endpoints
      * Banco de dados
      * Serviços
   * Integrações
      * WhatsApp API
      * Webhooks
      * Serviços externos

* 🛠️ **Desenvolvimento**
   * Ambiente de desenvolvimento
      * Requisitos
      * Configuração
      * Variáveis de ambiente
   * Padrões de código
      * Convenções
      * ESLint/Prettier
      * Git workflow
   * Testes
      * Unitários
      * Integração
      * E2E

* 📦 **Deploy e Infraestrutura**
   * Ambientes
      * Desenvolvimento
      * Homologação
      * Produção
   * Servidores
      * Configuração
      * Monitoramento
      * Backup
   * CI/CD
      * Pipeline
      * Automações
      * Logs

## 👥 3. DOCUMENTAÇÃO OPERACIONAL

* 💼 **Gestão de Usuários**
   * Níveis de Acesso
      * Administrador
         * Configurações gerais
         * Gestão de usuários
         * Relatórios avançados
      * Supervisor
         * Gestão de equipes
         * Monitoramento
         * Relatórios básicos
      * Atendente
         * Atendimento ao cliente
         * Gestão de tickets
         * Dashboards

* 📱 **WhatsApp**
   * Configuração
      * Conexão de número
      * QR Code
      * Webhook
   * Recursos
      * Mensagens
      * Mídia
      * Grupos
      * Listas
   * Limitações
      * Políticas do WhatsApp
      * Boas práticas
      * Restrições

* 🎫 **Sistema de Tickets**
   * Fluxo de Atendimento
      ```mermaid
      graph TD
          A[Nova Mensagem] --> B{Já existe ticket?}
          B -->|Sim| C[Atualiza Ticket]
          B -->|Não| D[Cria Ticket]
          C --> E[Notifica Atendente]
          D --> E
          E --> F[Atendimento]
          F --> G{Resolvido?}
          G -->|Sim| H[Fecha Ticket]
          G -->|Não| F
      ```
   * Estados do Ticket
      * Novo
      * Em Atendimento
      * Aguardando Cliente
      * Resolvido
      * Fechado
   * Prioridades
      * Baixa
      * Média
      * Alta
      * Urgente

* 📊 **Relatórios e Métricas**
   * KPIs de Atendimento
      * Tempo médio de resposta
      * Taxa de resolução
      * Satisfação do cliente
   * Dashboards
      * Tempo real
      * Diário
      * Mensal
   * Exportação
      * CSV
      * PDF
      * Excel

## 🔄 4. PROCESSOS E FLUXOS

* 📋 **Processos Operacionais**
   * Atendimento ao Cliente
      ```mermaid
      sequenceDiagram
          Cliente->>Sistema: Envia mensagem
          Sistema->>Fila: Cria/atualiza ticket
          Fila->>Atendente: Distribui ticket
          Atendente->>Cliente: Realiza atendimento
          Cliente->>Atendente: Responde
          Atendente->>Sistema: Resolve ticket
          Sistema->>Cliente: Pesquisa satisfação
      ```
   * Gestão de Equipe
      * Escalas
      * Pausas
      * Monitoramento
   * Campanhas
      * Planejamento
      * Execução
      * Análise

* 🤖 **Automações**
   * Chatbot
      * Fluxos
      * Respostas automáticas
      * Integrações
   * Disparos em Massa
      * Listas
      * Templates
      * Agendamentos
   * Regras de Negócio
      * Distribuição
      * Priorização
      * Alertas

## 🔒 5. SEGURANÇA E CONFORMIDADE

* 🛡️ **Segurança**
   * Autenticação
      * Login
      * 2FA
      * Tokens
   * Permissões
      * RBAC
      * ACL
      * Logs
   * Dados
      * Criptografia
      * Backup
      * Retenção

* 📜 **Conformidade**
   * LGPD
      * Políticas
      * Processos
      * Documentação
   * WhatsApp Business
      * Termos de uso
      * Políticas
      * Limitações

## 🎓 6. TREINAMENTO

* 📝 **Onboarding**
   * Primeiros Passos
      * Acesso ao sistema
      * Configuração inicial
      * Tour guiado
   * Treinamento Básico
      * Atendimento
      * Tickets
      * Relatórios
   * Treinamento Avançado
      * Automações
      * Campanhas
      * Integrações

* 📖 **Material de Apoio**
   * Guias
      * Usuário
      * Administrador
      * Desenvolvedor
   * Vídeos
      * Tutoriais
      * Demonstrações
      * Cases
   * FAQ
      * Dúvidas comuns
      * Troubleshooting
      * Boas práticas

## 🛟 7. SUPORTE

* 🆘 **Canais de Suporte**
   * Níveis
      * N1 - Suporte básico
      * N2 - Suporte técnico
      * N3 - Desenvolvimento
   * Contatos
      * Email
      * Chat
      * Telefone
   * SLA
      * Tempos de resposta
      * Prioridades
      * Escalação

* 🔍 **Resolução de Problemas**
   * Problemas Comuns
      * Sintomas
      * Soluções
      * Prevenção
   * Logs e Monitoramento
      * Coleta
      * Análise
      * Alertas
   * Manutenção
      * Preventiva
      * Corretiva
      * Evolutiva

# 📚 DETALHAMENTO TÉCNICO

## 🔧 Arquitetura do Sistema

### Frontend (React/TypeScript)

#### Estrutura de Diretórios
```
frontend/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── pages/         # Páginas da aplicação
│   ├── contexts/      # Contextos React
│   ├── hooks/         # Hooks personalizados
│   ├── services/      # Serviços e APIs
│   ├── utils/         # Funções utilitárias
│   └── types/         # Tipos TypeScript
├── public/           # Arquivos estáticos
└── package.json      # Dependências
```

#### Principais Tecnologias
* React 18
* TypeScript 4.x
* Material-UI v5
* React Query
* React Router v6
* Socket.io Client
* Axios

#### Componentes Principais

* **Layout**
  * `Sidebar`: Navegação principal
  * `Header`: Barra superior com notificações
  * `ChatPanel`: Painel de conversas
  * `TicketList`: Lista de tickets

* **Chat**
  * `MessageList`: Lista de mensagens
  * `MessageInput`: Campo de envio
  * `AttachmentHandler`: Gestor de anexos
  * `QuickResponses`: Respostas rápidas

* **Tickets**
  * `TicketManager`: Gerenciador de tickets
  * `TicketFilters`: Filtros de busca
  * `TicketTags`: Sistema de tags
  * `TicketHistory`: Histórico

### Backend (Node.js/TypeScript)

#### Estrutura de Diretórios
```
backend/
├── src/
│   ├── controllers/   # Controladores
│   ├── models/        # Modelos do banco
│   ├── services/      # Serviços
│   ├── routes/        # Rotas da API
│   ├── middlewares/   # Middlewares
│   ├── config/        # Configurações
│   └── utils/         # Utilitários
├── tests/            # Testes
└── package.json      # Dependências
```

#### Principais Tecnologias
* Node.js 16+
* TypeScript 4.x
* Express
* Prisma ORM
* Socket.io
* JWT
* Jest

#### APIs Principais

* **Autenticação**
```typescript
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

* **Tickets**
```typescript
GET /api/tickets
POST /api/tickets
PUT /api/tickets/:id
DELETE /api/tickets/:id
```

* **WhatsApp**
```typescript
POST /api/whatsapp/send
POST /api/whatsapp/media
GET /api/whatsapp/status
```

### Banco de Dados

#### Modelo de Dados
```mermaid
erDiagram
    User ||--o{ Ticket : atende
    Ticket ||--o{ Message : contem
    Contact ||--o{ Ticket : possui
    Queue ||--o{ Ticket : agrupa
    
    User {
        int id
        string name
        string email
        string role
    }
    
    Ticket {
        int id
        string status
        int userId
        int contactId
        int queueId
    }
    
    Message {
        int id
        string content
        int ticketId
        string type
    }
    
    Contact {
        int id
        string number
        string name
        string profile
    }
    
    Queue {
        int id
        string name
        string color
    }

```

### Integrações

#### WhatsApp API
* **Conexão**
  * Autenticação via QR Code
  * Webhook para eventos
  * Gerenciamento de sessão

* **Recursos**
  * Envio de mensagens
  * Mídia (imagens, áudio, documentos)
  * Templates
  * Listas e botões

#### Webhooks
* **Eventos**
  * Mensagens recebidas
  * Status de envio
  * Conexão/desconexão
  * Atualizações de perfil

## 🛠️ Ambiente de Desenvolvimento

### Requisitos
* Node.js 16+
* PostgreSQL 13+
* Redis
* Git

### Configuração

1. **Clone o repositório**
```bash
git clone https://github.com/Villela-Tech/Chat-Sender.git
cd Chat-Sender
```

2. **Variáveis de ambiente**
```env
# Backend
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/sender
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379

# Frontend
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOCKET_URL=http://localhost:3000
```

3. **Instalação**
```bash
# Backend
cd backend
npm install
npm run prisma:migrate
npm run dev

# Frontend
cd frontend
npm install
npm start
```
### Padrões de Código

#### ESLint
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error"
  }
}
```

#### Git Workflow
1. **Branches**
   * `main`: Produção
   * `develop`: Desenvolvimento
   * `feature/*`: Novas funcionalidades
   * `hotfix/*`: Correções urgentes

2. **Commits**
   * `feat`: Nova funcionalidade
   * `fix`: Correção de bug
   * `docs`: Documentação
   * `style`: Formatação
   * `refactor`: Refatoração
   * `test`: Testes

# 💼 PROCESSOS OPERACIONAIS

## 📱 Gestão de Atendimento

### Fluxo de Atendimento
```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Sistema
    participant A as Atendente
    
    C->>S: Envia mensagem
    S->>S: Verifica ticket existente
    S->>S: Aplica regras de distribuição
    S->>A: Notifica novo atendimento
    A->>S: Aceita atendimento
    A->>C: Inicia conversa
    C->>A: Interage
    A->>C: Responde
    A->>S: Finaliza atendimento
    S->>C: Envia pesquisa satisfação
```

### Estados do Ticket

1. **Novo**
   * Mensagem recebida
   * Aguardando atribuição
   * Prioridade definida

2. **Em Atendimento**
   * Atendente designado
   * Conversa em andamento
   * Tempo de resposta monitorado

3. **Aguardando Cliente**
   * Resposta enviada
   * Timer de espera ativo
   * Notificações configuradas

4. **Resolvido**
   * Solicitação atendida
   * Feedback solicitado
   * Histórico registrado

### Priorização de Atendimento

| Nível | Tempo Máximo | Condições |
|-------|--------------|-----------|
| P1    | 5 minutos   | - Cliente VIP<br>- Reclamação<br>- Palavra-chave urgente |
| P2    | 15 minutos  | - Cliente regular<br>- Dúvida produto<br>- Suporte técnico |
| P3    | 30 minutos  | - Informações gerais<br>- Consultas<br>- Feedback |
| P4    | 60 minutos  | - Marketing<br>- Sugestões<br>- Outros |

## 🤖 Automações

### Chatbot

#### Fluxos Automáticos
```mermaid
graph TD
    A[Mensagem Recebida] --> B{Horário Comercial?}
    B -->|Sim| C{Atendentes Disponíveis?}
    B -->|Não| D[Resposta Automática]
    C -->|Sim| E[Direciona Atendente]
    C -->|Não| F[Fila de Espera]
    D --> G[Registra Contato]
    E --> H[Inicia Atendimento]
    F --> I[Notifica Supervisão]
```

#### Respostas Automáticas

* **Boas-vindas**
```
Olá! Bem-vindo ao Sistema Sender.
Como posso ajudar você hoje?

1️⃣ Suporte Técnico
2️⃣ Vendas
3️⃣ Financeiro
4️⃣ Outros Assuntos
```

* **Fora do Horário**
```
Olá! Nosso horário de atendimento é:
Segunda a Sexta: 08h às 18h
Sábado: 09h às 13h

🔔 Deixe sua mensagem e retornaremos assim que possível!
```

### Campanhas

#### Tipos de Campanha

1. **Marketing**
   * Promoções
   * Novidades
   * Eventos

2. **Relacionamento**
   * Aniversário
   * Pós-venda
   * Pesquisa satisfação

3. **Informativo**
   * Avisos
   * Atualizações
   * Comunicados

#### Configuração de Disparo

* **Agendamento**
  * Data/hora específica
  * Recorrência
  * Fuso horário

* **Segmentação**
  * Grupos
  * Tags
  * Histórico

* **Limites**
  * Taxa de envio
  * Intervalo entre mensagens
  * Quantidade diária

## 📊 Métricas e KPIs

### Atendimento

#### Tempo Médio
```mermaid
pie title "Distribuição de Tempo de Atendimento"
    "< 5 min" : 45
    "5-15 min" : 30
    "15-30 min" : 15
    "> 30 min" : 10
```

#### Satisfação
```mermaid
pie title "Avaliação dos Clientes"
    "Excelente" : 60
    "Bom" : 25
    "Regular" : 10
    "Ruim" : 5
```

### Performance

| Métrica | Meta | Atual |
|---------|------|-------|
| Tempo Primeira Resposta | < 5 min | 4.2 min |
| Taxa de Resolução | > 90% | 93% |
| Satisfação Cliente | > 4.5/5 | 4.7/5 |
| Tickets/Hora | > 6 | 7.2 |

### Relatórios

1. **Diários**
   * Volume de tickets
   * Tempo médio resposta
   * Taxa resolução
   * Avaliações

2. **Semanais**
   * Performance equipe
   * Picos de demanda
   * Temas frequentes
   * Eficiência bot

3. **Mensais**
   * Tendências
   * Comparativos
   * Metas
   * ROI

## 🔐 Segurança e Compliance

### Controle de Acesso

#### Níveis de Permissão

| Nível | Acesso | Permissões |
|-------|--------|------------|
| Admin | Total | - Configurações sistema<br>- Gestão usuários<br>- Relatórios completos |
| Supervisor | Gerencial | - Gestão equipe<br>- Relatórios básicos<br>- Configurações atendimento |
| Atendente | Operacional | - Atendimento tickets<br>- Histórico conversas<br>- Respostas rápidas |

### Proteção de Dados

#### LGPD
* Consentimento
* Retenção
* Exclusão

#### Segurança
* Criptografia
* Backup
* Auditoria

# 🎓 TREINAMENTO E SUPORTE

## 📚 Programa de Treinamento

### Onboarding

#### 1. Introdução ao Sistema
* **Visão Geral**
  * História do projeto
  * Objetivos
  * Benefícios
  * Casos de sucesso

* **Primeiros Passos**
  * Acesso ao sistema
  * Tour guiado
  * Configurações iniciais
  * Teste de conexão

#### 2. Treinamento Básico

* **Módulo 1: Interface**
  * Dashboard
  * Menu principal
  * Atalhos
  * Personalização

* **Módulo 2: Atendimento**
  * Receber tickets
  * Responder mensagens
  * Transferir conversas
  * Finalizar atendimentos

* **Módulo 3: WhatsApp**
  * Conexão
  * Recursos
  * Limitações
  * Boas práticas

#### 3. Treinamento Avançado

* **Módulo 4: Gestão**
  * Relatórios
  * Métricas
  * Equipes
  * Metas

* **Módulo 5: Automação**
  * Chatbot
  * Respostas rápidas
  * Fluxos
  * Regras

* **Módulo 6: Campanhas**
  * Planejamento
  * Execução
  * Monitoramento
  * Análise

### Material de Apoio

#### Documentação
* Manual do usuário
* Guias rápidos
* Tutoriais em vídeo
* FAQ

#### Recursos
* Templates
* Exemplos
* Casos de uso
* Melhores práticas

## 🆘 Suporte Técnico

### Canais de Atendimento

#### 1. Help Desk
* **Horário**
  * Segunda a Sexta: 08h às 18h
  * Sábado: 09h às 13h

* **Contatos**
  * Email: suporte@grupovillela.com
  * WhatsApp: (51) 9946-8664

#### 2. Base de Conhecimento
* **Artigos**
  * Problemas comuns
  * Soluções
  * Dicas
  * Atualizações

* **Vídeos**
  * Tutoriais
  * Demonstrações
  * Treinamentos
  * Webinars

### Níveis de Suporte

#### Nível 1 - Suporte Básico
* Dúvidas gerais
* Problemas simples
* Configurações básicas
* Tempo resposta: 30min

#### Nível 2 - Suporte Técnico
* Problemas complexos
* Configurações avançadas
* Integrações
* Tempo resposta: 2h

#### Nível 3 - Desenvolvimento
* Bugs
* Customizações
* Melhorias
* Tempo resposta: 24h

### Processo de Suporte

```mermaid
graph TD
    A[Solicitação] --> B{Tipo?}
    B -->|Dúvida| C[Nível 1]
    B -->|Problema| D[Nível 2]
    B -->|Bug| E[Nível 3]
    C --> F{Resolvido?}
    D --> F
    E --> F
    F -->|Sim| G[Fecha Ticket]
    F -->|Não| H[Escala]
    H --> B
```

### Manutenção

#### Preventiva
* Verificações diárias
* Monitoramento
* Backups
* Atualizações

#### Corretiva
* Diagnóstico
* Correção
* Teste
* Documentação

#### Evolutiva
* Planejamento
* Desenvolvimento
* Homologação
* Implantação

---

*Última atualização: Março 2025*

