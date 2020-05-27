export const waitForXSeconds = (seconds = 1) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000);
    });
};

/* eslint-disable no-await-in-loop */
export const asyncForEach = async (array: any[], callback: any, delayTime = 0) => {
    for (let index = 0; index < array.length; index += 1) {
        if (delayTime > 0) {await waitForXSeconds(delayTime);};

        await callback(array[index], index, array);
    }
};