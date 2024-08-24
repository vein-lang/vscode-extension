import { workspace, ExtensionContext, window, commands, Uri, Terminal } from 'vscode';
import { access, existsSync, mkdirSync } from 'fs';
import { exec, spawn } from "child_process"
import * as path from 'path';
import {
    LanguageClientOptions,
    Trace
} from 'vscode-languageclient';
import {
    LanguageClient,
    ServerOptions
} from 'vscode-languageclient/node.js';
import { connect } from "net";
import * as os from 'os';
import getPort from "get-port";
import { promisify } from 'util';
import { execFile } from 'child_process';

const execFilePromise = promisify(execFile);


const outputChannel = window.createOutputChannel('Vein Language Extension');

async function checkFileExists(filePath: string): Promise<boolean> {
    try {
        await promisify(access)(filePath);
        return true;
    } catch {
        return false;
    }
}

function log(message: string, ...optionalParams: any[]) {
    const fullMessage = [message, ...optionalParams].join(' ');
    outputChannel.appendLine(fullMessage);
    console.log(message, optionalParams); 
}

let client: LanguageClient;

const platform = os.platform();
const runePath = platform === 'win32'
    ? path.join(os.homedir(), '.vein', 'rune.exe')
    : path.join(os.homedir(), '.vein', 'rune');

async function runCommand(command: string, args: string[]): Promise<string | null> {
    try {
        const { stdout, stderr } = await execFilePromise(command, args, {
            encoding: 'utf16le',
            env: {
                LOG_WRITE_TO_FILE: path.join(os.homedir(), '.vein', 'logs')
            },

        });
        return stdout.trim();
    } catch (error: any) {
        console.log(error);
        window.showErrorMessage(`Command failed: ${error.message}`);
        throw error;
    }
}

async function getVeinCompilerPath(): Promise<string | null> {
    if (!(await checkFileExists(runePath))) {
        window.showErrorMessage('rune executable not found.');
        return null;
    }

    const args = ['sys', 'get-tool', '--package', 'vein-compiler-package', '--tool', 'veinc'];

    try {
        const result = await runCommand(runePath, args);
        if (result === 'null') {
            window.showErrorMessage('Vein compiler is not installed.');
            return null;
        }
        return result;
    } catch (error) {
        window.showErrorMessage('Failed to retrieve Vein compiler path.');
        log("err", error);
        return null;
    }
}

export async  function activate(context: ExtensionContext) {
    const veinHome = path.join(os.homedir(), '.vein');
    const logsDir = path.join(veinHome, 'logs');

    if (!existsSync(veinHome)) {
        const install = await window.showErrorMessage(
            'VeinSDK is not installed. Please install VeinSDK to use this extension.', 
            'Install'
        );
        if (install === 'Install') 
            commands.executeCommand('vscode.open', Uri.parse('https://vein-lang.org/install')); 
        return;
    }

    if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });
    
    const compilerPath = await getVeinCompilerPath();
    
    if (!compilerPath) {
        window.showErrorMessage('Package with vein compiler is not installed. Please install the vein.compiler workload to use this extension.');
        return;
    }
    const port = await getPort();

    const env = {
        LOG_WRITE_TO_FILE: path.join(logsDir, 'vein-lsp.log')
    };
    console.error("CompilerPath", compilerPath);
    spawn(compilerPath, ['lsp', '--port', port.toString()], {
        stdio: 'ignore', env, //windowsHide: true
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const serverOptions: ServerOptions = () => {
        const socket = connect(port, '127.0.0.1');
        return Promise.resolve({
            reader: socket,
            writer: socket
        });
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'vein' },
            { scheme: 'untitled', language: 'vein' }
        ],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/*.vein')
        }
    };

    client = new LanguageClient("vein-language", "Vein Language", serverOptions, clientOptions);
    client.registerProposedFeatures();
    client.setTrace(Trace.Verbose);
    await client.start();

    context.subscriptions.push(commands.registerCommand('vein.build', () => {
        runBuildCommand();
    }));
}
let buildTerminal: Terminal | undefined;
async function runBuildCommand() {
    const rootPath = workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!rootPath) {
        window.showErrorMessage('No workspace folder is open.');
        return;
    }
    if (!buildTerminal) {
        buildTerminal = window.createTerminal({ name: "Vein Build" });
    }
    buildTerminal.show();
    buildTerminal.sendText(`cd "${rootPath}"`);
    buildTerminal.sendText('rune build');
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}