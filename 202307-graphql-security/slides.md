---
title: 	セキュリティの視点から見たGraphQL
author: kuzushiki
where: ３３回 初心者のためのセキュリティ勉強会

# タイトルページの設定
layout: cover
hideInToc: true # タイトルページを table of contents に含めない

# ここから下は基本触らない
# デザイン周りの設定
fonts:
  sans: 'BIZ UDPGothic,Robot'
  serif: 'BIZ UDPGothic,Robot Slab'
  mono: 'BIZ UDPGothic,Fira Code'
highlighter: shiki
lineNumbers: true

# テーマの設定
theme: academic
coverDate: ''
themeConfig:
  paginationX: r
  paginationY: t

css: unocss
---

# セキュリティの視点から見たGraphQL

## {{ $slidev.configs.author }}

---

# アジェンダ

<br>

- 発表内容

- GraphQLとは何か？

- GraphQLの機能とその悪用方法

- デモ

- おわりに


---
layout: figure-side
figureCaption: 2023/4 発売。 約7000円とお高めだが買う価値アリ
figureUrl: /2023-07-26-21-10-57.png
---

# 発表内容

<br>

最近 GraphQL に興味があり、[**Black Hat GraphQL**](https://nostarch.com/black-hat-graphql) を読んだ

本書の内容をもとに、GraphQL の攻撃方法を紹介


---

# GraphQLとは何か？

<br>


- Facebook が開発した、APIのためのクエリ言語

- 開発者フレンドリー
  - 必要なデータだけを指定して取得可能
  - データの型を定義できる


<br>

```
query {
  user(id: 1) {
    name
    email
  }
}
```

---
layout: center
---

# GraphQLの機能とその悪用方法

<br>

GraphQL は開発者フレンドリーな機能が豊富

機能と悪用方法をセットで紹介

---

# Introspection

<br>

- クライアントに「API がどのような操作を許可しているか」を教える機能

- GraphQL クライアント側でドキュメントの参照やフィールド名の自動補完ができる

<br>

```
 query {
        __schema {
            queryType {
                name
            }
            mutationType {
                name
            }
            subscriptionType {
                name
            }
            ...
```


---

# Introspectionを用いた情報収集

<br>

攻撃者にも「API がどのような操作を許可しているか」が伝わってしまう...

-> 攻撃のスキを与えることに

<br>

API の仕様を公開したくない場合は、Introspection を無効にしておきましょう

<br>

一部のサービスでは無効化できないので (AWS AppSync とか)、`__schema` を WAF で弾きましょう


---

# Alias

<br>

名前の衝突を避け、同じフィールド名を複数問い合わせられる機能

<br>

```
query {
  User1: user(id: 1) {
    name
  }
  User2: user(id: 2) {
    name
  }
  ...
}
```

<br>

```json
{
    "data": {
        "User1": {
            "name": "Bob"
        },
        "User2": {
            "name": "Alice"
        }
        ...
    }
}
```


---

# Aliasを用いたDoS、認証回避

<br>

攻撃者は1回のリクエストで同一クエリを複数回実行可能に...

-> 重いクエリを何度も実行することによる DoS

-> 認証のブルートフォース

<br>

API の回数制限では防げないので注意!

コスト制限を設けましょう


---

# Fragment

<br>

クエリ内で繰り返し使用する部分を定義し、使い回せる機能

<br>

```
query {
  user(id: 1) {
    ...userInfo
  }
}

fragment userInfo on User {
  name
  email
}
```

---

# Fragmentを用いたDoS

<br>

Fragment の中でも Fragment が使える！

定義のしかたによっては無限ループに陥ることに... (**Circular fragments**)

```
query {
  user(id: 1) {
    ...A
  }
}

fragment A on User {
  name
  ...B
}

fragment B on User {
  ...A
}
```

GraphQL サーバ側の設定で Circular fragments を無効化しましょう

---

# Field Suggestion

<br>

フィールド名が間違っている場合に、正しいフィールド名を提案してくれる機能

<br>

```
query {
  producte(id: 1) {
    name
    price
  }
}
```

<br>

```
"message": "Cannot query field \\"producte\\" on type \\"Query\\". Did you mean \\"product\\"?"
```

<br>

非常に便利な機能だが...


---

# Field Suggestionを用いた情報収集

<br>

こんな機能があったら悪用されるに決まってる...

※ GraphQL 開発者 **Lee Byron** のコメント

> I would expect that a schema with introspection disabled would also disable didYouMean. I can’t think of a reason why you would want to disable introspection but enable didYouMean or vice versa.


<br>

> introspectionを無効にしたスキーマはdidYouMeanも無効になることを期待します。introspectionを無効にしてdidYouMeanを有効にしたい理由や、その逆は思いつかない。


<br>

この仕様を悪用した、**Blind Introspection** というテクニックが存在

-> それっぽいフィールド名を大量にリクエストに含め、有効なフィールド名を列挙

<br>

Intorspection を無効にする場合、Field Suggestion も同様に無効化しましょう

---

# デモ

<br>

https://github.com/dolevf/Damn-Vulnerable-GraphQL-Application

<br>


紹介した4つの攻撃を試してみよう！

- introspection

- Alias を用いた DoS

- flagment を用いた DoS

- field suggestion を用いた情報収集

---

# おわりに

<br>

**Black Hat GraphQL** を読んだので、GraphQL の攻撃手法を紹介した

<br>

以下の文章が刺さりました


> This field suggestion feature makes GraphQL a convenient, friendly, and simple tool not only for API consumers but also for hackers.

<br>

> このフィールドサジェスト機能により、**GraphQLはAPI利用者だけでなく、ハッカーにとっても便利でフレンドリーでシンプルなツールとなっている。**


---

# その他の学習リソース

<br>

- https://github.com/flatt-security/mini-ctf

  - Flatt Security主催のCTF

- https://portswigger.net/web-security/graphql

  - あのBurpを作っているPortSwigger社のトレーニングコンテンツ