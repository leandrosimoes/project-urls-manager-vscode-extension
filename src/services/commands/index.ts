// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode'

import { syncURLs } from '../urls'
import { openWebview } from '../webview'
import { getContext } from '../context'
import { ECommands } from './enums'
import { getTreeViews } from '../treeview'

export const openURL = vscode.commands.registerCommand(ECommands.TREEVIEW_OPEN_URL, (url) => {
    vscode.env.openExternal(vscode.Uri.parse(url))
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
        treeviews.STARRED_TREEVIEW.updateTreviewData()
        treeviews.NORMAL_TREEVIEW.updateTreviewData()
        treeviews.IGNORED_TREEVIEW.updateTreviewData()
    })
})
