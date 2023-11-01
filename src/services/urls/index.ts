import * as vscode from 'vscode'
import { readdirSync, readFileSync, statSync } from 'fs'
import { extname, join } from 'path'
import { IPage, IURL } from './interfaces'
import URL from './models'

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
        for (const file of files) {
            const filePath = join(rootPath, file)
            const stat = statSync(filePath)

            if (ignorePaths.indexOf(file) > -1) {
                logger.log({ message: `File ignored: '${file}'` })
                continue
            }

            if (!stat.isDirectory()) {
                const fileExtension = extname(file)
                if (
                    extensionsList.length > 0 &&
                    extensionsList.indexOf(fileExtension) === -1
                ) {
                    logger.log({ message: `File extension ignored: '${file}'` })
                    continue
                }

                const content = readFileSync(filePath).toString()
                const lines = content.split('\n')

                for (const line of lines) {
                    const lineNumber = lines.indexOf(line)
                    const urlsFound = line.match(
                        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g
                    )

                    if (urlsFound && urlsFound.length > 0) {
                        for (const url of urlsFound) {
                            const columnNumber = line.indexOf(url)
                            const href = cleanURL(url)
                            const urlInstance = new URL(
                                href,
                                filePath,
                                lineNumber,
                                columnNumber
                            ).url
                            urlInstance.hasFavicon = false

                            if (
                                urlInstance &&
                                urlInstance.host &&
                                ignoreDomains.indexOf(urlInstance.host) === -1
                            ) {
                                URLS.push(urlInstance)
                            }
                        }

                        logger.log({
                            message: `${urlsFound.length} URL(s) found in "${filePath}".`,
                        })
                    } else {
                        logger.log({
                            message: `No URL found in "${filePath}".`,
                        })
                    }
                }
            } else {
                await searchForWorkspaceURLs(filePath)
            }
        }

        return URLS
    } catch (error) {
        logger.log({
            message: `searchForWorkspaceURLs ERROR: ${error.message}`,
        })
        return URLS
    }
}

export const syncURLs = async (showIgnored: boolean) => {
    try {
        const context = getContext()

        if (!context) {
            logger.log({
                message: `0 URL(s) found`,
                shouldSetStatusBarMessage: true,
            })
            return
        }

        URLS = []

        let existentURLs: IURL[] =
            context.workspaceState.get<IURL[]>('urls') || []

        logger.log({
            message: 'Syncing Project URLs ...',
            shouldSetStatusBarMessage: true,
            shouldClear: true,
        })

        URLS = (await searchForWorkspaceURLs(undefined)) || []

        // ADD URL TO THE existentURLs IF NOT ALREADY EXISTS
        for (const urlFound of URLS) {
            const existent = existentURLs.find(
                (ex) =>
                    ex.href === urlFound.href &&
                    ex.lineNumber === urlFound.lineNumber &&
                    ex.columnNumber === urlFound.columnNumber &&
                    ex.filePath === urlFound.filePath
            )
            if (!existent && urlFound.host) {
                existentURLs.push(urlFound)
            }
        }

        // REMOVE FROM existentURLs URLs THAT WAS NOT FOUND IN FILES ANYMORE
        for (const existent of existentURLs) {
            const urlFound = URLS.find(
                (ex) =>
                    ex.href === existent.href &&
                    ex.lineNumber === existent.lineNumber &&
                    ex.columnNumber === existent.columnNumber &&
                    ex.filePath === existent.filePath
            )
            if (!urlFound) {
                existentURLs = existentURLs.filter(
                    (ex) => ex.href !== existent.href
                )
            }
        }

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

export const getURLs = async (
    forceSync = false,
    showIgnored: boolean,
    currentPage: number,
    searchText: string
): Promise<{ urls: IURL[]; pages: IPage[], totalPages: number }> => {
    const context = getContext()

    if (!context) {
        return { urls: URLS, pages: [], totalPages: 0 }
    }

    if (forceSync) {
        await syncURLs(showIgnored)
    }

    try {
        const existentURLs = context.workspaceState.get<IURL[]>('urls') || []

        const starredURLs = (
            existentURLs.filter((ex) => ex.isStarred) || []
        ).sort((a, b) => {
            if (!a.host || !b.host) {
                return 1
            }

            return a.host >= b.host ? 1 : -1
        })
        const notStarredURLs = (
            existentURLs.filter((ex) => !ex.isStarred) || []
        ).sort((a, b) => {
            if (!a.host || !b.host) {
                return 1
            }

            return a.host >= b.host ? 1 : -1
        })

        const fileredURLs = [...starredURLs, ...notStarredURLs].filter(
            (ex) =>
                (showIgnored || !ex.isIgnored) &&
                (!searchText || ex.href.includes(searchText))
        )

        // for treeview should show all URLs
        if (currentPage === -1) {
            return { urls: fileredURLs, pages: [], totalPages: 0 }
        }

        const QTY_PER_PAGE = 6

        let pages = [
            ...Array(Math.ceil(fileredURLs.length / QTY_PER_PAGE)).keys(),
        ]

        const totalPages = pages.length

        if (pages.length > 5 && currentPage > 3) {
            pages = pages.splice(currentPage - 3, 5)
        } else if (pages.length > 5) {
            pages = pages.splice(0, 5)
        }

        return {
            urls: fileredURLs.splice(
                (currentPage - 1) * QTY_PER_PAGE,
                QTY_PER_PAGE
            ),
            pages: pages.map((item) => ({ number: item + 1 })),
            totalPages,
        }
    } catch (error) {
        logger.log({ message: `getURLs ERROR: ${error.message}` })
        return { urls: [], pages: [], totalPages: 0 }
    }
}

export const saveURLDescription = async (url: IURL) => {
    const context = getContext()

    if (!context) {
        return
    }

    try {
        const urlsFound: IURL[] =
            context.workspaceState.get<IURL[]>('urls') || []

        if (urlsFound.length <= 0) {
            return
        }

        for (const found of urlsFound) {
            if (found.href === url.href) {
                found.description = url.description
            }
        }

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
        const existentURLs: IURL[] =
            context.workspaceState.get<IURL[]>('urls') || []

        for (const existent of existentURLs) {
            if (existent.href === url.href) {
                existent.isIgnored = false
            }
        }

        context.workspaceState.update('urls', existentURLs)
    } catch (error) {
        logger.log({
            message: `restoreURLFromIgnoreList ERROR: ${error.message}`,
        })
    }
}

export const addURLToIgnoreList = async (url: IURL) => {
    const context = getContext()

    if (!context) {
        return
    }

    try {
        const existentURLs: IURL[] =
            context.workspaceState.get<IURL[]>('urls') || []

        for (const existent of existentURLs) {
            if (existent.href === url.href) {
                existent.isIgnored = true
                existent.isStarred = false
            }
        }

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
        const existentURLs: IURL[] =
            context.workspaceState.get<IURL[]>('urls') || []

        for (const existent of existentURLs) {
            if (existent.href === url.href) {
                existent.isStarred = false
            }
        }

        context.workspaceState.update('urls', existentURLs)
    } catch (error) {
        logger.log({
            message: `restoreURLFromIgnoreList ERROR: ${error.message}`,
        })
    }
}

export const addURLToStarredList = async (url: IURL) => {
    const context = getContext()

    if (!context) {
        return
    }

    try {
        const existentURLs: IURL[] =
            context.workspaceState.get<IURL[]>('urls') || []

        for (const existent of existentURLs) {
            if (existent.href === url.href) {
                existent.isStarred = true
                existent.isIgnored = false
            }
        }

        context.workspaceState.update('urls', existentURLs)
    } catch (error) {
        logger.log({ message: `addURLToIgnoreList ERROR: ${error.message}` })
    }
}
