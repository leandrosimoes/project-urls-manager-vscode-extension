import * as vscode from 'vscode';

import { getURLs, syncURLs } from '../services/urls';

export enum Commands {
	OPEN = 'project-urls-manager.openProjectUrlsManager',
	SYNC = 'project-urls-manager.syncProjectUrls',
}

export const openCommand = vscode.commands.registerCommand(Commands.OPEN, () => {
    getURLs();
});

export const syncCommand = vscode.commands.registerCommand(Commands.SYNC, () => {
    syncURLs();
});