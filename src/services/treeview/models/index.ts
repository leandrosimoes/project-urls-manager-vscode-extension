// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode'
import { IURL } from '../../urls/interfaces'
import { EURLTreeItemType, EProjectURLsTreeViewType } from '../enums'
import { getURLs } from '../../urls'
import { logger } from '../../logger'
import { ECommands } from '../../commands/enums'

export class ProjectURLsTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState)
    }

    get tooltip(): string {
        return 'Click to open the URL in browswer'
    }

    iconPath =
        this.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed
            ? new vscode.ThemeIcon('globe')
            : new vscode.ThemeIcon('link')

    command = {
        command: ECommands.TREEVIEW_OPEN_URL,
        arguments: [this.label],
        title: '',
    }
}

export class ProjectURLsTreeViewDataProvider
    implements vscode.TreeDataProvider<ProjectURLsTreeItem> {
    private _type: EURLTreeItemType

    private _urls: IURL[]

    constructor(type: EURLTreeItemType, urls: IURL[]) {
        this._type = type
        this._urls = urls
    }

    private _mapURLItems(urls: IURL[], host?: string): ProjectURLsTreeItem[] {
        switch (this._type) {
            case EURLTreeItemType.STARED:
                urls = urls.filter((url) => url.isStared && !url.isIgnored)
                break
            case EURLTreeItemType.NORMAL:
                urls = urls.filter((url) => !url.isStared && !url.isIgnored)
                break
            case EURLTreeItemType.IGNORED:
                urls = urls.filter((url) => url.isIgnored)
                break
            default:
                urls = []
                break
        }

        if (!host) {
            const hosts = [
                ...new Set(
                    urls
                        .filter((url: IURL) => !!url.host)
                        .map((url: IURL) => `${url.protocol}//${url.host}`)
                ),
            ].filter((h) => !!h)

            return hosts.map(
                (h) => new ProjectURLsTreeItem(h, vscode.TreeItemCollapsibleState.Collapsed)
            )
        }

        return urls
            .filter((url) => url.host === host.replace(`${url.protocol}//`, ''))
            .map((url) => new ProjectURLsTreeItem(url.href, vscode.TreeItemCollapsibleState.None))
    }

    getTreeItem(element: ProjectURLsTreeItem): ProjectURLsTreeItem {
        return element
    }

    getChildren(element?: ProjectURLsTreeItem | undefined): Thenable<ProjectURLsTreeItem[]> {
        if (!element) {
            return Promise.resolve(this._mapURLItems(this._urls))
        }

        return Promise.resolve(this._mapURLItems(this._urls, element.label))
    }
}

export class ProjectURLsTreeView {
    private _type: EProjectURLsTreeViewType

    public instance: vscode.TreeView<ProjectURLsTreeItem> | undefined

    constructor(type: EProjectURLsTreeViewType) {
        this._type = type
    }

    async updateTreviewData() {
        logger.log({ message: `Start updating ${this._type} TreeView ...` })

        const urls = await getURLs(false, this._type === EProjectURLsTreeViewType.IGNORED)

        if (this.instance) {
            this.instance.dispose()
        }

        let treeDataProvider: ProjectURLsTreeViewDataProvider | undefined

        switch (this._type) {
            case EProjectURLsTreeViewType.STARED:
                treeDataProvider = new ProjectURLsTreeViewDataProvider(
                    EURLTreeItemType.STARED,
                    urls
                )
                break
            case EProjectURLsTreeViewType.NORMAL:
                treeDataProvider = new ProjectURLsTreeViewDataProvider(
                    EURLTreeItemType.NORMAL,
                    urls
                )
                break
            case EProjectURLsTreeViewType.IGNORED:
                treeDataProvider = new ProjectURLsTreeViewDataProvider(
                    EURLTreeItemType.IGNORED,
                    urls
                )
                break
            default:
                treeDataProvider = undefined
                break
        }

        if (treeDataProvider)
            this.instance = vscode.window.createTreeView(this._type, {
                treeDataProvider,
                showCollapseAll: false,
                canSelectMany: false,
            })
    }
}
