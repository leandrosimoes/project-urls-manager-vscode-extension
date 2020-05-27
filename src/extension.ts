import * as vscode from 'vscode';

import { EXTENSION_NAME } from './constants';
import { openCommand, syncCommand } from './commands';
import { logger } from './services/log';
import { syncURLs } from './services/urls';

export function activate(context: vscode.ExtensionContext) {
	logger.log({ message: `${EXTENSION_NAME} Started ...` });

	context.subscriptions.push(openCommand);
	context.subscriptions.push(syncCommand);
	context.subscriptions.push(logger.getStatusBarInstance());

	// Syncing URLS on start
	syncURLs();
}

// this method is called when your extension is deactivated
export function deactivate() {}
