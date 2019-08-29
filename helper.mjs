import promisify from 'util.promisify'
import mkdirp from 'mkdirp'
import fs from 'fs'
import path from 'path'
export const readFile = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)
const mkdirpAsync = promisify(mkdirp)

/**
 * checks if a file/directory is accessable
 * @param {any} directory
 * @returns
 */
export async function exists(directory) {
    return new Promise((resolve, reject) => {
        fs.access(directory, fs.constants.R_OK | fs.constants.W_OK, err => {
            if (err) {
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}
/**
 * async wrapper for writeFile that will create the directory if it does not already exist
 * @param {String} filename
 * @param {Buffer} buffer
 * @returns
 */
export async function writeFile(filename, buffer) {
    const directory = path.dirname(filename)
    // if the directory doesn't exist, create it
    if (!(await exists(directory))) {
        await mkdirpAsync(directory)
    }

    return writeFileAsync(filename, buffer)
}
