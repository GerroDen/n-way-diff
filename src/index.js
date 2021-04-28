#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const yargs = require("yargs");
const terminalKit = require("terminal-kit");
const glob = require("glob");
const {diff} = require("./diff");

const term = terminalKit.terminal;
const info = term.brightBlue;
const error = term.brightRed;
const ok = term.brightGreen;
const warn = term.brightYellow;
const warnBg = term.bgYellow;
const {_: [rootDir]} = yargs(process.argv.slice(2))
	.usage("Usage: $0 <rootDir>")
	.demandCommand(1)
	.check((argv) => {
		fs.accessSync(argv._[0]);
		return true;
	})
	.help()
	.argv;

let subDirs;
let baseDir;
let diffSet;
let dirChoiceIndex;
let dirChoice;

term.fullscreen();
term.on("key", (name) => {
	if (name === "q") {
		term.clear();
		process.exit();
	}
});

try {
	subDirs = glob.sync(`${rootDir}/*/`).map(subDir => path.basename(subDir));
	render();
} catch (e) {
	term.error("Error:", e);
}

function render() {
	term.clear();
	if (!baseDir) {
		info(`Choose the base directory in "${rootDir}":`);
		term.singleLineMenu(subDirs, {y: 2}, async (error, response) => {
			baseDir = response.selectedText;
			diffSet = await diff({rootDir, baseDir});
			render();
		});
		return;
	}
	info(`Showing diff between directories and files in "${rootDir}" compared to "${baseDir}". Quit with "q"!`);
	term.nextLine(2);
	info("Show diffs with:");
	const diffDirNames = diffSet.map(diffEntry => diffEntry.basename);
	term.singleLineMenu(diffDirNames, {selectedIndex: dirChoiceIndex}, async (error, response) => {
		dirChoiceIndex = response.selectedIndex;
		dirChoice = response.selectedText;
		render();
	});
	if (!dirChoice) {
		return;
	}
	term.nextLine(2);
	const displayedDiffSet = diffSet.filter(diffEntry => diffEntry.basename === dirChoice);
	for (const diffEntry of displayedDiffSet) {
		const dirName = diffEntry.basename;
		const result = diffEntry.dirDiff;
		if (result.same) {
			ok(`${dirName} ✔`).nextLine();
		}
		if (result.distinct) {
			warnBg(`! ${dirName}`).nextLine();
			for (let dirDiff of result.diffSet) {
				if (dirDiff.type1 === "missing" && dirDiff.type2 === "file") {
					const filePath = path.resolve(dirDiff.relativePath, dirDiff.name2);
					error(`- ${filePath}`).nextLine();
				} else {
					if (dirDiff.type2 === "missing" && dirDiff.type1 === "file") {
						const filePath = path.resolve(dirDiff.relativePath, dirDiff.name1);
						ok(`+ ${filePath}`).nextLine();
					} else if (dirDiff.reason === "different-content") {
						const filePath = path.resolve(dirDiff.relativePath, dirDiff.name1);
						warn(`Δ ${filePath}`).nextLine();
						for (const fileDiff of diffEntry.fileDiffs) {
							let diffValue = fileDiff.value.replace(/\n$/, "");
							if (fileDiff.removed) {
								diffValue = diffValue.replace(/^/gm, "  - ");
								error(diffValue).nextLine();
							} else if (fileDiff.added) {
								diffValue = diffValue.replace(/^/gm, "  + ");
								ok(diffValue).nextLine();
							}
						}
					}
				}
			}
		}
	}
}
