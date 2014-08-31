# YAPC::Asia Ramen Challenge Graph

## なにこれ

[YAPC::Asia Ramen Challenge](http://bayashi.net/diary/2014/0829) で提唱された #yapcramen ハッシュタグを検索して、指名状況やチャレンジ状況を雑にグラフ表示するプログラムです。

## なにやってんの

1. Twitter API で #yapcramen ハッシュタグを検索
2. [vis.js](http://visjs.org/) 向けのグラフデータを作成しつつ、各ノードやエッジに紐づくツイートの情報を記録
3. JSON ファイルとして結果を保存
4. 読み込んだ JSON ファイルを vis.js を使って描画

## 使ってるもの

* Perl
  * Net::Twitter::Lite
  * Config::Pit
* JavaScript
  * vis.js
  * Mustache
  * jQuery
  * Bootstrap.js

あと JavaScript や CSS のビルド環境に Grunt とか Bower とか Stylus とか
