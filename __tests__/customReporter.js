class CustomReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.testResults = [];
  }

  onTestStart(test) {
    const path = test.path ? test.path.split(/[\\/]/).pop() : 'unknown';
    console.log(`\n\x1b[33m--- INICIANDO SCRIPT: ${path} ---\x1b[0m`);
  }

  onTestResult(test, testResult, aggregatedResult) {
    const fullPath = testResult.testFilePath || (test && test.path) || 'unknown';
    const filename = fullPath.split(/[\\/]/).pop();

    const success = !testResult.numFailingTests && !testResult.testExecError && !testResult.failureMessage;

    if (success) {
      console.log(`\x1b[32mSucesso no teste: ${filename}\x1b[0m`);
    } else {
      console.log(`\x1b[31mErro no teste: ${filename}\x1b[0m`);
    }

    this.testResults.push({
      name: filename,
      success,
    });
  }

  onRunComplete(contexts, results) {
    console.log('\n\x1b[33m=======================================\x1b[0m');
    console.log('\x1b[33m   RESUMO FINAL DOS TESTES (ApiPost)   \x1b[0m');
    console.log('\x1b[33m=======================================\x1b[0m');

    if (this.testResults.length === 0) {
      console.log('\x1b[31mNenhum resultado capturado no reporter.\x1b[0m');
    } else {
      this.testResults.sort((a, b) => a.name.localeCompare(b.name));

      this.testResults.forEach(result => {
        const color = result.success ? '\x1b[32m' : '\x1b[31m';
        const icon = result.success ? '✅' : '❌';
        const status = result.success ? ' Sucesso ' : ' Falha   ';
        console.log(`${color}${icon}${status} | ${result.name}\x1b[0m`);
      });
    }
    console.log('\x1b[33m=======================================\x1b[0m\n');
  }
}

module.exports = CustomReporter;
