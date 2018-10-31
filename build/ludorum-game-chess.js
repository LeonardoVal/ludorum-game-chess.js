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
			__SERMAT__: { include: [base, ludorum] },
			// Submodules
			ai: { }
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
	moves: function moves(options) {
		var globalChess = syncGlobalChess(this.fen),
			r = null;
		if (!globalChess.game_over()) {
			r = {};
			r[this.activePlayer()] = globalChess.moves(options);
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
			return this;
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
	})()
}); // declare Othello.

/** Adding Chess to `ludorum.games`.
*/
ludorum.games.Chess = Chess;

/** Sermat serialization.
*/
Chess.__SERMAT__.identifier = exports.__package__ +'.'+ Chess.__SERMAT__.identifier;
exports.__SERMAT__.include.push(Chess);
Sermat.include(exports);


/** # Heuristic 1  

Game evaluation heuristic based on a [Lauri Hartikka's blog post](https://medium.freecodecamp.org/simple-chess-ai-step-by-step-1d55a9266977).
*/
exports.ai.heuristic1 = (function () {
	var BOARD_FACTORS = Object.freeze({
			p: [
				[ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
				[+5.0,+5.0,+5.0,+5.0,+5.0,+5.0,+5.0,+5.0],
				[+1.0,+1.0,+2.0,+3.0,+3.0,+2.0,+1.0,+1.0],
				[+0.5,+0.5,+1.0,+2.5,+2.5,+1.0,+0.5,+0.5],
				[ 0.0, 0.0, 0.0, 2.0, 2.0, 0.0, 0.0, 0.0],
				[+0.5,-0.5,-1.0, 0.0, 0.0,-1.0,-0.5,+0.5],
				[+0.5,+1.0,+1.0,-2.0,-2.0,+1.0,+1.0,+0.5],
				[ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
			],
			n: [
				[-5.0,-4.0,-3.0,-3.0,-3.0,-3.0,-4.0,-5.0],
				[-4.0,-2.0, 0.0, 0.0, 0.0, 0.0,-2.0,-4.0],
				[-3.0, 0.0,+1.0,+1.5,+1.5,+1.0, 0.0,-3.0],
				[-3.0,+0.5,+1.5,+2.0,+2.0,+1.5,+0.5,-3.0],
				[-3.0, 0.0,+1.5,+2.0,+2.0,+1.5, 0.0,-3.0],
				[-3.0,+0.5,+1.0,+1.5,+1.5,+1.0,+0.5,-3.0],
				[-4.0,-2.0, 0.0,+0.5,+0.5, 0.0,-2.0,-4.0],
				[-5.0,-4.0,-3.0,-3.0,-3.0,-3.0,-4.0,-5.0]
			],
			b: [
				[-2.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-2.0],
				[-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-1.0],
				[-1.0, 0.0,+0.5,+1.0,+1.0,+0.5, 0.0,-1.0],
				[-1.0,+0.5,+0.5,+1.0,+1.0,+0.5,+0.5,-1.0],
				[-1.0, 0.0,+1.0,+1.0,+1.0,+1.0, 0.0,-1.0],
				[-1.0,+1.0,+1.0,+1.0,+1.0,+1.0,+1.0,-1.0],
				[-1.0,+0.5, 0.0, 0.0, 0.0, 0.0,+0.5,-1.0],
				[-2.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-2.0]
			],
			r: [
				[ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
				[ 0.5,+1.0,+1.0,+1.0,+1.0,+1.0,+1.0,+0.5],
				[-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-0.5],
				[-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-0.5],
				[-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-0.5],
				[-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-0.5],
				[-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-0.5],
				[ 0.0, 0.0, 0.0,+0.5,+0.5, 0.0, 0.0, 0.0]
			],
			q: [
				[-2.0,-1.0,-1.0,-0.5,-0.5,-1.0,-1.0,-2.0],
				[-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-1.0],
				[-1.0, 0.0,+0.5,+0.5,+0.5,+0.5, 0.0,-1.0],
				[-0.5, 0.0,+0.5,+0.5,+0.5,+0.5, 0.0,-0.5],
				[ 0.0, 0.0,+0.5,+0.5,+0.5,+0.5, 0.0,-0.5],
				[-1.0,+0.5,+0.5,+0.5,+0.5,+0.5, 0.0,-1.0],
				[-1.0, 0.0,+0.5, 0.0, 0.0, 0.0, 0.0,-1.0],
				[-2.0,-1.0,-1.0,-0.5,-0.5,-1.0,-1.0,-2.0]
			],
			k: [
				[-3.0,-4.0,-4.0,-5.0,-5.0,-4.0,-4.0,-3.0],
				[-3.0,-4.0,-4.0,-5.0,-5.0,-4.0,-4.0,-3.0],
				[-3.0,-4.0,-4.0,-5.0,-5.0,-4.0,-4.0,-3.0],
				[-3.0,-4.0,-4.0,-5.0,-5.0,-4.0,-4.0,-3.0],
				[-2.0,-3.0,-3.0,-4.0,-4.0,-3.0,-3.0,-2.0],
				[-1.0,-2.0,-2.0,-2.0,-2.0,-2.0,-2.0,-1.0],
				[+2.0,+2.0, 0.0, 0.0, 0.0, 0.0,+2.0,+2.0],
				[+2.0,+3.0,+1.0, 0.0, 0.0,+1.0,+3.0,+2.0]
			]
		}),
		PIECE_FACTORS = Object.freeze({
			p: 10.0,
			n: 30.0,
			b: 30.0,
			r: 50.0,
			q: 90.0,
			k: 900.0
		});

	var makeEvaluationFunction = function makeEvaluationFunction(boardFactors, pieceFactors) {
		boardFactors = boardFactors || BOARD_FACTORS;
		pieceFactors = pieceFactors || PIECE_FACTORS;
		//TODO Calculate max result for normalization.
		return function chessHeuristic(game, role) {
			var result = 0, 
				sq;
			for (var row = 0; row < 8; row++) {
				for (var col = 0; col < 8; col++) {
					sq = game.square([row, col]);
					if (sq) {
						//FIXME Check player's role.
						result += pieceFactors[sq.type] * (sq.color === 'w' ? 
							boardFactors[sq.type][row][col] : boardFactors[sq.type][8 - row][col]);
					}
				}
			}
			return result; //FIXME Normalize!
		};
	};

	return {
		BOARD_FACTORS: BOARD_FACTORS,
		PIECE_FACTORS: PIECE_FACTORS,
		makeEvaluationFunction: makeEvaluationFunction
		//TODO Player building functions (MiniMax, etc).
	};
})();

// See __prologue__.js
	return exports;
}
);
//# sourceMappingURL=ludorum-game-chess.js.map