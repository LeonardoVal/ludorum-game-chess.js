(function (init) { "use strict";
			if (typeof define === 'function' && define.amd) {
				define(["creatartis-base","sermat","ludorum","chess.js"], init); // AMD module.
			} else if (typeof exports === 'object' && module.exports) {
				module.exports = init(require("creatartis-base"),require("sermat"),require("ludorum"),require("chess.js")); // CommonJS module.
			} else {
				this["ludorum-game-chess"] = init(this.base,this.Sermat,this.ludorum,this.chess); // Browser.
			}
		}).call(this,/** Package wrapper and layout.
*/
function __init__(base, Sermat, ludorum) { "use strict";
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
		__package__: 'ludorum-game-connect4',
		__name__: 'ludorum_game_connect4',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum],
		__SERMAT__: { include: [base, ludorum] }
	};


/** # Chess piece kinds

The piece `kinds` of Chess are: Pawn, Knight, Bishop, Rook, Queen and King.
*/
var ChessBoard = exports.ChessBoard = declare({
	height: 8,
	width: 8,

	constructor: function constructor(intArray) {
		this.constructor.arrayToBoard(intArray, this);
	},

	'static arrayToBoard': function arrayToBoard(intArray, obj) {
		obj = obj || {};
		'RNBQKBNRPPPPPPPPpppppppprnbqkbnr'.split('').forEach(function (k, i) {
			var piece = intArray[i];
			if (piece < 0xFF) { // 0xFF means piece is not in the board.
				var row = piece & 0x7,
					col = (piece & 0x38) >> 3,
					kind = k.toUpperCase();
				obj[row +','+ col] = {
					player: kind === k ? 0 : 1,
					kind: kind,
					row: row,
					col: col,
					flags: flags,
					index: i
				};
			}
		});
		return obj;
	},

	toArray: function toArray() {
		return this.constructor.boardToArray(this);
	},

	'static boardToArray': function boardToArray(board, array) {
		array = array || (new Uint8Array(32)).fill(0xFF);
		var piece;
		for (var k in board) {
			piece = board[k];
			array[piece.index] = (piece.col & 0x7) << 3 | (piece.row & 0x7);
		}
		return array;
	},

	// ## Board information #######################################################################

	isValidPosition: function isValidPosition(pos) {
		var row = pos[0],
			col = pos[1];
		return row >= 0 && row < this.width && col >= 0 && col < this.height;
	},

	isEmptyPosition: function isEmptyPosition(pos) {
		return this.isValidPosition(pos) && !this.hasOwnProperty(pos[0] +','+ pos[1]);
	},

	isPlayersPosition: function isPlayersPosition(pos, player) {
		return this.isValidPosition(pos) && this.hasOwnProperty(pos[0] +','+ pos[1]) &&
			this[pos[0] +','+ pos[1]].player === player;
	},

	canMoveTo: function isPlayersPosition(pos, player) {
		return this.isValidPosition(pos) && (!this.hasOwnProperty(pos[0] +','+ pos[1]) ||
			this[pos[0] +','+ pos[1]].player !== player);
	},

	canCaptureAt: function canCaptureAt(pos, player) {
		return this.isValidPosition(pos) && this.hasOwnProperty(pos[0] +','+ pos[1]) &&
			this[pos[0] +','+ pos[1]].player !== player;
	},

	forward: function forward(player) {
		return player === 0 ? +1 : -1;
	},

	rank: function rank(n, player) {
		return player === 0 ? n - 1 : this.height - n;
	},

	toString: function toString() {
		var board = this,
			str = '';
		return Iterable.range(8).map(function (row) {
			return Iterable.range(8).map(function (col) {
				piece = board[row +','+ col];
				return !piece ? '.' :
					piece.player === 0 ? piece.kind.toUpperCase() : piece.kind.toLowerCase();
			}).join('');
		}).join('\n');
	},

	// ## Moves ###################################################################################

	'dual encodeMove': function encodeMove(fromRow, fromCol, toRow, toCol, promotion) {
		fromRow = fromRow & 0x7; 
		fromCol = fromCol & 0x7;
		toRow = toRow & 0x7;
		toCol = toCol & 0x7;
		promotion = promotion & 0x7;
		return (((promotion << 3 | fromRow) << 3 | fromCol) << 3 | toRow) << 3 | toCol;
	},
	
	'dual decodeMove': function decodeMove(m) {
		promotion = (m >> 10) & 0x7;
		fromRow = (m >> 9) & 0x7; 
		fromCol = (m >> 6) & 0x7;
		toRow = (m >> 3) & 0x7;
		toCol = m & 0x7;
		return [[fromRow, fromCol], [toRow, toCol], flags, promotion];
	},

	moves_Pawn: function moves_Pawn(piece) {
		var forward = this.forward(piece.player),
			moves = [],
			row2 = piece.row + forward;
		if (this.isEmptyPosition([row2, piece.col])) { // move forward
			moves.push(this.encodeMove(piece.row, piece.col, row2, piece.col));
		}
		if (piece.row === this.rank(2, piece.player) && this.isEmptyPosition([piece.row + 2 * forward, piece.col])) { // move 2 squares forward
			moves.push(this.encodeMove(piece.row, piece.col, piece.row + 2 * forward, piece.col));
		}
		if (this.canCaptureAt([row2, piece.col - 1], piece.player)) { // captures
			moves.push(this.encodeMove(piece.row, piece.col, row2, piece.col - 1));
		}
		if (this.canCaptureAt([row2, piece.col + 1], piece.player)) { // captures
			moves.push(this.encodeMove(piece.row, piece.col, row2, piece.col + 1));
		}
		/*TODO Promotions
		if (this.position[0] === (direction < 0 ? 1 : board.height - 2)) { // Promotions at the last rank.
			var promotions = ['Knight', 'Bishop', 'Rook', 'Queen'];
			return iterable(r).map(function (p) {
				return promotions.map(function (k) {
					return ['promote', piece.position, p, k];
				});
			}).flatten();
		} else {
			return iterable(r).map(function (p) {
				return ['move', piece.position, p];
			});
		}
		*/
		return moves;
	},

	moves_Knight: function moves_Knight(piece) {
		var board = this,
			deltas = [[+2,+1],[+1,+2],[+2,-1],[-1,+2],[-2,-1],[-1,-2],[-2,+1],[+1,-2]],
			row = piece.row,
			col = piece.col;
		return iterable(deltas).filterApply(function (dr, dc) {
			return board.canMoveTo([row + dr, col + dc], piece.player);
		}, function (dr, dc) {
			return board.encodeMove(row, col, row + dr, col + dc);
		});
	},
	
	moves_Bishop: function moves_Bishop(piece) {
		var board = this,
			row = piece.row,
			col = piece.col;
		return iterable(board.walks([row, col], Checkerboard.DIRECTIONS.DIAGONAL)).map(function (walk) {
			var cont = true;
			return walk.tail().takeWhile(function (p) {
				var r = cont && board.canMoveTo(p, piece.player);
				cont = cont && board.isEmptyPosition(p);
				return r;
			}).map(function (p) {
				return board.encodeMove(row, col, p[0], p[1]);
			});
		}).flatten();
	},
	
	moves_Rook: function moves_Rook(piece) {
		var board = this,
			row = piece.row,
			col = piece.col;
		return iterable(board.walks([row, col], Checkerboard.DIRECTIONS.ORTHOGONAL)).map(function (walk) {
			var cont = true;
			return walk.tail().takeWhile(function (p) {
				var r = cont && board.canMoveTo(p, piece.player);
				cont = cont && board.isEmptyPosition(p);
				return r;
			}).map(function (p) {
				return board.encodeMove(row, col, p[0], p[1]);
			});
		}).flatten();
	},

	moves_Queen: function moves_Queen(piece) {
		var board = this,
			row = piece.row,
			col = piece.col;
		return iterable(board.walks([row, col], Checkerboard.DIRECTIONS.EVERY)).map(function (walk) {
			var cont = true;
			return walk.tail().takeWhile(function (p) {
				var r = cont && board.canMoveTo(p, piece.player);
				cont = cont && board.isEmptyPosition(p);
				return r;
			}).map(function (p) {
				return board.encodeMove(row, col, p[0], p[1]);
			});
		}).flatten();
	},

	moves_King: function moves_King(piece) {
		var board = this,
			row = piece.row,
			col = piece.col;
		return iterable(Checkerboard.DIRECTIONS.EVERY).filterApply(function (dr, dc) {
			return board.canMoveTo([row + dr, col + dc], piece.player);
		}, function (dr, dc) {
			return board.encodeMove(row, col, row + dr, row + dc);
		});
	},

	apply: function apply(move) {
		move = typeof move === 'number' ? this.decodeMove(move) : move;
		var fromRow = move[0][0], fromCol = move[0][1],
			toRow = move[1][0], toCol = move[1][1],
			flags = move[2] |0,
			promotion = move[3] |0;
			piece = board[fromRow +','+ fromCol];
		delete this[fromRow +','+ fromCol];
		this[toRow +','+ toCol] = piece;
		piece.flags = flags;
		if (promotion > 0) {
			piece.kind = 'PNBRQ'.charAt(promotion);
		}
		return this;
	}
});


/** # Chess

Implementation of [Chess](http://www.fide.com/component/handbook/?id=124&view=article) for Ludorum.
*/

var Chess = exports.Chess = declare(Game, {
	name: 'Chess',

	/** The game is played by two players: White and Black. White moves first.
	*/
	players: ["White", "Black"],

	/** The constructor takes the `activePlayer` (`"White"` by default), and the `board` as an
	instance of `CheckerboardFromPieces` (with the initial setup by default).
	*/
	constructor: function Chess(params){
		params = params || {};
		Game.call(this, params.activePlayer || this.players[0]);
		this.board = !params.board ? this.initialBoard()
			: typeof params.board === 'string' ? Chess.boardFromFEN(params.board)
			: params.board;
		this.castling = params.castling || "KQkq";
		this.enPassant = params.enPassant;
		this.halfMoves = params.halfMoves |0;
		this.fullMoves = Math.max(params.fullMoves |0, 1);

		// Classify pieces by player and kind.
		var game = this;
		this.pieces = iterable(this.players).map(function (player) {
			return [player, iterable(game.kinds).mapApply(function (kindName, kindConstructor) {
				return [kindName, []];
			}).toObject()];
		}).toObject();
		iterable(this.board.pieces).forEachApply(function (_, piece) {
			game.pieces[piece.player][piece.name].push(piece);
		});
	},

	// ## Game methods #############################################################################

	/** A move always places a piece in an empty square, if and only if by doing so one or more
	lines of the opponent's pieces get enclosed between pieces of the active player.
	*/
	moves: function moves() {
		if (!this.hasOwnProperty('__moves__')) {
			var game = this,
				board = this.board,
				activePlayer = this.activePlayer(),
				king = this.pieces[activePlayer].King[0];
				this.checkMoves = []; /*FIXME iterable(this.pieces[this.opponent()]).select(1).flatten().filter(function (p) {
					return p.canMove(king.position);
				}).toArray();*/
			if (this.checkMoves.length < 1) { // Active player's king is not in check.
				this.__moves__ = base.obj(activePlayer, iterable(this.pieces[activePlayer])
					.mapApply(function (kind, pieces) {
						return pieces;
					}).flatten().map(function (p) {
						return p.moves(game, board);
					}).flatten().toArray()
				);
			} else {
				throw new Error('Do not know what to do when in check!');//FIXME
			}
		}
		return this.__moves__;
	},

	/** TODO.
	*/
	next: function next(moves, haps, update) {
		//FIXME WIP
		raiseIf(haps, 'Haps are not required (given ', haps, ')!');
		var activePlayer = this.activePlayer(),
			move = moves[activePlayer],
			movingPiece = this.board.square(move[1]);
		//console.log(this+"");//LOG
		var args = {
			activePlayer: this.opponent(),
			board: movingPiece.next(this, this.board, move),
			castling: this.castling,
			enPassant: null,
			halfMoves: this.halfMoves,
			fullMoves: this.fullMoves + (activePlayer === 'Black' ? 1 : 0)
		};
		if (update) {
			this.constructor(args);
			return this;
		} else {
			return new this.constructor(args);
		}
	},

	/** TODO.
	*/
	result: function result() {
		//FIXME
		if (this.moves()[this.activePlayer()]) {
			return null;
		} else if (this.checkMoves.length > 0) { // Checkmate!
			return this.defeat();
		} else { // Stalemate.
			return this.draw();
		}
	},

	// ## Utility methods ##########################################################################

	/** The game state serialization uses [Forsyth–Edwards notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation).
	*/
	'static __SERMAT__': {
		identifier: 'Chess',
		serializer: function serialize_Chess(obj) {
			return [obj.toFEN()];
		},
		materializer: function materialize_Chess(obj, args) {
			return args ? Chess.fromFEN(args[0]) : null;
		}
	},

	clone: function clone() { //FIXME Is this necessary?
		return Chess.fromFEN(this.toFEN());
	},

	'dual coordFromString': function coordFromString(str) {
		return [+str.charAt(1) + 1, str.charCodeAt(0) - 'a'.charCodeAt(0)];
	},

	'dual coordToString': function coordToString(coord) {
		return String.fromCharCode('a'.charCodeAt(0) + coord[1]) + (coord[0] + 1);
	},

	/** The default string representation of Chess is the
	[Forsyth–Edwards notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation).
	*/
	toString: function toString() {
		return this.toFEN();
	},

	toFEN: function toFEN() {
		var board = this.board,
			result = board.horizontals().map(function (hline) {
				var lineText = '',
					emptySquares = 0;
				hline.forEach(function (coord) {
					var p = board.square(coord);
					if (!p) {
						emptySquares++;
					} else {
						if (emptySquares > 0) {
							lineText += emptySquares;
							emptySquares = 0;
						}
						lineText += p.toString();
					}
				});
				if (emptySquares > 0) {
					lineText += emptySquares;
				}
				return lineText;
			}).join('/');
		result += " "+ (this.activePlayer().charAt(0).toLowerCase());
		result += " "+ this.castling;
		result += " "+ (this.enPassant ? this.coordToString(this.enPassant) : "-");
		result += " "+ this.halfMoves +" "+ this.fullMoves;
		return result;
	},

	/** The `fromFEN` function parses a string in [Forsyth–Edwards notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
	and builds the corresponding game state.
	*/
	'static fromFEN': function fromFEN(str) {
		str = str.trim();
		var match = this.FEN_REGEXP.exec(str);
		raiseIf(!match, "Invalid FEN string '", str, "'!");
		return new this({
			board: this.boardFromFEN(match[1]),
			activePlayer: match[2] === 'w' ? 'White' : 'Black',
			castling: match[3] === '-' ? "" : match[3],
			enPassant: match[4] === '-' ? null : this.coordFromString(match[4]),
			halfMoves: +match[5],
			fullMoves: +match[6]
		});
	},

	/** To parse a string in [Forsyth–Edwards notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
	this is regular expression is used. Capturing groups are: board, active player, castling, en
	passant, half move and full move. Spaces at beginning and end must be trimmed before matching.
	*/
	'static FEN_REGEXP':
		/^((?:[pnbrqkPNBRQK12345678]+\/){7}[pnbrqkPNBRQK12345678]+)\s+([wb])\s+(-|[KQkq]+)\s+(-|[a-h][1-8])\s+(\d+)\s+(\d+)$/,

	'dual boardFromFEN': function boardFromFEN(str) {
		var rows = str.split('/'),
			kinds = {
				'p': this.kinds.Pawn,
				'n': this.kinds.Knight,
				'b': this.kinds.Bishop,
				'r': this.kinds.Rook,
				'q': this.kinds.Queen,
				'k': this.kinds.King
			},
			pieces = [];
		rows.forEach(function (row, r) {
			var c = 0;
			iterable(row).forEach(function (sq) {
				if (!isNaN(sq)) {
					c += sq |0;
				} else {
					pieces.push(new kinds[sq.toLowerCase()](
						sq === sq.toLowerCase() ? 'Black' : 'White',
						[r, c]
					));
					c++;
				}
			});
		});
		return new ludorum.utils.CheckerboardFromPieces(8, 8, pieces);
	},

	// ## Heuristics ###############################################################################

	/** `Chess.heuristics` is a bundle of helper functions to build heuristic evaluation functions
	for this game.
	*/
	'static heuristics': {
		// TODO
	}
}); // declare Othello.

// ## Initial board ################################################################################

/** The initial board of Chess has the first rank of the board with the following pieces for Whites:
Rook, Knight, Bishop, Queen, King, Bishop, Knight and Rook. The next rank has 8 Pawns. Blacks have a
symmetrical layout on their ranks.
*/
Chess.initialBoard = Chess.prototype.initialBoard = function () {
	return Chess.boardFromFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
};

/** Adding Chess to `ludorum.games`.
*/
ludorum.games.Chess = Chess;

/** Sermat serialization.
*/
Chess.__SERMAT__.identifier = exports.__package__ +'.'+ Chess.__SERMAT__.identifier;
exports.__SERMAT__.include.push(Chess);
Sermat.include(exports);


/** # Chess pieces

The piece `kinds` of Chess are: Pawn, Knight, Bishop, Rook, Queen and King.
*/

/** `Piece` is the base class for all pieces in the game. Pieces' classes help to calculate moves,
and the effects these moves have on the board.
*/
var Piece = declare({
	constructor: function Piece(player, position) {
		this.player = player;
		this.position = position;
	},

	moves: base.objects.unimplemented('Piece', 'moves(game, board)'),

	canMove: base.objects.unimplemented('Piece', 'canMove(game, board, position)'),

	moveTo: function moveTo(position) {
		return new this.constructor(this.player, position);
	},

	next: function (game, board, move) {
		return board.clone()
			.__place__(move[1])
			.__place__(move[2], this.moveTo(move[2]));
	}
});

var KINDS = Chess.kinds = Chess.prototype.kinds = {};

KINDS.Pawn = declare(Piece, { //////////////////////////////////////////////////////////////////////
	name: 'Pawn',

	moves: function moves(game, board) { // TODO En passant captures.
		var piece = this,
			direction = (this.player === game.players[0]) ? -1 : +1,
			r = [],
			p = [this.position[0] + direction, this.position[1]];
		if (!board.square(p)) { // move forward
			r.push(p);
		}
		[[direction,-1], [direction,+1]].map(function (d) { // capture to the sides.
			return [piece.position[0] + d[0], piece.position[1] + d[1]];
		}).forEach(function (p) {
			if (board.isValidCoord(p)) {
				var square = board.square(p);
				if (square && square.player !== piece.player) {
					r.push(p);
				}
			}
		});
		if (this.position[0] === (direction > 0 ? 1 : board.height - 2)) { // double forward at first rank.
			p = [this.position[0] + 2 * direction, this.position[1]];
			if (!board.square(p)) { // move forward
				r.push(p);
			}
		}
		if (this.position[0] === (direction < 0 ? 1 : board.height - 2)) { // Promotions at the last rank.
			var promotions = ['Knight', 'Bishop', 'Rook', 'Queen'];
			return iterable(r).map(function (p) {
				return promotions.map(function (k) {
					return ['promote', piece.position, p, k];
				});
			}).flatten();
		} else {
			return iterable(r).map(function (p) {
				return ['move', piece.position, p];
			});
		}
	},

	//canMove: TODO,

	next: function next(game, board, move) {
		if (move[0] === 'move') {
			return Piece.prototype.next.call(this, game, board, move);
		} else { // Promotion
			return board.clone()
				.__place__(move[1])
				.__place__(move[2], new Chess.kinds[move[3]](this.player, move[2]));
		}
	},

	toString: function toString() {
		return this.player === "White" ? "P" : "p";
	}
}); // declare Chess.kinds.Pawn

KINDS.Knight = declare(Piece, { ////////////////////////////////////////////////////////////////////
	name: 'Knight',

	DELTAS: [[+2,+1],[+1,+2],[+2,-1],[-1,+2],[-2,-1],[-1,-2],[-2,+1],[+1,-2]],

	moves: function moves(game, board) {
		var piece = this;
		return iterable(this.DELTAS).map(function (d) {
			return ['move', piece.position, [piece.position[0] + d[0], piece.position[1] + d[1]]];
		}, function (m) {
			if (board.isValidCoord(m[2])) {
				var s = board.square(m[2]);
				return !s || s.player !== piece.player;
			} else {
				return false;
			}
		});
	},

	//canMove: TODO,

	toString: function toString() {
		return this.player === "White" ? "N" : "n";
	}
}); // declare Chess.kinds.Knight

KINDS.Bishop = declare(Piece, { ////////////////////////////////////////////////////////////////////
	name: 'Bishop',

	moves: function moves(game, board) {
		var piece = this;
		return iterable(board.walks(this.position, Checkerboard.DIRECTIONS.DIAGONAL)).map(function (walk) {
			var cont = true;
			return walk.tail().takeWhile(function (p) {
				var square = board.square(p),
					r = cont && (!square || square.player !== piece.player);
				cont = cont && !square;
				return r;
			}).map(function (p) {
				return ['move', piece.position, p];
			});
		}).flatten();
	},

	//canMove: TODO,

	next: function (game, board, move) {
		return board.clone()
			.__place__(move[1])
			.__place__(move[2], new this.constructor(this.player, move[2]));
	},

	toString: function toString() {
		return this.player === "White" ? "B" : "b";
	}
}); // declare Chess.kinds.Bishop

KINDS.Rook = declare(Piece, { //////////////////////////////////////////////////////////////////////
	name: 'Rook',

	moves: function moves(game, board) {
		var piece = this;
		return iterable(board.walks(this.position, Checkerboard.DIRECTIONS.ORTHOGONAL)).map(function (walk) {
			var cont = true;
			return walk.tail().takeWhile(function (p) {
				var square = board.square(p),
					r = cont && (!square || square.player !== piece.player);
				cont = cont && !square;
				return r;
			}).map(function (p) {
				return ['move', piece.position, p];
			});
		}).flatten();
	},

	//canMove: TODO,

	toString: function toString() {
		return this.player === "White" ? "R" : "r";
	}
}); // declare Chess.kinds.Rook

KINDS.Queen = declare(Piece, { /////////////////////////////////////////////////////////////////////
	name: 'Queen',

	moves: function moves(game, board) {
		var piece = this;
		return iterable(board.walks(this.position, Checkerboard.DIRECTIONS.EVERY)).map(function (walk) {
			var cont = true;
			return walk.tail().takeWhile(function (p) {
				var square = board.square(p),
					r = cont && (!square || square.player !== piece.player);
				cont = cont && !square;
				return r;
			}).map(function (p) {
				return ['move', piece.position, p];
			});
		}).flatten();
	},

	//canMove: TODO,

	toString: function toString() {
		return this.player === "White" ? "Q" : "q";
	}
}); // declare Chess.kinds.Queen

KINDS.King = declare(Piece, { //////////////////////////////////////////////////////////////////////
	// TODO Castling.
	name: 'King',

	moves: function moves(game, board) {
		var piece = this;
		return iterable(Checkerboard.DIRECTIONS.EVERY).map(function (d) {
			return ['move', piece.position, [piece.position[0] + d[0], piece.position[1] + d[1]]];
		}, function (m) {
			if (board.isValidCoord(m[2])) {
				var s = board.square(m[2]);
				return !s || s.player !== piece.player;
			} else {
				return false;
			}
		});
	},

	canMove: function canMove(game, board, pos) {
		if (board.isValidCoord(pos)	&&
				(Math.abs(this.position[0] - pos[0]) === 1) !== (Math.abs(this.position[1] - pos[1]) === 1)
			) {
			var sq = board.square(pos);
			return !sq || sq.player !== this.player;
		} else {
			return false;
		}
	},

	toString: function toString() {
		return this.player === "White" ? "K" : "k";
	}
}); // declare Chess.kinds.King


// See __prologue__.js
	return exports;
}
);
//# sourceMappingURL=ludorum-game-chess.js.map