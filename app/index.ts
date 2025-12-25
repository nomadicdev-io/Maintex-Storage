import { Elysia } from 'elysia';
import { BunAdapter } from 'elysia/adapter/bun'
import plugins, { openapiPlugin } from './plugins';
import { staticRoutes, uploadRoutes } from './routes';
import * as Minio from 'minio'
import { requestLogger } from './requestLogger';

export const minioClient = new Minio.Client({
    endPoint: process.env.F3_ENDPOINT as string,
    useSSL: true,
    accessKey: process.env.F3_ACCESS_KEY,
    secretKey: process.env.F3_SECRET_KEY,
    region: 'us-east-1'
})

const app = new Elysia({
    name: 'Maintex Storage API',
    adapter: BunAdapter
})

app
.use(openapiPlugin)
.use(plugins)
// .onAfterResponse(requestLogger as any)
.use(staticRoutes)
.use(uploadRoutes)
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