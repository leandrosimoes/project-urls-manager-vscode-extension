// eslint-disable-next-line import/no-unresolved
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
import { asyncForEach, waitForXSeconds } from '../../utils'
import { IURL } from '../urls/interfaces'
import { getAssetsPaths } from '../assets'
import { IFavicon } from './interfaces'
import { EActionTypes, EThemes } from './enums'
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
        await asyncForEach(styleFiles, async (file: string) => {
            if (extname(file) === '.css' && WEBVIEW_PANNEL) {
                const filePath = WEBVIEW_PANNEL.webview.asWebviewUri(
                    vscode.Uri.file(join(assetsPaths.css, file))
                )
                styles.push(`<link rel="stylesheet" href="${filePath}">`)
            }
        })

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
        const order = ['knockout.min.js', 'knockout.mapping.min.js', 'script.js']

        if (!context) {
            return undefined
        }

        const assetsPaths = getAssetsPaths()

        const scripts: string[] = []

        if (!existsSync(assetsPaths.js)) {
            return undefined
        }

        const scriptFiles = readdirSync(assetsPaths.js)
        await asyncForEach(scriptFiles, async (file: string) => {
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
        })

        return scripts
    } catch (error) {
        logger.log({ message: `getScriptsToInject ERRIR: ${error.message}` })
        return undefined
    }
}

const prepareHTML = async (html: string, shouldShowIgnored: boolean) => {
    try {
        const context = getContext()

        if (!context) {
            return 'ERROR LOADING HTML CONTENT'
        }

        logger.log({ message: 'Preparing HTML ...' })

        html = html.replace(/{{SHOW_IGNORED}}/g, shouldShowIgnored ? ' show-ignored' : '')

        const scripts = await getScriptsToInject()
        const currentTheme = context.workspaceState.get<string>('theme') || EThemes.DARK
        html = html.replace(/{{THEME}}/g, currentTheme)

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

export const getHTML = async (force = false, shouldShowIgnored: boolean) => {
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

        htmlFileContent = await prepareHTML(htmlFileContent, shouldShowIgnored)

        HTML = htmlFileContent

        return HTML
    } catch (error) {
        logger.log({ message: `getHTML ERROR: ${error.message}` })
        return HTML
    }
}

const sendURLs = async (forceSync: boolean, shouldShowIgnored: boolean) => {
    try {
        const context = getContext()

        if (!context || !WEBVIEW_PANNEL) {
            return
        }

        logger.log({ message: 'Sending URLs to WebView ...' })

        const assetsPaths = getAssetsPaths()

        const urls = await getURLs(forceSync, shouldShowIgnored)
        const fallbackFaviconPath = vscode.Uri.file(join(assetsPaths.img, 'fallback-favicon.png'))

        await asyncForEach(urls, async (url: IURL) => {
            if (!url.hasFavicon && WEBVIEW_PANNEL) {
                url.favicon = WEBVIEW_PANNEL.webview.asWebviewUri(fallbackFaviconPath).toString()
                url.hasFavicon = false
            }
        })

        WEBVIEW_PANNEL.webview.postMessage({ urls, type: EActionTypes.URL })
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

        await asyncForEach(existentURLs, async (url: IURL) => {
            try {
                if (!url.hasFavicon) {
                    const favicon: IFavicon = await pageIcon(`${url.protocol}//${url.hostname}`)
                    url.favicon = `data:${favicon.mime};base64, ${favicon.data.toString('base64')}`
                    url.hasFavicon = true
                }
            } catch (error) {}
        })

        context.workspaceState.update('urls', existentURLs)

        WEBVIEW_PANNEL.webview.postMessage({ urls: existentURLs, type: EActionTypes.URL_ICON })
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

export const openWebview = async (ignoreFocus?: boolean) => {
    const context = getContext()

    if (!context) {
        return
    }

    const shouldShowIgnored = context.workspaceState.get<boolean>('shouldShowIgnored') || false
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

        WEBVIEW_PANNEL.webview.onDidReceiveMessage((message: any) => {
            const currentContext = getContext()

            if (!currentContext) {
                return
            }

            const shouldShowIgnoredStored =
                currentContext.workspaceState.get<boolean>('shouldShowIgnored') || false
            const currentTheme = currentContext.workspaceState.get<string>('theme') || EThemes.DARK
            const { url } = message

            switch (message.type) {
                case EActionTypes.COPY:
                    if (url.href) {
                        vscode.env.clipboard.writeText(url.href)
                        vscode.window.showInformationMessage(`'${url.href}' copied to clipboard`)
                    }

                    break

                case EActionTypes.STAR:
                    ;(async () => {
                        await addURLToStarredList(url)
                        const html = await getHTML(true, shouldShowIgnoredStored)
                        if (html && WEBVIEW_PANNEL) {
                            WEBVIEW_PANNEL.webview.html = html
                        }

                        await sendURLs(true, shouldShowIgnoredStored)
                        await stopLoading()
                        await updateTreeviews()
                        await sendFavicons()
                    })()
                    break

                case EActionTypes.UNSTAR:
                    ;(async () => {
                        await restoreURLFromStarredList(url)
                        const html = await getHTML(true, shouldShowIgnoredStored)
                        if (html && WEBVIEW_PANNEL) {
                            WEBVIEW_PANNEL.webview.html = html
                        }

                        await sendURLs(true, shouldShowIgnoredStored)
                        await stopLoading()
                        await updateTreeviews()
                        await sendFavicons()
                    })()
                    break

                case EActionTypes.IGNORE:
                    ;(async () => {
                        await addURLToIgnoreList(url)
                        const html = await getHTML(true, shouldShowIgnoredStored)
                        if (html && WEBVIEW_PANNEL) {
                            WEBVIEW_PANNEL.webview.html = html
                        }

                        await sendURLs(true, shouldShowIgnoredStored)
                        await stopLoading()
                        await updateTreeviews()
                        await sendFavicons()
                    })()
                    break

                case EActionTypes.RESTORE:
                    ;(async () => {
                        await restoreURLFromIgnoreList(url)
                        const html = await getHTML(true, shouldShowIgnoredStored)
                        if (html && WEBVIEW_PANNEL) {
                            WEBVIEW_PANNEL.webview.html = html
                        }

                        await sendURLs(true, shouldShowIgnoredStored)
                        await stopLoading()
                        await updateTreeviews()
                        await sendFavicons()
                    })()
                    break

                case EActionTypes.SAVE_URL_DESCRIPTION:
                    ;(async () => {
                        await saveURLDescription(url)
                        const html = await getHTML(true, shouldShowIgnoredStored)
                        if (html && WEBVIEW_PANNEL) {
                            WEBVIEW_PANNEL.webview.html = html
                        }

                        await sendURLs(true, shouldShowIgnoredStored)
                        await stopLoading()
                        await sendFavicons()
                    })()
                    break

                case EActionTypes.TOGGLE_THEME:
                    currentContext.workspaceState.update(
                        'theme',
                        currentTheme === EThemes.DARK ? EThemes.LIGHT : EThemes.DARK
                    )
                    ;(async () => {
                        const html = await getHTML(true, shouldShowIgnoredStored)
                        if (html && WEBVIEW_PANNEL) {
                            WEBVIEW_PANNEL.webview.html = html
                        }

                        await sendURLs(true, shouldShowIgnoredStored)
                        await stopLoading()
                        await sendFavicons()
                    })()
                    break

                case EActionTypes.TOGGLE_SHOW_IGNORED:
                    currentContext.workspaceState.update(
                        'shouldShowIgnored',
                        !shouldShowIgnoredStored
                    )
                    ;(async () => {
                        const html = await getHTML(true, !shouldShowIgnoredStored)

                        if (html && WEBVIEW_PANNEL) {
                            WEBVIEW_PANNEL.webview.html = html
                        }

                        await sendURLs(true, !shouldShowIgnoredStored)
                        await stopLoading()
                        await updateTreeviews()
                        await sendFavicons()
                    })()
                    break

                default:
                    break
            }
        })
    }

    const viewHtml = await getHTML(true, shouldShowIgnored)

    if (!viewHtml) {
        logger.log({ message: `No HTML string found` })
        return
    }

    WEBVIEW_PANNEL.webview.html = viewHtml

    await startLoading()
    await sendURLs(true, shouldShowIgnored)
    await stopLoading()
    await sendFavicons()
}
