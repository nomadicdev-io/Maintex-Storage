import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";


const createThumbnail = async (file: Buffer) => {

    let thumbnail = await sharp(file)
    .resize({ width: 512, height: 512, fit: 'cover' })
    .webp({ quality: 75 })
    .toBuffer()

    return thumbnail
}

export const createVideoThumbnail = async (videoPath: any, outputPath: any)=> {

    await ffmpeg(videoPath)
    .screenshots({
      filename: outputPath,
      count: 4,
      size: "512x512",
    })
}


export default createThumbnail