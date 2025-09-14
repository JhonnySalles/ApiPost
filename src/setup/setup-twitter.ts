// setup-twitter.ts (versão para OAuth 1.0a)
import { TwitterApi } from 'twitter-api-v2';
import inquirer from 'inquirer';
import http from 'http';
import url from 'url';

// Cole os valores da seção "Consumer Keys" do seu app no Portal do Desenvolvedor
const TWITTER_APP_KEY = 'TWITTER_APP_KEY_AQUI';
const TWITTER_APP_SECRET = 'TWITTER_APP_SECRET_AQUI';

const CALLBACK_URL = 'http://127.0.0.1:3000/callback';

async function run() {
    const client = new TwitterApi({
        appKey: TWITTER_APP_KEY,
        appSecret: TWITTER_APP_SECRET,
    });

    const authLink = await client.generateAuthLink(CALLBACK_URL, { authAccessType: 'write' });

    console.log('🚀 Iniciando processo de autorização do Twitter (OAuth 1.0a)...');
    console.log('\n================================================================');
    console.log(' PASSO 1: Autorize a aplicação no seu navegador:');
    console.log(` 👉 Visite esta URL: ${authLink.url}`);
    console.log('================================================================\n');

    const server = http.createServer((req, res) => {
        if (req.url && req.url.startsWith('/callback')) {
            const parsedUrl = url.parse(req.url, true);
            const { oauth_token, oauth_verifier } = parsedUrl.query;

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Autorização recebida!</h1><p>Você pode fechar esta janela e voltar ao terminal.</p>');
            server.close();

            if (!oauth_token || !oauth_verifier || typeof oauth_verifier !== 'string') {
                console.error('❌ Callback recebido é inválido.');
                return;
            }

            // Cria um novo cliente com os tokens temporários para fazer o login
            const clientLogin = new TwitterApi({
                appKey: TWITTER_APP_KEY,
                appSecret: TWITTER_APP_SECRET,
                accessToken: oauth_token as string,
                accessSecret: authLink.oauth_token_secret, // O secret do token temporário
            });

            clientLogin.login(oauth_verifier)
                .then(({ accessToken, accessSecret }) => {
                    console.log('\n✅ Autorização concluída com sucesso!');
                    console.log('\nCopie as linhas abaixo e adicione ao seu arquivo .env:\n');
                    console.log('----------------------------------------------------');
                    console.log(`TWITTER_APP_KEY="${TWITTER_APP_KEY}"`);
                    console.log(`TWITTER_APP_SECRET="${TWITTER_APP_SECRET}"`);
                    console.log(`TWITTER_ACCESS_TOKEN="${accessToken}"`);
                    console.log(`TWITTER_ACCESS_SECRET="${accessSecret}"`);
                    console.log('----------------------------------------------------');
                })
                .catch((err) => console.error('❌ Erro ao obter os tokens de acesso finais:', err));
        }
    }).listen(3000, () => {
        console.log('Aguardando autorização no navegador... (escutando em http://127.0.0.1:3000)');
    });
}

run();