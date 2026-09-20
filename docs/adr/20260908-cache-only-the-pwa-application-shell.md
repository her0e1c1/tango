# PWAではapplication shellだけをcacheする

Status: Accepted

## Context

Service WorkerがFirebase responseやuser dataをruntime cacheすると、Firestore persistenceやLocal Storeとcache ownershipが重複し、logoutやidentity切替後にstale dataを表示する危険がある。一方、installabilityとstatic application shellのoffline起動にはService Workerが有効である。

## Decision

`vite-plugin-pwa`でroot scopeのmanifestとService Workerを生成し、browser applicationをinstall可能にする。

WorkboxでprecacheするのはbuildされたHTML、CSS、JavaScript、および明示したstatic assetだけとする。Firebase response、API response、Deck、Card、Study dataなどのuser dataをService Workerのruntime cacheへ保存しない。

Remote dataのoffline durabilityはFirestore persistent cache、Local only dataはEntity Storeのbrowser persistenceが所有する。Storybook buildからPWA pluginを除外する。

PWA artifact生成は通常のVite buildに委ね、standard toolingが保証する生成物を検査するcustom verifierを維持しない。[PR #333](https://github.com/her0e1c1/tango/pull/333)、[PR #452](https://github.com/her0e1c1/tango/pull/452)を参照する。
