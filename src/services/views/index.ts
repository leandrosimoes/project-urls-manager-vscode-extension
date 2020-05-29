import * as vscode from 'vscode';
import { join, extname } from 'path';
import { readFileSync, existsSync, readdirSync } from "fs";

const pageIcon = require('page-icon');

import { getURLs } from '../urls';
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
            const filePath = _WebViewPanel.webview.asWebviewUri(vscode.Uri.file(join(scriptsPath, file)));
            scripts.push(`<script src="${filePath}"></script>`);
        }
    });

    return scripts;
};

const prepareHTML = async (html: string) => {
    const context = getContext();

    if (!context) {
        return 'ERROR LOADING HTML CONTENT';
    }

    const scripts = await getScriptsToInject();

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

export const getHTML = async (force = false) => {
    if (!force) {
        return _HTML;
    }

    const context = getContext();

    if (!context) {
        return;
    }

    const htmlFilePath = join(context.extensionPath, 'src', 'assets', 'index.html');
    let htmlFileContent = readFileSync(htmlFilePath).toString();

    htmlFileContent = await prepareHTML(htmlFileContent);

    _HTML = htmlFileContent;

    return _HTML;
};

export const openWebview = async () => {
    const context = getContext();
    
    if (!context) {
        return;
    }

    const column = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

    if (_WebViewPanel) {
        _WebViewPanel.reveal(column);
    } else {
        _WebViewPanel = vscode.window.createWebviewPanel('projectUrlManager', EXTENSION_NAME, column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });

        _WebViewPanel.onDidDispose(() => {
            _WebViewPanel = undefined;
        });
    }

    const viewHtml = await getHTML(true);

    if (!viewHtml) {
        return;
    }

    _WebViewPanel.webview.html = viewHtml;
    
    const urls = (await getURLs(true));
    
    await asyncForEach(urls, async (url: IURL) => {
        if (url.favicon) {
            url.favicon = _WebViewPanel?.webview.asWebviewUri(vscode.Uri.parse(url.favicon)).toString();
        }
    });

    _WebViewPanel.webview.postMessage({ urls });

    await asyncForEach(urls, async (url: IURL) => {
        try {
            const favicon: IIcon = await pageIcon(`${url.protocol}//${url.hostname}`);
            url.favicon = favicon.source;
        } catch (error) {}
    });

    _WebViewPanel.webview.postMessage({ urls });
};