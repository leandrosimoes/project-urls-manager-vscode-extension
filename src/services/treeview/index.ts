import { EProjectURLsTreeViewType } from './enums'
import { ProjectURLsTreeView } from './models'

let STARED_TREEVIEW: ProjectURLsTreeView | undefined
let NORMAL_TREEVIEW: ProjectURLsTreeView | undefined
let IGNORED_TREEVIEW: ProjectURLsTreeView | undefined

interface IProjectURLTreeViews {
    STARED_TREEVIEW: ProjectURLsTreeView
    NORMAL_TREEVIEW: ProjectURLsTreeView
    IGNORED_TREEVIEW: ProjectURLsTreeView
}

export const setupTreeViews = async (): Promise<IProjectURLTreeViews> => {
    STARED_TREEVIEW = STARED_TREEVIEW || new ProjectURLsTreeView(EProjectURLsTreeViewType.STARED)
    NORMAL_TREEVIEW = NORMAL_TREEVIEW || new ProjectURLsTreeView(EProjectURLsTreeViewType.NORMAL)
    IGNORED_TREEVIEW = IGNORED_TREEVIEW || new ProjectURLsTreeView(EProjectURLsTreeViewType.IGNORED)

    return {
        STARED_TREEVIEW,
        NORMAL_TREEVIEW,
        IGNORED_TREEVIEW,
    }
}

export const getTreeViews = async (): Promise<IProjectURLTreeViews> => {
    STARED_TREEVIEW = STARED_TREEVIEW || new ProjectURLsTreeView(EProjectURLsTreeViewType.STARED)
    NORMAL_TREEVIEW = NORMAL_TREEVIEW || new ProjectURLsTreeView(EProjectURLsTreeViewType.NORMAL)
    IGNORED_TREEVIEW = IGNORED_TREEVIEW || new ProjectURLsTreeView(EProjectURLsTreeViewType.IGNORED)

    return {
        STARED_TREEVIEW,
        NORMAL_TREEVIEW,
        IGNORED_TREEVIEW,
    }
}

export default {
    setupTreeViews,
    getTreeViews,
}
