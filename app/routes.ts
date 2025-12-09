import { Elysia, file } from 'elysia';
import fileTypes from './config/upload-types.json'
import { minioClient } from '.';

const staticRoutes = new Elysia({
    name: 'Maintex Storage Static Routes',
})

staticRoutes
.get('/', file('public/index.html'))
.get('/favicon.ico', file('public/favicon.ico'))

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
.get('/uploads/file', async ({query, status}: {query: any, status: any})=> {
    try{
        const {path} = query

        if(!path) return status(400, {
            message: 'Bad Request',
            error: 'Bad Request, Path is required',
            status: false,
            code: 400
        })
        return file(path)
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

    if(!bearer) return status(401, {
        message: 'Unauthorized',
        error: 'Unauthorized, Token is required',
        status: false,
        code: 401
    })

    const verify = await jwt.verify(bearer as string)
    console.log(verify)

    if(!verify) return status(401, {
        message: 'Unauthorized',
        error: 'Unauthorized, Token is invalid',
        status: false,
        code: 401
    })
})
.post('/upload/static', async ({body, status}: {body: any, status: any})=> {
    try{
        const isFiletypeValid = fileTypes.includes(body.file?.type)
        if(!isFiletypeValid) return status(415, {
            message: 'Unsupported Media Type',
            error: 'Now Allowed',
            status: false,
            code: 415
        })        
        const file = body.file
        const name = Bun.randomUUIDv7() + '.' + file.name.split('.').pop();
        const path = body.path + name || 'storage/uploads/' + name

        await Bun.write(path, file);

        return {
            message: 'File uploaded successfully',
            data: {
                key: name,
                name: file.name,
                type: file.type,
                size: file.size,
                path: path,
                isStatic: true
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
        const arrayBuffer = await body.file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
       
        await minioClient.putObject(bucket, key, buffer, size, type)

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