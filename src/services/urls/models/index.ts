import { parse } from 'url'
import { IURL } from '../interfaces'

export default class URL {
    private _url: IURL

    constructor(url: string) {
        /* eslint-disable-next-line no-underscore-dangle */
        this._url = {
            ...parse(url),
            baseURL: url,
            favicon: undefined,
            isIgnored: false,
            hasFavicon: false,
            description: '',
            isStarred: false,
        }
    }

    get url(): IURL {
        // eslint-disable-next-line no-underscore-dangle
        return this._url
    }
}
