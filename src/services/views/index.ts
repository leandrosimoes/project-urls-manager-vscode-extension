import * as vscode from 'vscode';
import { join, extname } from 'path';
import { readFileSync, existsSync, readdirSync } from "fs";

const pageIcon = require('page-icon');

import { getURLs, saveURLDescription, addURLToIgnoreList, restoreURLFromIgnoreList } from '../urls';
import { EXTENSION_NAME } from '../../constants';
import { getContext } from '../context';
import { asyncForEach } from '../../utils';
import { IURL } from '../../models/url';

let _HTML = '';
let _WebViewPanel: vscode.WebviewPanel | undefined;

interface IIcon {
    source: string;
    name: string;
    data: Buffer;
    size: number;
    ext: string;
    mime: string;
}

interface CacheIcon extends IIcon {
    baseURL: string;
    base64: string;
}


// THIS MUST MATCH THE ActionTypes OBJECT IN script.js
enum ActionTypes {
    URL = 'URL',
    URL_ICON = 'URL_ICON',
    ICON = 'ICON',
    COPY = 'COPY',
    IGNORE = 'IGNORE',
    RESTORE = 'RESTORE',
    START_LOADING = 'START_LOADING',
    STOP_LOADING = 'STOP_LOADING',
    SAVE_URL_DESCRIPTION = 'SAVE_URL_DESCRIPTION',
    TOGGLE_THEME = 'TOGGLE_THEME',
    TOGGLE_SHOW_IGNORED = 'TOGGLE_SHOW_IGNORED'
}

enum Themes {
    DARK = 'dark-theme',
    LIGHT = 'light-theme'
}

const startLoading = () => {
    if (!_WebViewPanel) {
        return;
    }

    _WebViewPanel.webview.postMessage({ type: ActionTypes.START_LOADING });
};

const stopLoading = () => {
    if (!_WebViewPanel) {
        return;
    }

    _WebViewPanel.webview.postMessage({ type: ActionTypes.STOP_LOADING });
};

const getStylesToInject = async (): Promise<string[] | undefined> => {
    const context = getContext();

    if (!context) {
        return;
    }
    
    const styles: string[] = [];
    const stylesPath = join(context.extensionPath, 'src', 'assets');

    if (!existsSync(stylesPath)) {
        return;
    }

    const styleFiles = readdirSync(stylesPath);
    await asyncForEach(styleFiles, async (file: string) => {
        if (extname(file) === '.css' && _WebViewPanel) {
            const filePath = _WebViewPanel.webview.asWebviewUri(vscode.Uri.file(join(stylesPath, file)));
            styles.push(`<link rel="stylesheet" href="${filePath}">`);
        }
    });

    return styles;
};


const getScriptsToInject = async (): Promise<string[] | undefined> => {
    const context = getContext();
    const order = ['knockout.min.js', 'knockout.mapping.min.js', 'script.js'];

    if (!context) {
        return;
    }
    
    const scripts: string[] = [];
    const scriptsPath = join(context.extensionPath, 'src', 'assets');

    if (!existsSync(scriptsPath)) {
        return;
    }

    const scriptFiles = readdirSync(scriptsPath);
    await asyncForEach(scriptFiles, async (file: string) => {
        if (extname(file) === '.js' && _WebViewPanel) {
            const index = order.indexOf(file);
            const filePath = _WebViewPanel.webview.asWebviewUri(vscode.Uri.file(join(scriptsPath, file)));
            const script = `<script src="${filePath}"></script>`;

            if (index >= 0 && scripts.indexOf(script) === -1) {
                scripts[index] = script;
            } else if (index < 0 && scripts.indexOf(script) === -1) {
                scripts.push(script);
            }
        }
    });

    return scripts;
};

const prepareHTML = async (html: string, showIgnored: boolean) => {
    const context = getContext();

    if (!context) {
        return 'ERROR LOADING HTML CONTENT';
    }

    html = html.replace(/{{SHOW_IGNORED}}/g, showIgnored ? ' show-ignored' : '');

    const scripts = await getScriptsToInject();
    const currentTheme = context.workspaceState.get<string>('theme') || Themes.DARK;
    html = html.replace(/{{THEME}}/g, currentTheme);

    if (scripts && scripts.length > 0) {
        html = html.replace(/{{SCRIPTS}}/g, scripts.join('\n'));
    } else {
        html = html.replace(/{{SCRIPTS}}/g, '');
    }

    const styles = await getStylesToInject();
    if (styles && styles.length > 0) {
        html = html.replace(/{{STYLES}}/g, styles.join('\n'));
    } else {
        html = html.replace(/{{STYLES}}/g, '');
    }

    html = html.replace(/{{TITLE}}/g, EXTENSION_NAME);

    return html;
};

export const getHTML = async (force = false, showIgnored: boolean) => {
    if (!force) {
        return _HTML;
    }

    const context = getContext();

    if (!context) {
        return;
    }

    const htmlFilePath = join(context.extensionPath, 'src', 'assets', 'index.html');
    let htmlFileContent = readFileSync(htmlFilePath).toString();

    htmlFileContent = await prepareHTML(htmlFileContent, showIgnored);

    _HTML = htmlFileContent;

    return _HTML;
};

const sendURLs = async (forceSync: boolean, showIgnored: boolean) => {
    const context = getContext();

    if (!context || !_WebViewPanel) {
        return;
    }

    const urls = (await getURLs(forceSync, showIgnored));
    const assetsPath = join(context.extensionPath, 'src', 'assets');
    const fallbackFaviconPath = vscode.Uri.file(join(assetsPath, 'fallback-favicon.png'));

    await asyncForEach(urls, async (url: IURL) => {
        if (!url.hasFavicon && _WebViewPanel) {
            url.favicon = _WebViewPanel.webview.asWebviewUri(fallbackFaviconPath).toString();
            url.hasFavicon = false;
        }
    });

    _WebViewPanel.webview.postMessage({ urls, type: ActionTypes.URL });
};

const sendFavicons = async () => {
    const context = getContext();

    if (!context) {
        return;
    }

    const existentURLs = context.workspaceState.get<IURL[]>('urls');

    if (!_WebViewPanel || !existentURLs || existentURLs.length === 0) {
        return;
    }

    await asyncForEach(existentURLs, async (url: IURL) => {
        try {
            if (!url.hasFavicon) {
                const favicon: IIcon = await pageIcon(`${url.protocol}//${url.hostname}`);
                url.favicon = `data:${favicon.mime};base64, ${favicon.data.toString('base64')}`;
                url.hasFavicon = true;
            }
        } catch (error) {}
    });

    context.workspaceState.update('urls', existentURLs);

    _WebViewPanel.webview.postMessage({ urls: existentURLs, type: ActionTypes.URL_ICON });
};

const sendIcons = async () => {
    const context = getContext();

    if (!_WebViewPanel || !context) {
        return;
    }

    const iconsPath = join(context.extensionPath, 'src', 'assets');
    const icons: any = {};

    const copyClipboardIconPath = _WebViewPanel.webview.asWebviewUri(vscode.Uri.file(join(iconsPath, 'copy-clipboard.png')));
    const ignoreIconPath = _WebViewPanel.webview.asWebviewUri(vscode.Uri.file(join(iconsPath, 'ignore.png')));
    const restoreIconPath = _WebViewPanel.webview.asWebviewUri(vscode.Uri.file(join(iconsPath, 'restore.png')));
    icons['copy-clipboard'] = copyClipboardIconPath.toString();
    icons['ignore'] = ignoreIconPath.toString();
    icons['restore'] = restoreIconPath.toString();

    _WebViewPanel.webview.postMessage({ icons, type: ActionTypes.ICON });
};

export const openWebview = async () => {
    const context = getContext();
    
    if (!context) {
        return;
    }

    const showIgnored = context.workspaceState.get<boolean>('showIgnored') || false;
    const column = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

    if (_WebViewPanel) {
        _WebViewPanel.reveal(column);
        startLoading();
    } else {
        _WebViewPanel = vscode.window.createWebviewPanel('projectUrlManager', EXTENSION_NAME, column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });

        _WebViewPanel.onDidDispose(() => {
            _WebViewPanel = undefined;
        });

        _WebViewPanel.webview.onDidReceiveMessage((message: any) => {
            const currentContext = getContext();

            if (!currentContext) {
                return;
            }

            const currentShowIgnored = currentContext.workspaceState.get<boolean>('showIgnored') || false;
            const { url } = message;

            switch (message.type) {
                case ActionTypes.COPY:
                    
                    if (url.href) {
                        vscode.env.clipboard.writeText(url.href);
                    }

                    break;

                case ActionTypes.IGNORE:
                    addURLToIgnoreList(url)
                        .then(() => {
                            getHTML(true, currentShowIgnored).then(html => {
                                if (html && _WebViewPanel) {
                                    _WebViewPanel.webview.html = html;
        
                                    sendIcons().then(() => {
                                        sendURLs(true, currentShowIgnored).then(() => {
                                            sendFavicons().then(() => {
                                                stopLoading();
                                            });
                                        });
                                    });
                                }
                            });
                        });
                    break;

                case ActionTypes.RESTORE:
                    restoreURLFromIgnoreList(url)
                        .then(() => {
                            getHTML(true, currentShowIgnored).then(html => {
                                if (html && _WebViewPanel) {
                                    _WebViewPanel.webview.html = html;
        
                                    sendIcons().then(() => {
                                        sendURLs(true, currentShowIgnored).then(() => {
                                            sendFavicons().then(() => {
                                                stopLoading();
                                            });;
                                        });
                                    });
                                }
                            });
                        });
                    break;

                case ActionTypes.SAVE_URL_DESCRIPTION:
                    saveURLDescription(url)
                        .then(() => {
                            getHTML(true, currentShowIgnored).then(html => {
                                if (html && _WebViewPanel) {
                                    _WebViewPanel.webview.html = html;
        
                                    sendIcons().then(() => {
                                        sendURLs(true, currentShowIgnored).then(() => {
                                            sendFavicons().then(() => {
                                                stopLoading();
                                            });;
                                        });
                                    });
                                }
                            });
                        });

                    break;

                case ActionTypes.TOGGLE_THEME:

                    const currentTheme = currentContext.workspaceState.get<string>('theme') || Themes.DARK;
                    currentContext.workspaceState.update('theme', currentTheme === Themes.DARK ? Themes.LIGHT : Themes.DARK);
                    getHTML(true, currentShowIgnored).then(html => {
                        if (html && _WebViewPanel) {
                            _WebViewPanel.webview.html = html;
        
                            sendIcons().then(() => {
                                sendURLs(true, currentShowIgnored).then(() => {
                                    sendFavicons().then(() => {
                                        stopLoading();
                                    });;
                                });
                            });
                        }
                    });

                    break;

                case ActionTypes.TOGGLE_SHOW_IGNORED:

                    currentContext.workspaceState.update('showIgnored', !currentShowIgnored);
                    getHTML(true, !currentShowIgnored).then(html => {
                        if (html && _WebViewPanel) {
                            _WebViewPanel.webview.html = html;
        
                            sendIcons().then(() => {
                                sendURLs(true, !currentShowIgnored).then(() => {
                                    sendFavicons().then(() => {
                                        stopLoading();
                                    });;
                                });
                            });
                        }
                    });
                    break;

                default:
                    break;
            }
        });
    }

    const viewHtml = await getHTML(true, showIgnored);

    if (!viewHtml) {
        return;
    }

    _WebViewPanel.webview.html = viewHtml;

    await sendIcons();
    await sendURLs(true, showIgnored);
    await sendFavicons();
    stopLoading();
};