import { EventEmitter } from 'node:events'

const logHub = new EventEmitter()

const formatLog = ({ method, url }: Request) => {
    const now = new Date().toISOString()
    return `${now} ${method} ${url}`
}

const requestLogger = ({ request, ip }: { request: Request, ip: any }) => {
    console.log(request)
    console.log('IP:', ip)
    const line = formatLog(request)
    logHub.emit('log', line)
}

export { logHub, formatLog, requestLogger }