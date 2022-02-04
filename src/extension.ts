import * as vscode from 'vscode';
import simpleGit, * as git from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import { SimpleGit } from 'simple-git';

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

		if (repoHasBeenCloned(String(config.get('directory')))) {
			vscode.window.showWarningMessage(`The notes repo was previously cloned to ${String(config.get('directory'))}.\nPlease use \`Notes: Pull\` to update.`);
			return;
		}

		try { 
			sgit.clone(String(config.get('repo')), String(config.get('directory')));
			sgit.cwd(String(config.get('directory')));
			vscode.window.showInformationMessage(`The notes repo has been cloned to ${String(config.get('directory'))}.`);
		}
		catch (error) {
			vscode.window.showErrorMessage(String(error));
			console.error(error);
		}
	});

	let pull = vscode.commands.registerCommand('notes-for-code.git.pull', () => {
		if (!String(config.get('repo'))) {
			vscode.window.showErrorMessage("No notes repo specified.");
			return;
		}

		if (!String(config.get('directory'))) {
			vscode.window.showErrorMessage("No notes directory specified.");
			return;
		}

		if (!repoHasBeenCloned(String(config.get('directory')))) {
			vscode.window.showErrorMessage(`The notes repo has not been cloned.\nPlease use \`Notes: Clone\` to clone the repo.`);
			return;
		}

		try {
			sgit.pull();
			vscode.window.showInformationMessage(`The notes repo has been updated.`);
		} catch (error) {
			vscode.window.showErrorMessage(String(error));
			console.error(error);
		}
	});

	let push = vscode.commands.registerCommand('notes-for-code.git.push', () => {
		if (!String(config.get('repo'))) {
			vscode.window.showErrorMessage("No notes repo specified.");
			return;
		}

		if (!String(config.get('directory'))) {
			vscode.window.showErrorMessage("No notes directory specified.");
			return;
		}

		if (!repoHasBeenCloned(String(config.get('directory')))) {
			vscode.window.showErrorMessage(`The notes repo has not been cloned.\nPlease use \`Notes: Clone\` to clone the repo.`);
			return;
		}

		vscode.window.showInformationMessage(`${status(sgit)}`);

		try {
			sgit.add('./*').push();
			vscode.window.showInformationMessage(`The notes repo has been pushed.`);
		} catch (error) {
			vscode.window.showErrorMessage(String(error));
			console.error(error);
		}
	});

	context.subscriptions.push(clone, pull, push);
}

export function deactivate() {}

function repoHasBeenCloned(dir: string): boolean {
	let p = path.join(dir, ".git");

	let exists = false;

	try {
		if (fs.existsSync(p)) {
			exists = true;
		}
	} catch (error) {
		exists = false;
	}

	return exists;
}

async function status (sgit: SimpleGit) {
	let statusSummary = null;
	try {
		statusSummary = await sgit.status();
	}
	catch (error) {
		vscode.window.showErrorMessage(String(error));
		console.error(error);
	}

	return statusSummary;
}
