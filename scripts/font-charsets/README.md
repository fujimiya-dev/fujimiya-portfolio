# フォントのサブセット範囲（文字リスト）

`scripts/build-fonts.py` が、ここにある全ファイルの文字の**和集合**を、サブセット化の対象として使います。`npm run fonts:build` で再生成されるフォント（`src/fonts/*/*.woff2`）は、この和集合に含まれる文字だけを収録します。

## 各ファイルの出どころ

- **joyo-kanji.txt**（常用漢字、2140字）
  Unicode Consortium が公開している Unihan データベース（[Unihan.zip](https://unicode.org/Public/UCD/latest/ucd/Unihan.zip) 内 `Unihan_OtherMappings.txt` の `kJoyoKanji` フィールド）から抽出。文化庁「常用漢字表」(2010年改定) の2136字に、Unihan側で異体字として対応付けられている4字を加えたもの。

- **jis1-level-kanji.txt**（JIS第1水準漢字、2965字）
  Unicode Consortium が公開している公式マッピング表（[JIS0208.TXT](https://unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/JIS/JIS0208.TXT)）から、区(ku) 16〜47（JIS X 0208 第1水準の定義範囲）に該当する漢字を抽出。

- **kana-symbols-ascii.txt**（ひらがな・カタカナ(全角/半角)・一般記号・全角英数・ASCII、591字）
  標準のUnicodeブロック定義から、機械的に生成（ASCII印字可能文字 U+0020–007E、CJK記号・約物 U+3000–303F、ひらがな U+3040–309F、カタカナ U+30A0–30FF、半角・全角形 U+FF00–FFEF）。

- **db-snapshot.txt**（実際のDB内容・UI文言、764字）
  実装時点で、本番データベース全件（Work/Experience/ResearchItem とその翻訳）と、`src/i18n/ja.ts`・`en.ts` の静的文言から、読み取り専用で抽出した実使用文字。JIS第1水準の範囲外の人名・固有名詞等を、確実に拾うためのセーフティネット。**このファイルはビルド時に毎回DBへ問い合わせるのではなく、実装時に一度取得して固定したスナップショットです**（`npm run fonts:build` の再現性・オフライン実行可能性のため）。管理画面で新しい文章を追加した場合は、`npm run fonts:check` で、このスナップショットに含まれない文字が増えていないかを確認してください。範囲外の文字が見つかった場合は、このファイルを最新のDB内容で作り直し、`npm run fonts:build` を再実行してください。

## 更新方法

1. `db-snapshot.txt` を最新のDB内容で作り直す（必要な場合のみ。`npm run fonts:check` が「含まれない文字」を検出したときに実施）
2. `npm run fonts:build` を実行
3. 生成された `src/fonts/*/*.woff2` を確認してコミット
