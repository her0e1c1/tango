import { useStudyStore } from "./useStudyStore";

export const useStudySessions = () => useStudyStore((state) => state.sessionsByDeckId);
