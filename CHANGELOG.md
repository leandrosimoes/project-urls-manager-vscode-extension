# Change Log

All notable changes to the "project-urls-manager" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- You can see more about what's going on [here](https://github.com/leandrosimoes/project-urls-manager-vscode-extension/issues), even open a new issue with your sugestions/errors.

## [1.3.1]
- Small fixes and improvements

## [1.3.0]
- Now the URLs browser has pagination that shows only 6 URLs per page. You can change the page by clicking on the pagination buttons at the bottom of the page.

## [1.2.6]
- Fixed problem where no URLs were found when some ignored pattern URLs exists.

## [1.2.5]
- Now the tree view shows two icon buttons, one to open the URL in the browser, and another to open the URL source file with the cursor exactly where the URL was found.

## [1.2.4]
- Docs improvements

## [1.2.3]
- Fixed issue on open the side tree view

## [1.2.2]
### Changes
- Add `package-lock.json` and `yarn.lock` files to be ignored into the default `ignorePaths` settings

## [1.2.1]
### Fixes
- Fixed error on getting URLs on Mac OS

## [1.2.0]
### Features
- Now the pannels in the Webview has a default message and a SYNC button when the panel has no URLs so the users can force the sync command

### Changes
- The theme is not set by the theme that users are using in their VS Code. So because of that, the theme toggle at the manager was removed

### Fixes
- The TreeView URLs were not syncing when the manager was open. Now it's fixed and the URLs are syncing correctly

## [1.1.0]
### Features
- New configuration to add domains that you want to ignore
- New action icon to star URLs so you can see them at the top of the list
- New TreeView on the VS Code Activity bar so you can easily see your URLs list with no need to open the manager

### Changes
- URLs action buttons on the WebView are now just icons to a better look
- Icons on the WebView now are from the VS Code official API

### Fixes
- Fixed ignored URLs visibility toggle state

## [1.0.1] - 2020-06-09
### Fixes
- Extension icons background transparency

## [1.0.0] - 2020-06-08
### Features
- First version released. To see all the features and how it works, take a look at the [https://github.com/leandrosimoes/project-urls-manager-vscode-extension](documentation).