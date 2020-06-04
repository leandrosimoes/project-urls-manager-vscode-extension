// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode'

import { logger } from '../logger'
import { getContext } from '../context'
import { IConfigurations } from './interfaces'

export const getConfigurations = async (): Promise<IConfigurations> => {
    try {
        const ignorePaths =
            vscode.workspace.getConfiguration('projectURLsManager').get<string>('ignorePaths') || ''

        const extensionsList =
            vscode.workspace.getConfiguration('projectURLsManager').get<string>('extensionsList') ||
            ''

        const configurations: IConfigurations = {
            ignore: ignorePaths
                .split(',')
                .map((i) => i.trim())
                .filter((i) => !!i),
            extensions: extensionsList
                .split(',')
                .map((i) => i.trim())
                .filter((i) => !!i),
        }

        return configurations
    } catch (error) {
        logger.log({ message: `Error reading configurations: ${error.message}` })
        return {
            ignore: ['node_modules'],
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        }
    }
}

export default { getConfigurations, getContext }
