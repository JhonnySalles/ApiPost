# Publicação em Massa - PublishAllRoutes

## 🎯 Objetivo / Contexto

Ponto de entrada principal do sistema de postagem. Permite publicar um único conteúdo (texto, imagens e tags) em várias redes sociais suportadas de uma só vez, processando a requisição de forma assíncrona (background job) e reportando o status em tempo real.

## 🧩 Arquivos e Componentes

- **Arquivo Principal:** `src/routes/publishAllRoutes.ts`
- **Dependências Injetadas:** `handleTumblrPost`, `handleTwitterPost`, `handleBlueskyPost`, `handleThreadsPost`
- **Serviços Acionados:** `uploadImage` (Cloudinary), `db.ref` (Firebase), `io.to().emit` (Socket.io)

## ⚙️ Regras de Negócio e Lógica (Core Logic)

- **Upload Prévio:** Se o payload conter imagens e o destino incluir Tumblr ou Threads, as imagens em Base64 são enviadas para o Cloudinary primeiro para gerar URLs públicas.
- **Iteração de Plataformas:** A função `processPublishAllRequest` itera na lista de plataformas solicitadas. O processamento não é paralizado (`Promise.all`), mas sim executado sequencialmente (ou agendado internamente por cada handler) e reportado progressivamente ao WebSocket (`progressUpdate`).
- **Sumário Final:** Independentemente de falhas em plataformas individuais, no final do loop, o sistema compila os sucessos (`successfulPlatforms`) e as falhas (`failedPlatforms`) e atualiza o nó respectivo no Firebase Database.

## 🔄 Endpoints / Fluxo de Requisição

- **POST `/publish-all/post`**
  - **Espera:** `{ platforms: [], text: "", images: [{ base64: "", platforms: [] }], socketId: "...", instanceId: "...", postId: "..." }`.
  - **Retorna Imediatamente:** `202 Accepted` ("Processamento em lote iniciado...").
  - **Ação Subsequente:** Emite eventos WebSocket e grava no Firebase.

## 🌍 Variáveis de Ambiente e Constantes (Referência)

- Plataformas suportadas (Constantes): `TUMBLR`, `TWITTER`, `X`, `BLUESKY`, `THREADS`.
- Firebase node references: `${BASE_DOCUMENT}/${instanceId}/${postId}`.
