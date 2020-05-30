;(() => {
    document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
            const errorsDiv = document.querySelector('#errors');
            const ActionTypes = {
                URL: 'URL',
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
                    const { type } = event.data;

                    switch (type) {

                        case ActionTypes.URL:
                            const { urls } = event.data;
                            window.pam.model.urls(urls);
                            break;
                        
                        case ActionTypes.ICON:
                            const { icons } = event.data;
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