const ActionTypes = {
    URL: 'URL',
    URL_ICON: 'URL_ICON',
    ICON: 'ICON',
    COPY: 'COPY',
    IGNORE: 'IGNORE',
    RESTORE: 'RESTORE',
    START_LOADING: 'START_LOADING',
    STOP_LOADING: 'STOP_LOADING',
    SAVE_URL_DESCRIPTION: 'SAVE_URL_DESCRIPTION',
    TOGGLE_SHOW_IGNORED: 'TOGGLE_SHOW_IGNORED',
    STAR: 'STAR',
    UNSTAR: 'UNSTAR',
    CHANGE_PAGE: 'CHANGE_PAGE',
    SEARCH: 'SEARCH',
}

function viewModel() {
    const vscode = acquireVsCodeApi()

    // observables
    this.isShowingIgnored = ko.observable(
        document.querySelector('.toggle').classList.contains('show-ignored')
    )
    this.currentPage = ko.observable(1)
    this.totalPages = ko.observable(1)
    this.isLoading = ko.observable(true)
    this.urls = ko.observable([])
    this.pages = ko.observable([])
    this.searchText = ko.observable(
        document.querySelector('#search-input').value || ''
    )
    this.delayChangeSearchInputCallbackOptions = {
        delay: 1000, // miliseconds
        callback: (value) => {
            vscode.postMessage({
                type: ActionTypes.SEARCH,
                isShowingIgnored: this.isShowingIgnored(),
                currentPage: 1,
                searchText: value,
            })
        },
    }
    this.delayChangeURLDescriptionInputCallbackOptions = {
        delay: 1000, // miliseconds
        callback: (_, data) => {
            if (!data) {
                return
            }

            this.saveURLDescription(data)
        },
    }

    // subscribers
    this.urls.subscribe(() => {
        setTimeout(() => {
            const textareas = document.querySelectorAll(
                '.url-description-input'
            )
            if (textareas && textareas.length > 0) {
                textareas.forEach((tarea) =>
                    this.onChangeTextarea(null, {
                        currentTarget: tarea,
                    })
                )
            }
        }, 100)
    })
    this.debounceTimeout = null
    this.currentPage.subscribe(() => {
        clearTimeout(this.debounceTimeout)

        this.debounceTimeout = setTimeout(() => {
            this.changePage()
        }, 500)
    })
    this.isShowingIgnored.subscribe((isShowingIgnored) => {
        clearTimeout(this.debounceTimeout)

        this.debounceTimeout = setTimeout(() => {
            vscode.postMessage({
                type: ActionTypes.TOGGLE_SHOW_IGNORED,
                isShowingIgnored,
                currentPage: 1,
                searchText: this.searchText(),
            })
        }, 500)
    })

    // computeds
    this.ShowNoURLsMessage = ko.computed(() => {
        return (
            this.urls().filter((url) => url.show()).length === 0 &&
            !this.isLoading()
        )
    })
    this.ShowURLsList = ko.computed(() => {
        return (
            this.urls().filter((url) => url.show()).length > 0 &&
            !this.isLoading()
        )
    })
    this.ShowPagination = ko.computed(() => {
        return this.pages().length > 1 && !this.isLoading()
    })

    // functions
    this.changePage = () => {
        vscode.postMessage({
            type: ActionTypes.CHANGE_PAGE,
            isShowingIgnored: this.isShowingIgnored(),
            currentPage: this.currentPage(),
            searchText: this.searchText(),
        })
    }
    this.nextPage = () => {
        if (this.currentPage() >= this.totalPages()) return

        this.currentPage(this.currentPage() + 1)
    }
    this.firstPage = () => {
        this.currentPage(1)
    }
    this.lastPage = () => {
        this.currentPage(this.totalPages())
    }
    this.nextPage = () => {
        if (this.currentPage() >= this.totalPages()) return

        this.currentPage(this.currentPage() + 1)
    }
    this.selectPage = (page) => {
        if (!page) return

        this.currentPage(page)
    }
    this.prevPage = () => {
        if (this.currentPage() <= 1) return

        this.currentPage(this.currentPage() - 1)
    }
    this.saveURLDescription = (url) => {
        if (!url) return

        vscode.postMessage({
            type: ActionTypes.SAVE_URL_DESCRIPTION,
            url: ko.mapping.toJS(url),
            isShowingIgnored: this.isShowingIgnored(),
            currentPage: this.currentPage(),
            searchText: this.searchText(),
        })
    }
    this.copyToClipboard = (url) => {
        if (!url) return

        vscode.postMessage({
            type: ActionTypes.COPY,
            url: ko.mapping.toJS(url),
            isShowingIgnored: this.isShowingIgnored(),
            currentPage: this.currentPage(),
            searchText: this.searchText(),
        })
    }
    this.ignore = (url) => {
        if (!url) return

        vscode.postMessage({
            type: ActionTypes.IGNORE,
            url: ko.mapping.toJS(url),
            isShowingIgnored: this.isShowingIgnored(),
            currentPage: this.currentPage(),
            searchText: this.searchText(),
        })
    }
    this.restore = (url) => {
        if (!url) return

        vscode.postMessage({
            type: ActionTypes.RESTORE,
            url: ko.mapping.toJS(url),
            isShowingIgnored: this.isShowingIgnored(),
            currentPage: this.currentPage(),
            searchText: this.searchText(),
        })
    }
    this.star = (url) => {
        if (!url) return

        vscode.postMessage({
            type: ActionTypes.STAR,
            url: ko.mapping.toJS(url),
            isShowingIgnored: this.isShowingIgnored(),
            currentPage: this.currentPage(),
            searchText: this.searchText(),
        })
    }
    this.unstar = (url) => {
        if (!url) return

        vscode.postMessage({
            type: ActionTypes.UNSTAR,
            url: ko.mapping.toJS(url),
            isShowingIgnored: this.isShowingIgnored(),
            currentPage: this.currentPage(),
            searchText: this.searchText(),
        })
    }
    this.toggleShowIgnore = (isShowingIgnored) => {
        this.isShowingIgnored(isShowingIgnored)
    }
    this.onChangeTextarea = (data, event) => {
        const tarea = event.currentTarget
        const diference = (tarea.offsetHeight - tarea.scrollHeight) * -1

        if (diference > 0) {
            tarea.style.height = `${tarea.offsetHeight + diference}px`
            tarea.style.minHeight = `${tarea.offsetHeight + diference}px`
            tarea.style.maxHeight = `${tarea.offsetHeight + diference}px`
        }

        return true
    }
}

document.addEventListener('readystatechange', () => {
    if (document.readyState === 'complete') {
        let DELAY_CHANGE_INPUT_TIMEOUT

        ko.bindingHandlers.delayChangeInputCallback = {
            init: (
                element,
                valueAccessor,
                allBindings,
                viewModel,
                bindingContext
            ) => {
                const { delay = 1000, callback } = valueAccessor()

                element.addEventListener('keyup', (event) => {
                    clearTimeout(DELAY_CHANGE_INPUT_TIMEOUT)
                    DELAY_CHANGE_INPUT_TIMEOUT = setTimeout(() => {
                        if (callback)
                            callback(
                                event.target.value || '',
                                bindingContext.$data
                            )
                    }, delay)
                })
            },
        }
        window.view_model = {
            model: new viewModel(),
        }

        ko.applyBindings(window.view_model.model)

        window.addEventListener('message', (event) => {
            const { type, urls = [], pages = [], totalPages = 1 } = event.data
            let lastDomain = ''

            switch (type) {
                case ActionTypes.START_LOADING:
                    window.view_model.model.isLoading(true)
                    break

                case ActionTypes.STOP_LOADING:
                    window.view_model.model.isLoading(false)
                    break

                case ActionTypes.URL:
                    lastDomain = ''

                    window.view_model.model.urls(
                        urls.map((url) => {
                            url.hasFavicon = ko.observable(url.hasFavicon)
                            url.favicon = ko.observable(url.favicon)
                            url.show = ko.observable(true)
                            url.showDomain = ko.observable(
                                lastDomain !== url.host
                            )
                            url.description = ko.observable(url.description)
                            url.isStarred = !!url.isStarred
                            lastDomain = url.host
                            return url
                        })
                    )
                    window.view_model.model.pages(pages)
                    window.view_model.model.totalPages(totalPages)

                    if (pages.length === 1) {
                        window.view_model.model.currentPage(1)
                    }

                    break

                case ActionTypes.URL_ICON:
                    window.view_model.model.urls().forEach((url) => {
                        const foundURL = urls.find(
                            (u) => u.baseURL === url.baseURL
                        )

                        if (
                            foundURL &&
                            foundURL.hasFavicon &&
                            foundURL.favicon !== url.favicon()
                        ) {
                            url.favicon(foundURL.favicon)
                            url.hasFavicon(true)
                        }
                    })
                    break

                default:
                    break
            }
        })
    }
})
