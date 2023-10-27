export const waitForXSeconds = (seconds = 1) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(true), seconds * 1000)
    })
}

export const guid = () => {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1)
    }

    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`
}
