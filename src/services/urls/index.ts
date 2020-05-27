import * as vscode from 'vscode';
import { readdirSync, readFileSync, statSync } from 'fs';

import { asyncForEach } from '../../utils';
import { logger } from '../log';

const _URLS = new Set<string>();

async function updateProjectUrls(rootPath = vscode.workspace.rootPath) {
	if (!rootPath) {
		return;
	};
	
	const files = readdirSync(rootPath);
	await asyncForEach(files, async (file: string) => {
		const filePath = `${rootPath}\\${file}`;
		const stat = statSync(filePath);

		if (stat.isDirectory()) {
			await updateProjectUrls(filePath);
			return;
		}

		const content = readFileSync(filePath).toString();
		const urlsFound = content.match(/(https?:\/\/[^ ]*)/g);
		
		if (urlsFound && urlsFound.length > 0) {
            logger.log({ message: `${urlsFound.length} URL(s) found in "${filePath}".` });
            await asyncForEach(urlsFound, (url: string) => _URLS.add(url));
		} else {
            logger.log({ message: `No URL found in "${filePath}".` });
        }
	});
}


export const getURLs = async (forceSync = false) => {
    if (forceSync) {
        await syncURLs();
    }

    return _URLS.values;
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