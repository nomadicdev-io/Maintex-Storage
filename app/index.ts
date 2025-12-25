import { Elysia } from 'elysia';
import { BunAdapter } from 'elysia/adapter/bun'
import plugins, { openapiPlugin } from './plugins';
import { staticRoutes, uploadRoutes } from './routes';
import * as Minio from 'minio'

export const minioClient = new Minio.Client({
    endPoint: process.env.F3_ENDPOINT as string,
    useSSL: true,
    accessKey: process.env.F3_ACCESS_KEY,
    secretKey: process.env.F3_SECRET_KEY,
    region: process.env.F3_REGION || 'us-east-1'
})

const app = new Elysia({
    name: 'Maintex Storage API',
    adapter: BunAdapter
})

app
.use(openapiPlugin)
.use(plugins)
.use(staticRoutes)
.use(uploadRoutes)

export default app;