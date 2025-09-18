// setup-threads.ts
import { ThreadsPublicApiClient } from '@libs/threads-graph-api/index.js';
import http from 'http';
import url from 'url';

// Cole os valores que você obteve do Portal da Meta
const THREADS_CLIENT_ID = 'THREADS_CLIENT_ID';
const THREADS_CLIENT_SECRET = 'THREADS_CLIENT_SECRET';
const REDIRECT_URI = 'https://127.0.0.1:3000/callback';

const publicClient = new ThreadsPublicApiClient();
const scope = ['threads_basic', 'threads_content_publish'];

async function run() {
    const authUrl = publicClient.createAuthorizationUrl(THREADS_CLIENT_ID, REDIRECT_URI, scope);

    console.log('🚀 Iniciando processo de autorização do Threads (Graph API)...');
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

            publicClient.exchangeAuthorizationCode(THREADS_CLIENT_ID, THREADS_CLIENT_SECRET, REDIRECT_URI, code)
                .then(async (shortLivedTokenResponse) => {
                    const { access_token: shortLivedToken, user_id } = shortLivedTokenResponse;
                    const longLivedTokenUrl = `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${THREADS_CLIENT_SECRET}&access_token=${shortLivedToken}`;

                    const responseLong = await fetch(longLivedTokenUrl);
                    const longLivedTokenData = await responseLong.json() as any;

                    if (!longLivedTokenData.access_token) {
                        throw new Error(`Falha ao obter o token de longa duração: ${JSON.stringify(longLivedTokenData)}`);
                    }
                    const longLivedToken = longLivedTokenData.access_token;

                    console.log('\n✅ Autorização finalizada com sucesso!');
                    console.log('\nSALVE ESTES VALORES! Este é o seu TOKEN DE LONGA DURAÇÃO (60 dias).\n');
                    console.log('----------------------------------------------------');
                    console.log(`THREADS_CLIENT_ID="${THREADS_CLIENT_ID}"`);
                    console.log(`THREADS_CLIENT_SECRET="${THREADS_CLIENT_SECRET}"`);
                    console.log(`THREADS_ACCESS_TOKEN="${longLivedToken}"`);
                    console.log(`THREADS_USER_ID="${user_id}"`);
                    console.log('----------------------------------------------------');
                })
                .catch((err) => console.error('❌ Erro ao obter o access token:', err));
        }
    }).listen(3000, () => {
        console.log('Aguardando autorização no navegador... (escutando em http://127.0.0.1:3000)');
    });
}

run();