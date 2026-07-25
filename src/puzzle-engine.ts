import {apply,isCheckmate,isInCheck,legal,positionKey,type Move,type Position,type Side} from './game.ts'

const distanceCache=new Map<string,number|null>()

export function applyPuzzle(position:Position,move:Move){
  const target=position.board[move.to],next=apply(position,move,false)
  if(target?.kind==='lion'){
    next.winner=move.side
    next.reason='相手のライオンをつかまえました'
  }else if(isCheckmate(next)){
    next.winner=move.side
    next.reason='相手のライオンに王手をかけ、逃げ道をなくしました'
  }
  return next
}

export function isPuzzleCheckingMove(position:Position,move:Move){
  const next=applyPuzzle(position,move)
  return isInCheck(next,next.turn)
}

export function puzzleMateDistance(position:Position,attacker:Side,depth:number):number|null{
  if(position.winner)return position.winner===attacker?0:null
  if(depth<=0)return null
  const cacheKey=`${positionKey(position)}|${attacker}|${depth}`,cached=distanceCache.get(cacheKey)
  if(cached!==undefined||distanceCache.has(cacheKey))return cached??null
  const moves=legal(position)
  let result:number|null=null
  if(position.turn===attacker){
    const wins=moves.filter(move=>isPuzzleCheckingMove(position,move)).map(move=>puzzleMateDistance(applyPuzzle(position,move),attacker,depth-1)).filter((distance):distance is number=>distance!==null)
    if(wins.length)result=1+Math.min(...wins)
  }else{
    const replies=moves.map(move=>puzzleMateDistance(applyPuzzle(position,move),attacker,depth-1))
    if(replies.length&&replies.every((distance):distance is number=>distance!==null))result=1+Math.max(...replies)
  }
  distanceCache.set(cacheKey,result)
  return result
}

export function puzzleWinningMoves(position:Position,attacker:Side,remaining:number){
  return legal(position).filter(move=>isPuzzleCheckingMove(position,move)).filter(move=>{
    const distance=puzzleMateDistance(applyPuzzle(position,move),attacker,remaining-1)
    return distance!==null&&distance<=remaining-1
  })
}
