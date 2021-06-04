const { glob } = require("glob");
const path = require("path");
const open = require("open");
const fastify = require("fastify")({
    logger: true
});
const { createServer: createViteServer } = require("vite");

function setupRouting({ rootDir }) {
    fastify.get("/subdirs", async () => {
        return glob.sync(`${rootDir}/*/`).map(subDir => path.basename(subDir));
    });
    // fastify.get("dirdiff", async () => {});
    // fastify.get("filediff", async () => {});
    // fastify.get("file", async () => {});
    // fastify.get("dir", async () => {});
}

function createServer({ rootDir }) {
    async function start() {
        await fastify.register(require('middie'));
        const vite = await createViteServer({
            base: "/web/",
            server: {
                middlewareMode: "html",
            },
        });
        fastify.use(vite.middlewares);
        setupRouting({ rootDir });
        try {
            await fastify.listen(3000);
            open("http://localhost:3000/web/");
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
