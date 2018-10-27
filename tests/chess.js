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
		__className__: function __className__(square) {
			return !square ? 'ludorum-square-empty' : 'ludorum-square-'+ square.player +'-'+ square.name;
		},

		display: function display(game) {
			this.container.innerHTML = ''; // empty the board's DOM.
			var moves = game.moves(),
				table = this.document.createElement('table'),
				tr, td, coord, data;
			this.container.appendChild(table);
			for (var row = 0; row < 8; row++) {
				tr = this.document.createElement('tr');
				table.appendChild(tr);
				for (var col = 0; col < 8; col++) {
					td = this.document.createElement('td');
					coord = [row, col];
					data = td['ludorum-data'] = {
						square: game.square(coord),
						coord: coord
					};
					td.id = 'ludorum-square-'+ row +'-'+ col;
					td.className = this.__className__(data.square);
					td.innerHTML = '&nbsp';
					//TODO td.onclick
					tr.appendChild(td);
				}
			}
			return this;
/*
			var ui = this,
				activePlayer = game.activePlayer(),
				board = game.board,
				movesByFrom = moves ? base.iterable(moves[activePlayer]).groupAll(function (m) {
					return m[1] +'';
				}) : {},
				selectedMoves = ui.selectedPiece && iterable(movesByFrom[ui.selectedPiece]).map(function (m) {
					return [m[2] +'', m];
				}).toObject();
			board.renderAsHTMLTable(ui.document, ui.container, function (data) {
				/** The graphic of the square is defined by a CSS class. E.g. `ludorum-square-empty`,
				`ludorum-square-White-Rook`, `ludorum-square-Black-Pawn` or `ludorum-square-move`.
				* /
				var coordString = data.coord +'';
				data.className = ui.__className__(data.square);
				data.innerHTML = '&nbsp;';
				if (ui.selectedPiece) {
					if (selectedMoves && selectedMoves.hasOwnProperty(coordString)) {
						data.className = 'ludorum-square-'+ activePlayer +'-move';
						data.onclick = function () {
							var selectedPiece = ui.selectedPiece;
							ui.selectedPiece = null;
							ui.perform(selectedMoves[coordString], activePlayer);
						};
					}
				}
				if (movesByFrom.hasOwnProperty(coordString)) {
					data.onclick = function () {
						ui.selectedPiece = coordString;
						ui.display(game); // Redraw the game state.
					};
				}
			});
			return ui;
*/
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
		.playerMonteCarlo("", true, 50)
		.playerMonteCarlo("", true, 100)
		.playerUCT("", true, 50)
		.playerUCT("", true, 100)
		.playerAlfaBeta("", true, 3)
		.selects(['player0', 'player1'])
		.button('resetButton', document.getElementById('reset'), APP.reset.bind(APP))
		.reset();
}); // init()
}); // require().
