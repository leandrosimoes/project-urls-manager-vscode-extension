import { resolve } from 'path';
import { readFileSync } from "fs";
import { getURLs } from '../urls';
import { EXTENSION_NAME } from '../../constants';

let _HTML = '';

const prepareHTML = async (html: string) => {
    const urls = await getURLs(true);
    const urlsListItems = [...urls].map(url => `<li><a target="_blank" href="${url}">${url}</a></li>`);

    html = html.replace(/{{TITLE}}/g, EXTENSION_NAME);
    html = html.replace(/{{LIST_ITEMS}}/g, urlsListItems.join(''));

    return html;
};

export const getHTML = async (force = false) => {
    if (!force) {
        return _HTML;
    }

    const htmlFilePath = resolve(__dirname, "..", "..", "assets", "index.html");
    let htmlFileContent = readFileSync(htmlFilePath).toString();

    htmlFileContent = await prepareHTML(htmlFileContent);

    _HTML = htmlFileContent;

    return _HTML;
};