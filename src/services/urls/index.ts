// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode'
import { readdirSync, readFileSync, statSync } from 'fs'
import { extname } from 'path'
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
    if (!rootPath) {
        return undefined
    }

    const configurations = await getConfigurations()
    const { ignore, extensions } = configurations
    const context = getContext()

    if (!context) {
        return undefined
    }

    const files = readdirSync(rootPath)
    await asyncForEach(files, async (file: string) => {
        const filePath = `${rootPath}\\${file}`
        const stat = statSync(filePath)

        if (ignore.indexOf(file) > -1) {
            logger.log({ message: `File ignored: '${file}'` })
            return
        }

        if (!stat.isDirectory()) {
            const fileExtension = extname(file)
            if (extensions.length > 0 && extensions.indexOf(fileExtension) === -1) {
                logger.log({ message: `File extension ignored: '${file}'` })
                return
            }

            const content = readFileSync(filePath).toString()
            const urlsFound = content.match(/(https?:\/\/[^ ]*)/g)

            if (urlsFound && urlsFound.length > 0) {
                await asyncForEach(urlsFound, (url: string) => {
                    const href = cleanURL(url)
                    const urlInstance = new URL(href).url
                    urlInstance.hasFavicon = false

                    if (urlInstance && urlInstance.host) {
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
}

export const syncURLs = async (showIgnored: boolean) => {
    try {
        const context = getContext()

        if (!context) {
            logger.log({ message: `0 URL(s) found`, setStatusBarMessage: true })
            return
        }

        URLS = []

        let existentURLs: IURL[] = context.workspaceState.get<IURL[]>('urls') || []

        logger.clear()
        logger.log({ message: 'Syncing Project URLs ...', setStatusBarMessage: true })

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
            setStatusBarMessage: true,
        })
    } catch (error) {
        logger.log({ message: error.message })
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

    const existentURLs = (context.workspaceState.get<IURL[]>('urls') || []).sort((a, b) => {
        if (!a.host || !b.host) {
            return 1
        }

        return a.host >= b.host ? 1 : -1
    })

    return existentURLs.filter((ex) => showIgnored || !ex.isIgnored)
}

export const saveURLDescription = async (url: IURL) => {
    const context = getContext()

    if (!context) {
        return
    }

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
}

export const restoreURLFromIgnoreList = async (url: IURL) => {
    const context = getContext()

    if (!context) {
        return
    }

    const existentURLs: IURL[] = context.workspaceState.get<IURL[]>('urls') || []

    await asyncForEach(existentURLs, async (existent: IURL) => {
        if (existent.href === url.href) {
            existent.isIgnored = false
        }
    })

    context.workspaceState.update('urls', existentURLs)
}

export const addURLToIgnoreList = async (url: IURL) => {
    const context = getContext()

    if (!context) {
        return
    }

    const existentURLs: IURL[] = context.workspaceState.get<IURL[]>('urls') || []

    await asyncForEach(existentURLs, async (existent: IURL) => {
        if (existent.href === url.href) {
            existent.isIgnored = true
        }
    })

    context.workspaceState.update('urls', existentURLs)
}
