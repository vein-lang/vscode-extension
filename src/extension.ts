/**  * @param {import('vscode').ExtensionContext} context - The context.  */ 
async function activate(context: any) {  
    (await import('./ext.mjs')).activate(context);
}
module.exports.activate = activate;