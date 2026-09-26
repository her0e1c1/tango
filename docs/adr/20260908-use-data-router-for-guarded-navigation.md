App が Data Router とルートツリー、Shared がルート定義・遷移先生成・離脱ガードを持ち、Page は Router hook を直接使う。
変更済み・保存中の Form はアプリ内遷移とブラウザー離脱をガードし、保存後は遷移先と history action が一致する一回だけ許可する。
全体のガードは無効化せず、ルート照合と遷移先生成に同じ Shared の定義を使う。
