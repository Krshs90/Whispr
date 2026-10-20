const { spawn } = require('child_process');
const path = require('path');
const electronPath = require('electron');

const projectRoot = path.resolve(__dirname, '..');

if (process.platform === 'win32') {
  const psScript = path.join(__dirname, 'launch-default-desktop.ps1');
  const child = spawn(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psScript, '-ExePath', electronPath, '-WorkDir', projectRoot],
    { stdio: 'inherit', cwd: projectRoot }
  );
  child.on('exit', (code) => process.exit(code ?? 0));
} else {
  const child = spawn(electronPath, ['.'], { stdio: 'inherit', cwd: projectRoot });
  child.on('exit', (code) => process.exit(code ?? 0));
}
