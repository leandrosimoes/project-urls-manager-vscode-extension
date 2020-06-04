export interface IAutoSync {
    interval: number
}

export interface IConfigurations {
    ignore?: string[]
    extensions?: string[]
    autoSync?: IAutoSync
}
