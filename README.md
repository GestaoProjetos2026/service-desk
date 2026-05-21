# &#x20;Service Desk & Customer Success   – Gestão de Projetos

## 🏢 Estrutura Organizacional do Projeto

**ERP Modular Cloud-Native**

* Squad 1 — Core Engine & Auth
* Squad 2 — Fiscal, Financeiro & Estoque
* Squad 3 — Growth, Leads & CRM
* Squad 4 — Service Desk & Customer Success
* Squad 5 — DevOps & Platform Engineering

### ✅ Squad 4 

* Sistema de tickets
* Base de conhecimento
* Comunicação com usuário
* Suporte ao cliente
* Análise de churn

---

## 📌 Descrição do Microserviço

O microserviço de **Service Desk** é responsável pela comunicação e suporte aos usuários do sistema.

Este serviço será responsável por:

* Receber requisições de suporte
* Funções CRUD
* Registrar tickets
* Gerenciar status de atendimento
* Permitir comunicação entre usuário e equipe de suporte
* Integração com sistema de autenticação
* Integração com outros módulos do SAAS

---

## ⚙️ Backend

O sistema utilizará a linguagem **Python** no backend.

O serviço será executado utilizando **Docker**.

Integração com:

* API Gateway
* Banco de dados compartilhado
* API's externas (Provider)

---

## 🗄️ Banco de Dados

O banco de dados utilizado será **MySQL**.

Tabelas utilizadas pelo microserviço:

```sql
tickets
id CHAR(36)
title VARCHAR(255)
description TEXT
status_id ENUM
priority_id ENUM
user_id CHAR(36)
client_id CHAR(36)
assigned_to CHAR(36)
updated_by CHAR(36)
category VARCHAR(100)
closed_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP


ticket_messages
id CHAR(36)
ticket_id CHAR(36)
author_id CHAR(36)
message TEXT
is_internal BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## 🎨 Frontend

O frontend do sistema será desenvolvido utilizando:

* React

O frontend será responsável por:

* Abertura de tickets
* Listagem de tickets
* Responder mensagens
* Visualizar status
* Comunicação com API do Service Desk

Tela Inicial

![Tela inicial do aplicativo proposto](./docs/images/dashboard_section.png)

Tela de Tickets

![Tela dos tickets do aplicativo proposto](./docs/images/tickets_section.png)

Tela de Mensagens

![Tela de mensagens do aplicativo proposto](./docs/images/messages_section.png)

Tela de Configurações

![Tela de configurações do aplicativo proposto](./docs/images/settings_section.png)

---

## 📊 Gestão no Plane.so

O Plane será utilizado como:

Single Source of Truth

Configuração:

* Workspace único para toda a turma
* Um projeto para cada Squad
* Cycles = Sprints
* Modules = funcionalidades
* Issues = tarefas

Status utilizados:

* Backlog
* PRD em Escrita
* Ready for Dev
* In Progress
* QA / Review
* Done

---

## 📄 Fluxo de Engenharia

Deve existir um PRD contendo:

* Objetivo
* User Stories
* Requisitos funcionais
* Requisitos não funcionais
* Definition of Done
* Diagrama de sequência da API

Workflow Git:

* Uso de Pull Requests
* Code Review entre Squads
* README sempre atualizado
* Documentação obrigatória

Cross Review:

* Um Squad revisa código de outro Squad

---

## 📏 Critérios de Avaliação

* Qualidade do backlog
* Organização no Plane
* Integração com Git
* Liderança nas Sprints
* Documentação técnica
* Modularidade do sistema
* Funcionamento isolado do microserviço

---

## 👥 Integrantes 

* Arthur Silles RA: 216395
* Gabriele Silva RA: 220060
* Sérgio Escudero RA: 156753
* Pedro Nunes RA: 219672
* Yuri Santos RA: 183775
