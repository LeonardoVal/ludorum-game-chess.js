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
		var maxBoardFactor = iterable(boardFactors).select(1).flatten().flatten().max(),
			pieceFactorSum = 16 * pieceFactors.p + 4 * pieceFactors.n + 4 * pieceFactors.b +
				4 * pieceFactors.r + 2 * pieceFactors.q + 2 * pieceFactors.k,
			maxEvaluation = 32 * maxBoardFactor + pieceFactorSum;
		return function chessHeuristic(game, role) {
			var result = 0,
				roleColor = role.charAt(0).toLowerCase(),
				sq, boardFactor;
			for (var row = 0; row < 8; row++) {
				for (var col = 0; col < 8; col++) {
					sq = game.square([row, col]);
					if (sq) {
						boardFactor = sq.color === 'w' ? boardFactors[sq.type][row][col] : 
							boardFactors[sq.type][7 - row][col];
						result += (sq.color === roleColor ? +1 : -1) * 
							(pieceFactors[sq.type] + boardFactor);
					}
				}
			}
			return result / maxEvaluation;
		};
	};

	return {
		BOARD_FACTORS: BOARD_FACTORS,
		PIECE_FACTORS: PIECE_FACTORS,
		HEURISTIC_FUNCTION: makeEvaluationFunction(),
		makeEvaluationFunction: makeEvaluationFunction,

		heuristicPlayer: function heuristicPlayer(options) {
			options = options || {};
			if (!options.heuristic) {
				options.heuristic = makeEvaluationFunction(options.boardFactors,
					options.pieceFactors);
			}
			return new ludorum.players.HeuristicPlayer(options);
		},

		minimaxPlayer: function minimaxPlayer(options) {
			options = options || {};
			if (!options.heuristic) {
				options.heuristic = makeEvaluationFunction(options.boardFactors,
					options.pieceFactors);
			}
			return new ludorum.players.AlphaBetaPlayer(options);
		}
	};
})();