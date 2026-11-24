import { useState } from "react";
import { useTimeoutFn } from "react-use";

export function useStudyHistoryClock(uid: string, search: string) {
  const [selection, setSelection] = useState({ uid, search });
  const [today, setToday] = useState(() => new Date());
  if (selection.uid !== uid || selection.search !== search) {
    setSelection({ uid, search });
    setToday(new Date());
  }
  const midnight = new Date(today);
  midnight.setHours(24, 0, 0, 0);
  useTimeoutFn(() => setToday(new Date()), Math.max(0, midnight.getTime() - Date.now()));
  return { today, setToday };
}
