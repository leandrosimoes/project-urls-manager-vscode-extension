// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode'

import { EXTENSION_NAME } from '../../constants'
import { ECommands } from '../commands/enums'
import { ILogOptions } from './interfaces'

let output: vscode.OutputChannel
let statusBar: vscode.StatusBarItem

const getStatusBarInstance = () => {
    if (!statusBar) {
        statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
        statusBar.command = ECommands.OPEN
    }

    return statusBar
}

const getOutputChannelInstance = () => {
    if (!output) {
        output = vscode.window.createOutputChannel(EXTENSION_NAME)
    }

    return output
}

export const logger = {
    log: (options: ILogOptions) => {
        const opc = getOutputChannelInstance()
        const stb = getStatusBarInstance()

        if (options.clear) {
            opc.clear()
        }

        if (options.doNotBreakLine) {
            opc.append(options.message)
        } else {
            opc.appendLine(options.message)
        }

        if (options.setStatusBarMessage) {
            stb.text = options.message
            stb.show()
        }
    },
    clear: () => {
        const opc = getOutputChannelInstance()
        opc.clear()
    },
    setStatusBarMessage: (message: string) => {
        const stb = getStatusBarInstance()
        stb.text = message
        stb.show()
    },
    hideStatusBar: () => {
        const stb = getStatusBarInstance()
        stb.hide()
    },
    showStatusBar: () => {
        const stb = getStatusBarInstance()
        stb.show()
    },
    getStatusBarInstance,
    getOutputChannelInstance,
}

export default {
    logger,
}
