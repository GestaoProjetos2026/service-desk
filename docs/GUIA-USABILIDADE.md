# 📘 Guia de Usabilidade – Service Desk

**Versão:** 1.0  
**Data:** Maio de 2026  
**Objetivo:** Manual completo para usuários finais do sistema Service Desk

---

## 📋 Índice

1. [Introdução](#introdução)
2. [Conceitos Fundamentais](#conceitos-fundamentais)
3. [Guia Rápido para Clientes](#guia-rápido-para-clientes)
4. [Guia para Agentes de Suporte](#guia-para-agentes-de-suporte)
5. [Entendendo Prioridades e SLA](#entendendo-prioridades-e-sla)
6. [Boas Práticas](#boas-práticas)
7. [Troubleshooting e FAQ](#troubleshooting-e-faq)
8. [Dicas de Acessibilidade](#dicas-de-acessibilidade)

---

## Introdução

### O que é o Service Desk?

O **Service Desk** é um sistema centralizado de suporte ao cliente que permite:

- 🎫 **Abrir solicitações** (tickets) quando você precisa de ajuda
- 💬 **Comunicar-se** diretamente com a equipe de suporte
- 📊 **Acompanhar o progresso** em tempo real
- 🔍 **Encontrar soluções** na base de conhecimento
- ⏱️ **Entender o tempo** de atendimento (SLA)

### Quem pode usar?

- **Clientes/Usuários finais:** abrem tickets e recebem suporte
- **Agentes de suporte:** atendem, resolvem e acompanham tickets

### Acesso ao sistema

O sistema está disponível via:
- **Interface web:** https://servicedesk.exemplo.com (ou endpoint do seu ambiente)
- **API REST:** para integrações programáticas

---

## Conceitos Fundamentais

### O que é um Ticket?

Um **ticket** é um registro formal de uma solicitação ou problema que você reporta à equipe de suporte. Cada ticket contém:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **ID do Ticket** | Identificador único | SD-101 |
| **Título** | Resumo do problema | "Não consigo fazer login no app" |
| **Descrição** | Detalhes e contexto | "Recebo mensagem de credencial inválida..." |
| **Categoria** | Tipo de problema | mobile, billing, account, reports, etc. |
| **Prioridade** | Urgência da solicitação | Baixa, Normal, Alta, Urgente |
| **Status** | Fase atual | Aberto, Em andamento, Resolvido, Cancelado |
| **Criado em** | Data/hora de abertura | 2026-05-07 14:30 UTC |
| **Atribuído a** | Agente responsável | Alex Morgan |

### Ciclo de Vida de um Ticket

```
┌─────────────────────────────────────────────────┐
│  1. ABERTO (Pending)                            │
│  └─ Ticket foi criado e aguarda análise         │
│                                                 │
│  2. EM ANDAMENTO (In Process)                   │
│  └─ Agente começou a trabalhar no problema      │
│                                                 │
│  3. RESOLVIDO (Done)                            │
│  └─ Problema foi solucionado                    │
│                                                 │
│  4. CANCELADO (Canceled)                        │
│  └─ Ticket cancelado ou não aplicável           │
└─────────────────────────────────────────────────┘
```

### Prioridades

Cada ticket recebe uma **prioridade** que determina a urgência de atendimento:

| Prioridade | Símbolo | Uso Recomendado | Tempo de Resposta | Tempo de Resolução |
|------------|---------|-----------------|-------------------|-------------------|
| **Baixa** | ↓ | Solicitações simples, sem impacto imediato | 72 horas | 92 horas |
| **Normal** | = | Problemas rotineiros, alguns usuários afetados | 24 horas | 48 horas |
| **Alta** | ↑ | Problemas graves, múltiplos usuários afetados | 2 horas | 24 horas |
| **Urgente** | ⊕ | Crises, falhas críticas, sistema indisponível | 1 hora | 4 horas |

### Base de Conhecimento

A **base de conhecimento** é uma biblioteca de artigos e soluções documentadas. Antes de abrir um ticket, verifique se sua dúvida já foi respondida ali!

---

## Guia Rápido para Clientes

### 1️⃣ Abrindo um Novo Ticket

#### Passo a Passo:

1. **Acesse o dashboard** do Service Desk
2. Clique no botão **"Novo Ticket"** ou **"+"** 
3. Preencha os campos obrigatórios:
   
   | Campo | Como preencher |
   |-------|-----------------|
   | **Título** | Resumo claro em poucas palavras |
   | **Descrição** | Detalhe seu problema: o que você tentou, quando começou, erro exato |
   | **Categoria** | Escolha a mais apropriada (account, mobile, billing, etc.) |
   | **Prioridade** | Selecione honestamente (veja tabela acima) |

4. Clique em **"Enviar"** ou **"Criar Ticket"**
5. Você receberá um **ID de ticket** (ex: SD-101)

#### Exemplo: Abrindo um Ticket

**❌ Descrição Ruim:**
```
Não funciona. Preciso arrumar urgente.
```

**✅ Descrição Boa:**
```
Ao tentar fazer login no app mobile (iPhone 14) após a última atualização, 
recebo a mensagem "Credencial Inválida". 

O que tentei:
1. Redefinir senha – mesmo erro
2. Reinstalar app – problema persiste
3. Acesso web funciona normalmente

Ambiente: iOS 17.4.1, App versão 3.2.1
Erro começou em: 07/05/2026 14:30h
```

**Por que é melhor:** Agentes conseguem entender o problema de primeira e resolvem 3x mais rápido!

### 2️⃣ Acompanhando Seu Ticket

#### No Dashboard:

- **Veja a lista** de todos seus tickets
- **Clique no ticket** para abrir detalhes completos
- **Verifique o status** atual (cor visual facilita identificação)
- **Leia o histórico** de mensagens

#### Informações Disponíveis:

```
┌─ Ticket SD-101 ───────────────────────┐
│                                       │
│ 🎫 Cannot log in from mobile app      │
│ Status: Em andamento ⏳                │
│ Prioridade: Alta ↑                    │
│ Categoria: mobile                     │
│                                       │
│ Aberto em: 07/05/2026 14:30          │
│ Última atualização: 07/05/2026 15:50 │
│ Atribuído a: Alex Morgan              │
│                                       │
│ 📝 Histórico de Mensagens:            │
│ ├─ 14:30 - Seu relato inicial        │
│ ├─ 15:20 - Alex Morgan respondeu    │
│ └─ 15:50 - Você respondeu            │
│                                       │
└───────────────────────────────────────┘
```

### 3️⃣ Respondendo Mensagens

#### Como Responder:

1. Abra o ticket
2. Role até o final da conversa
3. No campo de mensagem, **digite sua resposta**
4. Revise antes de enviar
5. Clique em **"Enviar Mensagem"**

#### Dicas:

- ✅ **Seja claro e conciso** – agentes têm vários tickets
- ✅ **Inclua screenshots** se aplicável
- ✅ **Confirme qualquer ação** ("Testei conforme instruído...")
- ❌ **Evite spam** – uma mensagem por informação
- ❌ **Não compartilhe dados sensíveis** – senhas, tokens, informações pessoais

#### Exemplo de Resposta Boa:

```
Obrigado pela orientação! Testei conforme instruído:

1. Atualizei o app para versão 3.3.0 ✓
2. Limpei o cache do aplicativo ✓
3. Fiz novo login – agora funciona! ✓

Problema resolvido. Agradeço pelo suporte rápido!
```

### 4️⃣ Consultando a Base de Conhecimento

Antes de abrir um novo ticket, tente encontrar a resposta na **Base de Conhecimento**:

1. Clique em **"Base de Conhecimento"** ou **"Help"**
2. **Busque** por palavras-chave ("login", "senha", "export")
3. **Leia o artigo** e siga os passos
4. Se ainda tiver dúvida, **abra um ticket**

**Vantagem:** Muitos problemas têm solução imediata na base de conhecimento!

---

## Guia para Agentes de Suporte

> ⚠️ Esta seção é para membros da equipe de suporte

### 1️⃣ Dashboard de Agente

Ao fazer login como agente, você terá acesso a:

- **Lista de tickets não atribuídos** – tickets abertos aguardando atendimento
- **Meus tickets** – tickets já atribuídos a você
- **Todos os tickets** – filtro para gerenciamento geral
- **Base de conhecimento** – para consultar soluções documentadas
- **Analytics** – métricas de desempenho

### 2️⃣ Recebendo um Ticket

#### Workflow Padrão:

1. **Revise o ticket** completamente
   - Leia título e descrição
   - Consulte histórico se houver
   - Verifique categoria e prioridade

2. **Atribua a você** se ainda não está atribuído
   - Clique em "Atribuir a mim" ou selecione seu nome

3. **Mude o status para "Em andamento"**
   - Indica que você começou a trabalhar

4. **Analise e comunique-se**
   - Se precisa de mais informações, pergunte
   - Se consegue reproduzir, documente
   - Se tem solução, compartilhe

### 3️⃣ Respondendo Tickets

#### Tipos de Mensagens:

- **Mensagens públicas:** o cliente vê (comunicação externa)
- **Mensagens internas:** apenas equipe vê (notas internas)

#### Como Responder:

1. Abra o ticket
2. Na seção de mensagens, clique em **"Nova Mensagem"**
3. Escolha se é **pública ou interna**
4. Escreva sua resposta

#### Boas Práticas:

- ✅ **Primeira resposta rápida** – cumprimento + reconhecimento
- ✅ **Respeite o SLA** – veja a próxima seção
- ✅ **Use mensagens internas** para notas técnicas entre agentes
- ✅ **Documente a solução** – caso se torne artigo da KB
- ❌ **Não prometa prazos** que não podem cumprir

#### Exemplo de Resposta:

**Mensagem Pública:**
```
Olá Diego,

Obrigado por reportar o problema. Reproduzi o erro no meu end e 
estou investigando. Devo ter uma atualização para você em 1 hora.

Qualquer dúvida, avise!

– Alex Morgan
Equipe de Suporte
```

### 4️⃣ Resolvendo e Fechando Tickets

#### Quando Resolver:

1. **Solução testada e validada** – o cliente confirmou que funciona
2. **Alternativa documentada** – cliente tem workaround
3. **Sem mais ações** – ticket não pode ser resolvido (cancelar em vez de resolver)

#### Como Resolver:

1. Abra o ticket
2. Clique em **"Status"** → **"Resolvido"** 
3. Opcionalmente, adicione uma **mensagem final**
4. Clique **"Salvar"**

#### Exemplo de Resolução:

```
Problema resolvido! A causa era cache corrompido.

Solução aplicada:
1. Limpeza de cache no servidor – ✓
2. Reinicialização do serviço – ✓
3. Validação no cliente – ✓

Ticket fechado. Por favor, nos avise se o problema retornar!
```

### 5️⃣ Cancelando Tickets

**Cancele um ticket quando:**

- Cliente solicita cancelamento
- Ticket foi criado por engano
- Problema não é reproduzível após múltiplas tentativas
- Fora do escopo do suporte

**Como cancelar:**
1. Clique em **"Status"** → **"Cancelado"**
2. Adicione motivo (publicamente ou em nota interna)
3. Salve

### 6️⃣ Criando Artigos da Base de Conhecimento

Quando você resolver um **problema recorrente**, documente para futuro:

1. Abra o ticket resolvido
2. Clique em **"Criar artigo da KB"**
3. Preencha:
   - **Título:** perguntas comuns (ex: "Como redefinir minha senha?")
   - **Conteúdo:** passo a passo claro
   - **Categoria:** mesma do ticket
4. **Publique** (agora clientes podem encontrar a solução sozinhos!)

#### Benefícios:

- ⬇️ Reduz volume de tickets similares em 30-50%
- ⬆️ Satisfação do cliente (solução imediata)
- ⏱️ Economiza tempo da equipe

---

## Entendendo Prioridades e SLA

### O que é SLA?

**SLA** (Service Level Agreement) é um compromisso de tempo entre você e o cliente. Define:

- **Tempo de Primeira Resposta:** quanto tempo leva para um agente responder
- **Tempo de Resolução:** quanto tempo leva para resolver completamente

### Tabela SLA Vigente

| Prioridade | Resposta | Resolução | Quando usar |
|------------|----------|-----------|-------------|
| **Baixa** ↓ | 72h | 92h | Melhorias, features futuras, dúvidas |
| **Normal** = | 24h | 48h | Bugs simples, problemas rotineiros |
| **Alta** ↑ | 2h | 24h | Múltiplos usuários afetados, sem workaround |
| **Urgente** ⊕ | 1h | 4h | Sistema indisponível, dados perdidos |

### Exemplos Práticos

#### Ticket 1: Problematicamente Baixa

```
Título: Sugestão de cor diferente no dashboard
Prioridade: Baixa ✓
Motivo: Feature request, sem impacto no funcionamento
SLA: 72h para resposta – pode esperar
```

#### Ticket 2: Apropriadamente Alta

```
Título: API retorna erro 500 em 30% das requisições
Prioridade: Alta ✓
Motivo: Múltiplos clientes afetados, negócio impactado
SLA: 2h para resposta – atenda rapidamente!
```

#### Ticket 3: Criminosamente Urgente

```
Título: Banco de dados offline – ninguém consegue acessar
Prioridade: Urgente ✓
Motivo: Falha crítica, todos os usuários afetados
SLA: 1h para resposta – ALERTA VERMELHO!
```

### Monitorando SLA

No painel de agente, você verá:

- 🟢 **Verde:** dentro do SLA
- 🟡 **Amarelo:** aproximando do limite
- 🔴 **Vermelho:** SLA violado

**Ação:** se vir amarelo/vermelho, priorize aquele ticket!

### Regras Especiais

#### Pausa de SLA

O SLA é **pausado** quando:
- Status é "Aguardando Cliente" (esperando resposta/ação)
- Retoma quando cliente responde

**Por quê?** Não é justo contar o tempo enquanto cliente está pensando.

#### Violação de SLA

Se um ticket ultrapassa o tempo, ele fica marcado como **fora do SLA**. 

Não é punição – é **métrica de melhoria** para equipe:
- Indica pontos de gargalo
- Ajuda no planejamento de recursos
- Mostra tendências

---

## Boas Práticas

### Para Clientes ✅

1. **Seja específico ao abrir tickets**
   - Título claro (5-10 palavras)
   - Descrição detalhada (contexto, erro exato, tentativas)
   - Inclua ambiente (navegador, versão do app, etc.)

2. **Escolha prioridade honestamente**
   - Não marque tudo como "Urgente"
   - Considere impacto real no seu negócio
   - Urgente é para crises, não para tudo

3. **Responda rapidamente**
   - Se agente fez pergunta, responda em 24h
   - Atrasar resposta atrasa resolução
   - Seja proativo: tente soluções sugeridas e confirme

4. **Consulte a Base de Conhecimento**
   - 70% das perguntas já têm resposta documentada
   - Economiza seu tempo e do suporte
   - Busque por palavras-chave relacionadas

5. **Documente bem para que agentes entendam na primeira leitura**
   - Evita ida e volta de perguntas
   - Reduz tempo de resolução em até 50%

### Para Agentes ✅

1. **Responda rápido, mesmo que seja "estou investigando"**
   - Primeira resposta em <1h para urgentes
   - Demonstra que você viu o ticket

2. **Personalize as respostas**
   - Use o nome do cliente
   - Reconheça a frustração
   - Seja profissional mas amigável

3. **Documente tudo**
   - Escreva passos de debug
   - Registre a causa raiz
   - Crie artigos para problemas recorrentes

4. **Evite termos técnicos**
   - Clientes não são desenvolvedores
   - Traduzir jargão: "cache" → "memória temporária"
   - Se necessário, explique entre parênteses

5. **Siga o escalation path**
   - Problema fora de escopo? Redirecione
   - Precisa de especialista? Atribua ao time correto
   - Não finja saber se não sabe

### Geral (Ambos) ✅

- 🕐 **Seja consistente nos horários** – clientes aprendem quando você responde
- 💭 **Releia antes de enviar** – evita mal-entendidos
- 📎 **Use exemplos e screenshots** – valem mil palavras
- 🤝 **Seja empático** – problemas são frustrantes para todos
- 🎯 **Foque em solução** – não em culpa

---

## Troubleshooting e FAQ

### ❓ Perguntas Frequentes de Clientes

**P: Quanto tempo vai levar para meu ticket ser atendido?**

R: Depende da prioridade:
- Baixa: até 72 horas
- Normal: até 24 horas
- Alta: até 2 horas
- Urgente: até 1 hora

Você verá um indicador no seu ticket.

---

**P: Como eu sei que alguém está olhando para meu ticket?**

R: 
1. Status mudou de "Aberto" para "Em andamento"
2. Você recebeu uma mensagem do agente
3. Ticket foi atribuído (vê o nome do agente)

---

**P: E se meu problema não for resolvido?**

R:
- Informe no ticket (não abra novo)
- Descreva por que não resolveu
- Agente vai tentar abordagem diferente

Abrindo novo ticket do mesmo problema = mais lentidão para você!

---

**P: Posso conversar com o suporte por WhatsApp/Telegram/etc?**

R: Atualmente, suportamos apenas este portal. Razão: histórico completo fica registrado para qualidade e conformidade.

---

**P: Meu ticket foi fechado, mas o problema volta. E agora?**

R:
1. Reabra aquele ticket (comentário novo)
2. OU abra novo ticket com título "Retorno: [nome do original]"
3. Explique o que mudou desde último atendimento

---

**P: Como criar um ticket para pergunta genérica (não bug)?**

R: Perfeitamente normal! Use categoria apropriada:
- "account" para contas/login
- "billing" para faturamento
- "reports" para relatórios/exportação
- "mobile" para app mobile
- etc.

---

### ❓ Perguntas Frequentes de Agentes

**P: Um cliente abriu 3 tickets do mesmo problema. O que fazer?**

R:
1. Envie mensagem pública: "Vi que abriu 3 tickets do mesmo problema"
2. Sugira consolidar em 1 ticket
3. Feche os duplicados com motivo "Duplicado de SD-XXX"
4. Trabalhe no ticket consolidado

---

**P: Ticket prioritário está há 3 dias aberto, SLA próximo de vencer. Faço o quê?**

R:
1. Avise seu lead imediatamente
2. Se é especialista, assuma o ticket
3. Se não é sua área, redirecione
4. Nunca deixe um ticket urgente sem resposta passar do SLA

---

**P: Cliente não responde há 1 semana. Fecho o ticket?**

R:
1. Envie mensagem: "Não recebemos resposta. Vamos fechar este ticket em 48h se não houver retorno"
2. Aguarde 48h
3. Se sem resposta, feche com motivo "Sem resposta do cliente"
4. Cliente pode reabrir se precisar

---

**P: Deve criar artigo na KB para TUDO que resolve?**

R: Não. Crie artigos para:
- ✅ Problemas **recorrentes** (aparecem 3+ vezes)
- ✅ **Perguntas comuns** que clientes fazem
- ✅ Procedimentos **duradouros** (não muda em dias)
- ❌ Bugs **únicos** (improváveis de repetir)
- ❌ Workarounds **temporários** (será corrigido em breve)

---

### 🔧 Troubleshooting Técnico

**Problema: Não consigo fazer login no portal**

Solução:
1. Verifique credenciais (case-sensitive)
2. Tente modo incógnito/privado
3. Limpe cookies do navegador
4. Aceite cookies de terceiros
5. Tente browser diferente
6. Se ainda não funciona, abra ticket informando erro exato

---

**Problema: Mensagem que enviei não aparece**

Solução:
1. Aguarde alguns segundos (pode estar processando)
2. Atualize a página (F5)
3. Verifique conexão de internet
4. Tente novamente

Se persistir, abra ticket de suporte descrevendo o erro.

---

**Problema: Ticket desapareceu / não vejo mais na lista**

Causas comuns:
1. Você está com filtro ativo que o esconde (ex: filtro por categoria)
2. Status foi alterado e você está filtrando outro status
3. Ticket muito antigo (scroll para baixo / aumente limit)
4. Você foi removido como participante

Solução: Remova todos os filtros e busque por ID do ticket.

---

**Problema: App mobile não sincroniza mensagens**

Solução:
1. Saia e faça login novamente
2. Feche app completamente e reabra
3. Verifique conexão (WiFi ou dados)
4. Se problema persiste, atualize o app

---

**Problema: Não recebi notificação de novo ticket / mensagem**

Verificações:
1. Notificações estão ativadas na conta?
2. Notificações do navegador foram permitidas?
3. Verificou email spam/junk?
4. Se agente: você está "online" no sistema?

---

## Dicas de Acessibilidade

O sistema foi projetado pensando em acessibilidade:

### Navegação por Teclado

| Tecla | Ação |
|-------|------|
| `Tab` | Move para próximo elemento |
| `Shift+Tab` | Move para elemento anterior |
| `Enter` | Clica botão ou link focado |
| `Esc` | Fecha modais/dropdowns |
| `Ctrl+K` ou `/` | Abre busca rápida |

### Leitores de Tela

- Todo o sistema é compatível com NVDA, JAWS, VoiceOver
- Cores nunca são único indicador (também usamos ícones/texto)
- Todos os formulários têm labels associados

### Tema Claro/Escuro

- Toggle no canto superior direito
- Salva sua preferência automaticamente
- Contraste em ambas versões atende WCAG AA

### Mobile/Responsivo

- Interface adapta para celular
- Touch targets têm mínimo 44px² (fácil de clicar)
- Texto redimensionável até 200%

---

## Recursos Adicionais

- 📚 **Documentação Técnica:** veja `/docs/api-reference.md`
- 🔌 **Integração via API:** veja `/docs/backend.md`
- 📊 **Políticas de SLA:** veja `/docs/Definição de Políticas de SLA.md`
- 💻 **Status do Sistema:** ping em `/health`

---

## Contato e Feedback

Tem sugestão de melhoria neste manual? 

**Abra um ticket:** categoria "docs" ou "feedback"

---

**Versão:** 1.0 | **Última atualização:** Maio de 2026 | **Mantido por:** Squad 4 – Service Desk & Customer Success
