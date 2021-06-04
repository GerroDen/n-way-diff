#!/usr/bin/env node
const fs = require("fs");
const yargs = require("yargs");
const open = require("open");
const { createServer } = require("./server");
const { terminal } = require("./terminal");

const { _: [rootDir], debug, serve, noopen, port } = yargs(process.argv.slice(2))
	.usage("Usage: $0 <rootDir>")
	.option("debug", {
		alias: "d",
		boolean: true,
		description: "enables debug output",
	})
	.option("serve", {
		alias: "w",
		boolean: true,
		description: "serves a web UI",
	})
	.option("noopen", {
		alias: "n",
		boolean: true,
		description: "do not open browser",
	})
	.options("port", {
		alias: "p",
		default: 3000,
		description: "port for web server if --serve is specified",
	})
	.demandCommand(1)
	.check((argv) => {
		fs.accessSync(argv._[0]);
		return true;
	})
	.help()
	.argv;

if (serve) {
	createServer({ rootDir, port }).start()
		.then(() => {
			if (!noopen) {
				open(`http://localhost:${port}/web/`);
			}
		});
} else {
	terminal({ rootDir, debug });
}
