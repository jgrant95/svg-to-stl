import { readFile } from "fs/promises"
import { createWorker } from "./src/shared/worker/worker"
import { handleSvgToStlMessages } from "./src/shared/worker/worker-handler"

async function main(): Promise<void> {
    console.log('Starting...')

    const inputSvg = await readFile('./files/input.svg')

    const worker = createWorker()

    

    handleSvgToStlMessages(worker)
}

main()