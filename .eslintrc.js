module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	plugins: [
		"@typescript-eslint",
	],
	extends: [
		'plugin:vue/vue3-strongly-recommended',
	],
	env: {
		node: true,
		es2020: true,
	},
	parserOptions: {
		ecmaFeatures: {
			impliedStrict: true,
		},
	},
};
