import {apply,legal,type Move,type Position,type Side} from './game'

export type ReviewKind='mate1'|'escape'
export type ReviewMoment={moveIndex:number;position:Position;played:Move;best:Move;goodMoves:Move[];loss:number;kind:ReviewKind}

const movesEqual=(a:Move,b:Move)=>a.to===b.to&&a.from===b.from&&a.hand===b.hand&&a.piece===b.piece

export function immediateWinningMoves(position:Position){
  return position.winner?[]:legal(position).filter(move=>apply(position,move).winner===position.turn)
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

    // The played move lets the opponent win next. This is a suitable question
    // only if exactly one legal alternative removes that immediate loss.
    const escapes=options.filter(move=>{
      const next=apply(position,move)
      return next.winner===played.side||(!next.winner&&!immediateWinningMoves(next).length)
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
