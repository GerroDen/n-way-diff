module.exports = {
	root: true,
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
