define(['creatartis-base', 'sermat', 'ludorum', 'ludorum-game-chess'],
function (base, Sermat, ludorum, ludorum_game_chess) {
	var ai = ludorum_game_chess.ai;

	describe("ai", function () {
		it(".heuristic1", function () {
			expect(typeof ai.heuristic1).toBe('object');
			expect(typeof ai.heuristic1.makeEvaluationFunction).toBe('function');

			var evalFunc = ai.heuristic1.makeEvaluationFunction(),
				game = new ludorum_game_chess.Chess();
			['', 'e4','e5','f4','Nc6'].forEach(function (move) {
				if (move) {
					game = game.perform(move);
				}
				var whiteEval = evalFunc(game, game.players[0]),
					blackEval = evalFunc(game, game.players[1]);
				[whiteEval, blackEval].forEach(function (eval) {
					expect(typeof eval).toBe('number');
					expect(eval).toBeLessThan(1);
					expect(eval).toBeGreaterThan(-1);
				});
				expect(whiteEval).toBe(-blackEval);
			});
		}); // it ".heuristic1"
	}); // describe "ai"
}); //// define.
