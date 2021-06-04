const { glob } = require("glob")
const path = require("path")
const fastify = require("fastify")({
    logger: true,
})
const { createServer: createViteServer } = require("vite")

async function apiRouting(childServer, { rootDir }) {
    childServer.get("/subdirs", async () => {
        return glob.sync(`${rootDir}/*/`).map(subDir => path.basename(subDir))
    })
    // childServer.get("dirdiff", async () => {})
    // childServer.get("filediff", async () => {})
    // childServer.get("file", async () => {})
    // childServer.get("dir", async () => {})
}

async function viteRouting(childServer) {
    await fastify.register(require("middie"))
    const vite = await createViteServer({
        server: {
            middlewareMode: "html",
        },
    })
    childServer.use(vite.middlewares)
}

function createServer({ rootDir, port }) {
    async function start() {
        await fastify.register(apiRouting, { rootDir })
        await viteRouting(fastify)
        try {
            await fastify.listen(port)
        } catch (e) {
            fastify.log.error(e)
            process.exit(1)
        }
    }
    return {
        start,
    }
}

exports.createServer = createServer
