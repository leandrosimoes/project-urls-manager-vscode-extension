document.addEventListener('readystatechange', () => {
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
    }

    function pamViewModel() {
        const vscode = acquireVsCodeApi()

        // observables
        this.isLoading = ko.observable(true)
        this.urls = ko.observable([])
        this.searchText = ko.observable('')
        this.delayChangeSearchInputCallbackOptions = {
            delay: 1000, // miliseconds
            callback: (value) => {
                window.pam.model.urls().forEach((url) => {
                    url.show(!value || url.href.indexOf(value) > -1)
                })
            },
        }
        this.delayChangeURLDescriptionInputCallbackOptions = {
            delay: 1000, // miliseconds
            callback: (value, data) => {
                if (!data) {
                    return
                }

                this.saveURLDescription(data)
            },
        }

        // subscribers
        this.urls.subscribe(() => {
            setTimeout(() => {
                const tareas = document.querySelectorAll('.url-description-input')
                if (tareas && tareas.length > 0) {
                    tareas.forEach((tarea) =>
                        this.onChangeTextarea(null, {
                            currentTarget: tarea,
                        })
                    )
                }
            }, 100)
        })

        // computeds
        this.ShowNoURLsMessage = ko.computed(() => {
            return this.urls().filter((url) => url.show()).length === 0 && !this.isLoading()
        })
        this.ShowURLsList = ko.computed(() => {
            return this.urls().filter((url) => url.show()).length > 0 && !this.isLoading()
        })

        // functions
        this.saveURLDescription = (url) => {
            if (!url) {
                return
            }

            vscode.postMessage({
                type: ActionTypes.SAVE_URL_DESCRIPTION,
                url: ko.mapping.toJS(url),
            })
        }
        this.copyToClipboard = (url) => {
            if (!url) {
                return
            }

            vscode.postMessage({
                type: ActionTypes.COPY,
                url: ko.mapping.toJS(url),
            })
        }
        this.ignore = (url) => {
            if (!url) {
                return
            }

            vscode.postMessage({
                type: ActionTypes.IGNORE,
                url: ko.mapping.toJS(url),
            })
        }
        this.restore = (url) => {
            if (!url) {
                return
            }

            vscode.postMessage({
                type: ActionTypes.RESTORE,
                url: ko.mapping.toJS(url),
            })
        }
        this.star = (url) => {
            if (!url) {
                return
            }

            vscode.postMessage({
                type: ActionTypes.STAR,
                url: ko.mapping.toJS(url),
            })
        }
        this.unstar = (url) => {
            if (!url) {
                return
            }

            vscode.postMessage({
                type: ActionTypes.UNSTAR,
                url: ko.mapping.toJS(url),
            })
        }
        this.toggleShowIgnore = () => {
            vscode.postMessage({
                type: ActionTypes.TOGGLE_SHOW_IGNORED,
            })
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

    if (document.readyState === 'complete') {
        let DELAY_CHANGE_INPUT_TIMEOUT

        ko.bindingHandlers.delayChangeInputCallback = {
            init: (element, valueAccessor, allBindings, viewModel, bindingContext) => {
                const { delay = 1000, callback } = valueAccessor()

                element.addEventListener('keyup', (event) => {
                    clearTimeout(DELAY_CHANGE_INPUT_TIMEOUT)
                    DELAY_CHANGE_INPUT_TIMEOUT = setTimeout(() => {
                        if (callback) callback(event.target.value || '', bindingContext.$data)
                    }, delay)
                })
            },
        }
        window.pam = {
            model: new pamViewModel(),
        }

        ko.applyBindings(window.pam.model)

        window.addEventListener('message', (event) => {
            const { type, urls } = event.data
            let lastDomain = ''

            switch (type) {
                case ActionTypes.START_LOADING:
                    window.pam.model.isLoading(true)
                    break

                case ActionTypes.STOP_LOADING:
                    window.pam.model.isLoading(false)
                    break

                case ActionTypes.URL:
                    lastDomain = ''

                    window.pam.model.urls(
                        urls.map((url) => {
                            url.hasFavicon = ko.observable(url.hasFavicon)
                            url.favicon = ko.observable(url.favicon)
                            url.show = ko.observable(true)
                            url.showDomain = ko.observable(lastDomain !== url.host)
                            url.description = ko.observable(url.description)
                            url.isStarred = !!url.isStarred
                            lastDomain = url.host
                            return url
                        })
                    )

                    break

                case ActionTypes.URL_ICON:
                    window.pam.model.urls().forEach((url) => {
                        const foundURL = urls.find((u) => u.baseURL === url.baseURL)

                        if (foundURL && foundURL.hasFavicon && foundURL.favicon !== url.favicon()) {
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
