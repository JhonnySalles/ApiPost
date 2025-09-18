# Estágio 1: Builder - Instala tudo, aplica patches e compila
FROM node:22-alpine AS builder
WORKDIR /app

# Adiciona dependências para o 'sharp'
RUN apk add --no-cache vips-dev

COPY package.json yarn.lock ./

COPY patches ./patches

# Instala TODAS as dependências. O script 'postinstall' rodará aqui,
# aplicando o patch do tumblr.js na pasta node_modules deste estágio.
RUN yarn install

# Copia o resto do código-fonte
COPY . .

# Compila o TypeScript para JavaScript
RUN yarn build


# Estágio 2: Production - Instala deps de prod e copia os artefatos prontos e corrigidos
FROM node:22-alpine
WORKDIR /app

# Adiciona dependências para o 'sharp'
RUN apk add --no-cache vips

# Copia os arquivos de definição de pacotes
COPY package.json yarn.lock ./
COPY patches ./patches

# ==================================================================
# MUDANÇA PRINCIPAL
# ==================================================================
# 1. Instala APENAS as dependências de produção, IGNORANDO scripts (como o postinstall)
RUN yarn install --production --ignore-scripts

# 2. Copia a pasta `tumblr.js` já com o PATCH APLICADO do estágio 'builder',
#    sobrescrevendo a versão limpa que acabamos de instalar.
COPY --from=builder /app/node_modules/tumblr.js ./node_modules/tumblr.js
# ==================================================================

# Copia o código já compilado do estágio 'builder'
COPY --from=builder /app/dist ./dist

COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/tsconfig.json ./

EXPOSE 8080
CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]