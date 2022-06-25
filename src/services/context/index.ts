import * as vscode from 'vscode'

let CONTEXT: vscode.ExtensionContext | undefined

export const setContext = (context: vscode.ExtensionContext): vscode.ExtensionContext => {
    CONTEXT = CONTEXT || context

    return CONTEXT
}

export const getContext = (): vscode.ExtensionContext | undefined => {
    return CONTEXT
}
