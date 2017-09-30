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
