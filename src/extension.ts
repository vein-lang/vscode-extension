import { workspace, ExtensionContext, window } from 'vscode';
import * as path from 'path';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    Trace,
    TransportKind,
    createServerPipeTransport
} from 'vscode-languageclient/node';
import { connect } from "net";

let client: LanguageClient;

export async  function activate(context: ExtensionContext) {
    /*
    let serverModule = context.asAbsolutePath(path.join('out', 'server.js'));
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    const serverOptions: ServerOptions = () => {
        const pipePath = getPipePath(pipeName);
        const socket = net.connect(pipePath);
        
        socket.on('connect', () => {
            console.log('Connected to server!');
        });

        return Promise.resolve({
            reader: socket,
            writer: socket
        });
    };
    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    };

    */

    const port = 7777;

    const serverOptions: ServerOptions = () => {
        const socket = connect(port, '127.0.0.1');
        return Promise.resolve({
            reader: socket,
            writer: socket
        });
    };


    /*const pipeName = 'vein_language_pipe';
    let time = 0;
    let serverOptions = async () => {
        if (time > 0)
            await new Promise((r) => setTimeout(r, time));
        time = 10000;
        const [reader, writer] = createServerPipeTransport("\\\\.\\pipe\\" + pipeName);
        return {
            reader,
            writer,
        };
     };
*/
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
}
function getPipePath(pipeName: string): string {
    const pipePrefix = '\\\\.\\pipe\\';
    return path.join(pipePrefix, pipeName);
}
export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}