import fs from 'fs'
import path from 'path'
import imagemin from 'imagemin'
import imageminSvgo from 'imagemin-svgo'
import imageminOptipng from 'imagemin-optipng'
import imageminPngquant from 'imagemin-pngquant'
import imageminGifsicle from 'imagemin-gifsicle'
import imageminJpegtran from 'imagemin-jpegtran'
import { writeFile, exists, readFile } from './helper.mjs'

export default class BatchCompressImage {
    constructor(options = {}) {
        // I love ES2015!
        const {
            plugins = [],
            optipng = {
                optimizationLevel: 3
            },
            gifsicle = {
                optimizationLevel: 1
            },
            jpegtran = {
                progressive: false
            },
            svgo = {},
            pngquant = {
                quality: '80'
            },
            extname = ['.png', '.jpg']
        } = options

        this.options = {
            imageminOptions: {
                plugins: []
            },
            extname
        }

        // As long as the options aren't `null` then include the plugin. Let the destructuring above
        // control whether the plugin is included by default or not.
        for (let [plugin, pluginOptions] of [
            [imageminOptipng, optipng],
            [imageminGifsicle, gifsicle],
            [imageminJpegtran, jpegtran],
            [imageminSvgo, svgo],
            [imageminPngquant, pngquant]
        ]) {
            if (pluginOptions !== null) {
                this.options.imageminOptions.plugins.push(plugin(pluginOptions))
            }
        }

        // And finally, add any plugins that they pass in the options to the internal plugins array
        this.options.imageminOptions.plugins.push(...plugins)
    }

    /**
     * @desc 正式压缩图片
     * @param filePath
     * @param outPath
     *
     */
    compressionImage(filePath, outPath) {
        console.log('开始压缩：' + filePath)
        if (!exists(filePath)) {
            console.log(filePath + ' is no found')
            return
        }
        let files = []
        try {
            files = fs.readdirSync(filePath)
        } catch (error) {
            console.log('error:\n' + error)
        }
        /** 循环文件 **/
        files.forEach(async file => {
            let stat
            const inFilePath = filePath + '/' + file
            const outFilePath = outPath + '/' + file
            try {
                stat = fs.statSync(inFilePath)
            } catch (error) {
                console.log(error)
            }

            if (stat.isDirectory()) {
                this.compressionImage(inFilePath, outFilePath)
            } else {
                /** 压缩文件 begin*/
                let fileData = await readFile(inFilePath)
                if (this.options.extname.includes(path.extname(file))) {
                    fileData = await this.optimizeImage(
                        new Buffer(fileData),
                        this.options.imageminOptions
                    )
                }
                writeFile(outFilePath, fileData)
                /** 压缩文件 end*/
            }
        })
        console.log('结束压缩：' + filePath)
    }

    async optimizeImage(imageData, imageminOptions) {
        // Ensure that the contents i have are in the form of a buffer
        const imageBuffer = Buffer.isBuffer(imageData)
            ? imageData
            : Buffer.from(imageData, 'utf8')
        // And get the original size for comparison later to make sure it actually got smaller
        const originalSize = imageBuffer.length

        // Await for imagemin to do the compression
        const optimizedImageBuffer = await imagemin.buffer(
            imageBuffer,
            imageminOptions
        )

        // If the optimization actually produced a smaller file, then return the optimized version
        if (optimizedImageBuffer.length < originalSize) {
            return optimizedImageBuffer
        } else {
            // otherwize return the orignal
            return imageBuffer
        }
    }
}
/***
 *  exmple
 *
 * new BatchCompressImage().compressionImage(
 *   'C:\\Users\\Administrator\\Desktop\\images',
 *  'C:\\Users\\Administrator\\Desktop\\ccc'
 * )
 *
 */
