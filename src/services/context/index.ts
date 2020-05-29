import * as vscode from 'vscode';

let _CURRENT_CONTEXT: vscode.ExtensionContext | undefined;

export const setContext = (context: vscode.ExtensionContext): vscode.ExtensionContext => {
    _CURRENT_CONTEXT = _CURRENT_CONTEXT || context;

    return _CURRENT_CONTEXT;
};

export const getContext = (): vscode.ExtensionContext | undefined => {
    return _CURRENT_CONTEXT;
};