import * as vscode from 'vscode';
import { resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

import { CONFIGURATIONS_FILE_NAME } from '../../constants';
import { logger } from '../logger';

interface IAutoSync {
    interval: number
}

interface IConfigurations {
    ignore?: string[]
    extensions?: string[]
    autoSync?: IAutoSync
}

const createConfigurationBaseFile = async () => {
    try {
        const configurationsPath = `${vscode.workspace.rootPath}\\${CONFIGURATIONS_FILE_NAME}`;

        const baseConfigurationFilePath = resolve(__dirname, "..", "..", "assets", "pam.config-base.json");

        if (!existsSync(baseConfigurationFilePath)) {
            return;
        }

        const baseConfigurationFileContent = readFileSync(baseConfigurationFilePath).toString();

        if (!baseConfigurationFileContent) {
            return;
        }

        writeFileSync(configurationsPath, baseConfigurationFileContent);
        
        return true;
    } catch (error) {
        logger.log({ message: `Error creating base config file: ${error.message}` });
        return false;
    }
};

export const getConfigurations = async (): Promise<IConfigurations | undefined> => {
    try {
        const configurationsPath = `${vscode.workspace.rootPath}\\${CONFIGURATIONS_FILE_NAME}`;

        if (!existsSync(configurationsPath) && !(await createConfigurationBaseFile())) {
            return;
        }

        const configurationsFileContent = readFileSync(configurationsPath).toString();

        if (!configurationsFileContent) {
            return;
        }

        const configurations = (JSON.parse(configurationsFileContent) as IConfigurations);
        
        return configurations;
    } catch (error) {
        logger.log({ message: `Error reading configurations: ${error.message}` });
    }
};