;(() => {
    document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
            const errorsDiv = document.querySelector('#errors');

            try {
                function ViewModel() {
                    const self = this;

                    // observables
                    self.count = ko.observable(0);
                    self.urls = ko.observable([]);

                    // computeds
                    self.TemUrls = ko.computed(() => { 
                        return self.urls().length > 0; 
                    });

                    // functions
                    self.increment = () => { self.count(self.count() + 1); };
                };

                window.pam = {
                    model: new ViewModel()
                };

                ko.applyBindings(window.pam.model);

                window.addEventListener('message', event => {
                    window.pam.model.urls(event.data.urls);
                });
            } catch (error) {
                errorsDiv.innerHTML = error.message;
                errorsDiv.classList.remove('hidden');
            }
        }
    });
})();