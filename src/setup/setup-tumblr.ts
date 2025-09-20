import tumblr from 'tumblr.js';
import inquirer from 'inquirer';
import { URLSearchParams } from 'url';

const TUMBLR_CONSUMER_KEY = 'SUA_CONSUMER_KEY_AQUI';
const TUMBLR_CONSUMER_SECRET = 'SUA_SECRET_KEY_AQUI';
const CALLBACK_URL = 'http://localhost/callback';

const client = tumblr.createClient({
    consumer_key: TUMBLR_CONSUMER_KEY,
    consumer_secret: TUMBLR_CONSUMER_SECRET,
    token: '',
    token_secret: '',
});

async function run() {
    console.log('🚀 Iniciando processo de autorização do Tumblr...');

    try {
        const responseString: string = await client.getRequest('/oauth/request_token', {
            oauth_callback: CALLBACK_URL,
        });

        const responseParams = new URLSearchParams(responseString);
        const oauth_token = responseParams.get('oauth_token');
        const oauth_token_secret = responseParams.get('oauth_token_secret');

        if (!oauth_token || !oauth_token_secret) {
            throw new Error('Não foi possível obter o token de requisição do Tumblr.');
        }
        // ==================================================================

        const auth_url = `https://www.tumblr.com/oauth/authorize?oauth_token=${oauth_token}`;

        console.log('\n================================================================');
        console.log(' PASSO 1: Autorize a aplicação no seu navegador:');
        console.log(` 👉 Visite esta URL: ${auth_url}`);
        console.log('================================================================\n');

        const { verifier } = await inquirer.prompt([
            {
                type: 'input',
                name: 'verifier',
                message: 'Após autorizar, cole o código "oauth_verifier" que aparece na URL aqui:',
            },
        ]);

        // A função getAccessToken provavelmente também foi removida, então usamos o método genérico.
        const accessTokenString: string = await client.getRequest('/oauth/access_token', {
            oauth_consumer_key: TUMBLR_CONSUMER_KEY,
            oauth_token: oauth_token,
            oauth_verifier: verifier.trim(),
        });

        const accessTokenParams = new URLSearchParams(accessTokenString);
        const accessToken = accessTokenParams.get('oauth_token');
        const accessTokenSecret = accessTokenParams.get('oauth_token_secret');

        if (!accessToken || !accessTokenSecret) {
            throw new Error('Não foi possível obter o token de acesso final do Tumblr.');
        }

        console.log('\n✅ Autorização concluída com sucesso!');
        console.log('\nCopie as linhas abaixo e adicione ao seu arquivo .env:\n');
        console.log('----------------------------------------------------');
        console.log(`TUMBLR_CONSUMER_KEY="${TUMBLR_CONSUMER_KEY}"`);
        console.log(`TUMBLR_CONSUMER_SECRET="${TUMBLR_CONSUMER_SECRET}"`);
        console.log(`TUMBLR_ACCESS_TOKEN="${accessToken}"`);
        console.log(`TUMBLR_ACCESS_TOKEN_SECRET="${accessTokenSecret}"`);
        console.log('----------------------------------------------------');

    } catch (error) {
        console.error('❌ Ocorreu um erro durante a autorização:', error);
    }
}

run();