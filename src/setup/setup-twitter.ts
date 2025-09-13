// setup-twitter.ts
import { TwitterApi } from 'twitter-api-v2';
import inquirer from 'inquirer';
import util from 'util';
import http from 'http';
import url from 'url';

// Cole os valores que você obteve do Portal do Desenvolvedor X
const TWITTER_CLIENT_ID = 'SEU_CLIENT_ID_AQUI';
const TWITTER_CLIENT_SECRET = 'SEU_CLIENT_SECRET_AQUI';

const REDIRECT_URI = 'http://127.0.0.1:3000/callback';

const client = new TwitterApi({
  clientId: TWITTER_CLIENT_ID,
  clientSecret: TWITTER_CLIENT_SECRET,
});

async function run() {
  const { url: authUrl, codeVerifier } = client.generateOAuth2AuthLink(
    REDIRECT_URI,
    { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
  );

  console.log('🚀 Iniciando processo de autorização do Twitter (X)...');
  console.log('\n================================================================');
  console.log(' PASSO 1: Autorize a aplicação no seu navegador:');
  console.log(` 👉 Visite esta URL: ${authUrl}`);
  console.log('================================================================\n');

  const server = http.createServer((req, res) => {
    if (req.url && req.url.startsWith('/callback')) {
      const parsedUrl = url.parse(req.url, true);
      const code = parsedUrl.query.code as string;

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Autorização recebida!</h1><p>Você pode fechar esta janela e voltar ao terminal.</p>');
      server.close();

      client.loginWithOAuth2({ code, codeVerifier, redirectUri: REDIRECT_URI })
        .then(({ refreshToken }) => {
            console.log('\n✅ Autorização concluída com sucesso!');
            console.log('\nCopie as linhas abaixo e adicione ao seu arquivo .env:\n');
            console.log('----------------------------------------------------');
            console.log(`TWITTER_CLIENT_ID="${TWITTER_CLIENT_ID}"`);
            console.log(`TWITTER_CLIENT_SECRET="${TWITTER_CLIENT_SECRET}"`);
            console.log(`TWITTER_REFRESH_TOKEN="${refreshToken}"`);
            console.log('----------------------------------------------------');
        })
        .catch((err) => {
            console.error('❌ Erro ao obter o refresh token:', err);
        });
    }
  }).listen(3000, () => {
    console.log('Aguardando autorização no navegador... (escutando em http://127.0.0.1:3000)');
  });
}

run();