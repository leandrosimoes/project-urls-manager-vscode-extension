import { parse, Url } from 'url'

export interface IURL extends Url {
    baseURL: string
    favicon: string | undefined
    isIgnored: boolean
    hasFavicon: boolean
    description: string
}

export class URL {
    private _url: IURL

    constructor(url: string) {
        // eslint-disable-next-line no-underscore-dangle
        this._url = {
            ...parse(url),
            baseURL: url,
            favicon: undefined,
            isIgnored: false,
            hasFavicon: false,
            description: '',
        }
    }

    get url(): IURL {
        // eslint-disable-next-line no-underscore-dangle
        return this._url
    }
}
