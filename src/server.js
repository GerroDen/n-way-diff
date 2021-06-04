const fastify = require("fastify")({
    logger: true
});
const { createServer: createViteServer } = require("vite");

async function start() {
    const vite = await createViteServer({
        server: {
            middlewareMode: "html",
        },
    });
    await fastify.register(require('middie'));
    fastify.use(vite.middlewares);
    try {
        await fastify.listen(3000);
    } catch (e) {
        fastify.log.error(e);
        process.exit(1);
    }
}

start();
