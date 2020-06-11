![URLs Manager](https://raw.githubusercontent.com/leandrosimoes/project-urls-manager-vscode-extension/master/docs/icon-128.png)

# Project URLs Manager

VS Code Extension to manage all urls found inside the workspace files

## Features

This is how the Project URLs Manager looks like when open:

![URLs Manager](https://raw.githubusercontent.com/leandrosimoes/project-urls-manager-vscode-extension/master/docs/manager.png)

1. Search for URLs on list
2. Toggle whenever you want to see or not the ignored URLs on the list
3. Toggle between DARK and LIGHT theme
4. Copy the URL address to clipboard
5. Ignore URLs that you don't want to see on the list by default
6. When ignored URLs are visible, they get a little bit of opacity
7. Restore ignored URLs so you get them back to the list
8. Click at the URL address to open on your browser
9. Add a quick description about the URL
10. See how many URLs was found on your project and click to open the manager window

## Extension Settings

Manage the extension settings

![Settings UI](https://raw.githubusercontent.com/leandrosimoes/project-urls-manager-vscode-extension/master/docs/settings-ui.png)

1. Comma separated of valid file extensions to be considered on sync. (E.g. `'.js,.css,.html'`)
2. Comma separated paths to be ignored on sync. (E.g. `'node_modules,src/your-file.js'`)

The extension settings on VS Code JSON settings file are:

1. `projectURLsManager.extensionsList`
2. `projectURLsManager.ignorePaths` 

## Commands

There's some commands available for the extension too:

![Settings UI](https://raw.githubusercontent.com/leandrosimoes/project-urls-manager-vscode-extension/master/docs/commands.png)

1. After syncing, data is cached like images and descriptions of the URLs. Use this command to force the clean of this cache.
2. Open the URLs manager window
3. Search for URLs in all files, respecting the `ignorePaths` and `extensionsList` provided configurations

## Release Notes

You can see all change log [here](https://github.com/leandrosimoes/project-urls-manager-vscode-extension/blob/develop/CHANGELOG.md).
