;(() => {
    document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
            let _delayChangeInputCallback_timeout;
            ko.bindingHandlers.delayChangeInputCallback = {
                init: (element, valueAccessor) => {
                    const { delay = 1000, callback } = valueAccessor();
        
                    element.addEventListener('keyup', event => {
                        clearTimeout(_delayChangeInputCallback_timeout);
                        _delayChangeInputCallback_timeout = setTimeout(() => {
                            !!callback && callback(event.target.value || '');
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
                TOGGLE_THEME: 'TOGGLE_THEME',
                TOGGLE_SHOW_IGNORED: 'TOGGLE_SHOW_IGNORED'
            };

            try {
                function ViewModel() {
                    const self = this;
                    const vscode = acquireVsCodeApi();
                    let searchTimeout = null;

                    // observables
                    self.urls = ko.observable([]);
                    self.icons = ko.observable([]);
                    self.searchText = ko.observable('');
                    self.delayChangeInputCallbackOptions = {
                        delay: 1000, // miliseconds
                        callback: value => {
                            window.pam.model.urls().forEach(url => {
                                url.show(!value || url.href.indexOf(value) > -1);
                            });
                        }
                    };

                    // computeds
                    self.TemUrls = ko.computed(() => { 
                        return self.urls().filter(url => url.show()).length > 0;
                    });

                    // functions
                    self.toggleTheme = () => {
                        vscode.postMessage({ type: ActionTypes.TOGGLE_THEME });
                    };
                    self.copyToClipboard = url => {
                        if (!url) {
                            return;
                        }

                        vscode.postMessage({
                            type: ActionTypes.COPY,
                            url
                        });
                    };
                    self.ignore = url => {
                        if (!url) {
                            return;
                        }

                        vscode.postMessage({
                            type: ActionTypes.IGNORE,
                            url
                        });
                    };
                    self.restore = url => {
                        if (!url) {
                            return;
                        }

                        vscode.postMessage({
                            type: ActionTypes.RESTORE,
                            url
                        });
                    };
                    self.toggleShowIgnore = () => {
                        vscode.postMessage({ type: ActionTypes.TOGGLE_SHOW_IGNORED });
                    };
                };

                window.pam = {
                    model: new ViewModel()
                };

                ko.applyBindings(window.pam.model);

                window.addEventListener('message', event => {
                    const { type, urls, icons } = event.data;

                    switch (type) {

                        case ActionTypes.URL:
                            let lastDomain = '';
                            const bindedURLs = urls.map(url => {
                                url.hasFavicon = ko.observable(url.hasFavicon);
                                url.favicon = ko.observable(url.favicon);
                                url.show = ko.observable(true);
                                url.showDomain = ko.observable(lastDomain !== url.host);
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