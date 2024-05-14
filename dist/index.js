#!/usr/bin/env node


const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { CLIEngine } = require('eslint');
const { spawn } = require('child_process');
const { lintGo } = require('./lint-go');

program.option('-p, --path <path>', 'Path to the file or directory to review', './').option('-k, --key <key>', 'OpenAI API key for GPT-3 analysis').parse(process.argv);

const options = program.opts();

const file = path.resolve(options.path);
const isDirectory = fs.lstatSync(file).isDirectory();
const fileExtension = path.extname(file).substring(1);

let language;
switch (fileExtension) {
  case 'js':
  case 'jsx':
    language = 'js';
    break;
  case 'py':
    language = 'py';
    break;
  case 'go':
    language = 'go';
    break;
  default:
    console.error(`Unsupported file extension: ${fileExtension}`);
    process.exit(1);
}

switch (language) {
  case 'js':
    const cli = new CLIEngine({
      envs: ['node', 'es6'],
      useEslintrc: false,
      baseConfig: {
        extends: ['airbnb-base'],
        plugins: ['import']
      }
    });
    if (isDirectory) {
      cli.lintFiles(file).then(async report => {
        console.log(cli.getFormatter('stylish')(report.results));
        const code = report.results.map(result => result.source).join('\n\n');
        if (options.key) {
          const gpt3Analysis = await analyzeCodeWithGPT3(code, 'JavaScript', options.key);
          console.log('\nGPT-3 Analysis:\n', gpt3Analysis);
        }
      });
    } else {
      analyzeAndPrintGPT3Analysis(file, 'JavaScript', options.key, () => {
        const report = cli.executeOnText(fs.readFileSync(file, 'utf8'), file);
        console.log(cli.getFormatter('stylish')(report.results));
      });
    }
    break;

  case 'py':
    lintPython(file, isDirectory);
    if (isDirectory) {
      cli.lintFiles(file).then(async report => {
        console.log(cli.getFormatter('stylish')(report.results));
        const code = report.results.map(result => result.source).join('\n\n');
        if (options.key) {
          const gpt3Analysis = await analyzeCodeWithGPT3(code, 'JavaScript', options.key);
          console.log('\nGPT-3 Analysis:\n', gpt3Analysis);
        }
      });
    } else {
      analyzeAndPrintGPT3Analysis(file, 'JavaScript', options.key, () => {
        const report = cli.executeOnText(fs.readFileSync(file, 'utf8'), file);
        console.log(cli.getFormatter('stylish')(report.results));
      });
    }
    break;

  case 'go':
    lintGo(file, isDirectory);
    if (isDirectory) {
      cli.lintFiles(file).then(async report => {
        console.log(cli.getFormatter('stylish')(report.results));
        const code = report.results.map(result => result.source).join('\n\n');
        if (options.key) {
          const gpt3Analysis = await analyzeCodeWithGPT3(code, 'JavaScript', options.key);
          console.log('\nGPT-3 Analysis:\n', gpt3Analysis);
        }
      });
    } else {
      analyzeAndPrintGPT3Analysis(file, 'JavaScript', options.key, () => {
        const report = cli.executeOnText(fs.readFileSync(file, 'utf8'), file);
        console.log(cli.getFormatter('stylish')(report.results));
      });
    }
    break;
}

function lintPython(file, isDirectory) {
  const pylint = spawn('pylint', [...(isDirectory ? [file] : [path.resolve(file)])]);

  pylint.stdout.on('data', data => {
    console.log(`${data}`);
  });

  pylint.stderr.on('data', data => {
    console.error(`${data}`);
  });

  pylint.on('close', code => {
    if (code !== 0) {
      console.error(`pylint exited with code ${code}`);
    }
  });
}
async function analyzeCodeWithGPT3(code, language, apiKey) {
  const configuration = new Configuration({
    apiKey: apiKey
  });
  const openai = new OpenAIApi(configuration);

  const prompt = `Analyze the following ${language} code and provide feedback on potential errors, issues, or areas for improvement:\n\n${code}`;

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt,
    max_tokens: 1024,
    n: 1,
    stop: null,
    temperature: 0.7
  });

  return response.data.choices[0].text.trim();
}