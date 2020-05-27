import * as vscode from 'vscode';

import { EXTENSION_NAME } from '../../constants';
import { Commands } from '../../commands';

let output: vscode.OutputChannel;
let statusBar: vscode.StatusBarItem;

export interface LogOptions {
    message: string
    doNotBreakLine?: boolean
    clear?: boolean
    setStatusBarMessage?: boolean
}

const getStatusBarInstance = () => {
    if (!statusBar) {
        statusBar =  vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBar.command = Commands.OPEN;
    }

    return statusBar;
};

const getOutputChannelInstance = () => {
    if (!output) {
        output = vscode.window.createOutputChannel(EXTENSION_NAME);
    }

    return output;
};

export const logger = {
    log: (options: LogOptions) => {
        const opc = getOutputChannelInstance();
        const stb = getStatusBarInstance();

        if (options.clear) {
            opc.clear();
        };
        
        options.doNotBreakLine 
            ? opc.append(options.message) 
            : opc.appendLine(options.message);

        if (options.setStatusBarMessage) {
            stb.text = options.message;
            stb.show();
        };
    },
    clear: () => {
        const opc = getOutputChannelInstance();
        opc.clear();
    },
    setStatusBarMessage: (message: string) => { 
        const stb = getStatusBarInstance();
        stb.text = message;
        stb.show();
    },
    hideStatusBar: () => {
        const stb = getStatusBarInstance();
        stb.hide();
    },
    showStatusBar: () => {
        const stb = getStatusBarInstance();
        stb.show();
    },
    getStatusBarInstance,
    getOutputChannelInstance,
};