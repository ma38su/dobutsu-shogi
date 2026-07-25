export type Side='sente'|'gote'
export type Kind='lion'|'giraffe'|'elephant'|'chick'|'hen'
export type Piece={side:Side;kind:Kind}
export type Move={from?:number;hand?:Kind;to:number;piece:Kind;side:Side;captured?:Kind;promote?:boolean}
export type Position={board:(Piece|null)[];hands:Record<Side,Kind[]>;turn:Side;winner?:Side;reason?:string}

export const V:Record<Kind,number>={lion:1000,giraffe:5,elephant:5,chick:2,hen:7}

export const other=(side:Side):Side=>side==='sente'?'gote':'sente'
export const finalRank=(side:Side)=>side==='sente'?0:3

export function canDrop(kind:Kind,side:Side,row:number){
  return kind!=='chick'||row!==finalRank(side)
}

export function clone(position:Position):Position{
  return{
    ...position,
    board:position.board.map(piece=>piece&&{...piece}),
    hands:{sente:[...position.hands.sente],gote:[...position.hands.gote]},
  }
}

export function positionKey(position:Position):string{
  return JSON.stringify([position.board,[...position.hands.sente].sort(),[...position.hands.gote].sort(),position.turn])
}

export function vec(kind:Kind,side:Side):number[][]{
  const forward=side==='sente'?-1:1
  if(kind==='lion')return[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
  if(kind==='giraffe')return[[-1,0],[0,-1],[0,1],[1,0]]
  if(kind==='elephant')return[[-1,-1],[-1,1],[1,-1],[1,1]]
  if(kind==='chick')return[[forward,0]]
  return[[forward,-1],[forward,0],[forward,1],[0,-1],[0,1],[-forward,0]]
}

export function pseudo(position:Position,side=position.turn):Move[]{
  const moves:Move[]=[]
  position.board.forEach((piece,from)=>{
    if(!piece||piece.side!==side)return
    const row=Math.floor(from/3),column=from%3
    vec(piece.kind,side).forEach(([rowDelta,columnDelta])=>{
      const nextRow=row+rowDelta,nextColumn=column+columnDelta
      if(nextRow<0||nextRow>3||nextColumn<0||nextColumn>2)return
      const to=nextRow*3+nextColumn,target=position.board[to]
      if(target?.side!==side)moves.push({
        from,
        to,
        piece:piece.kind,
        side,
        captured:target?.kind,
        promote:piece.kind==='chick'&&nextRow===finalRank(side),
      })
    })
  })
  position.hands[side].forEach(kind=>position.board.forEach((piece,to)=>{
    const row=Math.floor(to/3)
    if(!piece&&canDrop(kind,side,row))moves.push({hand:kind,to,piece:kind,side})
  }))
  return moves
}

export function attacked(position:Position,square:number,by:Side):boolean{
  return pseudo({...position,hands:{sente:[],gote:[]}},by).some(move=>move.to===square)
}

export function isInCheck(position:Position,side=position.turn):boolean{
  const lion=position.board.findIndex(piece=>piece?.side===side&&piece.kind==='lion')
  return lion>=0&&attacked(position,lion,other(side))
}

export function isCheckmate(position:Position):boolean{
  return isInCheck(position,position.turn)&&legal(position).length===0
}

export function apply(position:Position,move:Move,checkWin=true):Position{
  const next=clone(position),target=next.board[move.to]
  if(move.from!==undefined)next.board[move.from]=null
  else{
    const handIndex=next.hands[move.side].indexOf(move.piece)
    next.hands[move.side].splice(handIndex,1)
  }
  next.board[move.to]={side:move.side,kind:move.promote?'hen':move.piece}
  if(target&&target.kind!=='lion')next.hands[move.side].push(target.kind==='hen'?'chick':target.kind)
  next.turn=other(move.side)
  if(checkWin){
    if(target?.kind==='lion'){
      next.winner=move.side
      next.reason='ライオンをつかまえました'
    }else if(move.piece==='lion'){
      const goal=move.side==='sente'?0:3
      if(Math.floor(move.to/3)===goal&&!attacked(next,move.to,other(move.side))){
        next.winner=move.side
        next.reason='トライに成功しました'
      }
    }
    if(!next.winner&&isCheckmate(next)){
      next.winner=move.side
      next.reason='相手のライオンに王手をかけ、逃げ道をなくしました（詰み）'
    }
  }
  return next
}

export function legal(position:Position):Move[]{
  return pseudo(position).filter(move=>{
    const next=apply(position,move,false)
    const lion=next.board.findIndex(piece=>piece?.side===position.turn&&piece.kind==='lion')
    return lion<0||!attacked(next,lion,other(position.turn))
  })
}

export function score(position:Position,side:Side){
  if(position.winner)return position.winner===side?99999:-99999
  let value=0
  position.board.forEach(piece=>{
    if(piece)value+=(piece.side===side?1:-1)*V[piece.kind]
  })
  ;(['sente','gote']as Side[]).forEach(owner=>position.hands[owner].forEach(kind=>{
    value+=(owner===side?1:-1)*V[kind]*.9
  }))
  return value
}
