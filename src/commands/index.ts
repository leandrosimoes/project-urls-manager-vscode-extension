import * as vscode from 'vscode';

import { syncURLs } from '../services/urls';
import { openWebview } from '../services/views';
import { getContext } from '../services/context';

export enum Commands {
	OPEN = 'project-urls-manager.openProjectUrlsManager',
	SYNC = 'project-urls-manager.syncProjectUrls',
}


export const openCommand = vscode.commands.registerCommand(Commands.OPEN, () => {
    openWebview();
});

export const syncCommand = vscode.commands.registerCommand(Commands.SYNC, () => {
    const context = getContext();

    if (!context) {
        return;
    }

    const showIgnored = context.workspaceState.get<boolean>('showIgnored') || false;

    syncURLs(showIgnored);
});