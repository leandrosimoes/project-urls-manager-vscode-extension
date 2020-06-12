# Change Log

All notable changes to the "project-urls-manager" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- You can see more about what's going on [here](https://github.com/leandrosimoes/project-urls-manager-vscode-extension/issues), even open a new issue with your sugestions/errors.

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