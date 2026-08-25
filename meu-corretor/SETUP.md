# O Meu Corretor — Guia de Configuração

## Pré-requisitos

- Node.js 18+
- Conta [Supabase](https://supabase.com) (gratuita)
- Chave API [Anthropic](https://console.anthropic.com) (Claude)
- Conta [Resend](https://resend.com) (gratuita — 3000 emails/mês)
- *(Opcional)* Projeto Google Cloud para integração com Google Drive

---

## 1. Supabase

1. Cria um projeto em supabase.com
2. Em **SQL Editor**, executa o ficheiro `src/lib/supabase/schema.sql`
3. Copia as credenciais: **Project URL** e **anon key** (em Settings → API)

---

## 2. Variáveis de ambiente

Copia `.env.local.example` para `.env.local` e preenche:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@teudominio.pt
NEXT_PUBLIC_APP_URL=https://teudominio.pt
```

---

## 3. Instalar e correr

```bash
npm install
npm run dev
```

Acede a [http://localhost:3000](http://localhost:3000)

---

## 4. Google Drive (opcional)

Para guardar os textos dos alunos na tua Google Drive:

1. Vai a [console.cloud.google.com](https://console.cloud.google.com)
2. Cria um projeto → ativa a **Google Drive API**
3. Cria credenciais OAuth 2.0 (Web Application)
4. Adiciona as credenciais ao `.env.local`

A integração está preparada na app — basta adicionar as chaves.

---

## 5. Deploy (Vercel — recomendado)

```bash
npm i -g vercel
vercel
```

Adiciona as variáveis de ambiente no painel da Vercel.

---

## Funcionalidades

### Professor
- ✅ Login / registo por email
- ✅ Criação de turmas com pasta Google Drive
- ✅ Criação de tarefas com proposta de texto e critérios
- ✅ Modelos de critérios (narrativo, argumentativo, descritivo, carta)
- ✅ Agendamento: dia e hora de abertura do link
- ✅ Link partilhável para alunos
- ✅ Correção automática por IA (Claude)
- ✅ Aprovação / ajuste de notas
- ✅ Envio de relatório individual a cada aluno (sem nota)
- ✅ Envio de relatório completo ao professor (com notas e fraude)

### Aluno
- ✅ Acesso por link único
- ✅ Verificação de disponibilidade (horário)
- ✅ Formulário de identificação
- ✅ Área de escrita protegida
- ✅ Anti-fraude: mudança de separador, saída da janela, colar texto, clique direito, atalhos de teclado
- ✅ Registo de todos os eventos de fraude
- ✅ Gravação automática (cada 30 segundos)
- ✅ Submissão com confirmação

### Relatórios
- ✅ Erros por categoria com explicação pedagógica em português europeu
- ✅ Sugestões de melhoria contextualizadas
- ✅ Relatório individual enviado por email ao aluno
- ✅ Relatório consolidado (todos os alunos) enviado ao professor
- ✅ Tabela de notas no painel do professor
- ✅ Relatório de fraude por aluno

### Interface
- ✅ Modo escuro / claro
- ✅ 2 línguas: Português (PT) e English
- ✅ Responsivo (móvel e desktop)
- ✅ Cores: amarelo torrado, verde, laranja, roxo; fundo bege (claro) / escuro
