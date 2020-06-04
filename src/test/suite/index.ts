import * as path from 'path'

// eslint-disable-next-line import/no-extraneous-dependencies
import * as Mocha from 'mocha'

// eslint-disable-next-line import/no-extraneous-dependencies
import * as glob from 'glob'

export default function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
    })

    const testsRoot = path.resolve(__dirname, '..')

    return new Promise((resolve, reject) => {
        glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
            if (err) {
                reject(err)
                return
            }

            // Add files to the test suite
            files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)))

            try {
                // Run the mocha test
                mocha.run((failures) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`))
                    } else {
                        resolve()
                    }
                })
            } catch (error) {
                console.error(error)
                reject(error)
            }
        })
    })
}
