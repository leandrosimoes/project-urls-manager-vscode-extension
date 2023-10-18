import * as vscode from 'vscode'

import { syncURLs } from '../urls'
import { openWebview } from '../webview'
import { getContext } from '../context'
import { ECommands } from './enums'
import { getTreeViews } from '../treeview'
import { ProjectURLsTreeItem } from '../treeview/models'

vscode.commands.registerCommand(ECommands.TREEVIEW_OPEN_IN_BROWSER, (url) => {
    vscode.env.openExternal(vscode.Uri.parse(url.label))
})

vscode.commands.registerCommand(ECommands.TREEVIEW_OPEN_IN_FILE, (url: ProjectURLsTreeItem) => {
    if (url.sourceFilePath === undefined) return;
    vscode.workspace.openTextDocument(url.sourceFilePath).then( document => {
        vscode.window.showTextDocument(document).then( editor => {
                const pos = new vscode.Position(url.sourceFileLineNumber, url.sourceFileColumnNumber);
                editor.selection = new vscode.Selection(pos, pos);
                editor.revealRange(new vscode.Range(pos, pos));
            }
        );
    });
})

export const openCommand = vscode.commands.registerCommand(ECommands.OPEN, () => {
    openWebview()
})

export const syncCommand = vscode.commands.registerCommand(ECommands.SYNC, () => {
    const context = getContext()

    if (!context) {
        return
    }

    const shouldShowIgnored = context.workspaceState.get<boolean>('shouldShowIgnored') || false

    syncURLs(shouldShowIgnored)

    getTreeViews().then((treeviews) => {
        treeviews.STARRED_TREEVIEW.updateTreviewData()
        treeviews.NORMAL_TREEVIEW.updateTreviewData()
        treeviews.IGNORED_TREEVIEW.updateTreviewData()
    })
})

export const clearCache = vscode.commands.registerCommand(ECommands.CLEAR_CACHE, () => {
    const context = getContext()

    if (!context) {
        return
    }
    const shouldShowIgnored = context.workspaceState.get<boolean>('shouldShowIgnored') || false

    context.workspaceState.update('urls', [])

    syncURLs(shouldShowIgnored)

    getTreeViews().then((treeviews) => {
        treeviews.STARRED_TREEVIEW.updateTreviewData(true)
        treeviews.NORMAL_TREEVIEW.updateTreviewData(true)
        treeviews.IGNORED_TREEVIEW.updateTreviewData(true)
    })
})
