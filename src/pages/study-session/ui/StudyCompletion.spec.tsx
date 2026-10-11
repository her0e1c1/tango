import { fireEvent, render, screen } from "@testing-library/react";
import { getI18n } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { StudyCompletion } from "./StudyCompletion";

describe("STUDY-SESSION-05 StudyCompletion", () => {
  it.each([
    { language: "en", cardCount: 1, summary: "Session: 1 card", title: "Study complete", back: "Back to deck list" },
    { language: "en", cardCount: 2, summary: "Session: 2 cards", title: "Study complete", back: "Back to deck list" },
    { language: "ja", cardCount: 1, summary: "対象カード: 1枚", title: "学習完了", back: "デッキ一覧へ戻る" },
    { language: "ja", cardCount: 2, summary: "対象カード: 2枚", title: "学習完了", back: "デッキ一覧へ戻る" },
  ])(
    "shows the session Card count in $language for $cardCount cards and reports the return action",
    async ({ language, cardCount, summary, title, back }) => {
      await getI18n().changeLanguage(language);
      const onClickBack = vi.fn();
      render(<StudyCompletion cardCount={cardCount} onClickBack={onClickBack} />);

      expect(screen.getByRole("heading", { name: title })).toHaveFocus();
      expect(screen.getByText(summary)).toBeVisible();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: back }));
      expect(onClickBack).toHaveBeenCalledOnce();
    }
  );
});
