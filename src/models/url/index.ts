import { parse, Url } from 'url';

export interface IURL extends Url {
    favicon: string | undefined
}

export class URL {
    private _url: IURL;

    constructor(url: string) {
        this._url = { ...parse(url), favicon: undefined };
    }

    get url(): IURL {
        return this._url;
    }
}