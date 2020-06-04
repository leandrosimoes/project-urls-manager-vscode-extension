// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'

import { CONFIGURATIONS_FILE_NAME } from '../../constants'
import { logger } from '../logger'
import { getContext } from '../context'
import { getAssetsPaths } from '../assets'
import { IConfigurations } from './interfaces'

const createConfigurationBaseFile = async () => {
    try {
        const context = getContext()

        if (!context) {
            return false
        }

        const assetsPaths = getAssetsPaths()
        const configurationsPath = `${vscode.workspace.rootPath}\\${CONFIGURATIONS_FILE_NAME}`
        const baseConfigurationFilePath = join(assetsPaths.root, 'pam.config.json')

        if (!existsSync(baseConfigurationFilePath)) {
            return false
        }

        const baseConfigurationFileContent = readFileSync(baseConfigurationFilePath).toString()

        if (!baseConfigurationFileContent) {
            return false
        }

        writeFileSync(configurationsPath, baseConfigurationFileContent)

        return true
    } catch (error) {
        logger.log({ message: `Error creating base config file: ${error.message}` })
        return false
    }
}

export const getConfigurations = async (): Promise<IConfigurations | undefined> => {
    try {
        const configurationsPath = `${vscode.workspace.rootPath}\\${CONFIGURATIONS_FILE_NAME}`

        if (!existsSync(configurationsPath) && !(await createConfigurationBaseFile())) {
            return undefined
        }

        const configurationsFileContent = readFileSync(configurationsPath).toString()

        if (!configurationsFileContent) {
            return undefined
        }

        const configurations = JSON.parse(configurationsFileContent) as IConfigurations

        return configurations
    } catch (error) {
        logger.log({ message: `Error reading configurations: ${error.message}` })
        return undefined
    }
}

export default { getConfigurations, getContext }
