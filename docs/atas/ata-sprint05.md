ATA DE REUNIÃO – PROJETO SERVICE DESK

**Data:** 08/05/2026\
**Horário:** 21:30\
**Participantes:** Sergio, Schina, Pedro, Gabriele\
**Responsável pela ata:** Pedro

## 1. Atualizações da Sprint

Durante a reunião, a equipe apresentou as atividades realizadas na sprint atual, incluindo:

* Configuração do ambiente de homologação (staging);

* Correção de bugs relacionados ao Alembic e gerenciamento do banco de dados;

* Implementação do endpoint de mensagens de ticket;

* Criação do script de deploy utilizando GitHub Actions.

Foi relatado que o script de deploy foi desenvolvido, porém ainda existem alguns erros de nomenclatura e configuração que impediram a conclusão completa do processo. A equipe destacou que o deploy exige validações rígidas e pequenos erros de sintaxe impedem a execução correta.

Também foi comentado que a máquina virtual utilizada para testes apresentou diferenças de nomenclatura e ambiente, o que gerou incompatibilidades durante o processo de deploy.

## 2. Correção de Bugs

A equipe demonstrou um bug relacionado às migrations do Alembic. Após análise, foi identificado que o problema ocorria porque o script tentava recriar tabelas já existentes no banco de dados, gerando conflito de dependências.

A correção foi realizada com sucesso após ajuste na lógica das tabelas existentes.

## 3. Testes e Continuidade

Foi informado que:

* A maior parte da estrutura do backend já está concluída;

* Ainda faltam os testes em ambiente de produção;

* Os testes pendentes serão movidos para a próxima sprint;

* A expectativa é que, após a conclusão do deploy, a equipe consiga iniciar os testes completos do sistema.

## 4. Front-end e Funcionalidades

A equipe comentou sobre o estado atual do front-end:

* O sistema do agente de suporte já permite:

  * Gerenciamento de tickets;

  * Conversa com usuários;

  * Vinculação de tickets ao chat.

Ainda está em definição a experiência do cliente final para contato com o suporte. Entre as ideias discutidas estão:

* Inserção de um botão de chat no site do cliente;

* Disponibilização de um código HTML para integração direta do chat nos sites dos clientes;

* Integração automática com o sistema Service Desk.

## 5. Interface e Design

Foi comentado que:

* O projeto possui identidade visual e logo definidos;

* O layout está sendo mantido simples para evitar excesso de elementos visuais;

* Houve comparação com interfaces recentes utilizadas por produtos do Google;

* A equipe está utilizando ferramentas de visualização e organização para auxiliar no desenvolvimento.

## 6. Organização das Próximas Tasks

Foi discutida a necessidade de:

* Modularizar melhor as tarefas;

* Dividir responsabilidades entre os integrantes;

* Ajustar o fluxo de deploy entre ambiente de desenvolvimento e produção;

* Definir corretamente as triggers do GitHub Actions.

Também foi debatida a possibilidade de utilizar ambientes separados para desenvolvimento e produção.

## 7. Encerramento

A reunião foi encerrada com alinhamento positivo sobre o andamento do projeto. Foi reforçada a importância da continuidade das entregas e da evolução constante do sistema.
