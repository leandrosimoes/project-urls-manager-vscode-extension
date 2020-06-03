;(() => {
    document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
            let _delayChangeInputCallback_timeout;
            ko.bindingHandlers.delayChangeInputCallback = {
                init: (element, valueAccessor, allBindings, viewModel, bindingContext) => {
                    const { delay = 1000, callback } = valueAccessor();
        
                    element.addEventListener('keyup', event => {
                        clearTimeout(_delayChangeInputCallback_timeout);
                        _delayChangeInputCallback_timeout = setTimeout(() => {
                            !!callback && callback(event.target.value || '', bindingContext.$data);
                        }, delay);
                    });
                }
            };

            const errorsDiv = document.querySelector('#errors');
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
                TOGGLE_THEME: 'TOGGLE_THEME',
                TOGGLE_SHOW_IGNORED: 'TOGGLE_SHOW_IGNORED'
            };

            try {
                function ViewModel() {
                    const self = this;
                    const vscode = acquireVsCodeApi();
                    let searchTimeout = null;

                    // observables
                    self.isLoading = ko.observable(true);
                    self.urls = ko.observable([]);
                    self.icons = ko.observable([]);
                    self.searchText = ko.observable('');
                    self.delayChangeSearchInputCallbackOptions = {
                        delay: 1000, // miliseconds
                        callback: value => {
                            window.pam.model.urls().forEach(url => {
                                url.show(!value || url.href.indexOf(value) > -1);
                            });
                        }
                    };
                    self.delayChangeURLDescriptionInputCallbackOptions = {
                        delay: 1000, // miliseconds
                        callback: (value, data) => {
                            if (!data) {
                                return;
                            }
                            
                            self.saveURLDescription(data);
                        }
                    };

                    // subscribers
                    self.urls.subscribe(() => {
                        setTimeout(() => {
                            const tareas = document.querySelectorAll('.url-description-input');
                            if (tareas && tareas.length > 0) {
                                tareas.forEach(tarea => self.onChangeTextarea(null, { currentTarget: tarea }));
                            }
                        }, 100);
                    });

                    // computeds
                    self.TemUrls = ko.computed(() => { 
                        return self.urls().filter(url => url.show()).length > 0;
                    });

                    // functions
                    self.saveURLDescription = (url) => {
                        if (!url) {
                            return;
                        }
                        
                        vscode.postMessage({ 
                            type: ActionTypes.SAVE_URL_DESCRIPTION, 
                            url: ko.mapping.toJS(url) 
                        });
                    };
                    self.toggleTheme = () => {
                        vscode.postMessage({ type: ActionTypes.TOGGLE_THEME });
                    };
                    self.copyToClipboard = url => {
                        if (!url) {
                            return;
                        }

                        vscode.postMessage({
                            type: ActionTypes.COPY,
                            url: ko.mapping.toJS(url)
                        });
                    };
                    self.ignore = url => {
                        if (!url) {
                            return;
                        }

                        vscode.postMessage({
                            type: ActionTypes.IGNORE,
                            url: ko.mapping.toJS(url)
                        });
                    };
                    self.restore = url => {
                        if (!url) {
                            return;
                        }

                        vscode.postMessage({
                            type: ActionTypes.RESTORE,
                            url: ko.mapping.toJS(url)
                        });
                    };
                    self.toggleShowIgnore = () => {
                        vscode.postMessage({ type: ActionTypes.TOGGLE_SHOW_IGNORED });
                    };
                    self.onChangeTextarea = (data, event) => {
                        const tarea = event.currentTarget;
                        const diference = ((tarea.offsetHeight - tarea.scrollHeight) * -1);

                        if (diference > 0) {
                            tarea.style.height = `${(tarea.offsetHeight + diference)}px`;
                            tarea.style.minHeight = `${(tarea.offsetHeight + diference)}px`;
                            tarea.style.maxHeight = `${(tarea.offsetHeight + diference)}px`;
                        }

                        return true;
                    };
                };

                window.pam = {
                    model: new ViewModel()
                };

                ko.applyBindings(window.pam.model);

                window.addEventListener('message', event => {
                    const { type, urls, icons } = event.data;

                    switch (type) {
                        case ActionTypes.START_LOADING:
                            window.pam.model.isLoading(true);
                            break;

                        case ActionTypes.STOP_LOADING:
                            window.pam.model.isLoading(false);
                            break;

                        case ActionTypes.URL:
                            let lastDomain = '';
                            const bindedURLs = urls.map(url => {
                                url.hasFavicon = ko.observable(url.hasFavicon);
                                url.favicon = ko.observable(url.favicon);
                                url.show = ko.observable(true);
                                url.showDomain = ko.observable(lastDomain !== url.host);
                                url.description = ko.observable(url.description);
                                lastDomain = url.host;
                                return url;
                            });

                            window.pam.model.urls(bindedURLs);

                            break;

                        case ActionTypes.URL_ICON:
                            window.pam.model.urls().forEach(url => {
                                const foundURL = urls.find(u => u.baseURL === url.baseURL);
                                
                                if (foundURL && foundURL.hasFavicon && foundURL.favicon !== url.favicon()) {
                                    url.favicon(foundURL.favicon);
                                    url.hasFavicon(true);
                                }
                            });

                            break;
                        
                        case ActionTypes.ICON:
                            window.pam.model.icons(icons);
                            break;
                    
                        default:
                            break;
                    }
                });
            } catch (error) {
                errorsDiv.innerHTML = error.message;
                errorsDiv.classList.remove('hidden');
            }
        }
    });
})();