// setup-threads.ts
import { ThreadsPublicApiClient } from 'threads-graph-api';
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
                .then(async (response) => {
                    const { access_token, user_id } = response;
                    console.log('\n✅ Autorização concluída com sucesso!');
                    console.log('\nCopie as linhas abaixo e adicione ao seu arquivo .env:\n');
                    console.log('----------------------------------------------------');
                    console.log(`THREADS_CLIENT_ID="${THREADS_CLIENT_ID}"`);
                    console.log(`THREADS_CLIENT_SECRET="${THREADS_CLIENT_SECRET}"`);
                    console.log(`THREADS_ACCESS_TOKEN="${access_token}"`);
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