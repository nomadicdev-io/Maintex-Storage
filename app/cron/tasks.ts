import { rm, mkdir } from "node:fs/promises";
import { Patterns } from "@elysiajs/cron";

const tasks = {
    tempCleaner: {
        name: 'tempCleaner',
        pattern: Patterns.daily(),
        async run() {
            await rm('storage/temp', { recursive: true, force: true })
            await mkdir('storage/temp', { recursive: true })
        }
    }
}

export default tasks