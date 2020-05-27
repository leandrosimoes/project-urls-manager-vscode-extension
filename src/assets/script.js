(() => {

    document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
            document.querySelector('h1').innerHTML = `${document.querySelector('h1').innerHTML}: from script`;
        }
    });

})();