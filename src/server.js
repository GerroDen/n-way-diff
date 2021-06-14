const { glob } = require("glob")
const path = require("path")
const { createServer: createViteServer } = require("vite")
const fastifyStatic = require("fastify-static");
const fastify = require("fastify")
const dircompare = require("dir-compare");

async function apiRouting(childServer, { rootDir }) {
    childServer.get("/subdirs", async () => {
        return glob.sync(`${rootDir}/*/`).map(subDir => path.basename(subDir))
    })
    childServer.get("/dirdiff", async (request) => {
        const { baseDir, otherDir } = request.query;
        const basePath = path.resolve(rootDir, baseDir);
        const otherPath = path.resolve(rootDir, otherDir);
        return await dircompare.compare(basePath, otherPath, {compareContent: true});
    })
    // childServer.get("/filediff", async () => {})
    // childServer.get("/file", async () => {})
    // childServer.get("/dir", async () => {})
}

async function viteRouting(childServer) {
    /*
    await childServer.register(require("middie"))
    const vite = await createViteServer({
        server: {
            middlewareMode: "html",
        },
    })
    childServer.use("/view", vite.middlewares)
    */
    /**/
    childServer.register(fastifyStatic, {
        root: path.resolve(__dirname, "../web/dist"),
    })
    /**/
}

function createServer({ rootDir, port }) {
    async function start() {
        const server = fastify({
            logger: true,
        })
        await server.register(apiRouting, { rootDir, prefix: "/api" })
        await server.register(viteRouting)
        try {
            await server.listen(port)
        } catch (e) {
            server.log.error(e)
            process.exit(1)
        }
    }

    return {
        start,
    }
}

exports.createServer = createServer
