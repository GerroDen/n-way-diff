const path = require("path");
const blessed = require("blessed");
const glob = require("glob");
const {diff} = require("./diff");

const info = (content) => blessed.text({fg: "lightblue", content});
const error = (content) => blessed.text({fg: "lightred", content});
const ok = (content) => blessed.text({fg: "lightgreen", content});
const warn = (content) => blessed.text({fg: "lightyellow", content});
const warnBg = (content) => blessed.text({bg: "lightyellow", content});
const menuStyle = {selected: {bg: "lightgray", fg: "black"}, item: {fg: "lightgray"}};

function terminal(rootDir) {
	let subDirs;
	let baseDir;
	let diffSet;
	let dirChoice;

	const screen = blessed.screen({
		smartCSR: true,
	});
	screen.key("q", () => process.exit());
	const titleLine = blessed.text({tags: true});
	screen.append(titleLine);
	const baseDirSelect = blessed.listbar({top: 2, style: menuStyle, autoCommandKeys: true});
	screen.append(baseDirSelect);
	blessed.box({scrollable: true, tags: true});
	const diffDirSelect = blessed.listbar({top: 4, style: menuStyle});
	screen.key("right", () => {
		diffDirSelect.moveRight(1);
		screen.render();
	});
	screen.key("left", () => {
		diffDirSelect.moveLeft(1);
		screen.render();
	});
	screen.append(diffDirSelect);
	screen.render();

	try {
		subDirs = glob.sync(`${rootDir}/*/`).map(subDir => path.basename(subDir));
		titleLine.setContent(`{light-blue-fg}Choose the base directory in "${rootDir}":`);
		baseDirSelect.setItems(Object.fromEntries(subDirs.map(dirname => [
			dirname,
			async () => {
				baseDir = dirname;
				titleLine.setContent(`{light-blue-fg}Showing diff between directories and files in "${rootDir}" compared to "${baseDir}". Quit with "q"!`);
				diffSet = await diff({rootDir, baseDir});
				diffDirSelect.setItems(Object.fromEntries(diffSet.map(diffEntry => [
					diffEntry.basename,
					() => {
						dirChoice = diffEntry.basename;
						screen.render();
					},
				])));
				screen.render();
			}
		])));
	} catch (e) {
		titleLine.setContent(`{light-red-fg}Error: ${e}. Exit with q!`);
	}

	function render() {
		info("Show diffs with:");
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
}

module.exports = {
	terminal,
};
