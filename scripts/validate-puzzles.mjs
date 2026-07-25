import assert from 'node:assert/strict'
import { clone, isCheckmate, isInCheck, legal } from '../src/game.ts'
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
    if (remaining > 1) assert.equal(winningMoves.length, 1, `${puzzleId}: an unintended attacking continuation exists before the final move`)
    if (remaining === 1) {
      const finalMoveSources = new Set(winningMoves.map(move => `${move.piece}:${move.hand ?? ''}:${move.from ?? ''}`))
      assert.equal(finalMoveSources.size, 1, `${puzzleId}: final moves use different pieces instead of equivalent destinations`)
    }
    const move = winningMoves[0]
    assert.equal(isPuzzleCheckingMove(position, move), true, `${puzzleId}: attacker move is not check`)
    validateForcedLine(applyPuzzle(position, move), attacker, remaining - 1, puzzleId)
    return
  }

  const replies = legal(position)
  assert.ok(replies.length > 0, `${puzzleId}: non-terminal defender position has no reply`)
  for (const reply of replies) validateForcedLine(applyPuzzle(position, reply), attacker, remaining - 1, puzzleId)
}

function sameMove(a, b) {
  return a?.from === b?.from
    && a?.hand === b?.hand
    && a?.to === b?.to
    && a?.piece === b?.piece
    && a?.promote === b?.promote
}

function preservesPuzzle(puzzle, position, originalFirstMove) {
  if (isInCheck(position, 'sente')) return false
  if (puzzleMateDistance(position, 'sente', puzzle.plies) !== puzzle.plies) return false
  if (puzzle.plies > 1 && puzzleMateDistance(position, 'sente', puzzle.plies - 2) !== null) return false
  const firstMoves = puzzleWinningMoves(position, 'sente', puzzle.plies)
  return firstMoves.length === 1 && sameMove(firstMoves[0], originalFirstMove)
}

assert.equal(new Set(PUZZLES.map(puzzle => puzzle.id)).size, PUZZLES.length, 'Puzzle IDs must be unique')
assert.ok(PUZZLES.filter(puzzle => puzzle.difficulty === 'starter').length >= 10, 'Expected at least ten one-move puzzles')
assert.ok(PUZZLES.filter(puzzle => puzzle.difficulty === 'stepup').length >= 10, 'Expected at least ten three-move puzzles')
assert.ok(PUZZLES.filter(puzzle => puzzle.difficulty === 'challenge').length >= 10, 'Expected at least ten five-move puzzles')

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
  const firstMoves = puzzleWinningMoves(puzzle.position, 'sente', puzzle.plies)
  assert.equal(firstMoves.length, 1, `${puzzle.id}: first move must be unique`)
  validateForcedLine(puzzle.position, 'sente', puzzle.plies, puzzle.id)

  const checkingSources = new Set(legal(puzzle.position)
    .filter(move => move.from !== undefined && isPuzzleCheckingMove(puzzle.position, move))
    .map(move => move.from))
  puzzle.position.board.forEach((piece, index) => {
    if (piece?.side !== 'sente' || piece.kind === 'lion' || checkingSources.has(index)) return
    const reduced = clone(puzzle.position)
    reduced.board[index] = null
    assert.equal(
      preservesPuzzle(puzzle, reduced, firstMoves[0]),
      false,
      `${puzzle.id}: sente ${piece.kind} at board index ${index} is an unnecessary decoration`,
    )
  })
}

console.log(`Validated ${PUZZLES.length} puzzles: checking lines, checkmates, intended continuations, and board-piece economy are sound.`)
