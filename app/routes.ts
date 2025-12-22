import { Elysia, file } from 'elysia';
import fileTypes from './config/upload-types.json'
import { minioClient } from '.';
import { healthcheckPlugin } from 'elysia-healthcheck';
import sharp from 'sharp';

const staticRoutes = new Elysia({
    name: 'Maintex Storage Static Routes',
})

staticRoutes
.get('/', file('public/index.html'))
.get('/favicon.ico', file('public/favicon.ico'))
.use(
    healthcheckPlugin({
      prefix: '/api/v1/health',
      paths: {
        liveness: '/liveness',
        readiness: '/readiness',
      }
    })
)

const uploadRoutes = new Elysia({
    name: 'Maintex Storage Upload Routes',
    prefix: '/api/v1',
})

uploadRoutes
.get('/s3/url', async ({query, status, redirect}: {query: any, status: any, redirect: any})=> {
    try{
        const {key, bucket} = query

        if(!key || !bucket) return status(400, {
            message: 'Bad Request',
            error: 'Bad Request, Key and Bucket are required',
            status: false,
            code: 400
        })

        const url = await minioClient.presignedGetObject(query.bucket, query.key)
        return redirect(url)
    }catch(error){
        console.log(error)
    }
})
.get('/uploads/file/*', async ({params, status}: {params: any, status: any})=> {
    try{
        if(!params) return status(400, {
            message: 'Bad Request',
            error: 'Bad Request, Path is required',
            status: false,
            code: 400
        })
        return file(params['*'])
    }catch(error){
        console.log(error)
        return status(500, {
            message: 'Internal Server Error',
            error: 'Internal Server Error',
            status: false,
            code: 500
        })
    }
})
.onBeforeHandle(async ({bearer, jwt, set, status, headers}: {bearer: any, jwt: any, set: any, status: any, headers: any})=> {
  
    const secretKey = headers['x-app-secret']
    if(!secretKey) return status(401, {
        message: 'Unauthorized, Secret Key is required',
        error: 'Unauthorized',
        status: false,
        code: 401
    })

    if(secretKey !== process.env.APP_SECRET) return status(401, {    
        message: 'Unauthorized',
        error: 'Unauthorized, Secret Key is invalid',
        status: false,
        code: 401
    })

    // if(!bearer) return status(401, {
    //     message: 'Unauthorized',
    //     error: 'Unauthorized, Token is required',
    //     status: false,
    //     code: 401
    // })

    // const verify = await jwt.verify(bearer as string)
    // console.log(verify)

    // if(!verify) return status(401, {
    //     message: 'Unauthorized',
    //     error: 'Unauthorized, Token is invalid',
    //     status: false,
    //     code: 401
    // })
})
.post('/upload/static', async ({body, status}: {body: any, status: any})=> {
    try{

        console.log(body)
        
        const isFiletypeValid = fileTypes.includes(body.file?.type)
        if(!isFiletypeValid) return status(415, {
            message: 'Unsupported Media Type',
            error: 'Now Allowed',
            status: false,
            code: 415
        })        
        const file = body.file
        const name = Bun.randomUUIDv7() + '.' + file.name.split('.').pop();
        const thumbnail = 'thumbnail-' + Bun.randomUUIDv7() + '.webp'
        const path = body.path ? body.path + name : 'storage/uploads/' + name
        const thumbnailPath = body.path ? body.path + thumbnail : 'storage/uploads/' + thumbnail

        await Bun.write(path, file);

        await sharp(path)
        .resize(512, 512, {
            fit: "cover",
            position: "centre",
        })
        .webp({
            quality: 82,
            effort: 6,
            smartSubsample: true,
        })
        .toFile(thumbnailPath);

        return {
            message: 'File uploaded successfully',
            data: {
                key: name,
                name: file.name,
                type: file.type,
                size: file.size,
                path: path,
                isStatic: true,
                thumbnail: thumbnailPath
            }
        }

    }catch(error){
        console.log(error)
        return status(500, {
            message: 'Internal Server Error',
            error: 'Internal Server Error',
            status: false,
            code: 500
        })
    }
})
.post('/upload/s3', async ({body, status}: {body: any, status: any})=> {
    try{
        const isFiletypeValid = fileTypes.includes(body.file?.type)
        if(!isFiletypeValid) return status(415, {
            message: 'Unsupported Media Type',
            error: 'Now Allowed',
            status: false,
            code: 415
        })        

        const bucket = process.env.S3_BUCKET as string
        const {name, size, type} = body.file
        const key = Bun.randomUUIDv7() + '.' + name.split('.').pop();
        const thumbnail = 'thumbnail-' + Bun.randomUUIDv7() + '.webp'
        const thumbnailPath = 'storage/temp/' + thumbnail
        const arrayBuffer = await body.file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
       
        await minioClient.putObject(bucket, key, buffer, size, type)

        const thumbnailBuffer = await sharp(arrayBuffer)
        .resize(512, 512, {
            fit: "cover",
            position: "centre",
        })
        .webp({
            quality: 82,
            effort: 6,
            smartSubsample: true,
        })
        .toBuffer();

        await minioClient.putObject(bucket, thumbnail, thumbnailBuffer as any, thumbnailBuffer.length, 'image/webp' as any)

        return {
            status: true,
            code: 'UPLOAD_SUCCESS',
            statusCode: 200,
            message: 'Upload Success',
            data: {
                name: name,
                key: key,
                bucket: bucket,
                type: type,
                size: size,
                isStatic: false,
                thumbnail: thumbnail
            }
        }

    }catch(error){
        console.log(error)
        return status(500, {
            message: 'Internal Server Error',
            error: 'Internal Server Error',
            status: false,
            code: 500
        })
    }
})

export {
    staticRoutes,
    uploadRoutes
}