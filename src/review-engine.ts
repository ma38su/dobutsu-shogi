import {apply,legal,other,positionKey,type Move,type Position,type Side} from './game'

export type ReviewKind='mate1'|'escape'
export type ReviewMoment={moveIndex:number;position:Position;played:Move;best:Move;goodMoves:Move[];loss:number;kind:ReviewKind}

const movesEqual=(a:Move,b:Move)=>a.to===b.to&&a.from===b.from&&a.hand===b.hand&&a.piece===b.piece

export function immediateWinningMoves(position:Position){
  return position.winner?[]:legal(position).filter(move=>apply(position,move).winner===position.turn)
}

const SURVIVAL_PLIES=5

function forcedWinDistance(position:Position,attacker:Side,depth:number,cache:Map<string,number|null>):number|null{
  if(position.winner)return position.winner===attacker?0:null
  if(depth<=0)return null

  const key=`${positionKey(position)}|${attacker}|${depth}`
  if(cache.has(key))return cache.get(key)??null

  const moves=legal(position)
  if(!moves.length){
    cache.set(key,null)
    return null
  }

  const distances=moves.map(move=>forcedWinDistance(apply(position,move),attacker,depth-1,cache))
  let result:number|null=null
  if(position.turn===attacker){
    const wins=distances.filter((distance):distance is number=>distance!==null)
    if(wins.length)result=1+Math.min(...wins)
  }else if(distances.every((distance):distance is number=>distance!==null)){
    result=1+Math.max(...distances)
  }
  cache.set(key,result)
  return result
}

/**
 * A review question must have one objectively forced answer.
 *
 * Static evaluation scores are intentionally not used here. They are useful for
 * choosing an AI move, but a small score difference is not enough to teach a
 * child that one legal move is "the answer".
 */
export function buildReview(history:Position[],moves:Move[],players:Record<Side,'human'|'ai'>){
  const moments:ReviewMoment[]=[]
  const forcedWinCache=new Map<string,number|null>()

  moves.forEach((played,index)=>{
    const position=history[index]
    if(!position||position.winner||players[played.side]!=='human')return

    const options=legal(position)
    const actualMove=options.find(move=>movesEqual(move,played))
    if(!actualMove)return

    // Only ask about a missed win when exactly one move wins immediately.
    const winningMoves=immediateWinningMoves(position)
    if(winningMoves.length===1&&!movesEqual(actualMove,winningMoves[0])){
      moments.push({
        moveIndex:index,
        position,
        best:winningMoves[0],
        played,
        loss:99999,
        goodMoves:winningMoves,
        kind:'mate1',
      })
      return
    }

    const afterPlayed=apply(position,actualMove)
    if(!immediateWinningMoves(afterPlayed).length)return

    // The played move lets the opponent win next. Merely postponing that loss
    // is not a useful lesson, so an alternative must also survive a deeper
    // forced-win search. Only one such alternative may exist.
    const escapes=options.filter(move=>{
      const next=apply(position,move)
      return next.winner===played.side
        ||(!next.winner&&forcedWinDistance(next,other(played.side),SURVIVAL_PLIES,forcedWinCache)===null)
    })
    if(escapes.length!==1)return

    moments.push({
      moveIndex:index,
      position,
      best:escapes[0],
      played,
      loss:90000,
      goodMoves:escapes,
      kind:'escape',
    })
  })

  return moments.slice(-3).sort((a,b)=>a.moveIndex-b.moveIndex)
}
