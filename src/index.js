#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { ESLint } = require('eslint');
const { spawn } = require('child_process');
const packageJson = require('../package.json');
const lintGo = require('./lint-go.js')

program
  .version(packageJson.version, '-v, --version')
  .option('-p, --path <path>', 'Path to the file or directory to review')
  .option('-k, --key <key>', 'OpenAI API key for GPT-3 analysis')
  .helpOption('-h, --help', 'Display help for command');

program.parse(process.argv);

const options = program.opts();

const file = path.resolve(options.path);
const isDirectory = fs.lstatSync(file).isDirectory();

let language;

if (isDirectory) {
  // If it's a directory, assume all supported files are present
  language = 'all';
} else {
  // If it's a file, check the file extension
  const fileExtension = path.extname(file).substring(1);

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
}

switch (language) {
  case 'js':
    const cli = new ESLint({
      overrideConfigFile: null,
      overrideConfig: {
        env: {
          node: true,
          es6: true,
        },
        extends: ['airbnb-base'],
        plugins: ['import'],
      },
    });
    if (isDirectory) {
      cli.lintFiles(file).then(async (results) => {
        const formatter = await cli.loadFormatter('stylish');
        console.log(formatter.formatResults(results));
        if (options.key) {
          const code = results.flatMap(result => result.source).join('\n\n');
          const gpt3Analysis = await analyzeCodeWithGPT3(code, 'JavaScript', options.key);
          console.log('\nGPT-3 Analysis:\n', gpt3Analysis);
        }
      });
    } else {
      lintFileAndPrintGPT3Analysis(file, cli, options.key);
    }
    break;

  case 'py':
    lintPython(file, isDirectory);
    if (isDirectory) {
      cli.lintFiles(file).then(async (report) => {
        console.log(cli.getFormatter('stylish')(report.results));
        const code = report.results.map(result => result.source).join('\n\n');
        if (options.key) {
          const gpt3Analysis = await analyzeCodeWithGPT3(code, 'JavaScript', options.key);
          console.log('\nGPT-3 Analysis:\n', gpt3Analysis);
        }
      });
    } else {
      lintFileAndPrintGPT3Analysis(file, cli, options.key);
    }
    break;

  case 'go':
    lintGo(file, isDirectory);
    if (isDirectory) {
      cli.lintFiles(file).then(async (report) => {
        console.log(cli.getFormatter('stylish')(report.results));
        const code = report.results.map(result => result.source).join('\n\n');
        if (options.key) {
          const gpt3Analysis = await analyzeCodeWithGPT3(code, 'JavaScript', options.key);
          console.log('\nGPT-3 Analysis:\n', gpt3Analysis);
        }
      });
    } else {
      lintFileAndPrintGPT3Analysis(file, cli, options.key);
    }
    break;
  }

function lintPython(file, isDirectory) {
  const pylint = spawn('pylint', [
    ...(isDirectory ? [file] : [path.resolve(file)]),
  ]);

  pylint.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  pylint.stderr.on('data', (data) => {
    console.error(`${data}`);
  });

  pylint.on('close', (code) => {
    if (code !== 0) {
      console.error(`pylint exited with code ${code}`);
    }
  });
}

async function lintFileAndPrintGPT3Analysis(file, cli, apiKey) {
  const code = fs.readFileSync(file, 'utf8');
  const results = await cli.lintText(code, { filePath: file });
  const formatter = await cli.loadFormatter('stylish');
  console.log(formatter.formatResults([results]));
  if (apiKey) {
    const gpt3Analysis = await analyzeCodeWithGPT3(code, 'JavaScript', apiKey);
    console.log('\nGPT-3 Analysis:\n', gpt3Analysis);
  }
}