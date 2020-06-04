// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode'

import { EXTENSION_NAME } from './constants'
import { openCommand, syncCommand, clearCache } from './services/commands'
import { logger } from './services/logger'
import { syncURLs } from './services/urls'
import { setContext } from './services/context'

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

    const shouldShowIgnored = context.workspaceState.get<boolean>('shouldShowIgnored') || false

    // Syncing URLS on start
    ;(async () => {
        await syncURLs(shouldShowIgnored)
    })()
}

// this method is called when your extension is deactivated
export function deactivate() {}
