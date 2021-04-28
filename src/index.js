const path = require("path");
const chalk = require("chalk");
const Vorpal = require("vorpal");
const {diff} = require("./diff");

const info = chalk.blueBright;
const error = chalk.redBright;
const ok = chalk.greenBright;
const warn = chalk.yellowBright;
const warnBg = chalk.bgYellow;

const vorpal = Vorpal();
vorpal.default("<rootDir> <baseDir>")
	.action(action);
vorpal.parse(process.argv);

async function action({rootDir, baseDir}) {
	this.log(info(`Showing diff between directories and files in ${rootDir} compared to "${baseDir}"`));
	try {
		const diffSet = await diff({rootDir, baseDir});
		render.call(this, diffSet);
	} catch (e) {
		this.log(error("Error:"), e);
	}
}

function render(diffSet) {
	for (const diffEntry of diffSet) {
		const dirName = path.basename(diffEntry.path);
		const result = diffEntry.dirDiff;
		if (result.same) {
			this.log(ok(`${dirName} ✔`));
		}
		if (result.distinct) {
			this.log(warnBg(`! ${dirName}`));
			for (let dirDiff of result.diffSet) {
				if (dirDiff.type1 === "missing" && dirDiff.type2 === "file") {
					const filePath = path.resolve(dirDiff.relativePath, dirDiff.name2);
					this.log(error(`  - ${filePath}`));
				} else {
					if (dirDiff.type2 === "missing" && dirDiff.type1 === "file") {
						const filePath = path.resolve(dirDiff.relativePath, dirDiff.name1);
						this.log(ok(`  + ${filePath}`));
					} else if (dirDiff.reason === "different-content") {
						const filePath = path.resolve(dirDiff.relativePath, dirDiff.name1);
						this.log(warn(`  Δ ${filePath}`));
						for (const fileDiff of diffEntry.fileDiffs) {
							let diffValue = fileDiff.value.replace(/\n$/, "");
							if (fileDiff.removed) {
								diffValue = diffValue.replace(/^/gm, "    - ");
								this.log(error(diffValue));
							} else if (fileDiff.added) {
								diffValue = diffValue.replace(/^/gm, "    + ");
								this.log(ok(diffValue));
							}
						}
					}
				}
			}
		}
	}
}
