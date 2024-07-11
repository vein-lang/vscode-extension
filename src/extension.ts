import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    StreamInfo
} from 'vscode-languageclient/node';
import { WebSocket }  from 'ws';
import { Duplex } from 'stream';

class WebSocketStream extends Duplex {
    private socket: WebSocket;

    constructor(socket: WebSocket) {
        super();
        this.socket = socket;

        this.socket.on('message', (data) => {
            console.log(`Received message: ${data}`);
            this.push(data);
        });

        this.socket.on('close', () => {
            this.push(null);
        });
    }

    _read(size: number) {}

    _write(chunk: any, encoding: string, callback: () => void) {
        console.log(`Sending message: ${chunk}`);
        this.socket.send(chunk, callback);
    }
}
let client: LanguageClient;

export function activate(context: ExtensionContext) {
    const serverOptions: ServerOptions = () => {
        const socket = new WebSocket('ws://localhost:8080');

        return new Promise<StreamInfo>((resolve, reject) => {
            socket.on('open', () => {
                const stream = new WebSocketStream(socket);
                resolve({
                    reader: stream,
                    writer: stream
                });
            });

            socket.on('error', (error) => {
                reject(error);
            });
        });
    };

    let clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'vein' }],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/*.vein')
        }
    };

    client = new LanguageClient(
        'languageServerExample',
        'Language Server Example',
        serverOptions,
        clientOptions
    );

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}