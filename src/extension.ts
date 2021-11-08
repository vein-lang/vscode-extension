'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LanguageServer } from './languageServer';
import { registerCommand} from './commands';

/**
 * Returns the root folder for the current workspace.
 */
 function findRootFolder() : string {
    // FIXME: handle multiple workspace folders here.
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        return workspaceFolders[0].uri.fsPath;
    } else {
        return '';
    }
}

export async function activate(context: vscode.ExtensionContext) {
    console.error('[vein-lsp] Activated!');
    process.env['VSCODE_LOG_LEVEL'] = 'trace';

    registerCommand(
        context,
        "editor.action.vein-lang.status",
        () => {
            vscode.window.showInformationMessage(
                `Status is ok.`
            );
        }
    );


    let config = vscode.workspace.getConfiguration();
    let isDisabled = config.get("veinDevkit.languageServer.disabled", true);

    let rootFolder = findRootFolder();

    if (isDisabled)
    {
        vscode.window.showInformationMessage(
            `Language server for Vein Lang has disabled in this version.`
        );
    }
    else
    {
        // Start the language server client.
        let languageServer = new LanguageServer(context, rootFolder);
        await languageServer
            .start()
            .catch(
                err => {
                    console.log(`[vein-lsp] Language server failed to start: ${err}`);
                    let reportFeedbackItem = "Report feedback...";
                    vscode.window.showErrorMessage(
                        `Language server failed to start: ${err}`,
                        reportFeedbackItem
                    ).then(
                        item => {
                            vscode.env.openExternal(vscode.Uri.parse(
                                "https://github.com/vein-lang/vein/issues/new?assignees=&labels=bug,area-lsp&template=bug_report.md&title="
                            ));
                        }
                    );
                }
            );
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}