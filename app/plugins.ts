import Elysia from "elysia";
import { bearer } from '@elysiajs/bearer'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { staticPlugin } from '@elysiajs/static'
import chalk from 'chalk'
import { logger, LoggerOptions } from "@rasla/logify";
import { serverTiming } from '@elysiajs/server-timing'
import { openapi } from '@elysiajs/openapi'

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
    } as LoggerOptions) as any
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
.use(staticPlugin({
    prefix: '/public',
    assets: 'public'
}))

export default plugins;

export const openapiPlugin = openapi({
    provider: 'scalar',
    path: '/docs',
    documentation: {
        info: {
            title: 'Maintex Storage API',
            version: '1.0.0',
            description: 'Maintex Storage API is a microservice for storing and retrieving files.'
        },
        components: {
            securitySchemes: {
              'X-App-Secret': {
                type: 'apiKey',
                in: 'header',
                name: 'X-Storage-Token',
              }
            },
        },
        security: [
            {'X-Storage-Token': []}
        ],
        tags: [
            {
                name: 'Storage',
                description: 'Storage API'
            }
        ]
    },
    scalar: {
        "theme": "dark",
        "metaData": {
          "title": "Maintex API Docs",
          "description": "Maintex API provides a unified platform for managing HR operations and service/maintenance workflows.It powers two web dashboards (**Maintex HR** for employee management, **Maintex Pro** for service teams) and three mobile applications for employees, technicians, and supervisors.",
          "image": "https://storage.quadbits.cloud//eK4wAkKyPRdb.png",
          "url": "https://api.maintex.pro/docs",
          "type": "website",
          "locale": "en_US",
          "siteName": "Maintex API Docs",
          "imageWidth": 1200,
          "imageHeight": 630,
          "favicon": "https://storage.quadbits.app/kthl7PD8MRiX.ico"
        },
        "favicon": "https://storage.quadbits.app/kthl7PD8MRiX.ico",
        "customCss": ".section-flare{display:none}.sidebar[data-v-db673c0a]{background:#111111}.references-rendered[data-v-c81c86d6]{background:#1d1d1d}.introduction-card[data-v-3358908f]{gap:1rem}.active_page.sidebar-heading[data-v-fa7fb2b8],.active_page.sidebar-heading[data-v-fa7fb2b8]:hover{background:#262626}.sidebar-heading[data-v-fa7fb2b8]{padding-block:0.35rem}.section-container:has( ~ .footer):before,.tag-section-container:before{background:0 0}.scalar-app .text-sidebar-c-2:has(a[target=\"_blank\"]){display:none}.darklight-reference[data-v-c81c86d6]{padding-bottom:0}.scalar-api-references-standalone-search[data-v-c81c86d6]{padding-top:15px}.dark-mode{--scalar-border-color:#393939}.show-more[data-v-c46d29d9]{margin-left:0;margin-right:auto;background:#343434;padding:12px 20px;border-radius:9px}.show-more[data-v-c46d29d9]:focus,.show-more[data-v-c46d29d9]:hover{background:#292929}.scalar-app .text-sidebar-c-2:has(a[target=\"_blank\"]){display:none}.darklight-reference[data-v-c81c86d6]{padding-bottom:0}.scalar-api-references-standalone-search[data-v-c81c86d6]{padding-top:15px}.dark-mode{--scalar-border-color:#393939;--scalar-color-2:#fcfcfc}.show-more[data-v-c46d29d9]{margin-left:0;margin-right:auto;background:#343434;padding:12px 20px;border-radius:9px}.show-more[data-v-c46d29d9]:focus,.show-more[data-v-c46d29d9]:hover{background:#292929}h1.section-header-label{color:#3d7eff;margin-top:2rem}.section-header[data-v-f8e38d9f]{margin-top:1.35rem;font-size:1.75rem}.badge[data-v-2a0118c0]{background:#c3ffda1a;padding:5px 8px;border-radius:7px;border:1px solid #c3ffda14}.badge[data-v-2a0118c0]:nth-child(2){background:#ffaf4c1f;border-color:#ffaf4c1f}.scalar-app label.font-medium{height:40px;background:#222425}.scalar-card-header[data-v-34675578]{padding-block:12px;background:#222425}div#scalar-refs-0-26{background:#22232500;padding-block:8px}div#scalar-refs-0-26 div{color:#34b9bc;font-size:18px}#headlessui-disclosure-button-scalar-refs-0-18,#scalar-refs-0-1{background:#222325;padding-block:12px}#scalar-refs-0-1{max-height:40px;min-height:40px}.section[data-v-393971a5]{padding: 50px 0px;}.section-header-label {color: #16afef;}.section-flare{display:none}.sidebar[data-v-db673c0a]{background:#151515}.references-rendered[data-v-c81c86d6]{background:#1d1d1d}.introduction-card[data-v-3358908f]{gap:1rem}.active_page.sidebar-heading[data-v-fa7fb2b8],.active_page.sidebar-heading[data-v-fa7fb2b8]:hover{background:#262626}.sidebar-heading[data-v-fa7fb2b8]{padding-block:0.35rem}.section-container:has( ~ .footer):before,.tag-section-container:before{background:0 0}.scalar-app .text-sidebar-c-2:has(a[target=\"_blank\"]){display:none}.darklight-reference[data-v-c81c86d6]{padding-bottom:0}.scalar-api-references-standalone-search[data-v-c81c86d6]{padding-top:15px}.dark-mode{--scalar-border-color:#393939}.show-more[data-v-c46d29d9]{margin-left:0;margin-right:auto;background:#343434;padding:12px 20px;border-radius:9px}.show-more[data-v-c46d29d9]:focus,.show-more[data-v-c46d29d9]:hover{background:#292929}.scalar-app .text-sidebar-c-2:has(a[target=\"_blank\"]){display:none}.darklight-reference[data-v-c81c86d6]{padding-bottom:0}.scalar-api-references-standalone-search[data-v-c81c86d6]{padding-top:15px}.dark-mode{--scalar-border-color:#393939;--scalar-color-2:#eaeaea}.show-more[data-v-c46d29d9]{margin-left:0;margin-right:auto;background:#343434;padding:12px 20px;border-radius:9px}.show-more[data-v-c46d29d9]:focus,.show-more[data-v-c46d29d9]:hover{background:#292929}h1.section-header-label{color:#3d7eff;margin-top:2rem}.section-header[data-v-f8e38d9f]{margin-top:1.35rem;font-size:1.75rem}.badge[data-v-2a0118c0]{background:#c3ffda1a;padding:5px 8px;border-radius:7px;border:1px solid #c3ffda14}.badge[data-v-2a0118c0]:nth-child(2){background:#ffaf4c1f;border-color:#ffaf4c1f}.scalar-app label.font-medium{height:40px;background:#222425}.scalar-card-header[data-v-34675578]{padding-block:12px;background:#262829}div#scalar-refs-0-26{background:#22232500;padding-block:8px}div#scalar-refs-0-26 div{color:#34b9bc;font-size:18px}#headlessui-disclosure-button-scalar-refs-0-18,#scalar-refs-0-1{background:#222325;padding-block:12px}#scalar-refs-0-1{max-height:40px;min-height:40px}.section[data-v-393971a5]{padding: 50px 0px;}.section-header-label {color: #16afef;} .scalar-api-references-standalone-search:before{content:\"\";position:relative;display:block;width:100%;height:50px;background-image:url(\"https://storage.quadbits.app/M8Yej6QdAYiE.svg\");background-size:auto 55%;background-repeat:no-repeat;background-position:top left;margin-top:1rem;margin-bottom:.5rem}.sidebar-heading-link-method{display:inline-flex;align-items:center;justify-content:center}.sidebar-heading p[data-v-fa7fb2b8] span{text-align:center!important;min-width:35px;background:var(--method-color);display:inline-flex;align-items:center;justify-content:center;padding:3px;border-radius:3px;color:#000000;font-size:10px}.sidebar-heading[data-v-fa7fb2b8]{font-size:.9rem;font-weight:600}.sidebar-heading-link .sidebar-heading-link-title{font-size:.95rem;font-weight:500!important}.sidebar-heading~.sidebar-indent-nested .sidebar-heading-link-title{font-size:.8rem;color:#ffffffab}.scalar-app .contents a div[data-v-782723fb]{justify-content:flex-start;min-width:35px}.endpoints[data-v-b3881ce4]{padding:15px}.tab[data-v-faa0eb23]{font-size:.78rem;font-weight:600!important;padding-inline:5px;color:#fafafa63}.tab.tab-selected{color:#fafafa}.dark-mode .scalar .scalar-app-exit[data-v-45e9730e]{background:#43434352;backdrop-filter:blur(10px)}[data-v-cbe958dd]{background:#282b2d}.scalar .scalar-app-layout[data-v-45e9730e]{border-color:#dadada4a}.show-api-client-button[data-v-321199ae] {background: #36c570;color: #fff;padding: 8px 12px;border-radius: 8px;}.show-api-client-button[data-v-321199ae] span {color: #141912;font-size: 12px;}.show-api-client-button[data-v-321199ae] svg {color: #141912;}.scalar-app .markdown p {font-weight: 300;}",
        "hideDarkModeToggle": true,
        "forceDarkModeState": "dark"
    } as any
})