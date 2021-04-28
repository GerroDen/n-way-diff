const fs = require("fs").promises;
const dircompare = require("dir-compare");
const Diff = require("diff");
const glob = require("glob");
const path = require("path");

async function diff({rootDir, baseDir}) {
	const basePath = path.resolve(rootDir, baseDir);
	try {
		await fs.access(basePath);
	} catch (e) {
		throw new Error(`Base directory "${basePath}" does not exist`);
	}
	const subDirs = glob.sync(`${rootDir}/*/`, {absolute: true}).filter(dir => !dir.endsWith(baseDir));
	return Promise.all(subDirs.map(path => compareDirectory({basePath, path})));
}

async function compareDirectory({basePath, path}) {
	const dirDiff = await dircompare.compare(basePath, path, {compareContent: true});
	const fileDiffs = await compareContent(dirDiff);
	return new DirDiff({
		path,
		dirDiff,
		fileDiffs,
	});
}

async function compareContent(dirDiff) {
	if (dirDiff.distinct && dirDiff.reason === "different-content") {
		const content1 = await fs.readFile(path.resolve(dirDiff.path1, dirDiff.name1), {encoding: "utf8"});
		const content2 = await fs.readFile(path.resolve(dirDiff.path2, dirDiff.name2), {encoding: "utf8"});
		return Diff.diffTrimmedLines(content2, content1);
	}
	return [];
}

class DirDiff {
	constructor({path, dirDiff, fileDiffs}) {
		this.path = path;
		this.dirDiff = dirDiff;
		this.fileDiffs = fileDiffs;
	}
}

module.exports = {
	diff,
};