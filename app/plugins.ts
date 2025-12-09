import Elysia from "elysia";
import { bearer } from '@elysiajs/bearer'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { staticPlugin } from '@elysiajs/static'
import chalk from 'chalk'
import { logger } from "@rasla/logify";
import { serverTiming } from '@elysiajs/server-timing'

const plugins = new Elysia({
    name: 'Maintex Storage Plugins',
})

plugins
.use(
    logger({
        console: true,
        file: true,
        filePath: './logs/server.log',
        level: 'debug', 
        skip: ['/health', '/metrics'],
        includeIp: true,
        format: chalk.bgBlue.white('[{timestamp}]') +  chalk.bold.green(' {level}') + chalk.bold.yellow('[{method}]') + ' - ' + chalk.red('[{path}]') + ' - ' + chalk.bold.magenta('{statusCode} ') + chalk.bold.white('{ip}'),
    })
)
.use(serverTiming())
.use(cors())
.use(bearer())
.use(
    jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET || '9vUEk6GpQ52WVweU8xJTpZqSqRSuAPh9TMQ',
        exp: '720d'
    })
)
.use(staticPlugin())


export default plugins;