import * as vscode from 'vscode';
import { readdirSync, readFileSync, statSync } from 'fs';

import { asyncForEach } from '../../utils';
import { logger } from '../logger';
import { getConfigurations } from '../configurations';

const _URLS = new Set<string>();
let autoSyncInterval: NodeJS.Timeout;

function cleanURL(url: string) {
    return url.replace(/[\'\"\(\)\`\´,\\\{\}\<\>\|\^]/g, '');
}

async function updateProjectUrls(rootPath = vscode.workspace.rootPath) {
	if (!rootPath) {
		return;
	};
	
    const configurations = await getConfigurations();
    const ignore = configurations?.ignore || [];
    const extensions = configurations?.extensions || [];

    const files = readdirSync(rootPath);
	await asyncForEach(files, async (file: string) => {
		const filePath = `${rootPath}\\${file}`;
        const stat = statSync(filePath);

		if (stat.isDirectory()) {
            if (ignore.indexOf(file) > -1) {
                logger.log({ message: `Directory ignored: '${file}'` });
                return;
            }

			await updateProjectUrls(filePath);
			return;
        }
        
        const splitedFileName = file.split('.');
        const fileExtension = splitedFileName && splitedFileName.length > 0 ? `.${splitedFileName.reverse()[0]}` : '';

        if (file === 'pam.config.json') {
            return;
        }

        if (ignore.indexOf(file) > -1) {
            logger.log({ message: `File ignored: '${file}'` });
            return;
        }

        if (extensions.length > 0 && extensions.indexOf(fileExtension) === -1) {
            logger.log({ message: `File extension ignored: '${file}'` });
            return;
        }

		const content = readFileSync(filePath).toString();
		const urlsFound = content.match(/(https?:\/\/[^ ]*)/g);
		
		if (urlsFound && urlsFound.length > 0) {
            logger.log({ message: `${urlsFound.length} URL(s) found in "${filePath}".` });
            await asyncForEach(urlsFound, (url: string) => _URLS.add(cleanURL(url)));
		} else {
            logger.log({ message: `No URL found in "${filePath}".` });
        }
	});
}


export const getURLs = async (forceSync = false) => {
    if (forceSync) {
        await syncURLs();
    }

    return _URLS;
};

export const syncURLs = async () => {
    try {
        _URLS.clear();

        logger.clear();
        logger.log({ message: 'Syncing Project URLs ...', setStatusBarMessage: true });
        
        await updateProjectUrls();

        logger.log({ message: `${_URLS.size} URL(s) found`, setStatusBarMessage: true });
    } catch (error) {
        logger.log({ message: error.message });
    }
};

export const startAutoSync = async () => {
    try {
        if (autoSyncInterval) {
            clearInterval(autoSyncInterval);
        }
        
        logger.log({ message: `Starting auto sync ...` });
        
        const configurations = await getConfigurations();
        
        if (configurations?.autoSync) {
            let { interval = 1 } = configurations.autoSync;

            if (interval < 1) {
                interval = 1;
            }

            const minutes = interval * 60 * 1000;

            autoSyncInterval = setInterval(() => { 
                (async () => {
                    logger.log({ message: `Auto sync ...` });

                    await syncURLs();
                })();
            }, minutes);
        }
    } catch (error) {
        logger.log({ message: `Error starting auto sync: ${error.message}` });
    }
};