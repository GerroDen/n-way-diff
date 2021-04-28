const path = require("path");
const chalk = require("chalk");
const Vorpal = require("vorpal");
const glob = require("glob");
const {diff} = require("./diff");

const info = chalk.blueBright;
const error = chalk.redBright;
const ok = chalk.greenBright;
const warn = chalk.yellowBright;
const warnBg = chalk.bgYellow;

const vorpal = Vorpal();
vorpal.default("<rootDir>")
	.action(action);
vorpal.delimiter("").show().parse(process.argv);

async function action({rootDir, baseDir}) {
	try {
		const subDirs = glob.sync(`${rootDir}/*/`).map(subDir => path.basename(subDir));
		baseDir = await this.prompt([{
			type: "list",
			name: "baseDir",
			message: "Choose a base directory",
			choices: subDirs,
		}]).then(answers => answers.baseDir);
		this.log(info(`Showing diff between directories and files in "${rootDir}" compared to "${baseDir}"`));
		const diffSet = await diff({rootDir, baseDir});
		let quit = false;
		while (!quit) {
			const {dirChoice} = await this.prompt([{
				type: "list",
				name: "dirChoice",
				message: "Show diffs with",
				choices: diffSet.map(diffEntry => diffEntry.basename).concat([">all", ">quit"]),
			}]);
			if (dirChoice === ">quit") {
				quit = true;
			} else {
				const displayedDiffSet = (dirChoice === ">all")
					? diffSet
					: diffSet.filter(diffEntry => diffEntry.basename === dirChoice);
				render.call(this, displayedDiffSet);
			}
		}
	} catch (e) {
		this.log(error("Error:"), e);
	}
	// await new Promise((resolve) => {
	// 	let count = 0;
	// 	setInterval(() => {
	// 		vorpal.ui.redraw(`hi ${++count}`);
	// 	}, 200);
	// 	setTimeout(resolve, 10000);
	// });
}

function render(diffSet) {
	for (const diffEntry of diffSet) {
		const dirName = diffEntry.basename;
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
