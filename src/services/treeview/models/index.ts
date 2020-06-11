// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode'
import { IURL } from '../../urls/interfaces'
import { EURLTreeItemType, EProjectURLsTreeViewType } from '../enums'
import { getURLs } from '../../urls'

export class ProjectURLsTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState)
    }

    get tooltip(): string {
        return this.label
    }

    iconPath = new vscode.ThemeIcon('link')
}

export class ProjectURLsTreeViewDataProvider
    implements vscode.TreeDataProvider<ProjectURLsTreeItem> {
    private _type: EURLTreeItemType

    private _urls: ProjectURLsTreeItem[]

    constructor(type: EURLTreeItemType, urls: IURL[]) {
        this._type = type
        this._urls = this._mapURLItems(urls)
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        ProjectURLsTreeItem | undefined
    > = new vscode.EventEmitter<ProjectURLsTreeItem | undefined>()

    readonly onDidChangeTreeData: vscode.Event<ProjectURLsTreeItem | undefined> = this
        ._onDidChangeTreeData.event

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined)
    }

    private _mapURLItems(urls: IURL[]): ProjectURLsTreeItem[] {
        switch (this._type) {
            case EURLTreeItemType.STARED:
                return urls
                    .filter((url) => url.isStared && !url.isIgnored)
                    .map(
                        (url) =>
                            new ProjectURLsTreeItem(url.href, vscode.TreeItemCollapsibleState.None)
                    )
            case EURLTreeItemType.NORMAL:
                return urls
                    .filter((url) => !url.isStared && !url.isIgnored)
                    .map(
                        (url) =>
                            new ProjectURLsTreeItem(url.href, vscode.TreeItemCollapsibleState.None)
                    )
            case EURLTreeItemType.IGNORED:
                return urls
                    .filter((url) => url.isIgnored)
                    .map(
                        (url) =>
                            new ProjectURLsTreeItem(url.href, vscode.TreeItemCollapsibleState.None)
                    )
            default:
                return []
        }
    }

    getTreeItem(element: ProjectURLsTreeItem): ProjectURLsTreeItem {
        return element
    }

    getChildren(element?: ProjectURLsTreeItem | undefined): Thenable<ProjectURLsTreeItem[]> {
        if (!element) {
            return Promise.resolve(this._urls)
        }

        return Promise.resolve([])
    }
}

export class ProjectURLsTreeView {
    private _type: EProjectURLsTreeViewType

    public instance: vscode.TreeView<ProjectURLsTreeItem> | undefined

    constructor(type: EProjectURLsTreeViewType) {
        this._type = type
    }

    async updateTreviewData() {
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
