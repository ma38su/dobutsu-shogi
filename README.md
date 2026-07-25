# dobutsu-shogi

スマートフォンの縦画面で遊べる、ローカル完結型の将棋ゲームです。

## Features

- 人間・AIを各手番で切り替え可能
- AIの強さを4段階から選択可能
- 棋譜、待った、Undo／Redo、局面からの再開
- PWAとしてインストール可能
- GitHub Pagesで公開可能

## Development

```sh
npm install
npm run dev
```

公開用ファイルは `npm run build` で `dist/` に生成されます。

## Third-party assets

駒の動物画像には Google Noto Emoji を使用しています。詳細は
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)を参照してください。

本プロジェクトは、既存の市販商品・公式アプリおよびその権利者による公式製品ではありません。
