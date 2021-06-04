const open = require("open");
const fastify = require("fastify")({
    logger: true
});
const { createServer: createViteServer } = require("vite");

function createServer({ rootDir }) {
    fastify.get("/subdirs", async () => {
        return glob.sync(`${rootDir}/*/`).map(subDir => path.basename(subDir));
    });
    // fastify.get("dirdiff", async () => {});
    // fastify.get("filediff", async () => {});
    // fastify.get("file", async () => {});
    // fastify.get("dir", async () => {});

    async function start() {
        await fastify.register(require('middie'));
        const vite = await createViteServer({
            server: {
                middlewareMode: "html",
            },
        });
        fastify.use(vite.middlewares);
        try {
            await fastify.listen(3000);
            open("http://localhost:3000");
        } catch (e) {
            fastify.log.error(e);
            process.exit(1);
        }
    }

    return {
        start,
    }
};

exports.createServer = createServer;
