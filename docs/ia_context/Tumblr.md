# Integração Tumblr - TumblrRoutes

## 🎯 Objetivo / Contexto

Lida com a integração oficial à API do Tumblr (`tumblr.js`). Permite buscar os blogs vinculados ao usuário e publicar fotos/textos nos referidos blogs, incluindo tratativas contra Rate Limits.

## 🧩 Arquivos e Componentes

- **Arquivo Principal:** `src/routes/tumblrRoutes.ts`
- **Utilitários:** `parseDataUrl` (para extração e conversão de buffers base64).

## ⚙️ Regras de Negócio e Lógica (Core Logic)

- **Identificação Obrigatória:** Ao contrário de outras redes que publicam direto num "perfil", o Tumblr exige especificar em qual blog o post irá ser alocado via a variável `blogName`.
- **Limite Diário (Rate Limit):** Se o handler receber um erro de _Status 403_ da API do Tumblr (indicando limite de postagem atingido), a API automaticamente transaciona o post e tenta salvá-lo como "rascunho agendado" (`state: 'queue'`) para 24 horas adiante.
- **Conversão de Imagens:** Converte a Data URL em base64 diretamente para `Buffer` e insere como blocks de imagem (`contentBlocks`) no padrão do novo formato "Neue Post Format" (NPF) do Tumblr.

## 🔄 Endpoints / Fluxo de Requisição

- **GET `/tumblr/blogs`**: Traz a lista de sub-blogs da conta logada.
- **POST `/tumblr/post`**: Chamada direta para postar exclusivamente no Tumblr.
  - (Geralmente essa lógica não é chamada via endpoint direto em produção, mas sim através da função utilitária `handleTumblrPost` consumida em `PublishAllRoutes`).

## 🌍 Variáveis de Ambiente (Referência)

- `TUMBLR_CONSUMER_KEY`, `TUMBLR_CONSUMER_SECRET`, `TUMBLR_ACCESS_TOKEN`, `TUMBLR_ACCESS_TOKEN_SECRET`.
