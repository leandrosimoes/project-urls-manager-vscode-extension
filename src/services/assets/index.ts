import { join } from 'path'
import { getContext } from '../context'
import { IAssetsPaths } from './interfaces'

export enum EIcons {
    COPY_CLIPBOARD = 'copy-clipboard.png',
    IGNORE = 'ignore.png',
    RESTORE = 'restore.png',
}

export const getAssetsPaths = (): IAssetsPaths => {
    const context = getContext()

    if (!context) {
        return {
            root: '',
            js: '',
            css: '',
            json: '',
            img: '',
        }
    }

    const root = join(context.extensionPath, 'src', 'assets')
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
}

export default {
    getAssetsPaths,
}
