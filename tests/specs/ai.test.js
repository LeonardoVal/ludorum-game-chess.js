define(['creatartis-base', 'sermat', 'ludorum', 'ludorum-game-chess'],
function (base, Sermat, ludorum, ludorum_game_chess) {
	var ai = ludorum_game_chess.ai;

	describe("ai", function () {
		it(".heuristic1", function () {
			expect(typeof ai.heuristic1).toBe('object');
			expect(typeof ai.heuristic1.makeEvaluationFunction).toBe('function');

			var evalFunc = ai.heuristic1.makeEvaluationFunction(),
				game = new ludorum_game_chess.Chess(),
				gameEval = evalFunc(game, game.activePlayer());
			expect(typeof gameEval).toBe('number');
			expect(gameEval).toBeLessThan(1);
			expect(gameEval).toBeGreaterThan(-1);
		}); // it ".heuristic1"
	}); // describe "ai"
}); //// define.
