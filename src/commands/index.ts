import * as vscode from 'vscode';

import { syncURLs } from '../services/urls';
import { openWebview } from '../services/views';

export enum Commands {
	OPEN = 'project-urls-manager.openProjectUrlsManager',
	SYNC = 'project-urls-manager.syncProjectUrls',
}


export const openCommand = vscode.commands.registerCommand(Commands.OPEN, () => {
    openWebview();
});

export const syncCommand = vscode.commands.registerCommand(Commands.SYNC, () => {
    syncURLs();
});