import { Elysia } from 'elysia'
import { cron } from '@elysiajs/cron'
import tasks from './tasks'

const cronWorker = new Elysia({name : 'Cron Worker'})

cronWorker
    .use(
        cron(tasks.tempCleaner)
    )

export default cronWorker