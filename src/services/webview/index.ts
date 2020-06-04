// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode'
import { join, extname } from 'path'
import { readFileSync, existsSync, readdirSync } from 'fs'

import { getURLs, saveURLDescription, addURLToIgnoreList, restoreURLFromIgnoreList } from '../urls'
import { EXTENSION_NAME } from '../../constants'
import { getContext } from '../context'
import { asyncForEach } from '../../utils'
import { IURL } from '../urls/interfaces'
import { getAssetsPaths, EIcons } from '../assets'
import { IFavicon } from './interfaces'
import { EActionTypes, EThemes } from './enums'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pageIcon = require('page-icon')

let HTML = ''
let WEBVIEW_PANNEL: vscode.WebviewPanel | undefined

const startLoading = () => {
    if (!WEBVIEW_PANNEL) {
        return
    }

    WEBVIEW_PANNEL.webview.postMessage({ type: EActionTypes.START_LOADING })
}

const stopLoading = () => {
    if (!WEBVIEW_PANNEL) {
        return
    }

    WEBVIEW_PANNEL.webview.postMessage({ type: EActionTypes.STOP_LOADING })
}

const getStylesToInject = async (): Promise<string[] | undefined> => {
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
}

const getScriptsToInject = async (): Promise<string[] | undefined> => {
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
}

const prepareHTML = async (html: string, shouldShowIgnored: boolean) => {
    const context = getContext()

    if (!context) {
        return 'ERROR LOADING HTML CONTENT'
    }

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
}

export const getHTML = async (force = false, shouldShowIgnored: boolean) => {
    if (!force) {
        return HTML
    }

    const context = getContext()

    if (!context) {
        return HTML
    }

    const assetsPaths = getAssetsPaths()

    const htmlFilePath = join(assetsPaths.root, 'index.html')
    let htmlFileContent = readFileSync(htmlFilePath).toString()

    htmlFileContent = await prepareHTML(htmlFileContent, shouldShowIgnored)

    HTML = htmlFileContent

    return HTML
}

const sendURLs = async (forceSync: boolean, shouldShowIgnored: boolean) => {
    const context = getContext()

    if (!context || !WEBVIEW_PANNEL) {
        return
    }

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
}

const sendFavicons = async () => {
    const context = getContext()

    if (!context) {
        return
    }

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
}

const sendIcons = async () => {
    const context = getContext()

    if (!WEBVIEW_PANNEL || !context) {
        return
    }

    const assetsPaths = getAssetsPaths()

    const icons: any = {}
    const files = Object.values(EIcons)

    await asyncForEach(files, async (file: string) => {
        const fileName = file.split('.')[0]
        icons[fileName] = WEBVIEW_PANNEL?.webview
            .asWebviewUri(vscode.Uri.file(join(assetsPaths.img, file)))
            .toString()
    })

    WEBVIEW_PANNEL.webview.postMessage({ icons, type: EActionTypes.ICON })
}

export const openWebview = async () => {
    const context = getContext()

    if (!context) {
        return
    }

    const shouldShowIgnored = context.workspaceState.get<boolean>('shouldShowIgnored') || false
    const column = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined

    if (WEBVIEW_PANNEL) {
        WEBVIEW_PANNEL.reveal(column)
        startLoading()
    } else {
        WEBVIEW_PANNEL = vscode.window.createWebviewPanel(
            'projectUrlManager',
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
                    }

                    break

                case EActionTypes.IGNORE:
                    addURLToIgnoreList(url).then(() => {
                        getHTML(true, shouldShowIgnoredStored).then((html) => {
                            if (html && WEBVIEW_PANNEL) {
                                WEBVIEW_PANNEL.webview.html = html

                                sendIcons().then(() => {
                                    sendURLs(true, shouldShowIgnoredStored).then(() => {
                                        sendFavicons().then(() => {
                                            stopLoading()
                                        })
                                    })
                                })
                            }
                        })
                    })
                    break

                case EActionTypes.RESTORE:
                    restoreURLFromIgnoreList(url).then(() => {
                        getHTML(true, shouldShowIgnoredStored).then((html) => {
                            if (html && WEBVIEW_PANNEL) {
                                WEBVIEW_PANNEL.webview.html = html

                                sendIcons().then(() => {
                                    sendURLs(true, shouldShowIgnoredStored).then(() => {
                                        sendFavicons().then(() => {
                                            stopLoading()
                                        })
                                    })
                                })
                            }
                        })
                    })
                    break

                case EActionTypes.SAVE_URL_DESCRIPTION:
                    saveURLDescription(url).then(() => {
                        getHTML(true, shouldShowIgnoredStored).then((html) => {
                            if (html && WEBVIEW_PANNEL) {
                                WEBVIEW_PANNEL.webview.html = html

                                sendIcons().then(() => {
                                    sendURLs(true, shouldShowIgnoredStored).then(() => {
                                        sendFavicons().then(() => {
                                            stopLoading()
                                        })
                                    })
                                })
                            }
                        })
                    })

                    break

                case EActionTypes.TOGGLE_THEME:
                    currentContext.workspaceState.update(
                        'theme',
                        currentTheme === EThemes.DARK ? EThemes.LIGHT : EThemes.DARK
                    )
                    getHTML(true, shouldShowIgnoredStored).then((html) => {
                        if (html && WEBVIEW_PANNEL) {
                            WEBVIEW_PANNEL.webview.html = html

                            sendIcons().then(() => {
                                sendURLs(true, shouldShowIgnoredStored).then(() => {
                                    sendFavicons().then(() => {
                                        stopLoading()
                                    })
                                })
                            })
                        }
                    })

                    break

                case EActionTypes.TOGGLE_SHOW_IGNORED:
                    currentContext.workspaceState.update(
                        'shouldShowIgnored',
                        !shouldShowIgnoredStored
                    )
                    getHTML(true, !shouldShowIgnoredStored).then((html) => {
                        if (html && WEBVIEW_PANNEL) {
                            WEBVIEW_PANNEL.webview.html = html

                            sendIcons().then(() => {
                                sendURLs(true, !shouldShowIgnoredStored).then(() => {
                                    sendFavicons().then(() => {
                                        stopLoading()
                                    })
                                })
                            })
                        }
                    })
                    break

                default:
                    break
            }
        })
    }

    const viewHtml = await getHTML(true, shouldShowIgnored)

    if (!viewHtml) {
        return
    }

    WEBVIEW_PANNEL.webview.html = viewHtml

    await sendIcons()
    await sendURLs(true, shouldShowIgnored)
    await sendFavicons()
    stopLoading()
}
