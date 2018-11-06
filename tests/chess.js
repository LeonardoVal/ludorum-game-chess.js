require(['require-config'], function (init) { "use strict";
init(['creatartis-base', 'sermat', 'ludorum', 'chess', 'playtester', 'ludorum-game-chess'],
	function (base, Sermat, ludorum, ChessJS, PlayTesterApp, ludorum_game_chess) {

	var BasicHTMLInterface = ludorum.players.UserInterface.BasicHTMLInterface;

	/** Custom HTML interface for Chess.
	*/
	var ChessHTMLInterface = base.declare(BasicHTMLInterface, {
		constructor: function ChessHTMLInterface() {
			BasicHTMLInterface.call(this, {
				document: document,
				container: document.getElementById('board')
			});
		},

		/** CSS class name for the square.
		*/
		__className__: function __className__(square, coord) {
			var r;
			if (!square) {
				r = 'ludorum-square-empty';
			} else {
				r = 'ludorum-square-'+ square.player +'-'+ square.name;
			}
			if (coord === this.selectedPiece) {
				r += ' ludorum-square-selected';
			}
			return r;
		},

		__movesBySquare__: function __movesBySquare__(game) {
			var moves = game.moves({ verbose: true });
			return moves && base.iterable(moves.White || moves.Black).map(function (move) {
				return [move.from +' '+ move.to, move.san];
			}).toObject();
		}, 

		display: function display(game) {
			this.container.innerHTML = ''; // empty the board's DOM.
			var moves = this.__movesBySquare__(game),
				activePlayer = game.activePlayer(),
				table = this.document.createElement('table'),
				tr, td, coord, data;
			this.container.appendChild(table);
			for (var row = 1; row < 9; row++) {
				tr = this.document.createElement('tr');
				table.appendChild(tr);
				for (var col = 1; col < 9; col++) {
					td = this.document.createElement('td');
					coord = '.abcdefgh'.charAt(col) + row;
					data = {
						square: game.square(coord),
						coord: coord
					};
					td.id = 'ludorum-square-'+ row +'-'+ col;
					td.className = this.__className__(data.square, data.coord);
					td.innerHTML = '&nbsp';
					td.onclick = (function (data) {
						//console.log('Click @ '+ data.coord);//FIXME
						var m = this.selectedPiece +' '+ data.coord;
						if (moves.hasOwnProperty(m)) {
							this.selectedPiece = null;
							this.perform(moves[m], activePlayer);
						} else if (this.selectedPiece !== data.coord) {
							if (data.square 
									&& data.square.color === activePlayer.toLowerCase().charAt(0)) {
								this.selectedPiece = data.coord;
							} else {
								this.selectedPiece = null;
							}
						}
						this.display(game); // Redraw the game state.
					}).bind(this, data);
					td['ludorum-data'] = data;
					tr.appendChild(td);
				}
			}
			return this;
		}
	});

	/** PlayTesterApp initialization.
	*/
	base.global.APP = new PlayTesterApp(
		new ludorum_game_chess.Chess(),
		new ChessHTMLInterface(),
		{ bar: document.getElementsByTagName('footer')[0] },
		[ludorum_game_chess]
	);
	APP.playerUI("You")
		.playerRandom()
		.playerMonteCarlo("", true, 10)
		.playerUCT("", true, 10)
		.playerAlfaBeta("", true, 3)
		.player("Heuristic1", function () {
			return ludorum_game_chess.ai.heuristic1.minimaxPlayer({ horizon: 2 });
		}, true)
		.selects(['player0', 'player1'])
		.button('resetButton', document.getElementById('reset'), APP.reset.bind(APP))
		.reset();
}); // init()
}); // require().
