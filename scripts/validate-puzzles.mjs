import assert from 'node:assert/strict'
import { isCheckmate, isInCheck, legal } from '../src/game.ts'
import { applyPuzzle, isPuzzleCheckingMove, puzzleMateDistance, puzzleWinningMoves } from '../src/puzzle-engine.ts'
import { PUZZLES } from '../src/puzzles.ts'

function validateForcedLine(position, attacker, remaining, puzzleId) {
  if (position.winner) {
    assert.equal(position.winner, attacker, `${puzzleId}: defender won on the solution line`)
    const enemyLion = position.board.findIndex(piece => piece?.side !== attacker && piece?.kind === 'lion')
    assert.ok(enemyLion >= 0, `${puzzleId}: capturing the lion must not be accepted as checkmate`)
    assert.equal(isCheckmate(position), true, `${puzzleId}: terminal position is not checkmate`)
    return
  }
  assert.ok(remaining > 0, `${puzzleId}: solution did not finish within the advertised plies`)

  if (position.turn === attacker) {
    const winningMoves = puzzleWinningMoves(position, attacker, remaining)
    assert.ok(winningMoves.length > 0, `${puzzleId}: no checking continuation for the attacker`)
    const move = winningMoves[0]
    assert.equal(isPuzzleCheckingMove(position, move), true, `${puzzleId}: attacker move is not check`)
    validateForcedLine(applyPuzzle(position, move), attacker, remaining - 1, puzzleId)
    return
  }

  const replies = legal(position)
  assert.ok(replies.length > 0, `${puzzleId}: non-terminal defender position has no reply`)
  for (const reply of replies) validateForcedLine(applyPuzzle(position, reply), attacker, remaining - 1, puzzleId)
}

assert.equal(new Set(PUZZLES.map(puzzle => puzzle.id)).size, PUZZLES.length, 'Puzzle IDs must be unique')
assert.equal(PUZZLES.filter(puzzle => puzzle.difficulty === 'starter').length, 10, 'Expected ten one-move puzzles')
assert.equal(PUZZLES.filter(puzzle => puzzle.difficulty === 'stepup').length, 10, 'Expected ten three-move puzzles')
assert.equal(PUZZLES.filter(puzzle => puzzle.difficulty === 'challenge').length, 10, 'Expected ten five-move puzzles')

const previousDiagonalResult = {
  board: [
    { side: 'sente', kind: 'giraffe' }, null, null,
    null, { side: 'sente', kind: 'elephant' }, { side: 'gote', kind: 'lion' },
    { side: 'sente', kind: 'lion' }, { side: 'sente', kind: 'chick' }, null,
    { side: 'sente', kind: 'elephant' }, { side: 'sente', kind: 'giraffe' }, null,
  ],
  hands: { sente: ['chick'], gote: [] },
  turn: 'gote',
  winner: null,
  reason: null,
}
assert.equal(isInCheck(previousDiagonalResult, 'gote'), false, 'Previous diagonal position must not be treated as check')
assert.equal(legal(previousDiagonalResult).length, 0, 'Previous diagonal regression position should still have no legal reply')
assert.equal(isCheckmate(previousDiagonalResult), false, 'Previous diagonal position must not be treated as checkmate')

for (const puzzle of PUZZLES) {
  assert.equal(puzzle.position.turn, 'sente', `${puzzle.id}: attacker must be sente`)
  assert.equal(isInCheck(puzzle.position, 'sente'), false, `${puzzle.id}: attacker starts in check`)
  assert.equal(puzzleMateDistance(puzzle.position, 'sente', puzzle.plies), puzzle.plies, `${puzzle.id}: advertised mate distance is wrong`)
  if (puzzle.plies > 1) assert.equal(puzzleMateDistance(puzzle.position, 'sente', puzzle.plies - 2), null, `${puzzle.id}: a shorter mate exists`)
  assert.equal(puzzleWinningMoves(puzzle.position, 'sente', puzzle.plies).length, 1, `${puzzle.id}: first move must be unique`)
  validateForcedLine(puzzle.position, 'sente', puzzle.plies, puzzle.id)
}

console.log(`Validated ${PUZZLES.length} puzzles: every attacking move checks, and every terminal position is checkmate.`)
