(function (init) { "use strict";
			if (typeof define === 'function' && define.amd) {
				define(["creatartis-base","sermat","ludorum","chess"], init); // AMD module.
			} else if (typeof exports === 'object' && module.exports) {
				module.exports = init(require("creatartis-base"),require("sermat"),require("ludorum"),require("chess")); // CommonJS module.
			} else {
				this["ludorum-game-chess"] = init(this.base,this.Sermat,this.ludorum,this.ChessJS); // Browser.
			}
		}).call(this,/** Package wrapper and layout.
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
	var exports = {
		__package__: 'ludorum-game-chess',
		__name__: 'ludorum_game_chess',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum, ChessJS],
		__SERMAT__: { include: [base, ludorum] }
	};


/** # Chess

Implementation of [Chess](http://www.fide.com/component/handbook/?id=124&view=article) for Ludorum.
*/

function syncGlobalChess(fen) {
	fen = fen || INITIAL_FEN;
	if (CHESS.__currentFEN__ !== fen) {
		CHESS.load(fen);
		CHESS.__currentFEN__ = fen;
	}
	return CHESS;
}

var Chess = exports.Chess = declare(ludorum.Game, {
	name: 'Chess',

	/** The game is played by two players: White and Black. White moves first.
	*/
	players: ["White", "Black"],

	/** The constructor takes the `activePlayer` (`"White"` by default), and the `board` as an
	instance of `CheckerboardFromPieces` (with the initial setup by default).
	*/
	constructor: function Chess(params){
		this.fen = params && params.fen || INITIAL_FEN;
		var globalChess = syncGlobalChess(this.fen);
		ludorum.Game.call(this, this.players[globalChess.turn() === 'w' ? 0 : 1]);
	},

	// ## Game methods #############################################################################

	/** A move always places a piece in an empty square, if and only if by doing so one or more
	lines of the opponent's pieces get enclosed between pieces of the active player.
	*/
	moves: function moves() {
		var globalChess = syncGlobalChess(this.fen),
			r = null;
		if (!globalChess.game_over()) {
			r = {};
			r[this.activePlayer()] = globalChess.moves();
		}
		return r;
	},

	/** TODO.
	*/
	next: function next(moves, haps, update) {
		base.raiseIf(haps, 'Haps are not required (given ', haps, ')!');
		var globalChess = syncGlobalChess(this.fen);
		globalChess.move(moves[this.activePlayer()]);
		if (update) {
			this.fen = globalChess.fen();
		} else {
			return new this.constructor({ fen: globalChess.fen() });
		}
	},

	/** TODO.
	*/
	result: function result() {
		var globalChess = syncGlobalChess(this.fen);
		if (!globalChess.game_over()) {
			return null;
		} else if (globalChess.in_checkmate()) {
			return this.defeat();
		} else {
			return this.tied();
		}
	},

	// ## Utility methods ##########################################################################

	/** The game state serialization uses [Forsyth–Edwards notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation).
	*/
	'static __SERMAT__': {
		identifier: 'Chess',
		serializer: function serialize_Chess(obj) {
			return [{ fen: obj.fen }];
		}
	},

	clone: function clone() {
		return new this.constructor(this.fen);
	},

	/** The default string representation of Chess is the
	[Forsyth–Edwards notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation).
	*/
	toString: function toString() {
		return this.toFEN();
	},

	toFEN: function toFEN() {
		return this.fen;
	},

	/** The `fromFEN` function parses a string in [Forsyth–Edwards notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
	and builds the corresponding game state.
	*/
	'static fromFEN': function fromFEN(str) {
		return new this({ fen: this.fen });
	},

	square: (function () {
		var PIECES = {
			p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King'
		};
		return function square(coord) {
			if (Array.isArray(coord)) {
				coord = 'abcdefgh'.charAt(coord[1]) + (coord[0] + 1);
			}
			var globalChess = syncGlobalChess(this.fen),
				r = globalChess.get(coord);
			if (r) {
				r.player = this.players[r.color === 'w' ? 0 : 1];
				r.name = PIECES[r.type];
			}
			return r;
		};
	})(),

	// ## Heuristics ###############################################################################

	/** `Chess.heuristics` is a bundle of helper functions to build heuristic evaluation functions
	for this game.
	*/
	'static heuristics': {
		// TODO
	}
}); // declare Othello.

/** Adding Chess to `ludorum.games`.
*/
ludorum.games.Chess = Chess;

/** Sermat serialization.
*/
Chess.__SERMAT__.identifier = exports.__package__ +'.'+ Chess.__SERMAT__.identifier;
exports.__SERMAT__.include.push(Chess);
Sermat.include(exports);


// See __prologue__.js
	return exports;
}
);
//# sourceMappingURL=ludorum-game-chess.js.map