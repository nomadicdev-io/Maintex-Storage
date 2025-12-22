import { Elysia } from 'elysia';
import { BunAdapter } from 'elysia/adapter/bun'
import plugins, { openapiPlugin } from './plugins';
import { staticRoutes, uploadRoutes } from './routes';
import * as Minio from 'minio'
import { existsSync, mkdirSync } from 'node:fs';

const createStorageFolder = async () => {

    const isStorageFolderExists = existsSync('storage');
    if(!isStorageFolderExists) {
        mkdirSync('storage');
    }

    const isUploadsFolderExists = existsSync('storage/uploads');
    if(!isUploadsFolderExists) {
        mkdirSync('storage/uploads');
    }

    const isTempFolderExists = existsSync('storage/temp');
    if(!isTempFolderExists) {
        mkdirSync('storage/temp');
    }

    const isDriveFolderExists = existsSync('drive');
    if(!isDriveFolderExists) {
        mkdirSync('drive');
    }

    const isLogsFolderExists = existsSync('storage/logs');
    if(!isLogsFolderExists) {
        mkdirSync('storage/logs');
    }

    const isAssetsFolderExists = existsSync('storage/assets');
    if(!isAssetsFolderExists) {
        mkdirSync('storage/assets');
    }
}

createStorageFolder();


export const minioClient = new Minio.Client({
    endPoint: process.env.F3_ENDPOINT as string,
    port: parseInt(process.env.F3_PORT as string),
    useSSL: false,
    accessKey: process.env.F3_ACCESS_KEY,
    secretKey: process.env.F3_SECRET_KEY,
    region: 'us-east-1'
})

const app = new Elysia({
    name: 'Maintex Storage API',
    adapter: BunAdapter
})

app
.use(plugins)
.use(staticRoutes)
.use(uploadRoutes)
.use(openapiPlugin)
// .get('/token', async ({jwt}: {jwt: any})=> {
//     const token = await jwt.sign({
//         id: '68c9e29876475905a9167e38',
//         name: 'Admin Maintex',
//         email: 'admin@maintex.pro',
//         usernane: 'maintex-admin'
//     })
//     return token
// })

export default app;