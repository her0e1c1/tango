整形・一般 lint は Biome、型依存・React・テスト・UI 境界は ESLint、FSD は Steiger、型検査は TypeScript、未使用検出は Knip が担う。
React Compiler と Vite 設定を本番・Vitest・Storybook で共有し、通常のメモ化を Compiler に任せ、useMemo・useCallback は lint で禁止する。
Hooks・Compiler の診断はコードや責務の修正で解消する。例外は ADR と lint 方針を更新してから設ける。
