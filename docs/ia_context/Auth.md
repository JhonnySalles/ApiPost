# Autenticação - AuthRoutes

## 🎯 Objetivo / Contexto

Gerencia a segurança da API, protegendo os endpoints de criação de posts contra acessos indevidos. A API utiliza uma estratégia de credenciais estáticas seguras configuradas no servidor, não havendo um banco de dados de usuários tradicionais.

## 🧩 Arquivos e Componentes

- **Arquivo Principal:** `src/routes/authRoutes.ts`
- **Middleware Relacionado:** `src/middleware/authMiddleware.ts` (verifica a assinatura do token).

## ⚙️ Regras de Negócio e Lógica (Core Logic)

- **Validação Dupla:** Para o login ser aprovado, o cliente precisa fornecer o usuário (`username`), a senha (`password`) e um Token de Acesso estático extra (`accessToken`). Todos devem corresponder perfeitamente com o `.env`.
- **Expiração de Token:** O JWT gerado dura exatamente 24 horas (`24 * 60 * 60` segundos).
- **Renovação (Refresh):** Um token expirado pode ser renovado sem senha se o cliente enviar o token antigo (via `Authorization` header) acompanhado do `accessToken` correto no corpo da requisição.

## 🔄 Endpoints / Fluxo de Requisição

- **POST `/auth/login`**: Recebe credenciais e devolve o Token JWT.
- **POST `/auth/token/refresh`**: Recebe token antigo e token estático, devolve um novo JWT com +24 horas.

## 🌍 Variáveis de Ambiente (Referência)

- `JWT_SECRET`, `API_USER`, `API_PASSWORD`, `API_ACCESS_TOKEN`.
