import * as vscode from 'vscode';
import simpleGit, * as git from 'simple-git';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "notes-for-code" is now active!');

	const config = vscode.workspace.getConfiguration("notes-for-code");

	const sgit = simpleGit({
		errors(error, result) {
			if (error) { return error; }

			if (result.exitCode === 0) { return; }

			return Buffer.concat([...result.stdOut, ...result.stdErr]);
		}
	});

	let clone = vscode.commands.registerCommand('notes-for-code.git.clone', () => {
		if (!String(config.get('repo'))) {
			vscode.window.showErrorMessage("No notes repo specified.");
			return;
		}

		if (!String(config.get('directory'))) {
			vscode.window.showErrorMessage("No notes directory specified.");
			return;
		}

		try { sgit.clone(String(config.get('repo')), String(config.get('directory'))); }
		catch (err) {
			vscode.window.showErrorMessage(String(err));
			console.error(err);
		}
	});

	context.subscriptions.push(clone);
}

export function deactivate() {}
