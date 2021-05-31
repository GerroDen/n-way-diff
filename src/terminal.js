const path = require("path");
const blessed = require("blessed");
const glob = require("glob");
const {diff} = require("./diff");
const mitt = require("mitt");

const info = (content) => blessed.text({fg: "lightblue", content});
const error = (content) => blessed.text({fg: "lightred", content});
const ok = (content) => blessed.text({fg: "lightgreen", content});
const warn = (content) => blessed.text({fg: "lightyellow", content});
const warnBg = (content) => blessed.text({bg: "lightyellow", content});
const menuStyle = {selected: {bg: "lightgray", fg: "black"}, item: {fg: "lightgray"}};

const selectBaseDir = "selectBaseDir";
const selectDiffEntry = "selectDiffEntry";

function terminal({rootDir, debug}) {
	let subDirs;
	let baseDir;
	let diffSet;
	let dirChoiceIndex;
	let dirChoice;

	const screen = blessed.screen({
		smartCSR: true,
	});
	screen.key("q", () => process.exit());
	const titleLine = blessed.text({tags: true});
	screen.append(titleLine);
	const baseDirSelect = blessed.listbar({
		top: 2, 
		style: menuStyle, 
		autoCommandKeys: true,
		mouse: true,
	});
	screen.append(baseDirSelect);
	const diffDirSelect = blessed.listbar({
		top: 4, 
		style: menuStyle,
		mouse: true,
	});
	screen.key("right", () => {
		if (!diffSet) return;
		dirChoiceIndex = Math.min(diffSet.length, dirChoiceIndex+1);
		diffDirSelect.moveRight(1);
		screen.render();
	});
	screen.key("left", () => {
		if (!diffSet) return;
		dirChoiceIndex = Math.max(0, dirChoiceIndex-1);
		diffDirSelect.moveLeft(1);
		screen.render();
	});
	screen.key("enter", () => {
		if (!diffSet) return;
		diffDirSelect.selectTab(dirChoiceIndex);
		screen.render();
	});
	screen.append(diffDirSelect);
	const diffLine = blessed.line({
		top: 6, 
		orientation: "horizontal", 
		hidden: true,
	});
	screen.append(diffLine);
	const diffOut = blessed.box({
		top: 7,
		scrollable: true,
		alwaysScroll: true,
		tags: true,
		scrollbar: true,
		mouse: true,
	});
	screen.key("up", () => {
		diffOut.scroll(-1);
		screen.render();
	});
	screen.key("pageup", () => {
		diffOut.scroll(-diffOut.height);
		screen.render();
	});
	screen.key("down", () => {
		diffOut.scroll(1);
		screen.render();
	});
	screen.key("pagedown", () => {
		diffOut.scroll(diffOut.height);
		screen.render();
	});
	screen.append(diffOut);
	screen.render();

	const bus = mitt();
	showErrors(() => {
		subDirs = glob.sync(`${rootDir}/*/`).map(subDir => path.basename(subDir));
		titleLine.setContent(`{light-blue-fg}Choose the base directory in "${rootDir}":`);
		baseDirSelect.setItems(Object.fromEntries(subDirs.map(dirname => [
			dirname,
			() => bus.emit(selectBaseDir, dirname),
		])));
		screen.render();
	});
	bus.on(selectBaseDir, async (dirname) => {
		baseDir = dirname;
		titleLine.setContent(`{light-blue-fg}Showing diff between directories and files in "${rootDir}" compared to "${baseDir}". Quit with "q"!`);
		diffSet = await diff({rootDir, baseDir});
		diffDirSelect.setItems(Object.fromEntries(diffSet.map(diffEntry => [
			diffEntry.basename,
			() => bus.emit(selectDiffEntry, diffEntry),
		])));
		dirChoiceIndex = 0;
		screen.render();
	});
	bus.on(selectDiffEntry, (diffEntry) => {
		dirChoice = diffEntry.basename;
		diffLine.hidden = false;
		const displayedDiffSet = diffSet.filter(diffEntry => diffEntry.basename === dirChoice);
		if (debug) {
			diffOut.setContent(JSON.stringify(displayedDiffSet, null, 2));
		} else {
			const content = render(displayedDiffSet);
			diffOut.setContent(`{light-blue-fg}Show diffs with ${dirChoice}:\n${content}`);
		}
		screen.render();
	});

	/** @param {Function()} run */
	function showErrors(run) {
		try {
			run();
		} catch (e) {
			titleLine.setContent(`{light-red-fg}Error: ${e}. Exit with q!`);
		}
	}

	/**
	 * @param {object[]} displayedDiffSet 
	 * @returns {string}
	 */
	function render(displayedDiffSet) {
		let content = "";
		for (const diffEntry of displayedDiffSet) {
			const dirName = diffEntry.basename;
			const result = diffEntry.dirDiff;
			if (result.same) {
				content += `{light-green-fg}${dirName} ✔{/}\n`;
			}
			if (result.distinct) {
				content += `{yellow-bg}{black-fg}! ${dirName}{/}\n`;
				for (let dirDiff of result.diffSet) {
					if (dirDiff.type1 === "missing" && dirDiff.type2 === "file") {
						const filePath = path.resolve(dirDiff.relativePath, dirDiff.name2);
						content += `{light-red-fg}- ${filePath}{/}\n`;
					} else {
						if (dirDiff.type2 === "missing" && dirDiff.type1 === "file") {
							const filePath = path.resolve(dirDiff.relativePath, dirDiff.name1);
							content += `{light-red-fg}+ ${filePath}{/}\n`;
						} else if (dirDiff.reason === "different-content") {
							const filePath = path.resolve(dirDiff.relativePath, dirDiff.name1);
							content += `{yellow-bg}{black-fg}Δ ${filePath}{/}\n`;
							for (const fileDiff of diffEntry.fileDiffs) {
								let diffValue = fileDiff.value.replace(/\n$/, "");
								if (fileDiff.removed) {
									diffValue = diffValue.replace(/^/gm, "  - ");
									content += `{light-red-fg}${diffValue}{/}`;
								} else if (fileDiff.added) {
									diffValue = diffValue.replace(/^/gm, "  + ");
									content += `{light-green-fg}${diffValue}{/}\n`;
								}
							}
						}
					}
				}
			}
		}
		return content;
	}
}

module.exports = {
	terminal,
};
