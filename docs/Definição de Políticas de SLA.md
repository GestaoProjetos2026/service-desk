# 📌 Definição de Políticas de SLA (Service Level Agreement)

## Objetivo

Estabelecer tempos máximos para atendimento e resolução de tickets, garantindo previsibilidade, qualidade no suporte e transparência para clientes e equipes envolvidas.

---

## Definição de SLA

O SLA (Service Level Agreement) define os limites de tempo para:

- Primeira resposta ao cliente  
- Resolução completa do ticket  

Os prazos são determinados com base na prioridade atribuída ao ticket no momento de sua criação ou atualização.

---

## Tabela de SLA por Prioridade

| Prioridade | Tempo de Primeira Resposta | Tempo de Resolução |
|------------|--------------------------  |--------------------|
| low        | 72 horas                   | 92 horas           |
| normal     | 24 horas                   | 48 horas           |
| high       | 2 horas                    | 24 horas           |
| urgent     | 1 hora               	  | 4 horas            |

---

## Regras de Negócio

**RBN-003 — SLA de Primeira Resposta**  
Todo ticket deve receber uma primeira interação dentro do tempo definido para sua prioridade.  
A contagem inicia a partir do momento de criação (`created_at`).

**RBN-004 — SLA de Resolução**  
Todo ticket deve ser resolvido dentro do tempo máximo definido para sua prioridade.  
A verificação ocorre no momento em que o status é alterado para "done".

**RBN-005 — Pausa de SLA**  
Quando o ticket estiver com status "aguardando_cliente", a contagem de tempo do SLA deve ser pausada até que haja nova interação.

**RBN-006 — Violação de SLA**  
Caso o tempo de resposta ou resolução ultrapasse os limites definidos, o ticket será considerado fora do SLA.

---

## Funcionamento do SLA

- O SLA inicia no momento da criação do ticket  
- Continua durante o atendimento  
- Pode ser pausado dependendo do status  
- Finaliza quando o ticket é resolvido ou cancelado  

---

## Monitoramento

Os seguintes indicadores devem ser acompanhados:

- Percentual de tickets dentro do SLA  
- Percentual de tickets fora do SLA  
- Tempo médio de primeira resposta  
- Tempo médio de resolução  

---

## Critérios de Aceitação

- SLA definido para todas as prioridades de ticket  
- Regras de contagem de tempo claramente estabelecidas  
- Possibilidade de identificar quando um ticket está fora do SLA  
- Informações suficientes para futura implementação no sistema  