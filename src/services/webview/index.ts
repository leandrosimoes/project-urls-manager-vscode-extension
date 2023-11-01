import * as vscode from 'vscode'
import { join, extname } from 'path'
import { readFileSync, existsSync, readdirSync } from 'fs'

import {
    getURLs,
    saveURLDescription,
    addURLToIgnoreList,
    restoreURLFromIgnoreList,
    addURLToStarredList,
    restoreURLFromStarredList,
} from '../urls'
import { EXTENSION_NAME, EXTENSION_ID } from '../../constants'
import { getContext } from '../context'
import { waitForXSeconds } from '../../utils'
import { IURL } from '../urls/interfaces'
import { getAssetsPaths } from '../assets'
import { IFavicon } from './interfaces'
import { EActionTypes } from './enums'
import { logger } from '../logger'
import { getTreeViews } from '../treeview'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pageIcon = require('page-icon')

let HTML = ''
let WEBVIEW_PANNEL: vscode.WebviewPanel | undefined

export const getInstance = () => WEBVIEW_PANNEL

const startLoading = async () => {
    if (!WEBVIEW_PANNEL) {
        return
    }

    logger.log({ message: `0 $(sync~spin)`, shouldSetStatusBarMessage: true })

    WEBVIEW_PANNEL.webview.postMessage({ type: EActionTypes.START_LOADING })

    await waitForXSeconds(1)
}

const stopLoading = async () => {
    if (!WEBVIEW_PANNEL) {
        return
    }

    logger.log({ message: 'Stop Loading ...' })

    WEBVIEW_PANNEL.webview.postMessage({ type: EActionTypes.STOP_LOADING })

    await waitForXSeconds(1)
}

const getStylesToInject = async (): Promise<string[] | undefined> => {
    try {
        logger.log({ message: 'Injecting style ...' })

        const context = getContext()

        if (!context) {
            return undefined
        }

        const assetsPaths = getAssetsPaths()

        const styles: string[] = []

        if (!existsSync(assetsPaths.css)) {
            return undefined
        }

        const styleFiles = readdirSync(assetsPaths.css)
        for (const file of styleFiles) {
            if (extname(file) === '.css' && WEBVIEW_PANNEL) {
                const filePath = WEBVIEW_PANNEL.webview.asWebviewUri(
                    vscode.Uri.file(join(assetsPaths.css, file))
                )
                styles.push(`<link rel="stylesheet" href="${filePath}">`)
            }
        }

        return styles
    } catch (error) {
        logger.log({ message: `getStylesToInject ERROR: ${error.message}` })
        return undefined
    }
}

const getScriptsToInject = async (): Promise<string[] | undefined> => {
    try {
        logger.log({ message: 'Injecting script ...' })

        const context = getContext()
        const order = [
            'knockout.min.js',
            'knockout.mapping.min.js',
            'script.js',
        ]

        if (!context) {
            return undefined
        }

        const assetsPaths = getAssetsPaths()

        const scripts: string[] = []

        if (!existsSync(assetsPaths.js)) {
            return undefined
        }

        const scriptFiles = readdirSync(assetsPaths.js)
        for (const file of scriptFiles) {
            if (extname(file) === '.js' && WEBVIEW_PANNEL) {
                const index = order.indexOf(file)
                const filePath = WEBVIEW_PANNEL.webview.asWebviewUri(
                    vscode.Uri.file(join(assetsPaths.js, file))
                )
                const script = `<script src="${filePath}"></script>`

                if (index >= 0 && scripts.indexOf(script) === -1) {
                    scripts[index] = script
                } else if (index < 0 && scripts.indexOf(script) === -1) {
                    scripts.push(script)
                }
            }
        }

        return scripts
    } catch (error) {
        logger.log({ message: `getScriptsToInject ERRIR: ${error.message}` })
        return undefined
    }
}

const prepareHTML = async (
    html: string,
    shouldShowIgnored: boolean,
    searchText: string
) => {
    try {
        const context = getContext()

        if (!context) {
            return 'ERROR LOADING HTML CONTENT'
        }

        logger.log({ message: 'Preparing HTML ...' })

        html = html.replace(
            /{{SHOW_IGNORED}}/g,
            shouldShowIgnored ? ' show-ignored' : ''
        )

        html = html.replace(/{{SEARCH_TEXT}}/g, searchText || '')

        const scripts = await getScriptsToInject()

        if (scripts && scripts.length > 0) {
            html = html.replace(/{{SCRIPTS}}/g, scripts.join('\n'))
        } else {
            html = html.replace(/{{SCRIPTS}}/g, '')
        }

        const styles = await getStylesToInject()
        if (styles && styles.length > 0) {
            html = html.replace(/{{STYLES}}/g, styles.join('\n'))
        } else {
            html = html.replace(/{{STYLES}}/g, '')
        }

        html = html.replace(/{{TITLE}}/g, EXTENSION_NAME)

        return html
    } catch (error) {
        logger.log({ message: `prepareHTML ERROR: ${error.message}` })
        return html
    }
}

export const getHTML = async (
    force = false,
    shouldShowIgnoredStored: boolean,
    searchText: string
) => {
    try {
        if (!force) {
            return HTML
        }

        const context = getContext()

        if (!context) {
            return HTML
        }

        logger.log({ message: 'Start getting HTML ...' })

        const assetsPaths = getAssetsPaths()

        const htmlFilePath = join(assetsPaths.root, 'index.html')
        let htmlFileContent = readFileSync(htmlFilePath).toString()

        htmlFileContent = await prepareHTML(
            htmlFileContent,
            shouldShowIgnoredStored,
            searchText
        )

        HTML = htmlFileContent

        return HTML
    } catch (error) {
        logger.log({ message: `getHTML ERROR: ${error.message}` })
        return HTML
    }
}

const sendURLs = async (
    forceSync: boolean,
    shouldShowIgnored: boolean,
    currentPage: number,
    searchText: string
) => {
    try {
        const context = getContext()

        if (!context || !WEBVIEW_PANNEL) {
            return
        }

        logger.log({ message: 'Sending URLs to WebView ...' })

        const assetsPaths = getAssetsPaths()

        const { urls, pages, totalPages } = await getURLs(
            forceSync,
            shouldShowIgnored,
            currentPage,
            searchText
        )
        const fallbackFaviconPath = vscode.Uri.file(
            join(assetsPaths.img, 'fallback-favicon.png')
        )

        for (const url of urls) {
            if (!url.hasFavicon && WEBVIEW_PANNEL) {
                url.favicon = WEBVIEW_PANNEL.webview
                    .asWebviewUri(fallbackFaviconPath)
                    .toString()
                url.hasFavicon = false
            }
        }

        WEBVIEW_PANNEL.webview.postMessage({
            urls,
            pages,
            totalPages,
            type: EActionTypes.URL,
        })
    } catch (error) {
        logger.log({ message: `sendURLs ERROR: ${error.message}` })
    }
}

const sendFavicons = async () => {
    try {
        const context = getContext()

        if (!context) {
            return
        }

        logger.log({ message: 'Sending Favicons to WebView ...' })

        const existentURLs = context.workspaceState.get<IURL[]>('urls')

        if (!WEBVIEW_PANNEL || !existentURLs || existentURLs.length === 0) {
            return
        }

        for (const url of existentURLs) {
            try {
                if (!url.hasFavicon) {
                    const favicon: IFavicon = await pageIcon(
                        `${url.protocol}//${url.hostname}`
                    )
                    url.favicon = `data:${
                        favicon.mime
                    };base64, ${favicon.data.toString('base64')}`
                    url.hasFavicon = true
                }
            } catch (error) {}
        }

        context.workspaceState.update('urls', existentURLs)

        WEBVIEW_PANNEL.webview.postMessage({
            urls: existentURLs,
            type: EActionTypes.URL_ICON,
        })
    } catch (error) {
        logger.log({ message: `sendFavicons ERROR: ${error.message}` })
    }
}

const updateTreeviews = async () => {
    const treeviews = await getTreeViews()
    treeviews.STARRED_TREEVIEW.updateTreviewData()
    treeviews.NORMAL_TREEVIEW.updateTreviewData()
    treeviews.IGNORED_TREEVIEW.updateTreviewData()
}

const reloadWebView = async (
    shouldShowIgnoredStored: boolean,
    currentPage: number,
    searchText: string
) => {
    const html = await getHTML(true, shouldShowIgnoredStored, searchText)
    if (html && WEBVIEW_PANNEL) {
        WEBVIEW_PANNEL.webview.html = html
    }
    await sendURLs(true, shouldShowIgnoredStored, currentPage, searchText)
    await stopLoading()
    await updateTreeviews()
    await sendFavicons()
}

export const openWebview = async (ignoreFocus?: boolean) => {
    const context = getContext()

    if (!context) {
        return
    }

    const shouldShowIgnored =
        context.workspaceState.get<boolean>('shouldShowIgnored') || false
    const column = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined

    if (WEBVIEW_PANNEL) {
        if (!ignoreFocus) {
            WEBVIEW_PANNEL.reveal(column)
            ;(async () => await startLoading())()
        }
    } else {
        WEBVIEW_PANNEL = vscode.window.createWebviewPanel(
            EXTENSION_ID,
            EXTENSION_NAME,
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        )

        WEBVIEW_PANNEL.onDidDispose(() => {
            WEBVIEW_PANNEL = undefined
        })

        WEBVIEW_PANNEL.webview.onDidReceiveMessage(
            async (message: {
                type: EActionTypes
                url: IURL
                currentPage: number
                isShowingIgnored: boolean
                searchText: string
            }) => {
                const currentContext = getContext()

                if (!currentContext) {
                    return
                }

                let shouldReloadWebView = false

                const { url, isShowingIgnored, currentPage, searchText } =
                    message

                switch (message.type) {
                    case EActionTypes.SEARCH:
                    case EActionTypes.CHANGE_PAGE:
                        shouldReloadWebView = true
                        break
                    case EActionTypes.COPY:
                        if (url.href) {
                            vscode.env.clipboard.writeText(url.href)
                            vscode.window.showInformationMessage(
                                `'${url.href}' copied to clipboard`
                            )
                        }
                        break

                    case EActionTypes.STAR:
                        shouldReloadWebView = true
                        await addURLToStarredList(url)
                        break

                    case EActionTypes.UNSTAR:
                        shouldReloadWebView = true
                        await restoreURLFromStarredList(url)
                        break

                    case EActionTypes.IGNORE:
                        shouldReloadWebView = true
                        await addURLToIgnoreList(url)
                        break

                    case EActionTypes.RESTORE:
                        shouldReloadWebView = true
                        await restoreURLFromIgnoreList(url)
                        break

                    case EActionTypes.SAVE_URL_DESCRIPTION:
                        shouldReloadWebView = true
                        await saveURLDescription(url)
                        break

                    case EActionTypes.TOGGLE_SHOW_IGNORED:
                        shouldReloadWebView = true
                        currentContext.workspaceState.update(
                            'shouldShowIgnored',
                            isShowingIgnored
                        )
                        break

                    default:
                        break
                }

                if (shouldReloadWebView) {
                    await reloadWebView(
                        isShowingIgnored,
                        currentPage,
                        searchText
                    )
                }
            }
        )
    }

    await reloadWebView(shouldShowIgnored, 1, '')
}
