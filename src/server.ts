const { spawn } = require('child_process');
const path = require('path');

const serverPath = 'C:\\git\\vein.lang\\lsp\\bin\\Debug\\net8.0\\lsp.exe';

const serverProcess = spawn(serverPath, [], {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc']
});

process.stdin.pipe(serverProcess.stdin);
serverProcess.stdout.pipe(process.stdout);
serverProcess.stderr.pipe(process.stderr);

serverProcess.on('exit', (code: any) => {
  console.log(`LSP Server exited with code ${code}`);
});

serverProcess.on('error', (err: any) => {
  console.error('Failed to start LSP Server:', err);
});