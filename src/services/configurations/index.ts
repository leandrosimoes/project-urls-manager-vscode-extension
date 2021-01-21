// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode'

import { logger } from '../logger'
import { getContext } from '../context'
import { IConfigurations } from './interfaces'

export const getConfigurations = async (): Promise<IConfigurations> => {
    const defaultResult = {
        ignorePaths: [
            'node_modules',
            'android,ios',
            '.vscode',
            '.git',
            '.github',
            'package-lock.json',
            'yarn.lock',
        ],
        extensionsList: [
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.html',
            '.css',
            '.xml',
            '.txt',
            '.json',
            '.md',
        ],
        ignoreDomains: [],
    }

    try {
        const ignorePaths =
            vscode.workspace.getConfiguration('projectURLsManager').get<string>('ignorePaths') || ''

        const extensionsList =
            vscode.workspace.getConfiguration('projectURLsManager').get<string>('extensionsList') ||
            ''

        const ignoreDomains =
            vscode.workspace.getConfiguration('projectURLsManager').get<string>('ignoreDomains') ||
            ''

        const configurations: IConfigurations = {
            ignorePaths: ignorePaths
                .split(',')
                .map((i) => i.trim())
                .filter((i) => !!i),
            extensionsList: extensionsList
                .split(',')
                .map((i) => i.trim())
                .filter((i) => !!i),
            ignoreDomains: ignoreDomains
                .split(',')
                .map((i) => i.trim())
                .filter((i) => !!i),
        }

        return configurations
    } catch (error) {
        logger.log({
            message: `Error reading configurations: ${error.message}`,
        })
        logger.log({
            message: `Using this default settings: ${JSON.stringify(defaultResult, null, 2)}`,
        })
        return defaultResult
    }
}

export default { getConfigurations, getContext }
