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
- おかししょうぎ・さむらいしょうぎの両方で遊べる全9問の詰将棋
- 「1手詰め」「3手詰め」「5手詰め」の難易度別問題一覧とクリア記録
- 段階式ヒント、誤答案内、相手の自動応手に対応した詰将棋プレイ画面
- AIの強さを「やさしい」から「とてもつよい」まで4段階で選択可能
- 通常モードと、不正な移動先を案内する入門モード
- 棋譜の表示と、任意の手数への移動
- 待った、Undo／Redo、過去の局面からの指し直し
- ライオンの捕獲、トライ、詰みによる勝敗判定
- 対局後の端末内解析と、キャラクターが出題する対話型のおさらい
- 盤上で答えるヒント付きの振り返り問題と、端末音声による読み上げ
- 端末内で完結する対局とAI処理
- スマートフォンの縦画面に対応したUI
- おかししょうぎのPWA・オフライン対応
- GitHub ActionsによるGitHub Pagesへの自動デプロイ

### おかししょうぎ固有の設定

- 駒を「和菓子」「洋菓子」「和洋MIX」から選択
- 盤を「おかし箱」「木の盤」「若草」「墨色」から選択

## 詰将棋モード

おかししょうぎ・さむらいしょうぎの各ゲーム画面で、最初に「対局する」または「詰将棋に挑戦」を選べます。詰将棋では下側の先手を操作し、指定された手数以内に相手のライオン／大将を捕まえるか、逃げ道をなくして詰ませます。対局で使われる「トライ」は詰将棋の正解には含まれません。

| 難易度 | 手数 | 問題数 | 内容 |
| --- | ---: | ---: | --- |
| はじめて | 1手詰め | 3問 | 一手で相手の逃げ道をなくす |
| ステップアップ | 3手詰め | 3問 | 相手の応手を読んで追い詰める |
| チャレンジ | 5手詰め | 3問 | 最後まで詰みの手順を読み切る |

- 相手の手は自動で進み、どの合法手で逃げても詰む手順だけが正解になります。
- 間違えた手は盤面へ反映されず、その場で別の手を試せます。
- ヒントは「動かす駒」「行き先」の2段階で表示できます。
- 全9問のクリア状況はブラウザ内へ保存され、おかししょうぎ・さむらいしょうぎごとに記録されます。
- おかししょうぎでは、詰将棋の問題一覧から駒の種類を変更できます。

収録問題はゲームエンジンで手数と初手の一意性を検証しています。問題や相手の応手の計算に外部通信は使用しません。

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
| `npm test` | Playwrightでランチャーと両ゲームの基本操作を検査 |
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
- Service Worker / Web App Manifest（おかししょうぎ）
- GitHub Actions / GitHub Pages

ゲームの状態とAIはクライアント側で処理され、対局のためのバックエンドAPIや外部通信は使用しません。

## ディレクトリ構成

```text
.
├── src/
│   ├── App.tsx          # 共通のゲーム・AI・詰将棋ロジックと各プレイ画面
│   ├── Launcher.tsx     # ゲーム選択画面
│   └── *.css            # 各画面のスタイル
├── public/
│   ├── pieces/          # 駒の画像素材
│   └── okashi/          # PWAのmanifestとService Worker
├── okashi/index.html    # おかししょうぎのエントリーポイント
├── samurai/index.html   # さむらいしょうぎのエントリーポイント
├── vite.config.ts       # 複数ページのビルド設定
└── .github/workflows/
    └── deploy.yml       # GitHub Pagesへのデプロイ
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
