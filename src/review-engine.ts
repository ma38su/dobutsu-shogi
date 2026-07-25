import {V,apply,attacked,legal,other,score,type Move,type Position,type Side} from './game'

export type ReviewKind='praise'|'mate1'|'escape'|'capture'|'try'|'safety'|'choice'
export type ReviewMoment={moveIndex:number;position:Position;played:Move;best:Move;goodMoves:Move[];loss:number;kind:ReviewKind}

const movesEqual=(a:Move,b:Move)=>a.to===b.to&&a.from===b.from&&a.hand===b.hand&&a.piece===b.piece

function reviewScore(position:Position,root:Side){
  let value=score(position,root)
  if(Math.abs(value)>90000)return value
  position.board.forEach((piece,index)=>{
    if(!piece)return
    const sign=piece.side===root?1:-1,row=Math.floor(index/3)
    if(piece.kind==='lion'){
      const progress=piece.side==='sente'?3-row:row
      value+=sign*progress*.55
    }
    if(piece.kind!=='lion'&&attacked(position,index,other(piece.side)))value-=sign*V[piece.kind]*.22
  })
  return value
}

function reviewSearch(position:Position,depth:number,root:Side,alpha=-Infinity,beta=Infinity):number{
  if(!depth||position.winner)return reviewScore(position,root)
  const moves=legal(position)
  if(!moves.length)return position.turn===root?-90000:90000
  if(position.turn===root){
    let value=-Infinity
    for(const move of moves){
      value=Math.max(value,reviewSearch(apply(position,move),depth-1,root,alpha,beta))
      alpha=Math.max(alpha,value)
      if(beta<=alpha)break
    }
    return value
  }
  let value=Infinity
  for(const move of moves){
    value=Math.min(value,reviewSearch(apply(position,move),depth-1,root,alpha,beta))
    beta=Math.min(beta,value)
    if(beta<=alpha)break
  }
  return value
}

export function immediateWinningMoves(position:Position){
  return position.winner?[]:legal(position).filter(move=>apply(position,move).winner===position.turn)
}

function reviewKind(position:Position,played:Move,best:Move,loss:number):ReviewKind{
  if(loss<.55)return'praise'
  const after=apply(position,played)
  if(best.captured&&!played.captured)return'capture'
  const goal=position.turn==='sente'?0:3
  if(best.piece==='lion'&&Math.floor(best.to/3)===goal)return'try'
  if(attacked(after,played.to,other(position.turn)))return'safety'
  return'choice'
}

export function buildReview(history:Position[],moves:Move[],players:Record<Side,'human'|'ai'>){
  const moments:ReviewMoment[]=[]
  moves.forEach((played,index)=>{
    const position=history[index]
    if(!position||position.winner||players[played.side]!=='human')return
    const options=legal(position)
    const actualMove=options.find(move=>movesEqual(move,played))
    if(!actualMove)return
    const afterPlayed=apply(position,actualMove)
    const mateInOne=immediateWinningMoves(position)
    if(mateInOne.length&&afterPlayed.winner!==played.side){
      moments.push({moveIndex:index,position,best:mateInOne[0],played,loss:99999,goodMoves:mateInOne,kind:'mate1'})
      return
    }
    const opponentWins=immediateWinningMoves(afterPlayed)
    const escapes=opponentWins.length?options.filter(move=>{
      const next=apply(position,move)
      return next.winner===played.side||(!next.winner&&!immediateWinningMoves(next).length)
    }):[]
    if(opponentWins.length&&escapes.length){
      const rankedEscapes=escapes.map(move=>({move,value:reviewSearch(apply(position,move),2,played.side)})).sort((a,b)=>b.value-a.value)
      moments.push({moveIndex:index,position,best:rankedEscapes[0].move,played,loss:90000,goodMoves:escapes,kind:'escape'})
      return
    }
    const ranked=options.map(move=>({move,value:reviewSearch(apply(position,move),2,played.side)})).sort((a,b)=>b.value-a.value)
    const actual=ranked.find(item=>movesEqual(item.move,played))
    if(!actual||!ranked[0])return
    const loss=Math.max(0,ranked[0].value-actual.value),best=loss<.55?played:ranked[0].move
    moments.push({moveIndex:index,position,best,played,loss,goodMoves:ranked.filter(item=>ranked[0].value-item.value<.55).map(item=>item.move),kind:reviewKind(position,played,best,loss)})
  })
  const tactical=moments.filter(moment=>moment.kind==='mate1'||moment.kind==='escape').slice(-3).sort((a,b)=>a.moveIndex-b.moveIndex)
  const useful=moments.filter(moment=>moment.loss>=.55&&moment.kind!=='mate1'&&moment.kind!=='escape').sort((a,b)=>b.loss-a.loss)
  const picked:ReviewMoment[]=[...tactical]
  for(const moment of useful){
    if(picked.length===3)break
    if(picked.every(item=>Math.abs(item.moveIndex-moment.moveIndex)>1))picked.push(moment)
  }
  if(!picked.length)return moments.filter(moment=>moment.kind==='praise').slice(-2)
  if(tactical.length)return[...tactical,...picked.filter(moment=>moment.kind!=='mate1'&&moment.kind!=='escape').sort((a,b)=>a.moveIndex-b.moveIndex)]
  return picked.sort((a,b)=>a.moveIndex-b.moveIndex)
}
