import { Elysia, sse } from 'elysia'
// import { EventEmitter } from 'node:events'
// import { logHub } from './requestLogger'

const subscribe = new Elysia({
    name: 'Maintex Storage Subscribe',
    prefix: '/subscribe',
})

// subscribe
// .get(
//     '/logs',
//     function* () {
//       const listener = (msg: string) => {
//         generator.next(sse(msg))
//       }
//       const generator = (async function* () {
//         while (true) {
//           const event = yield
//         }
//       })()
//       logHub.on('log', listener)
//       try {
//         return generator
//       } finally {
//         logHub.off('log', listener)
//       }
//     }
//   )

export default subscribe