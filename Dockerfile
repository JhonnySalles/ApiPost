# Estágio 1: Builder - Instala dependências e compila o projeto
FROM node:18-alpine AS builder
WORKDIR /app

# Copia os arquivos de definição de pacotes
COPY package.json yarn.lock ./

# Instala TODAS as dependências (incluindo as de desenvolvimento para o build)
RUN yarn install

# Copia o resto do código-fonte
COPY . .

# Compila o TypeScript para JavaScript
RUN yarn build


# Estágio 2: Production - Cria a imagem final, menor e mais segura
FROM node:18-alpine
WORKDIR /app

# Copia os arquivos de definição de pacotes novamente
COPY package.json yarn.lock ./

# Instala APENAS as dependências de produção
RUN yarn install --production

# Copia o código compilado do estágio 'builder'
COPY --from=builder /app/dist ./dist

# Expõe a porta que a aplicação usa
EXPOSE 8080

# Comando para iniciar a aplicação
CMD ["node", "dist/server.js"]