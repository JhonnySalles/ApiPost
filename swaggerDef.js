const packageJson = require('./package.json');

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'API de Postagem Social',
    version: packageJson.version,
    description: 'API para postar conteúdo em diversas redes sociais.',
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
      LoginRequest: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
          accessToken: { type: 'string' },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
        },
      },
      ImagePayload: {
        type: 'object',
        properties: {
          base64: { type: 'string', format: 'byte' },
          platforms: { type: 'array', items: { type: 'string', enum: ['tumblr', 'twitter', 'bluesky', 'threads'] } },
        },
      },
      SocialPostRequest: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          images: { type: 'array', items: { type: 'string', format: 'byte' } },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};
