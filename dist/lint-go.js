const { spawn } = require('child_process');
const path = require('path');

function lintGo(file, isDirectory) {
  const golangci = spawn('golangci-lint', ['run', '--disable-all', '--enable=goimports,golint,gosec,gosimple,govet,ineffassign,staticcheck,typecheck,unused,varcheck', ...(isDirectory ? [file] : [path.resolve(file)])]);

  golangci.stdout.on('data', data => {
    console.log(`${data}`);
  });

  golangci.stderr.on('data', data => {
    console.error(`${data}`);
  });

  golangci.on('close', code => {
    if (code !== 0) {
      console.error(`golangci-lint exited with code ${code}`);
    }
  });
}

module.exports = { lintGo };