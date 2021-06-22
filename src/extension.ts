// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CommandHelper } from './command-helper.class';


export function activate(context: vscode.ExtensionContext) {
	const commandHelper = new CommandHelper();

	let disposable = vscode.commands.registerCommand('command-helper.runCommand', async () => await commandHelper.runCommand());

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }