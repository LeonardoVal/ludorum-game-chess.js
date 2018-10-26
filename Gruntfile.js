/** Gruntfile for [ludorum-game-chess.js](http://github.com/LeonardoVal/ludorum-game-chess.js).
*/
module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});

	require('@creatartis/creatartis-grunt').config(grunt, {
		sourceNames: ['__prologue__', 'ChessBoard', 'Chess', 'pieces', '__epilogue__'],
		deps: [
			{ id: 'creatartis-base', name: 'base' },
			{ id: 'sermat', name: 'Sermat',
		 		path: 'node_modules/sermat/build/sermat-umd-min.js' },
			{ id: 'ludorum' },
			{ id: 'chess.js', name: 'chess' },
			{ id: 'playtester', dev: true, module: false,
		 		path: 'node_modules/ludorum/build/playtester-common.js' }
		],
		targets: {
			build_umd: {
				fileName: 'build/ludorum-game-chess',
				wrapper: 'umd'
			},
			build_raw: {
				fileName: 'build/ludorum-game-chess-tag',
				wrapper: 'tag'
			}
		}
	});

	grunt.registerTask('default', ['build']);
};
