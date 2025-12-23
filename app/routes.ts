import { Elysia, file } from 'elysia';
import fileTypes from './config/upload-types.json'
import { minioClient } from '.';
import { healthcheckPlugin } from 'elysia-healthcheck';
import { readdir } from "node:fs/promises";
import { pdf } from "pdf-to-img";

const staticRoutes = new Elysia({
    name: 'Maintex Storage Static Routes',
})

staticRoutes
.get('/', file('public/index.html'))
.get('/logo', file('public/logo-dark.svg'))
.get('/server-image', file('public/server.svg'))
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

        // if(file.type.includes('image') && file.type !== 'image/svg+xml'){

        //     const input = await file.arrayBuffer();
        //     const buffer = Buffer.from(input);

        //     const metaInformation = await metadata(buffer);

        //     const transformedImage = await transform(buffer, {
        //         resize: {
        //             width: metaInformation.width > 2048 ? 2048 : metaInformation.width,
        //             height: metaInformation.height > 2048 ? 2048 : metaInformation.height,
        //         }
        //     });

        //     const thumbnailBuffer = await transform(buffer, {
        //         resize: {
        //             width: 512,
        //             height: 512,
        //             fit: 'Cover' as any,
        //             filter: 'Bilinear' as any
        //         },
        //         output: {
        //             format: 'webp',
        //             webp: {
        //                 quality: 75
        //             }
        //         }
        //     });

        //     await Bun.write(path, transformedImage);
        //     await Bun.write(thumbnailPath, thumbnailBuffer);
        // }
        // else 
        // if(file.type.includes('application/pdf')){
        //     const input = await body.file.arrayBuffer();
        //     const buffer = Buffer.from(input);
        //     const document = await pdf(buffer, { scale: 1 });

        //     const indexPage = await document.getPage(1)
        //     const indexPageBuffer = Buffer.from(indexPage)

        //     const thumbnailBuffer = await transform(indexPageBuffer, {
        //         resize: {
        //             width: 512,
        //             height: 512,
        //             fit: 'Cover' as any,
        //             filter: 'Bilinear' as any
        //         },
        //         output: {
        //             format: 'webp',
        //             webp: {
        //                 quality: 75
        //             }
        //         }
        //     });

        //     await Bun.write(path, indexPageBuffer);
        //     await Bun.write(thumbnailPath, thumbnailBuffer);

        // }
        // else{
            
        // }
        await Bun.write(path, file);

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

        const bucket = process.env.F3_BUCKET as string
        const {name, size, type} = body.file
        const key = Bun.randomUUIDv7() + '.' + name.split('.').pop();
        const thumbnail = 'thumbnail-' + Bun.randomUUIDv7() + '.webp'
        
        // if(type.includes('image') && type !== 'image/svg+xml'){

        //     const input = await body.file.arrayBuffer();
        //     const buffer = Buffer.from(input);

        //     const metaInformation = await metadata(buffer);

        //     const transformedImage = await transform(buffer, {
        //         resize: {
        //             width: metaInformation.width > 2048 ? 2048 : metaInformation.width,
        //             height: metaInformation.height > 2048 ? 2048 : metaInformation.height,
        //         }
        //     });

        //     const thumbnailBuffer = await transform(buffer, {
        //         resize: {
        //             width: 512,
        //             height: 512,
        //             fit: 'Cover' as any,
        //             filter: 'Bilinear' as any
        //         },
        //         output: {
        //             format: 'webp',
        //             webp: {
        //                 quality: 75
        //             }
        //         }
        //     });

        //     await minioClient.putObject(bucket, key, transformedImage, size, type)

        //     await minioClient.putObject(bucket, thumbnail, thumbnailBuffer as any, thumbnailBuffer.length, 'image/webp' as any)

        // }
        // else if(type.includes('application/pdf')){

        //     const input = await body.file.arrayBuffer();
        //     const buffer = Buffer.from(input);
        //     const document = await pdf(buffer, { scale: 1 });

        //     const indexPage = await document.getPage(1)
        //     const indexPageBuffer = Buffer.from(indexPage)

        //     const thumbnailBuffer = await transform(indexPageBuffer, {
        //         resize: {
        //             width: 512,
        //             height: 512,
        //             fit: 'Cover' as any,
        //             filter: 'Bilinear' as any
        //         },
        //         output: {
        //             format: 'webp',
        //             webp: {
        //                 quality: 75
        //             }
        //         }
        //     });
            
        //     await minioClient.putObject(bucket, key, buffer, size, type)
        //     thumbnailBuffer && await minioClient.putObject(bucket, thumbnail, thumbnailBuffer as any, thumbnailBuffer.length, 'image/webp' as any)

        // }
        // else {
        //     const arrayBuffer = await body.file.arrayBuffer()
        //     const buffer = Buffer.from(arrayBuffer)
        //     await minioClient.putObject(bucket, key, buffer, size, type)
        // }

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
.post('/upload/static/chunks', 'Uploaded Chunks')
.post('/upload/static/chunks', 'Uploaded S3 Chunks')

export {
    staticRoutes,
    uploadRoutes
}