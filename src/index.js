#!/usr/bin/env node
const fs = require("fs");
const yargs = require("yargs");
const { createServer } = require("./server");
const { terminal } = require("./terminal");

const { _: [rootDir], debug, serve } = yargs(process.argv.slice(2))
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
	.demandCommand(1)
	.check((argv) => {
		fs.accessSync(argv._[0]);
		return true;
	})
	.help()
	.argv;

if (serve) {
	createServer({rootDir}).start();
} else {
	terminal({ rootDir, debug });
}
