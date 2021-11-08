'use strict';
import * as vscode from 'vscode';


export function registerCommand(context: vscode.ExtensionContext, name: string, action: () => void) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            name,
            () => {
                action();
            }
        )
    )
}