;(() => {
    document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
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

                    // observables
                    self.urls = ko.observable([]);
                    self.icons = ko.observable([]);

                    // computeds
                    self.TemUrls = ko.computed(() => { 
                        return self.urls().length > 0; 
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
                            window.pam.model.urls(urls.map(url => {
                                url.hasFavicon = ko.observable(url.hasFavicon);
                                url.favicon = ko.observable(url.favicon);
                                return url;
                            }));

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