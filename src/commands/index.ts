import * as vscode from 'vscode';

import { syncURLs } from '../services/urls';
import { EXTENSION_NAME } from '../constants';
import { getHTML } from '../services/views';

export enum Commands {
	OPEN = 'project-urls-manager.openProjectUrlsManager',
	SYNC = 'project-urls-manager.syncProjectUrls',
}

let _WebViewPanel: vscode.WebviewPanel | undefined;

export const openCommand = vscode.commands.registerCommand(Commands.OPEN, () => {
    (async () => {
        const viewHtml = await getHTML(true);
        const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

        if (!viewHtml) {
            return;
        }

        if (_WebViewPanel) {
            _WebViewPanel.reveal(column);
            return;
        }

        _WebViewPanel = vscode.window.createWebviewPanel('projectUrlManager', EXTENSION_NAME, column || vscode.ViewColumn.One, {
            enableScripts: true
        });

        _WebViewPanel.onDidDispose(() => {
            _WebViewPanel = undefined;
        });

        _WebViewPanel.webview.html = viewHtml;
    })();
});

export const syncCommand = vscode.commands.registerCommand(Commands.SYNC, () => {
    syncURLs();
});