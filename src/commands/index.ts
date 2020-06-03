import * as vscode from 'vscode';

import { syncURLs } from '../services/urls';
import { openWebview } from '../services/views';
import { getContext } from '../services/context';

export enum Commands {
	OPEN = 'project-urls-manager.open',
    SYNC = 'project-urls-manager.sync',
    CLEAR_CACHE = 'project-urls-manager.clearCache'
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

export const clearCache = vscode.commands.registerCommand(Commands.CLEAR_CACHE, () => {
    const context = getContext();

    if (!context) {
        return;
    }
    const showIgnored = context.workspaceState.get<boolean>('showIgnored') || false;
    
    context.workspaceState.update('urls', []);

    syncURLs(showIgnored);
});