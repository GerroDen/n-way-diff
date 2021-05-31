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
	for (const dirDiffSet of dirDiff.diffSet) {
		dirDiffSet.fileDiffs = await compareContent(dirDiffSet);
	}
	return new DirDiff({
		path,
		dirDiff,
	});
}

async function compareContent(dirDiffSet) {
	if (dirDiffSet.state === "distinct" && dirDiffSet.reason === "different-content") {
		const content1 = await fs.readFile(path.resolve(dirDiffSet.path1, dirDiffSet.name1), {encoding: "utf8"});
		const content2 = await fs.readFile(path.resolve(dirDiffSet.path2, dirDiffSet.name2), {encoding: "utf8"});
		return Diff.diffTrimmedLines(content2, content1);
	}
	return [];
}

class DirDiff {
	constructor({path: _path, dirDiff}) {
		this.path = _path;
		this.basename = path.basename(_path);
		this.dirDiff = dirDiff;
	}
}

module.exports = {
	diff,
};
