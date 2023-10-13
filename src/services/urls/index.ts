import * as vscode from 'vscode'
import { readdirSync, readFileSync, statSync } from 'fs'
import { extname, join } from 'path'
import { IURL } from './interfaces'
import URL from './models'

import { asyncForEach } from '../../utils'
import { logger } from '../logger'
import { getConfigurations } from '../configurations'
import { getContext } from '../context'

let URLS: IURL[] = []

function cleanURL(url: string) {
    return url.replace(/['"()`´,\\{}<>|^]/g, '').trim()
}

async function searchForWorkspaceURLs(rootPath = vscode.workspace.rootPath) {
    try {
        if (!rootPath) {
            return undefined
        }

        const configurations = await getConfigurations()
        const { ignorePaths, extensionsList, ignoreDomains } = configurations
        const context = getContext()

        if (!context) {
            return undefined
        }

        const files = readdirSync(rootPath)
        await asyncForEach(files, async (file: string) => {
            const filePath = join(rootPath, file)
            const stat = statSync(filePath)

            if (ignorePaths.indexOf(file) > -1) {
                logger.log({ message: `File ignored: '${file}'` })
                return
            }

            if (!stat.isDirectory()) {
                const fileExtension = extname(file)
                if (extensionsList.length > 0 && extensionsList.indexOf(fileExtension) === -1) {
                    logger.log({ message: `File extension ignored: '${file}'` })
                    return
                }

                const content = readFileSync(filePath).toString()
                const lines = content.split('\n')
                const urlsFound = content.match(
                    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g
                )

                if (urlsFound && urlsFound.length > 0) {
                    await asyncForEach(urlsFound, (url: string) => {
                        const lineNumber = lines.findIndex((line) => line.indexOf(url) > -1)
                        const line = lineNumber > -1 ? lines[lineNumber] : ''
                        const columnNumber = line.indexOf(url)
                        const href = cleanURL(url)
                        const urlInstance = new URL(href, filePath, lineNumber, columnNumber).url
                        urlInstance.hasFavicon = false

                        if (
                            urlInstance &&
                            urlInstance.host &&
                            ignoreDomains.indexOf(urlInstance.host) === -1
                        ) {
                            URLS.push(urlInstance)
                        }
                    })

                    logger.log({ message: `${urlsFound.length} URL(s) found in "${filePath}".` })
                } else {
                    logger.log({ message: `No URL found in "${filePath}".` })
                }
            } else {
                await searchForWorkspaceURLs(filePath)
            }
        })

        return URLS
    } catch (error) {
        logger.log({ message: `searchForWorkspaceURLs ERROR: ${error.message}` })
        return URLS
    }
}

export const syncURLs = async (showIgnored: boolean) => {
    try {
        const context = getContext()

        if (!context) {
            logger.log({ message: `0 URL(s) found`, shouldSetStatusBarMessage: true })
            return
        }

        URLS = []

        let existentURLs: IURL[] = context.workspaceState.get<IURL[]>('urls') || []

        logger.log({
            message: 'Syncing Project URLs ...',
            shouldSetStatusBarMessage: true,
            shouldClear: true,
        })

        URLS = (await searchForWorkspaceURLs(undefined)) || []

        // ADD URL TO THE existentURLs IF NOT ALREADY EXISTS
        await asyncForEach(URLS, async (urlFound: IURL) => {
            const existent = existentURLs.find((ex) => ex.href === urlFound.href)
            if (!existent && urlFound.host) {
                existentURLs.push(urlFound)
            }
        })

        // REMOVE FROM existentURLs URLs THAT WAS NOT FOUND IN FILES ANYMORE
        await asyncForEach(existentURLs, async (existent: IURL) => {
            const urlFound = URLS.find((ex) => ex.href === existent.href)
            if (!urlFound) {
                existentURLs = existentURLs.filter((ex) => ex.href !== existent.href)
            }
        })

        context.workspaceState.update('urls', existentURLs)

        logger.log({
            message: `${
                existentURLs.filter((ex) => showIgnored || !ex.isIgnored).length
            } URL(s) found`,
            shouldSetStatusBarMessage: true,
        })
    } catch (error) {
        logger.log({ message: `syncURLs ERROR: ${error.message}` })
    }
}

export const getURLs = async (forceSync = false, showIgnored: boolean): Promise<IURL[]> => {
    const context = getContext()

    if (!context) {
        return URLS
    }

    if (forceSync) {
        await syncURLs(showIgnored)
    }

    try {
        const existentURLs = context.workspaceState.get<IURL[]>('urls') || []

        const starredURLs = (existentURLs.filter((ex) => ex.isStarred) || []).sort((a, b) => {
            if (!a.host || !b.host) {
                return 1
            }

            return a.host >= b.host ? 1 : -1
        })
        const notStarredURLs = (existentURLs.filter((ex) => !ex.isStarred) || []).sort((a, b) => {
            if (!a.host || !b.host) {
                return 1
            }

            return a.host >= b.host ? 1 : -1
        })

        return [...starredURLs, ...notStarredURLs].filter((ex) => showIgnored || !ex.isIgnored)
    } catch (error) {
        logger.log({ message: `getURLs ERROR: ${error.message}` })
        return []
    }
}

export const saveURLDescription = async (url: IURL) => {
    const context = getContext()

    if (!context) {
        return
    }

    try {
        const urlsFound: IURL[] = context.workspaceState.get<IURL[]>('urls') || []

        if (urlsFound.length <= 0) {
            return
        }

        await asyncForEach(urlsFound, async (found: IURL) => {
            if (found.href === url.href) {
                found.description = url.description
            }
        })

        context.workspaceState.update('urls', urlsFound)
    } catch (error) {
        logger.log({ message: `saveURLDescription ERROR: ${error.message}` })
    }
}

export const restoreURLFromIgnoreList = async (url: IURL) => {
    const context = getContext()

    if (!context) {
        return
    }

    try {
        const existentURLs: IURL[] = context.workspaceState.get<IURL[]>('urls') || []

        await asyncForEach(existentURLs, async (existent: IURL) => {
            if (existent.href === url.href) {
                existent.isIgnored = false
            }
        })

        context.workspaceState.update('urls', existentURLs)
    } catch (error) {
        logger.log({ message: `restoreURLFromIgnoreList ERROR: ${error.message}` })
    }
}

export const addURLToIgnoreList = async (url: IURL) => {
    const context = getContext()

    if (!context) {
        return
    }

    try {
        const existentURLs: IURL[] = context.workspaceState.get<IURL[]>('urls') || []

        await asyncForEach(existentURLs, async (existent: IURL) => {
            if (existent.href === url.href) {
                existent.isIgnored = true
                existent.isStarred = false
            }
        })

        context.workspaceState.update('urls', existentURLs)
    } catch (error) {
        logger.log({ message: `addURLToIgnoreList ERROR: ${error.message}` })
    }
}

export const restoreURLFromStarredList = async (url: IURL) => {
    const context = getContext()

    if (!context) {
        return
    }

    try {
        const existentURLs: IURL[] = context.workspaceState.get<IURL[]>('urls') || []

        await asyncForEach(existentURLs, async (existent: IURL) => {
            if (existent.href === url.href) {
                existent.isStarred = false
            }
        })

        context.workspaceState.update('urls', existentURLs)
    } catch (error) {
        logger.log({ message: `restoreURLFromIgnoreList ERROR: ${error.message}` })
    }
}

export const addURLToStarredList = async (url: IURL) => {
    const context = getContext()

    if (!context) {
        return
    }

    try {
        const existentURLs: IURL[] = context.workspaceState.get<IURL[]>('urls') || []

        await asyncForEach(existentURLs, async (existent: IURL) => {
            if (existent.href === url.href) {
                existent.isStarred = true
                existent.isIgnored = false
            }
        })

        context.workspaceState.update('urls', existentURLs)
    } catch (error) {
        logger.log({ message: `addURLToIgnoreList ERROR: ${error.message}` })
    }
}
