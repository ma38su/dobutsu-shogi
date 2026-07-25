# おかししょうぎ・さむらいしょうぎ

[![Deploy to GitHub Pages](https://github.com/ma38su/dobutsu-shogi/actions/workflows/deploy.yml/badge.svg)](https://github.com/ma38su/dobutsu-shogi/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-あそぶ-2ea44f?logo=github)](https://ma38su.github.io/dobutsu-shogi/)
[![Node.js 22](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232a)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

スマートフォンの縦画面を中心に、ブラウザ上で手軽に遊べるローカル完結型のミニ将棋です。
共通のルールとAIを使い、駒や盤面の世界観が異なる2種類のゲームを収録しています。

## あそぶ

**[ゲームを開く](https://ma38su.github.io/dobutsu-shogi/)**

- [おかししょうぎ](https://ma38su.github.io/dobutsu-shogi/okashi/): 和菓子・洋菓子・和洋MIXの駒で遊べます。PWAとして端末へのインストールにも対応しています。
- [さむらいしょうぎ](https://ma38su.github.io/dobutsu-shogi/samurai/): 侍をテーマにした駒と戦場の盤面で遊べます。

トップページから、どちらのゲームで遊ぶか選択できます。

## 主な機能

- 先手・後手それぞれを人間またはAIに切り替え可能
- 「対局」と「詰将棋」を分けたモード選択画面
- おかししょうぎ・さむらいしょうぎの両方で遊べる全12問の詰将棋
- 「1手詰め」「3手詰め」「5手詰め」の難易度別問題一覧とクリア記録
- 段階式ヒント、誤答案内、相手の自動応手に対応した詰将棋プレイ画面
- AIの強さを「やさしい」から「とてもつよい」まで4段階で選択可能
- 通常モードと、不正な移動先を案内する入門モード
- 棋譜の表示と、任意の手数への移動
- 待った、Undo／Redo、過去の局面からの指し直し
- ライオンの捕獲、トライ、詰みによる勝敗判定
- 対局後の端末内解析と、キャラクターが出題する対話型のおさらい
- 盤上で答えるヒント付きの振り返り問題と、端末音声による読み上げ
- Web Worker内で実行され、端末内で完結する対局AI
- Androidスマートフォン、iPad、iPad Proの縦画面で、対局・詰将棋プレイをスクロールなしで操作できるレスポンシブUI
- おかししょうぎ・さむらいしょうぎのPWA・オフライン対応
- GitHub ActionsによるGitHub Pagesへの自動デプロイ

### おかししょうぎ固有の設定

- 駒を「和菓子」「洋菓子」「和洋MIX」から選択
- 盤を「おかし箱」「木の盤」「若草」「墨色」から選択
- 洋菓子では、基本駒にマカロン、斜めに動く駒にカップケーキを使用
- ドーナツ、ロリポップ、旧ジェリービーンズの画像は、将来の差し替え候補として`public/pieces/candidates/`へ保存

## 詰将棋モード

おかししょうぎ・さむらいしょうぎの各ゲーム画面で、最初に「対局する」または「詰将棋に挑戦」を選べます。詰将棋では下側の先手を操作し、指定された手数で相手のライオン／大将へ王手をかけ、合法な応手がない局面まで追い詰めます。駒の捕獲や、対局で使われる「トライ」だけでは詰将棋の正解になりません。

| 難易度 | 手数 | 問題数 | 内容 |
| --- | ---: | ---: | --- |
| はじめて | 1手詰め | 6問 | 王手と逃げ道を一手で確認する |
| ステップアップ | 3手詰め | 3問 | 相手の応手を読んで追い詰める |
| チャレンジ | 5手詰め | 3問 | 最後まで詰みの手順を読み切る |

- 相手の手は自動で進み、どの合法手で逃げても詰む手順だけが正解になります。
- 間違えた手は盤面へ反映されず、その場で別の手を試せます。
- ヒントは「動かす駒」「行き先」の2段階で表示できます。
- 正解後はクリア画面から次の問題へ進み、難易度をまたいで全12問を続けて遊べます。
- 全12問のクリア状況はブラウザ内へ保存され、おかししょうぎ・さむらいしょうぎごとに記録されます。
- おかししょうぎでは、詰将棋の問題一覧から駒の種類を変更できます。

収録問題はゲームエンジンで、すべての攻め方の手が王手であること、最終局面が「王手かつ合法な応手なし」であること、手数、初手の一意性を自動検証しています。問題や相手の応手の計算に外部通信は使用しません。

## ルール概要

3×4マスの盤を使用します。ライオンを捕まえるか、相手陣の最奥へ安全に到達する「トライ」に成功すると勝ちです。取った駒は自分の持ち駒として使用できます。ひよこは相手陣の最奥へ進むと、にわとり／若武者に成ります。

通常モードで駒の動きとして可能でもライオンが取られる手を選ぶと、反則負けになります。入門モードでは、そのような移動先をあらかじめ画面上で案内します。

## 開発

### 必要な環境

- Node.js 22
- npm

### セットアップ

```sh
git clone git@github.com:ma38su/dobutsu-shogi.git
cd dobutsu-shogi
npm ci
npm run dev
```

開発サーバーの表示するURLをブラウザで開いてください。通常は次のURLです。

- ランチャー: `http://localhost:5173/`
- おかししょうぎ: `http://localhost:5173/okashi/`
- さむらいしょうぎ: `http://localhost:5173/samurai/`

### npm scripts

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | Vite開発サーバーを起動 |
| `npm run build` | TypeScriptの型チェック後、公開用ファイルを`dist/`へ生成 |
| `npm run lint` | oxlintでソースコードを検査 |
| `npm test` | Playwrightで画面表示・両ゲームの基本操作・AI応手・詰将棋を検査 |
| `npm run check` | lint・ビルド・ブラウザテストをまとめて実行 |
| `npm run preview` | ビルド結果をローカルでプレビュー |

初回だけ、ブラウザテスト用のChromiumをインストールしてください。

```sh
npx playwright install chromium
```

Pull Requestでは `Health Check`、`main` ブランチへのpushではデプロイ前の健全性チェックとして自動実行されます。

## 技術構成

- React 19
- TypeScript 6
- Vite 8
- oxlint
- React Compiler
- Web Worker（AI探索）
- Service Worker / Web App Manifest（おかししょうぎ）
- GitHub Actions / GitHub Pages

ゲームの状態とAIはクライアント側で処理され、対局のためのバックエンドAPIや外部通信は使用しません。対局AIの探索はWeb Workerへ分離されているため、思考中も画面のメインスレッドを占有しません。

PWA用の各HTMLにはビルド時に画面表示用のJavaScriptとCSSを内包し、Service Workerの範囲外にある共有ファイルへ依存せずオフライン起動できるようにしています。AI Workerも各アプリの配下へ複製されます。

## AIエンジン

対局AIは固定深度のミニマックス法とαβ枝刈りで実装されています。機械学習や外部AIサービスは使用していません。

| 強さ | 探索 |
| --- | --- |
| やさしい | 合法手からランダムに選択 |
| ふつう | 2手探索 |
| つよい | 4手探索 |
| とてもつよい | 5手探索 |

探索には次の最適化を適用しています。

- ルート候補間でα値を共有し、後続候補の不要な応手を枝刈り
- 同一局面の再計算を避ける置換表（思考ごとに生成）
- 置換表の最善手、即勝ち、駒取り、成り、ライオンへの攻撃を優先する手の並べ替え
- 勝てる場合は最短の勝ち、負ける場合は最長の抵抗を選ぶ詰み距離評価

詰将棋では、攻め方が最短手順を選び、受け方が最長まで抵抗するAND/OR探索によって、指定手数内の必至の詰みと初手を検証します。

開発サーバーでは、対局画面の「AIのつよさ」の下に開発用の探索情報を表示します。探索局面数、置換表ヒット数、αβカット回数、到達深度、思考時間、評価値、選択手を確認できます。この表示は本番ビルドには出ません。

## ディレクトリ構成

```text
.
├── src/
│   ├── App.tsx             # Reactの画面・対局状態・ユーザー操作
│   ├── game.ts             # 局面型、駒の動き、合法手、勝敗、評価関数
│   ├── ai-engine.ts        # αβ探索、置換表、手の並べ替え、探索統計
│   ├── ai.worker.ts        # 対局AIを実行するWeb Worker
│   ├── puzzle-engine.ts    # 詰将棋の手順・詰み距離探索
│   ├── review-engine.ts    # 対局後のおさらい解析
│   ├── Launcher.tsx        # ゲーム選択画面
│   └── *.css               # 各画面のスタイル
├── public/
│   ├── pieces/             # 駒の画像素材と差し替え候補
│   ├── okashi/             # おかししょうぎのPWA設定と専用アイコン
│   └── samurai/            # さむらいしょうぎのPWA設定と専用アイコン
├── okashi/index.html       # おかししょうぎのエントリーポイント
├── samurai/index.html      # さむらいしょうぎのエントリーポイント
├── vite.config.ts          # 複数ページのビルド設定
└── .github/workflows/
    └── deploy.yml          # GitHub Pagesへのデプロイ
```

## GitHub Pagesへのデプロイ

`main`ブランチへpushすると、[Deploy to GitHub Pages](https://github.com/ma38su/dobutsu-shogi/actions/workflows/deploy.yml)ワークフローが次の処理を行います。

1. `npm ci`で依存関係をインストール
2. lint・TypeScriptビルド・両ゲームのブラウザテストを実行
3. 生成物をGitHub Pagesへデプロイ

GitHubのリポジトリ設定では、PagesのSourceを **GitHub Actions** に設定してください。ワークフローはGitHubのActions画面から手動実行することもできます。

- 公開先: <https://ma38su.github.io/dobutsu-shogi/>
- ソースコード: <https://github.com/ma38su/dobutsu-shogi>
- デプロイ状況: <https://github.com/ma38su/dobutsu-shogi/actions/workflows/deploy.yml>

## 権利について

本プロジェクトは、既存の市販商品・公式アプリおよびその権利者が提供・承認する公式製品ではありません。
