import * as vscode from 'vscode';

import { EXTENSION_NAME } from './constants';
import { openCommand, syncCommand } from './commands';
import { logger } from './services/logger';
import { syncURLs, startAutoSync } from './services/urls';
import { getConfigurations } from './services/configurations';

export function activate(context: vscode.ExtensionContext) {
	if (!vscode.workspace.rootPath) {
		return;
	}

	logger.log({ message: `${EXTENSION_NAME} Started ...` });
	
	context.subscriptions.push(openCommand);
	context.subscriptions.push(syncCommand);
	context.subscriptions.push(logger.getStatusBarInstance());

	// Syncing URLS on start
	(async () => {
		const configurations = await getConfigurations();

		if (configurations?.autoSync) {
			await startAutoSync();
		}

		await syncURLs();
	})();
}

// this method is called when your extension is deactivated
export function deactivate() {}
