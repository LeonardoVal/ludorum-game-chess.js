/** Package wrapper and layout.
*/
function __init__(base, Sermat, ludorum, ChessJS) { "use strict";
// Import synonyms. ////////////////////////////////////////////////////////////////////////////////
	var declare = base.declare,
		iterable = base.iterable,
		UserInterface = ludorum.players.UserInterface;

// Workaround for difference in module definition depending on platform. ///////////////////////////
	if (typeof ChessJS === 'object') {
		ChessJS = ChessJS.Chess;
	}
	var CHESS = ChessJS(),
		INITIAL_FEN = CHESS.fen();

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var chessjs_package = {
			__package__: 'chess.js',
			__name__: 'ChessJS',
			__init__: eval('(function __init__() { return ('+ ChessJS +'); })'),
			__dependencies__: []
		},
		exports = {
			__package__: 'ludorum-game-chess',
			__name__: 'ludorum_game_chess',
			__init__: __init__,
			__dependencies__: [base, Sermat, ludorum, chessjs_package],
			__SERMAT__: { include: [base, ludorum] }
		};
