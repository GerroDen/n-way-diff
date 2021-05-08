#!/usr/bin/env node
const fs = require("fs");
const yargs = require("yargs");
const {terminal} = require("./terminal");

const {_: [rootDir], debug} = yargs(process.argv.slice(2))
	.usage("Usage: $0 <rootDir>")
	.option("debug", {
		alias: "d",
		boolean: true,
		description: "enables debug output",
	})
	.demandCommand(1)
	.check((argv) => {
		fs.accessSync(argv._[0]);
		return true;
	})
	.help()
	.argv;

terminal({rootDir, debug});
