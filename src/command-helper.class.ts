import * as vscode from 'vscode';

interface ArgumentWithChoices {
  choices?: string[];
}

interface Command {
  command: string;
  args?: {
    [argName: string]: ArgumentWithChoices | string
  },
  description?: string;
}

export class CommandHelper {
	private terminal: vscode.Terminal;
	private terminalName = 'command-helper';
	private settings = vscode.workspace.getConfiguration('command-helper');
	private commands = this.settings.get('commands') as { [commandName: string]: Command };
	private quickPickCommands: vscode.QuickPickItem[] = this.initQuickPickCommands();

	constructor() {
		this.terminal = this.createTerminal();
		this.terminal.show();
	}

	public async runCommand(): Promise<void> {
		const { currentCommand, pickedScript } = await this.getCurrentCommand();
    if (!currentCommand || !pickedScript?.description) { return; }
		await this.replaceArguments(currentCommand, pickedScript);
    this.showTerminalAndSendText(`${pickedScript.description}`);
	}

  private async replaceArguments(currentCommand: Command, pickedScript: vscode.QuickPickItem): Promise<void> {
    if (currentCommand.args) {
      const scriptArguments = await this.getArguments(currentCommand.args);
      for (const [argName, argValue] of Object.entries(scriptArguments)) {
        pickedScript.description = pickedScript.description!.replace(new RegExp(`{${argName}}`, 'g'), argValue);
      }
    }
  }

  private async getArguments(args: ArgumentWithChoices): Promise<{ [key: string]: string }> {
    const scriptArguments: { [key: string]: string } = { };
    for (const [argumentName, argument] of Object.entries(args)) {
      const arg = await (typeof argument === 'string' ? this.readArgumentFromInputBox(argumentName) : this.readArgumentFromQuickPick(argument));
      if (!arg) { break; }
      scriptArguments[argumentName] = arg;
    }
    return scriptArguments;
  }

  private async readArgumentFromInputBox(argumentName: string): Promise<string | undefined> {
    return await vscode.window.showInputBox({
      title: 'Current script arguments',
      placeHolder: `argument "${argumentName}"`,
      prompt: `Provide argument for argument "${argumentName}"`
    });
  }

  private async readArgumentFromQuickPick(commandArgument: ArgumentWithChoices): Promise<string | undefined> {
		const quickPickOptions = commandArgument.choices!.map((name) => ({ label: name }));
    return (await vscode.window.showQuickPick(quickPickOptions))?.label;
  }

  private async getCurrentCommand() {
    const pickedScript = await vscode.window.showQuickPick(this.quickPickCommands);
    const currentCommand: Command = this.commands?.[pickedScript?.label || ''];
    return { currentCommand, pickedScript };
  }

	private showTerminalAndSendText(text: string): void {
		if (!this.terminal) { this.terminal = this.createTerminal(); }
		this.terminal.show();
		this.terminal.sendText(text);
	}

	private initQuickPickCommands(): vscode.QuickPickItem[] {
		return Object.entries(this.commands).map(([name, command]) => ({
      label: name,
      description: command.command,
      detail: command.description || ''
    }));
	}

	private createTerminal(): vscode.Terminal {
		return vscode.window.createTerminal({ name: this.terminalName });
	}
}
