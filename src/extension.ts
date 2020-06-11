// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode'

import { EXTENSION_NAME } from './constants'
import { openCommand, syncCommand, clearCache } from './services/commands'
import { logger } from './services/logger'
import { syncURLs } from './services/urls'
import { setContext } from './services/context'
import { getInstance, openWebview } from './services/webview'
import { setupTreeViews } from './services/treeview'

export function activate(context: vscode.ExtensionContext) {
    if (!vscode.workspace.rootPath) {
        return
    }

    setContext(context)

    logger.log({ message: `${EXTENSION_NAME} Started ...` })

    context.subscriptions.push(openCommand)
    context.subscriptions.push(syncCommand)
    context.subscriptions.push(clearCache)
    context.subscriptions.push(logger.getStatusBarInstance())

    const syncCallback = () => {
        const webviewPannel = getInstance()

        if (webviewPannel) {
            openWebview(true)
        } else {
            const shouldShowIgnored =
                context.workspaceState.get<boolean>('shouldShowIgnored') || false
            syncURLs(shouldShowIgnored).then(() => {
                setupTreeViews().then((treeviews) => {
                    treeviews.IGNORED_TREEVIEW.updateTreviewData()
                    treeviews.NORMAL_TREEVIEW.updateTreviewData()
                    treeviews.IGNORED_TREEVIEW.updateTreviewData()
                })
            })
        }
    }

    vscode.workspace.onDidChangeConfiguration(syncCallback)
    vscode.workspace.onDidSaveTextDocument(syncCallback)
    vscode.workspace.onDidDeleteFiles(syncCallback)

    // Syncing URLS on start
    ;(async () => {
        const shouldShowIgnored = context.workspaceState.get<boolean>('shouldShowIgnored') || false
        await syncURLs(shouldShowIgnored)
        const treeViews = await setupTreeViews()

        treeViews.IGNORED_TREEVIEW.updateTreviewData()
        treeViews.NORMAL_TREEVIEW.updateTreviewData()
        treeViews.IGNORED_TREEVIEW.updateTreviewData()
    })()
}

// this method is called when your extension is deactivated
export function deactivate() {
    const stb = logger.getStatusBarInstance()
    const opc = logger.getOutputChannelInstance()

    if (stb) {
        stb.dispose()
    }

    if (opc) {
        opc.dispose()
    }
}
