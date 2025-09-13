// setup-tumblr.ts
import tumblr from 'tumblr.js';
import inquirer from 'inquirer';
import util from 'util';

// Cole as chaves que você obteve do site do Tumblr aqui
const TUMBLR_CONSUMER_KEY = 'SUA_CONSUMER_KEY_AQUI';
const TUMBLR_CONSUMER_SECRET = 'SUA_SECRET_KEY_AQUI';

const client = tumblr.createClient({
  consumer_key: TUMBLR_CONSUMER_KEY,
  consumer_secret: TUMBLR_CONSUMER_SECRET,
  token: '',
  token_secret: '',
});

const getOAuthRequestToken = util.promisify(client.getRequestToken.bind(client));

async function run() {
  console.log('🚀 Iniciando processo de autorização do Tumblr...');

  try {
    const { oauth_token, oauth_token_secret, auth_url } = await getOAuthRequestToken('http://localhost/callback');

    console.log('\n================================================================');
    console.log(' PASSO 1: Autorize a aplicação no seu navegador:');
    console.log(` 👉 Visite esta URL: ${auth_url}`);
    console.log('================================================================\n');

    const { verifier } = await inquirer.prompt([
      {
        type: 'input',
        name: 'verifier',
        message: 'Após autorizar, cole o código "verifier" que aparece na URL aqui:',
      },
    ]);

    const getOAuthAccessToken = util.promisify(client.getAccessToken.bind(client));

    const { oauth_token: accessToken, oauth_token_secret: accessTokenSecret } = await getOAuthAccessToken(
      oauth_token,
      oauth_token_secret,
      verifier.trim()
    );

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