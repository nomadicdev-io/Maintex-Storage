import { Elysia, file } from 'elysia';
import fileTypes from './config/upload-types.json'
import { minioClient } from '.';
import { healthcheckPlugin } from 'elysia-healthcheck';
import { readdir } from "node:fs/promises";
import { pdf } from "pdf-to-img";
import createThumbnail, { createVideoThumbnail } from './converter';
import { verifyApplicationToken } from './tokenGenerator';
import subscribe from './subscribe';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const staticRoutes = new Elysia({
    name: 'Maintex Storage Static Routes',
})

staticRoutes
.get('/', file('public/index.html'))
.get('/logo', file('public/logo-dark.svg'))
.get('/server-image', file('public/server.svg'))
.get('/favicon.ico', file('public/favicon.ico'))
.get('/assets/*', ({params}: {params: any})=> file('public/' + params['*']))
.get('/files/*', ({params}: {params: any})=> file('files/' + params['*']))
.use(subscribe)
.use(
    healthcheckPlugin({
      prefix: '/api/v1/health',
      paths: {
        liveness: '/liveness',
        readiness: '/readiness',
      }
    })
)

const generateRoutes = new Elysia({
    name: 'Maintex Storage Generate Routes',
    prefix: '/generate',
})

const uploadFile = new Elysia({
    name: 'Maintex Storage Upload File',
    prefix: '/upload',
})

uploadFile
.onBeforeHandle(async ({body, status})=> {
    if (!body || !(body as any).file) return status(400, {
        message: 'File required',
        error: 'Bad Request',
        status: false,
        code: 400
    });

    const file = (body as any).file;
    const isFiletypeValid = fileTypes.includes(file.type);

    if(!isFiletypeValid) return status(415, {
        message: 'Unsupported Media Type',
        error: 'Not Allowed',
        status: false,
        code: 415
    });

    if(file.size > MAX_FILE_SIZE) return status(413, {
        message: 'File too large',
        error: 'Payload Too Large',
        status: false,
        code: 413
    });
})
.post('/static', async ({body, status}: {body: any, status: any})=> {
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
        const path = body.path ? body.path + name : 'storage/uploads/' + name
        const thumbnail = 'thumbnail-' + Bun.randomUUIDv7() + '.webp'
        const thumbnailPath = body.path ? body.path + thumbnail : 'storage/uploads/' + thumbnail

        const input = await file.arrayBuffer();
        const buffer = Buffer.from(input);

        if(file.type.includes('image')){

            await Bun.write(path, buffer);

            const thumbnail = await createThumbnail(buffer);
            await Bun.write(thumbnailPath, thumbnail);
        }
        else if(file.type.includes('application/pdf')){
            
            await Bun.write(path, buffer);

            const document = await pdf(buffer, { scale: 1 });

            const indexPage = await document.getPage(1)
            const indexPageBuffer = Buffer.from(indexPage)

            const thumbnail = await createThumbnail(indexPageBuffer);
            await Bun.write(thumbnailPath, thumbnail);

        } else if(file.type.includes('video')){

            await Bun.write(path, buffer);
            const thumbnail = await createVideoThumbnail(path, thumbnailPath);
            console.log('Thumbnail created', thumbnail)
            
        }
        else {
            await Bun.write(path, file);
        }

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
.post('/s3', async ({body, status}: {body: any, status: any})=> {
    try{


        const bucket = body?.bucket || process.env.F3_BUCKET as string
        const file = body.file
        const key = Bun.randomUUIDv7() + '.' + file.name.split('.').pop();
        const thumbnail = 'thumbnail-' + Bun.randomUUIDv7() + '.webp'
        const tempPath = 'storage/temp/' + Bun.randomUUIDv7() + '.' + file.name.split('.').pop();

        const isBucketExists = await minioClient.bucketExists(bucket)
        if(!isBucketExists) await minioClient.makeBucket(bucket)

        const input = await file.arrayBuffer();
        const buffer = Buffer.from(input);


        if(file.type.includes('image')){

            await minioClient.putObject(bucket, key, buffer, file.size, file.type)

            // const thumbnailBuffer = await createThumbnail(buffer);
            // await minioClient.putObject(bucket, thumbnail, thumbnailBuffer as any, thumbnailBuffer.length, 'image/webp' as any)

        }
        else if(file.type.includes('application/pdf')){

            await minioClient.putObject(bucket, key, buffer, file.size, file.type)

            const document = await pdf(buffer, { scale: 1 });
            const indexPage = await document.getPage(1)
            const indexPageBuffer = Buffer.from(indexPage)

            const thumbnailBuffer = await createThumbnail(indexPageBuffer);
            
            await minioClient.putObject(bucket, thumbnail, thumbnailBuffer as any, thumbnailBuffer.length, 'image/webp' as any)

        }
        else if(file.type.includes('video')){

            await minioClient.putObject(bucket, key, buffer, file.size, file.type)
            await Bun.write(tempPath, buffer);
            // const thumbnail = await createVideoThumbnail(tempPath, tempThumbnailPath);

            // const indexPageBuffer = Buffer.from(tempThumbnailPath)
            // await minioClient.putObject(bucket, key, indexPageBuffer, file.size, file.type)

            // console.log('Thumbnail created', thumbnail)

            // Bun.file(tempPath).delete()
            // Bun.file(tempThumbnailPath).delete()
            
        }
        else {
            await minioClient.putObject(bucket, key, buffer, file.size, file.type)
        }

        return {
            status: true,
            code: 'UPLOAD_SUCCESS',
            statusCode: 200,
            message: 'Upload Success',
            link: process.env.API_ENDPOINT + '/s3/url?key=' + key + '&bucket=' + bucket,
            data: {
                name: file.name,
                key: key,
                bucket: bucket,
                type: file.type,
                size: file.size,
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
.get('/get/all/files', async ({status}: {status: any})=> {
    try{
        const files =await readdir('storage', {recursive: true})
        return {
            status: true,
            code: 'GET_ALL_FILES_SUCCESS',
            statusCode: 200,
            message: 'Get All Files Success',
            data: files
        }
    }catch(error){
        console.log(error)
    }
})
.use(uploadFile)
.use(generateRoutes)

export {
    staticRoutes,
    uploadRoutes
}