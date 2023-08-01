---
title: Web Cache Deception Attackについて解説する
author: kuzushiki
where: ３０回 初心者のためのセキュリティ勉強会

# タイトルページの設定
layout: cover
hideInToc: true # タイトルページを table of contents に含めない

# ここから下は基本触らない
# デザイン周りの設定
# fonts:
#   sans: 'BIZ UDPGothic,Robot'
#   serif: 'BIZ UDPGothic,Robot Slab'
#   mono: 'BIZ UDPGothic,Fira Code'
highlighter: shiki
lineNumbers: true

# テーマの設定
theme: academic
coverDate: ''
themeConfig:
  paginationX: r
  paginationY: t
---

# {{ $slidev.configs.title }}

## {{ $slidev.configs.author }}

---

# 発表内容

<br>

Black Hat<sup>1</sup> USA 2017 にてOmer Gil氏が発表した **Web Cache Deception Attack** を解説する

<br>

なぜ今なのか？

- 先月 **ChatGPT** で報告されていた

- 直近1ヶ月でHackerOneにて2件のバグレポートが公開された

<Footnotes separator>
  <Footnote :number=1>世界最大級のサイバーセキュリティカンファレンスの一つ</Footnote>
</Footnotes>

---

# Web Cache Deception Attackとは？

<br>

一言で表すと、<br>
「機密情報を含むページをキャッシュさせる攻撃」

<br>

Top 10 Web Hacking Technique<sup>1</sup> of 2017にて **2** 位！

<br>

※ Top 10 Web Hacking Techniqueについて

PortSwigger社が毎年公表している脆弱性のランキング<br>
OWASP Top 10 とは異なり、革新的な脆弱性を研究者目線で順位付けしているのが特徴

<Footnotes separator>
  <Footnote :number=1>ちなみに2022年度の1位は「Account hijacking using dirty dancing in sign-in OAuth-flows」</Footnote>
</Footnotes>

---


# 前提知識 - Webにおけるキャッシュとは？

<br>

`.css`や`.js`などの静的コンテンツは毎回読み込む必要がない

-> レスポンスを再利用することでより高速にページを表示できる

---


# 攻撃の仕組み

<br>

<!-- ここで Web Cache Poisoning の逆だよね、という話もしたい
-->


---

# デモ

<br>

`Docker Compose`形式で配布しているので、ぜひ触ってみてください

https://github.com/kuzushiki/cache-deception-demo


---

# 事例紹介

<br>

ChatGPT
- Nagli氏が2023/3/25に報告
-> 2時間以内に修正

<br>

`chat.openai[.]com/api/auth/session/test.css`のようなリンクを踏ませることで<br>
被害者の下記情報がキャッシュされ、攻撃者に窃取される可能性があった

<div class="grid grid-cols-[50%,50%]">
<div>

- メールアドレス
- 登録名
- アバター画像
- **アクセストークン**

</div><div>

<Tweet id="1639343866313601024"/>

</div></div>

---

# 事例紹介

<br>

Expedia
- bombon氏が2022/9/13に報告
-> 2023/4/2に脆弱性レポートが公開

<br>

1. 下記URLのレスポンスにセッショントークンが含まれていた<br>
`www.abritel.fr/search/keywords:soissons-france-(xss)/minNightlyPrice/{anything}`

2. `.jpeg`を末尾に付与してキャッシュさせることができた<br>
`www.abritel.fr/search/keywords:soissons-france-(xss)/minNightlyPrice/cached.jpeg`


<Tweet id="1642266924351381504"/>

---

# 攻撃が成立する条件とその対策<sup>1</sup>

<br>

1. http://www.example.com/account.php/nonexistent.css のようなページにアクセスすると account.php のコンテンツを返す (素のPHPやDjangoで起こりうる)

-> 正規表現パターンを厳密に設定する

```
× url(r'^inbox/', views.index, name='index')
○ url(r'^inbox/$', views.index, name='index')
```


<br>

2. キャッシュ機能がキャッシュヘッダを無視し、拡張子のみでファイルをキャッシュするように設定されている

-> 拡張子のみで判断せず、Content-TypeやCache-Controlヘッダ等をチェックする

<br>

3. 被害者が悪意のあるURLにアクセスする際に認証が必要

-> そもそも認証が必要なコンテンツはキャッシュさせない

<Footnotes separator>
  <Footnote :number=1>Gil, Omer. "Web cache deception attack." Black Hat USA 2017 (2017).
</Footnote>
</Footnotes>

---

# おわりに

<br>

**Web Cache Deception Attack** について、デモを交えながら攻撃手法と事例について説明した

<br>

**ChatGPT** や **Expedia** のような有名なサービスでも報告されており、かつ確認手順も簡単なため、<br>
診断やバグバウンティで確認する価値はありそう

<Footnotes separator>
  <Footnote :number=1></Footnote>
</Footnotes>
