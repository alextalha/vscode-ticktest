# Ticktest

Extensao para VSCode que permite gerenciar checklists de teste organizados por ticket/tarefa, direto na sidebar.

Ideal para QA manual: crie tarefas, agrupe testes por categoria, marque status (aprovado, falhou, pulado) e acompanhe o progresso com barras visuais.

## Como funciona

### 1. Criar uma tarefa

Clique no **+** no topo da sidebar ou use o comando `Ticktest: Nova Tarefa`. Informe o ID do ticket (ex: `RH-5321`) e um nome opcional.

Tambem e possivel detectar automaticamente o ticket a partir da branch git atual (botao **fork** na sidebar). Se a branch contiver o padrao `RH-XXXX`, a tarefa e criada automaticamente.

### 2. Adicionar testes

Dentro da tarefa, adicione grupos de teste (categorias) e testes individuais. Voce pode:

- **Adicionar manualmente**: crie grupos e digite testes um a um
- **Importar via JSON**: cole um JSON populado pela IA ou gerado manualmente

### 3. Marcar status

Clique no circulo ao lado de cada teste para alternar o status:

- **Pendente** (circulo vazio) — ainda nao testado
- **Aprovado** (verde) — teste passou
- **Falhou** (vermelho) — teste falhou
- **Pulado** (cinza) — nao se aplica ou adiado

### 4. Acompanhar progresso

Cada tarefa e grupo exibe uma barra de progresso mostrando quantos testes foram aprovados.

## Importar JSON (integracao com IA)

A principal vantagem do Ticktest e permitir que uma IA gere os casos de teste e voce importe direto na extensao.

### Template

Dentro da tarefa, clique no botao de importar (seta para baixo) para acessar a tela de importacao. La voce encontra o **template** para copiar e enviar para a IA:

```json
{
  "taskId": "RH-XXXX",
  "taskName": "",
  "groups": [
    {
      "name": "Nome da Categoria",
      "tests": [
        { "description": "Descricao do caso de teste", "notes": "" }
      ]
    }
  ]
}
```

### Fluxo recomendado

1. Copie o template da extensao
2. Envie para a IA junto com o contexto da tarefa (ex: "gere casos de teste para o componente X")
3. A IA retorna o JSON populado
4. Cole o JSON na tela de importacao e clique **Importar**
5. Todos os grupos e testes aparecem prontos para validacao

### Modos de importacao

- **Substituir**: apaga os testes existentes e importa os novos
- **Adicionar**: mantem os testes existentes e adiciona os novos grupos ao final

## Onde os dados ficam salvos

Os dados sao persistidos em um arquivo JSON dentro do diretorio da extensao (`.testlists/tasks.json`). Cada tarefa fica com seu historico completo de testes.

## Comandos

| Comando | Descricao |
|---|---|
| `Ticktest: Nova Tarefa` | Cria uma nova tarefa informando ID e nome |
| `Ticktest: Detectar Tarefa do Branch` | Cria tarefa a partir do padrao RH-XXXX da branch git atual |

## Desenvolvimento

```bash
# Instalar dependencias
npm install

# Compilar
npm run compile

# Empacotar .vsix
npm run package
```
