# Visão Geral da Arquitetura - ApiPost

## 🎯 Objetivo / Contexto

A `ApiPost` é uma API backend em Node.js (Express) cujo principal objetivo é gerenciar e publicar postagens simultâneas em múltiplas plataformas de redes sociais (Tumblr, Twitter/X, Bluesky, Threads).

## 🧩 Estrutura de Diretórios e Padrão

- **`src/routes/`**: Contém os roteadores do Express e as funções controladoras (handlers) para cada domínio de rede social.
- **`src/services/`**: Serviços externos e integrações (Cloudinary, Firebase).
- **`src/middleware/`**: Interceptadores de requisição (como o `authMiddleware.ts` para proteção JWT).
- **`src/config/`**: Configurações globais (Logger, Secrets).

## ⚙️ Tecnologias e Integrações (Core)

- **Linguagem:** TypeScript
- **Framework Web:** Express.js
- **Autenticação:** JWT (JSON Web Tokens) com credenciais estáticas no `.env`.
- **Tempo Real:** Socket.io (usado para emitir eventos de progresso de postagem para os clientes conectados).
- **Banco de Dados / Tracking:** Firebase Realtime Database (grava o progresso e sumário das postagens vinculadas a um `instanceId` e `postId`).
- **Hospedagem de Imagens Temporárias:** Cloudinary (necessário para gerar URLs públicas exigidas por algumas APIs como Threads e Tumblr).
- **Monitoramento/Tracing:** Sentry.

## 🔄 Fluxo de Processamento Padrão

1. Cliente autentica na rota `/auth/login` e recebe o JWT.
2. Cliente abre uma conexão WebSocket com o servidor (recebendo um `socketId`).
3. Cliente dispara um POST para `/publish-all/post` enviando dados, imagens e o `socketId`.
4. A API responde imediatamente com `202 Accepted`.
5. Em background, a API itera pelas plataformas, faz o upload das imagens para o Cloudinary (se necessário), aciona o handler de cada rede social e emite via WebSocket o progresso (`progressUpdate`).
6. Ao finalizar, grava o sumário no Firebase e emite o evento final via WebSocket (`taskCompleted`).
