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
