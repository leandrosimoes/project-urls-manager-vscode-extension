import { parse, Url } from 'url';

export interface IURL extends Url {
    baseURL: string;
    favicon: string | undefined
    isIgnored: boolean
    hasFavicon: boolean
    description: string
}

export class URL {
    private _url: IURL;

    constructor(url: string) {        
        this._url = { 
            ...parse(url), 
            baseURL: url, 
            favicon: undefined, 
            isIgnored: false, 
            hasFavicon: false,
            description: ''
        };
    }

    get url(): IURL {
        return this._url;
    }
}