import assert from 'node:assert/strict'
import {chooseAiMove} from '../src/ai-engine.ts'
import {apply,legal,pseudo} from '../src/game.ts'

const sides=[
  {side:'sente',allowedRows:[1,2,3],forbiddenRow:0,aiTarget:9},
  {side:'gote',allowedRows:[0,1,2],forbiddenRow:3,aiTarget:0},
]

for(const {side,allowedRows,forbiddenRow,aiTarget} of sides){
  const emptyPosition={
    board:Array(12).fill(null),
    hands:{sente:[],gote:[]},
    turn:side,
  }
  emptyPosition.hands[side]=['chick']

  const pseudoDrops=pseudo(emptyPosition).filter(move=>move.hand==='chick')
  const legalDrops=legal(emptyPosition).filter(move=>move.hand==='chick')
  for(const row of allowedRows){
    assert.equal(pseudoDrops.filter(move=>Math.floor(move.to/3)===row).length,3,`${side} must be able to drop a chick on row ${row}`)
    assert.equal(legalDrops.filter(move=>Math.floor(move.to/3)===row).length,3,`${side} legal moves must include chick drops on row ${row}`)
  }
  assert.equal(pseudoDrops.some(move=>Math.floor(move.to/3)===forbiddenRow),false,`${side} must not drop a chick on its final rank`)
  assert.equal(legalDrops.some(move=>Math.floor(move.to/3)===forbiddenRow),false,`${side} legal moves must reject a dead chick drop`)

  const drop=pseudoDrops.find(move=>move.to===aiTarget)
  assert.ok(drop,`${side} must have the expected edge-rank drop`)
  const afterDrop=apply(emptyPosition,drop)
  assert.deepEqual(afterDrop.board[aiTarget],{side,kind:'chick'})
  assert.deepEqual(afterDrop.hands[side],[])

  const aiPosition={
    board:Array.from({length:12},(_,index)=>index===aiTarget?null:{side:side==='sente'?'gote':'sente',kind:'chick'}),
    hands:{sente:[],gote:[]},
    turn:side,
  }
  aiPosition.hands[side]=['chick']
  const aiLegalMoves=legal(aiPosition)
  assert.equal(aiLegalMoves.length,1,`${side} AI fixture must have exactly one legal move`)
  assert.equal(aiLegalMoves[0].to,aiTarget)
  assert.equal(aiLegalMoves[0].hand,'chick')
  const aiMove=chooseAiMove(aiPosition,2).move
  assert.ok(aiMove,`${side} AI must find the edge-rank chick drop`)
  assert.equal(aiMove.to,aiTarget)
  assert.equal(aiMove.hand,'chick')
}

console.log('Validated chick drops for both sides, including legal generation, application, and AI selection.')
