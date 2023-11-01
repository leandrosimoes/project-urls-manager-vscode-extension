// THIS MUST MATCH THE EActionTypes OBJECT IN script.js
export enum EActionTypes {
    URL = 'URL',
    URL_ICON = 'URL_ICON',
    ICON = 'ICON',
    COPY = 'COPY',
    IGNORE = 'IGNORE',
    RESTORE = 'RESTORE',
    START_LOADING = 'START_LOADING',
    STOP_LOADING = 'STOP_LOADING',
    SAVE_URL_DESCRIPTION = 'SAVE_URL_DESCRIPTION',
    TOGGLE_SHOW_IGNORED = 'TOGGLE_SHOW_IGNORED',
    STAR = 'STAR',
    UNSTAR = 'UNSTAR',
    CHANGE_PAGE = 'CHANGE_PAGE',
    SEARCH = 'SEARCH',
}

export default EActionTypes
