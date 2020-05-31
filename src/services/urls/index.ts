import * as vscode from 'vscode';
import { readdirSync, readFileSync, statSync } from 'fs';
import { extname, join } from 'path';
import { URL, IURL } from '../../models/url';

import { asyncForEach } from '../../utils';
import { logger } from '../logger';
import { getConfigurations } from '../configurations';
import { getContext } from '../context';

let _URLS: IURL[] = [];
let autoSyncInterval: NodeJS.Timeout;

function cleanURL(url: string) {
    return url.replace(/[\'\"\(\)\`\´,\\\{\}\<\>\|\^]/g, '').trim();
}

async function updateProjectUrls(rootPath = vscode.workspace.rootPath, showIgnored?: boolean) {
	if (!rootPath) {
		return;
	};
	
    const configurations = await getConfigurations();
    const ignore = configurations?.ignore || [];
    const extensions = configurations?.extensions || [];
    const context = getContext();

    if (!context) {
        return;
    }

    const assetsPath = join(context.extensionPath, 'src', 'assets');
    const fallbackFaviconPath = vscode.Uri.file(join(assetsPath, 'fallback-favicon.png'));

    const files = readdirSync(rootPath);
	await asyncForEach(files, async (file: string) => {
        const filePath = `${rootPath}\\${file}`;
        const stat = statSync(filePath);

		if (stat.isDirectory()) {
            if (ignore.indexOf(file) > -1) {
                logger.log({ message: `Directory ignored: '${file}'` });
                return;
            }

			await updateProjectUrls(filePath, showIgnored);
			return;
        }
        

        if (file === 'pam.config.json') {
            return;
        }

        if (ignore.indexOf(file) > -1) {
            logger.log({ message: `File ignored: '${file}'` });
            return;
        }

        const fileExtension = extname(file);
        if (extensions.length > 0 && extensions.indexOf(fileExtension) === -1) {
            logger.log({ message: `File extension ignored: '${file}'` });
            return;
        }

		const content = readFileSync(filePath).toString();
		const urlsFound = content.match(/(https?:\/\/[^ ]*)/g);
        const ignoredURLs: string[] = (context.workspaceState.get<string[]>('ignoredURLs') || []);
		
		if (urlsFound && urlsFound.length > 0) {
            await asyncForEach(urlsFound, (url: string) => {
                const urlInstance = new URL(cleanURL(url));
                if (urlInstance.url.host && (showIgnored || ignoredURLs.indexOf(urlInstance.url.href) === -1) && !_URLS.find(u => u.href === urlInstance.url.href)) {
                    urlInstance.url.favicon = fallbackFaviconPath.toString();
                    urlInstance.url.isIgnored = (ignoredURLs.indexOf(urlInstance.url.href) > -1);
                    urlInstance.url.hasFavicon = false;
                    _URLS.push(urlInstance.url);
                }
            });

            logger.log({ message: `${urlsFound.length} URL(s) found in "${filePath}".` });
		} else {
            logger.log({ message: `No URL found in "${filePath}".` });
        }
	});
}

export const getURLs = async (forceSync = false, showIgnored: boolean): Promise<IURL[]>  => {
    if (forceSync) {
        await syncURLs(showIgnored);
    }
    
    return _URLS;
};

export const syncURLs = async (showIgnored: boolean) => {
    try {
        _URLS = [];

        logger.clear();
        logger.log({ message: 'Syncing Project URLs ...', setStatusBarMessage: true });
        
        await updateProjectUrls(undefined, showIgnored);

        logger.log({ message: `${_URLS.length} URL(s) found`, setStatusBarMessage: true });
    } catch (error) {
        logger.log({ message: error.message });
    }
};

export const startAutoSync = async (showIgnored: boolean) => {
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

                    await syncURLs(showIgnored);
                })();
            }, minutes);
        }
    } catch (error) {
        logger.log({ message: `Error starting auto sync: ${error.message}` });
    }
};