import type {Kind,Piece,Position} from './game.ts'

export type PuzzleDifficulty='starter'|'stepup'|'challenge'
export type PuzzleDefinition={
  id:string
  difficulty:PuzzleDifficulty
  title:string
  mission:string
  plies:1|3|5
  position:Position
}

const sente=(kind:Kind):Piece=>({side:'sente',kind})
const gote=(kind:Kind):Piece=>({side:'gote',kind})
const puzzle=(id:string,difficulty:PuzzleDifficulty,title:string,mission:string,plies:1|3|5,board:(Piece|null)[],senteHand:Kind[]=[],goteHand:Kind[]=[]):PuzzleDefinition=>({
  id,
  difficulty,
  title,
  mission,
  plies,
  position:{board,hands:{sente:senteHand,gote:goteHand},turn:'sente'},
})

export const PUZZLES:PuzzleDefinition[]=[
  puzzle('starter-1','starter','まんなかを ふさごう','もちごまを使って、王手と逃げ道封鎖を同時に決めよう',1,[gote('giraffe'),gote('lion'),null,null,null,sente('chick'),gote('giraffe'),sente('elephant'),sente('lion'),null,null,null],['chick','elephant']),
  puzzle('starter-2','starter','みぎから おさえよう','右側から王手をかけて、すべての逃げ道をなくそう',1,[null,gote('giraffe'),gote('lion'),gote('giraffe'),null,null,null,null,sente('lion'),null,null,null],['chick','elephant']),
  puzzle('starter-3','starter','ななめの いって','斜めに動く駒で王手をかけ、ライオンを詰ませよう',1,[gote('giraffe'),null,gote('elephant'),null,sente('chick'),gote('lion'),sente('lion'),null,null,sente('elephant'),null,sente('giraffe')]),
  puzzle('starter-4','starter','もちごまの 王手','まっすぐ動く持ち駒を、王手になる場所へ置こう',1,[gote('lion'),null,null,sente('elephant'),gote('elephant'),null,null,sente('lion'),null,null,null,null],['chick','giraffe']),
  puzzle('starter-5','starter','パワーアップで 詰み','いちばん奥へ進み、成った駒の動きで詰ませよう',1,[null,null,gote('lion'),null,sente('chick'),sente('elephant'),null,null,sente('lion'),null,gote('giraffe'),null],['chick']),
  puzzle('starter-6','starter','取って 王手','相手の駒を取りながら、ライオンへ王手をかけよう',1,[gote('lion'),null,gote('elephant'),gote('giraffe'),null,sente('elephant'),sente('chick'),sente('lion'),null,gote('hen'),null,null]),
  puzzle('starter-7','starter','たての もちごま','まっすぐ進む持ち駒を、ライオンの横へ打って詰ませよう',1,[gote('lion'),null,sente('hen'),gote('chick'),gote('chick'),null,null,null,sente('hen'),sente('lion'),null,gote('giraffe')],['giraffe','chick']),
  puzzle('starter-8','starter','ちゅうおうへ ななめ','斜めの駒を中央へ動かし、離れた場所から王手をかけよう',1,[gote('lion'),null,null,sente('elephant'),null,null,null,sente('lion'),sente('elephant'),null,null,null]),
  puzzle('starter-9','starter','守りを 取って','王手をじゃまする守り駒を取りながら、逃げ道も閉じよう',1,[gote('elephant'),gote('lion'),null,null,null,gote('giraffe'),null,sente('hen'),sente('hen'),null,sente('lion'),null],[],['elephant']),
  puzzle('starter-10','starter','いっぽ前の 王手','まっすぐ動く駒を一歩進めて、前と横の逃げ道を押さえよう',1,[gote('lion'),gote('chick'),null,null,null,null,sente('giraffe'),sente('lion'),null,null,null,null]),
  puzzle('stepup-1','stepup','取って 追いかけよう','守りの駒を取り、相手の返しにも王手を続けよう',3,[gote('lion'),null,gote('elephant'),gote('giraffe'),gote('chick'),null,sente('chick'),sente('elephant'),null,null,sente('lion'),null]),
  puzzle('stepup-2','stepup','ななめの 連続王手','持ち駒の斜めの動きから、次の王手へつなげよう',3,[null,null,sente('giraffe'),gote('lion'),null,null,gote('chick'),sente('giraffe'),null,null,null,sente('lion')],['chick','elephant']),
  puzzle('stepup-3','stepup','強い駒で はさもう','成った駒の広い動きで、逃げ先をしぼろう',3,[sente('giraffe'),null,sente('hen'),null,gote('lion'),null,null,null,gote('chick'),null,sente('lion'),sente('giraffe')],[],['elephant','elephant']),
  puzzle('stepup-4','stepup','取って パワーアップ','相手の駒を取りながら成り、広がった動きで次の王手へつなごう',3,[gote('lion'),gote('chick'),null,null,sente('chick'),sente('elephant'),null,null,null,null,sente('lion'),null],['chick'],['chick']),
  puzzle('stepup-5','stepup','ぞうで 道をあける','斜めの駒で守りを取り、相手を呼び込んで最後の王手を決めよう',3,[gote('lion'),null,gote('hen'),null,gote('hen'),sente('hen'),sente('elephant'),sente('chick'),null,sente('lion'),null,null],['elephant'],['elephant']),
  puzzle('stepup-6','stepup','ななめから まっすぐ','斜めの王手で移動先を決め、最後は持ち駒でまっすぐ押さえよう',3,[null,gote('giraffe'),null,sente('chick'),null,gote('lion'),null,null,null,sente('elephant'),sente('lion'),null],['giraffe']),
  puzzle('stepup-7','stepup','守りを もちごまに','守りの駒を取って逃げ道を減らし、持ち駒の王手で仕上げよう',3,[null,gote('lion'),null,null,gote('giraffe'),null,sente('lion'),sente('giraffe'),gote('chick'),null,null,null],['giraffe','elephant'],['chick','chick']),
  puzzle('stepup-8','stepup','取り合いの あと','相手に取り返させる手順を読み、その直後の持ち駒で詰ませよう',3,[gote('lion'),gote('hen'),null,gote('giraffe'),sente('giraffe'),null,sente('giraffe'),null,sente('lion'),null,null,null],['giraffe','chick']),
  puzzle('stepup-9','stepup','上から おさえて打つ','盤上の駒で上から追い、逃げた先へ小さな持ち駒を打とう',3,[null,sente('giraffe'),null,null,null,gote('lion'),null,sente('chick'),null,sente('lion'),sente('hen'),null],['chick']),
  puzzle('stepup-10','stepup','打って 取らせる','持ち駒をあえて取らせ、空いた場所へ別の駒を進めよう',3,[gote('hen'),gote('lion'),null,null,null,null,sente('lion'),sente('hen'),null,null,null,null],['giraffe','elephant'],['chick','chick']),
  puzzle('challenge-1','challenge','守りを くずそう','守りの駒を取りながら、5手の連続王手で追い詰めよう',5,[gote('giraffe'),gote('lion'),gote('elephant'),sente('chick'),null,sente('giraffe'),null,sente('elephant'),null,null,sente('lion'),null],['chick']),
  puzzle('challenge-2','challenge','もちごまから 連続王手','持ち駒を起点に、相手の応手を最後まで読み切ろう',5,[null,gote('lion'),null,null,null,sente('chick'),gote('elephant'),sente('giraffe'),sente('lion'),null,null,null],['chick','giraffe']),
  puzzle('challenge-3','challenge','さいごの 包囲網','盤上の駒をつないで、5手の王手を続けよう',5,[null,null,gote('lion'),gote('chick'),null,null,null,sente('elephant'),sente('giraffe'),null,null,sente('lion')],['giraffe','elephant'],['chick','chick']),
  puzzle('challenge-4','challenge','三つの駒の リレー','持ち駒、盤上の長い駒、小さな駒へ王手を受け渡そう',5,[null,null,gote('lion'),sente('giraffe'),null,null,null,null,sente('chick'),sente('lion'),null,null],['giraffe']),
  puzzle('challenge-5','challenge','盤上だけの 追撃','持ち駒を使わず、盤上の二つの駒で逃げるライオンを追い続けよう',5,[null,null,gote('lion'),sente('lion'),null,null,null,null,sente('chick'),null,sente('hen'),null]),
  puzzle('challenge-6','challenge','取った駒で ふさぐ','最初に取った駒を持ち駒として使い、次の逃げ道を封鎖しよう',5,[null,gote('lion'),sente('elephant'),null,gote('giraffe'),gote('giraffe'),null,sente('chick'),sente('hen'),sente('lion'),null,null]),
  puzzle('challenge-7','challenge','打って取り また打つ','持ち駒で追い、守りを取って増えた駒を最後にもう一度打とう',5,[null,gote('lion'),null,sente('giraffe'),null,gote('giraffe'),null,sente('lion'),null,null,null,null],['giraffe'],['elephant','chick']),
  puzzle('challenge-8','challenge','成り駒を おとりに','駒を取りながら成り、その成り駒を取らせて斜めの連続王手へつなごう',5,[gote('elephant'),gote('lion'),null,sente('chick'),null,null,null,sente('elephant'),sente('elephant'),null,sente('lion'),null],['elephant'],['giraffe']),
  puzzle('challenge-9','challenge','三つの ななめ包囲','三つの斜め駒を順番に動かし、逃げる方向を一つずつ消そう',5,[sente('elephant'),null,gote('lion'),null,null,null,null,sente('elephant'),sente('lion'),sente('elephant'),null,null],[],['elephant','giraffe']),
  puzzle('challenge-10','challenge','取ったひよこを 打つ','相手の小さな駒を取り、持ち駒にしてすぐ次の王手へ活用しよう',5,[gote('lion'),gote('chick'),sente('giraffe'),gote('chick'),null,null,null,sente('chick'),sente('chick'),null,sente('lion'),null],['giraffe'],['chick']),
]

export const PUZZLE_LEVELS:Record<PuzzleDifficulty,{label:string;short:string;description:string;plies:1|3|5}>={
  starter:{label:'はじめて',short:'1手詰め',description:'王手と逃げ道を一手で確認しよう',plies:1},
  stepup:{label:'ステップアップ',short:'3手詰め',description:'相手の返しにも王手を続けよう',plies:3},
  challenge:{label:'チャレンジ',short:'5手詰め',description:'連続王手を最後まで読み切ろう',plies:5},
}
