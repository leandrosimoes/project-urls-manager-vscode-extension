export const waitForXSeconds = (seconds = 1) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(true), seconds * 1000)
    })
}

/* eslint-disable no-await-in-loop */
export const asyncForEach = async (array: any[], callback: any, delayTime = 0) => {
    for (let index = 0; index < array.length; index += 1) {
        if (delayTime > 0) {
            await waitForXSeconds(delayTime)
        }

        await callback(array[index], index, array)
    }
}

export const guid = () => {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1)
    }

    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`
}
