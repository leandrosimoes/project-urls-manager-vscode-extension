import * as vscode from 'vscode';

import { EXTENSION_NAME } from './constants';
import { openCommand, syncCommand, clearCache } from './commands';
import { logger } from './services/logger';
import { syncURLs, startAutoSync } from './services/urls';
import { getConfigurations } from './services/configurations';
import { setContext } from './services/context';

export function activate(context: vscode.ExtensionContext) {
	if (!vscode.workspace.rootPath) {
		return;
	}
	
	setContext(context);

	logger.log({ message: `${EXTENSION_NAME} Started ...` });
	
	context.subscriptions.push(openCommand);
	context.subscriptions.push(syncCommand);
	context.subscriptions.push(clearCache);
	context.subscriptions.push(logger.getStatusBarInstance());

	const showIgnored = context.workspaceState.get<boolean>('showIgnored') || false;

	// Syncing URLS on start
	(async () => {
		const configurations = await getConfigurations();

		if (configurations?.autoSync) {
			await startAutoSync(showIgnored);
		}

		await syncURLs(showIgnored);
	})();
}

// this method is called when your extension is deactivated
export function deactivate() {}
