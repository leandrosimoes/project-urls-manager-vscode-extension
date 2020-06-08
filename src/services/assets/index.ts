import { join } from 'path'
import { getContext } from '../context'
import { IAssetsPaths } from './interfaces'
import { logger } from '../logger'

export enum EIcons {
    COPY_CLIPBOARD = 'copy-clipboard.png',
    IGNORE = 'ignore.png',
    RESTORE = 'restore.png',
}

export const getAssetsPaths = (): IAssetsPaths => {
    const defaultResult: IAssetsPaths = {
        root: '',
        js: '',
        css: '',
        json: '',
        img: '',
    }

    try {
        const context = getContext()

        if (!context) {
            return defaultResult
        }

        const root = join(context.extensionPath, 'out', 'assets')
        const js = join(root, 'js')
        const css = join(root, 'css')
        const img = join(root, 'img')
        const json = join(root, 'json')

        return {
            root,
            js,
            css,
            json,
            img,
        }
    } catch (error) {
        logger.log({ message: `getAssetsPaths ERROR: ${error.message}` })
        return defaultResult
    }
}

export default {
    getAssetsPaths,
}
