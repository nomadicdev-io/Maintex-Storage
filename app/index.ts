import { Elysia } from 'elysia';
import { BunAdapter } from 'elysia/adapter/bun'
import plugins, { openapiPlugin } from './plugins';
import { staticRoutes, uploadRoutes } from './routes';
import * as Minio from 'minio'

export const minioClient = new Minio.Client({
    endPoint: import.meta.env.MINIO_ENDPOINT as string,
    useSSL: true,
    accessKey: import.meta.env.S3_ACCESS_KEY,
    secretKey: import.meta.env.S3_SECRET_KEY,
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