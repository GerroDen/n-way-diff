const fs = require("fs").promises;
const dircompare = require("dir-compare");
const Diff = require("diff");
const glob = require("glob");
const chalk = require("chalk");
const Vorpal = require("vorpal");
const path = require("path");

const info = chalk.blueBright;
const error = chalk.redBright;
const ok = chalk.greenBright;
const warn = chalk.yellowBright;
const warnBg = chalk.bgYellow;

const vorpal = Vorpal();
vorpal.default("<rootDir> <baseDir>")
	.action(diff);
vorpal.parse(process.argv);

async function diff({rootDir, baseDir}) {
	this.log(info(`Showing diff between directories and files in ${rootDir} compared to "${baseDir}"`));
	const basePath = path.resolve(rootDir, baseDir);
	try {
		await fs.access(basePath);
	} catch (e) {
		this.log(error(`Base directory "${basePath}" does not exist`));
		return;
	}
	const subDirs = glob.sync(`${rootDir}/*/`, {absolute: true}).filter(dir => !dir.endsWith(baseDir));
	for (const subDir of subDirs) {
		const dirName = path.basename(subDir);
		const result = await dircompare.compare(basePath, subDir, {compareContent: true});
		if (result.same) {
			this.log(ok(`${dirName} ✔`));
		}
		if (result.distinct) {
			this.log(warnBg(`! ${dirName}`));
			for (let dirDiff of result.diffSet) {
				if (dirDiff.type1 === "missing") {
					const filePath = path.resolve(dirDiff.relativePath, dirDiff.name2);
					this.log(error(`  - ${filePath}`));
				} else {
					if (dirDiff.type2 === "missing") {
						const filePath = path.resolve(dirDiff.relativePath, dirDiff.name1);
						this.log(warn(`  + ${filePath}`));
					} else if (dirDiff.reason === "different-content") {
						const filePath = path.resolve(dirDiff.relativePath, dirDiff.name1);
						this.log(warn(`  Δ ${filePath}`));
						const content1 = await fs.readFile(path.resolve(dirDiff.path1, dirDiff.name1), {encoding: "utf8"});
						const content2 = await fs.readFile(path.resolve(dirDiff.path2, dirDiff.name2), {encoding: "utf8"});
						const fileDiffs = Diff.diffTrimmedLines(content1, content2);
						for (const fileDiff of fileDiffs) {
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
