# Documento de Requisitos do Produto (PRD)

Versão: 0.1

Data: 26/03/2026

Proprietários do Produto: Squad 4 - Yuri Santos 183775, Gabriele Silva - 220060, Pedro Nunes - 219672, Sergio Escudeiro - 156753, Arthur Silles 216395.

-----------------
Resumo Executivo
- Objetivo do projeto: entregar um microserviço de Service Desk focado na comunicação cliente ↔ SaaS.
- Problema / oportunidade: falta de um backend de tickets leve e documentado para devs consumidores de API.
- Visão de sucesso: API de tickets aceita e utilizada por times de desenvolvimento, com documentação clara em `/docs` (Swagger) e coleção Postman disponível.
---
Desafios possíveis
Situação atual

* Chamados podem se perder ou ficar sem resposta
* Falta de histórico confiável
* Falta de clareza sobre responsabilidade
* Cliente sem visibilidade do status
---
Solução proposta

Organizar todas as interações em um sistema centralizado, trazendo transparência e controle.

---------------
1. Visão Geral
- Contexto do negócio: empresa precisa de canal estruturado para atendimento operacional e correção de incidentes no produto SaaS.
- Público-alvo e stakeholders principais: devs integradores, times de suporte técnico, PO do produto.

--------------------------------
2. Metas e Critérios de Sucesso
- Meta 1 (SMART): disponibilizar MVP da API em 4 semanas com endpoints de criação, leitura, atualização e envio de mensagens.
- Meta 2: documentação completa em FastAPI/Swagger e Postman até a mesma entrega.
- KPIs: tempo de criação de ticket (menos de 10s), taxa de sucesso das requisições (>= 97%)

---------
3. Escopo
- Incluído no MVP / Fase 1:
	- Endpoints CRUD de tickets (criar, consultar, atualizar status, fechar).
	- Endpoints de mensagem associada ao ticket (thread de conversa).
	- Banco de dados com tabelas `tickets` e `ticket_messages`, relação 1:N entre ticket e mensagens.
	- Documentação FastAPI/Swagger em `/docs` e coleção Postman.
- Excluído desta fase:
	- UI de atendimento (apenas API).
	- Regras de SLA complexas e métricas de tempo de resposta automatizado.
	- Integração com canais externos (email/chat) nesta etapa inicial.
- Premissas:
	- Infraestrutura de banco de dados já disponível.
	- Autenticação e autorização tratadas por gateway/separa camada (não entra no escopo técnico detalhado aqui).

------------
4. Personas
- Dev de integração: cria/consulta tickets via API e espera resposta rápida e contratos estáveis.
- Atendente de suporte: consulta tickets e envia mensagens, com histórico completo.


-------------------------------
5. Jornadas / Fluxos de Usuário
- Fluxo principal:
	1. Usuário (dev ou cliente do SaaS) acessa o portal/API e abre solicitação (ticket).
	2. O atendente do Service Desk recebe notificação de novo ticket e visualiza detalhes em lista de tickets abertos.
	3. Atendente atribui prioridade e, se aplicável, categoria (crítico, alto, normal) ao ticket.
	4. Atendente inicia conversa de atendimento no chat interno e envia a primeira resposta.
	5. Usuário acompanha conversa pelo histórico de mensagens e responde sempre que necessário.
	6. Atendente verifica continuamente novos tickets e atualiza status (em progresso, aguardando cliente, resolvido).
	7. Quando a solução é confirmada, atendente fecha ticket com status "fechado" e registra observações finais.

- Fluxos alternativos / exceções:
	- Se ticket não existe ao consultar ou atualizar, retorna erro de não encontrado.
	- Se status inválido for enviado, é retornado erro de validação.
	- Se o ticket fica muito tempo sem resposta, pode ser reaberto ou escalado (workflow extra fora do MVP).

-------------------------
6. Requisitos Funcionais
- RF-001 — CRUD de ticket
	- Descrição: permitir criar, listar, obter e atualizar tickets.
	- Critérios de aceitação: dado uma requisição válida, quando chamar POST/GET/PATCH, então retornará código 200/201 e recurso esperado.
- RF-002 — Mensagens em ticket
	- Descrição: criar e listar mensagens associadas a um ticket.
	- Critérios de aceitação: dado um ticket existente, quando enviar mensagem, então ela será persistida em `ticket_messages` e vinculada a `ticket_id`.
- RF-003 — Status do ticket
	- Descrição: atualizar status (aberto, em progresso, resolvido, fechado).
	- Critérios de aceitação: status válido aceita, valor inválido rejeitado com 400.
- RF-004 — Documentação de API
	- Descrição: fornecer Swagger `/docs` e coleção Postman exportável.
	- Critérios de aceitação: todos endpoints descritos e testados manualmente.

----------------------------
7. Requisitos Não Funcionais
- Performance: resposta de 1s para operações básicas em cenário típico.
- Segurança: obrigatoriedade de token no header (aplicação de gateway).
- Disponibilidade: target de 99.5% no ambiente de produção.
- Escalabilidade: serviço stateless, com suporte a múltiplas instâncias.
- Usabilidade: API clara, validações consistentes e mensagens de erro legíveis.

---------------------
8. Regras de Negócio
- RBN-001: Ticket pode ser criado sem mensagens iniciais; mensagens são opcionais e feitas posteriormente pelo usuário/atendente.
- RBN-002: Mensagens de ticket são obrigatoriamente 1:N (um ticket pode ter múltiplas mensagens, cada mensagem pertence a um único ticket).

9. Fluxo de Estados

```
PENDING → IN_PROCESS → DONE
                    ↘
                      CANCELED
```
- **PENDING:** Ticket aberto, aguardando atribuição
- **IN_PROCESS:** Analista está trabalhando
- **DONE:** Ticket resolvido e fechado (closed_at preenchido automaticamente)
- **CANCELED:** Ticket cancelado sem resolução

----------------------------------
10. Critérios de Aceitação & Testes
- Critérios mínimos do done:
	- API funcionando com endpoints e DB básico.
	- Documentação em `/docs` e Postman disponível.

-----------------
11. Arquitetura e Implementação
11.1 Tecnologias Utilizadas

* **Backend:** Python
* **Frontent:** HTML e CSS
* **Banco de Dados:** MySQL
* **ORM/Conexão:** SQLAlchemy
* **Servidor:** FastAPI (Leve, rápido e compatível com FastAPI)

-----------------
11.2 Implementação Inicial

Foi implementado um servidor FastAPI com:
* Configuração via ambiente.
* Conexão com banco de dados.
* Endpoint `/health` para verificação de status da aplicação e banco.

-----------------
11.3 Fluxo de Funcionamento
1. **Cliente:** Envia requisição via API.
2. **Controller:** Recebe a rota e valida os dados.
3. **Service:** Aplica as regras de negócio.
4. **Repository:** Persiste as informações no banco de dados.
5. **Resposta:** Retorno do status ao cliente.

-----------------
11.4 Relação com Requisitos
* **RF01:** `POST /tickets` (Abertura)
* **RF02:** `PATCH /tickets/{id}` (Atualização)
* **RF03:** `POST /tickets/{id}/close` (Fechamento)
* **RF04:** Histórico completo na tabela `ticket_messages`

-----------------
11.5 Modelo de Dados (Schema)

11.5.1 Tabela: `tickets`
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| **id** | CHAR(36) | PK - Identificador único (UUID) |
| **title** | VARCHAR(255) | Título do chamado |
| **description** | TEXT | Descrição detalhada do problema |
| **status** | ENUM | pending, in_process, done, canceled |
| **priority** | ENUM | low, normal, high, urgent |
| **user_id** | CHAR(36) | Usuário que criou o ticket |
| **client_id** | CHAR(36) | Cliente associado ao ticket |
| **assigned_to** | CHAR(36) | Responsável pelo atendimento |
| **updated_by** | CHAR(36) | Quem realizou a última atualização |
| **category** | VARCHAR(100) | Categoria do chamado |
| **closed_at** | TIMESTAMP | Data de encerramento (NULL se aberto) |
| **created_at** | TIMESTAMP | Data de criação (Default: CURRENT_TIMESTAMP) |
| **updated_at** | TIMESTAMP | Última atualização (Auto-update) |
---
11.5.2 Tabela: `ticket_messages`
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| **id** | CHAR(36) | PK - Identificador único (UUID) |
| **ticket_id** | CHAR(36) | FK - Relacionado a `tickets(id)` (NOT NULL) |
| **author_id** | CHAR(36) | Identificador do autor da mensagem |
| **message** | TEXT | Conteúdo da interação |
| **is_internal** | BOOLEAN | Indica se a mensagem é interna (privada) |
| **created_at** | TIMESTAMP | Data de criação (Default: CURRENT_TIMESTAMP) |
| **updated_at** | TIMESTAMP | Última atualização (Auto-update) |

> **Relacionamento:** `ticket_id` referencia `tickets(id)` com regra **ON DELETE CASCADE**.

-----------------
11.6 Estruturação de Telas Principais

11.6.1 Tela Inicial

![Tela inicial do aplicativo proposto](./docs/images/dashboard_section.png)

11.6.2 Tela de Tickets

![Tela dos tickets do aplicativo proposto](./docs/images/tickets_section.png)

11.6.3 Tela de Mensagens

![Tela de mensagens do aplicativo proposto](./docs/images/messages_section.png)

11.6.4 Tela de Configurações

![Tela de configurações do aplicativo proposto](./docs/images/settings_section.png)

-----------------
12. Dependências
- Sistemas externos: banco de dados relacional (MySQL). 
- Equipes: infra, Equipe Core Engine.
- Recursos: acesso a ambiente de staging e dados de teste.

------------------------
13. Riscos e Mitigações
- Risco 1: atraso na infraestrutura de banco — mitigação: usar ambiente de dev local e mock inicial.
- Risco 2: gaps na documentação — mitigação: revisão com devs consumidores e ajustes rápidos em Swagger/Postman.

-----------------------
14. Cronograma e Marcos
- Marco 1: definição de requisitos e arquitetura — semana 2.
- Marco 2: implementação do MVP e testes — semanas 4-6.
- Marco 3: entrega e validação — fim da sprint 7.

---------------------------------
15. Plano de Lançamento e Operação
- Lançamento: deploy em staging, validação, então produção.
- Métricas pós-lançamento: sucesso de requisição, histórico de alterações, número de tickets criados.

------------
16. Glossário
- Ticket: solicitação registrada de atendimento.
- Ticket message: entrada de conversa vinculada a um ticket.

--------
Apêndice
- Documentos relacionados: README do projeto, arquitetura.
- Anexos: modelo de entidade `tickets` e `ticket_messages`, roteiro de uso de Postman.




**Status:** Em Desenvolvimento

