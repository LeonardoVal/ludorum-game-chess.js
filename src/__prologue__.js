﻿/** Package wrapper and layout.
*/
function __init__(base, Sermat, ludorum, ChessJS) { "use strict";
// Import synonyms. ////////////////////////////////////////////////////////////////////////////////
	var declare = base.declare,
		obj = base.obj,
		copy = base.copy,
		raise = base.raise,
		raiseIf = base.raiseIf,
		Iterable = base.Iterable,
		iterable = base.iterable,
		Game = ludorum.Game,
		Checkerboard = ludorum.utils.Checkerboard,
		CheckerboardFromString = ludorum.utils.CheckerboardFromString,
		UserInterface = ludorum.players.UserInterface;

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
		__package__: 'ludorum-game-chess',
		__name__: 'ludorum_game_chess',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum, ChessJS],
		__SERMAT__: { include: [base, ludorum] }
	};
