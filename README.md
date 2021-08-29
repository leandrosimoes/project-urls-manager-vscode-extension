![URLs Manager](https://raw.githubusercontent.com/leandrosimoes/project-urls-manager-vscode-extension/master/docs/icon-128.png)

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/907e5f86db67459e81d3bccba521b6ba)](https://www.codacy.com/gh/leandrosimoes/project-urls-manager-vscode-extension/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=leandrosimoes/project-urls-manager-vscode-extension&amp;utm_campaign=Badge_Grade)

# Project URLs Manager

VS Code Extension to manage all urls found inside the workspace files

## Features

This is how the Project URLs Manager looks like when open:

![URLs Manager](https://raw.githubusercontent.com/leandrosimoes/project-urls-manager-vscode-extension/master/docs/manager.png)

* **Search Input**: Search for URLs on list
* **Ignored URLs Visibility Toggle** Toggle whenever you want to see or not the ignored URLs on the list
* **URL Actions**: Copy to Clipboard, Ignore, Restore, Star and Unstar actions
* **Ignored URL**: When ignored URLs are visible, they get a little bit of opacity
* **URL Address**: Click at the URL address to open on your browser
* **URL Description**: Add a quick description about the URL
* **Status Bar/Open Button**: See how many URLs was found on your project and click to open the manager window
* **Treview**: Pannels that shows all URLs separated by status. You can double click them to open on browser.

## Extension Settings

Manage the extension settings

![Settings UI](https://raw.githubusercontent.com/leandrosimoes/project-urls-manager-vscode-extension/master/docs/settings-ui.png)

1. Comma separated of valid file extensions to be considered on sync. (E.g. `'.js,.css,.html'`)
2. Comma separated domains to be ignored on sync. (E.g. `'google.con,facebook.com'`)
3. Comma separated paths to be ignored on sync. (E.g. `'node_modules,src/your-file.js'`)

The extension settings on VS Code JSON settings file are:

1. `projectURLsManager.extensionsList`
2. `projectURLsManager.ignoreDomains` 
3. `projectURLsManager.ignorePaths` 

## Commands

There's some commands available for the extension too:

![Settings UI](https://raw.githubusercontent.com/leandrosimoes/project-urls-manager-vscode-extension/master/docs/commands.png)

1. This command is used just by treeview, so if you execute it nothing is gonna happend
2. Show Project URLs Manager TreeView List
3. Show Project URLs Manager TreeView List and focus on Ignored pannel
4. Search for URLs in all files, respecting the `ignorePaths`, `ignoreDomains` and `extensionsList` provided configurations
5. Show Project URLs Manager TreeView List and focus on Normal pannel
6. Show Project URLs Manager TreeView List and focus on Starred pannel
7. After syncing, data is cached like images and descriptions of the URLs. Use this command to force the clean of this cache.
8. Open the URLs manager tab

## Release Notes

You can see all change log [here](https://github.com/leandrosimoes/project-urls-manager-vscode-extension/blob/develop/CHANGELOG.md).
