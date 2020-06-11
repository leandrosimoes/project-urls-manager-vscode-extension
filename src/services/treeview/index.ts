import { EProjectURLsTreeViewType } from './enums'
import { ProjectURLsTreeView } from './models'

let STARRED_TREEVIEW: ProjectURLsTreeView | undefined
let NORMAL_TREEVIEW: ProjectURLsTreeView | undefined
let IGNORED_TREEVIEW: ProjectURLsTreeView | undefined

interface IProjectURLTreeViews {
    STARRED_TREEVIEW: ProjectURLsTreeView
    NORMAL_TREEVIEW: ProjectURLsTreeView
    IGNORED_TREEVIEW: ProjectURLsTreeView
}

export const setupTreeViews = async (): Promise<IProjectURLTreeViews> => {
    STARRED_TREEVIEW = STARRED_TREEVIEW || new ProjectURLsTreeView(EProjectURLsTreeViewType.STARRED)
    NORMAL_TREEVIEW = NORMAL_TREEVIEW || new ProjectURLsTreeView(EProjectURLsTreeViewType.NORMAL)
    IGNORED_TREEVIEW = IGNORED_TREEVIEW || new ProjectURLsTreeView(EProjectURLsTreeViewType.IGNORED)

    return {
        STARRED_TREEVIEW,
        NORMAL_TREEVIEW,
        IGNORED_TREEVIEW,
    }
}

export const getTreeViews = async (): Promise<IProjectURLTreeViews> => {
    STARRED_TREEVIEW = STARRED_TREEVIEW || new ProjectURLsTreeView(EProjectURLsTreeViewType.STARRED)
    NORMAL_TREEVIEW = NORMAL_TREEVIEW || new ProjectURLsTreeView(EProjectURLsTreeViewType.NORMAL)
    IGNORED_TREEVIEW = IGNORED_TREEVIEW || new ProjectURLsTreeView(EProjectURLsTreeViewType.IGNORED)

    return {
        STARRED_TREEVIEW,
        NORMAL_TREEVIEW,
        IGNORED_TREEVIEW,
    }
}

export default {
    setupTreeViews,
    getTreeViews,
}
