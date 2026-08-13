/**
 * @file Provides the study feature's Use Study Store React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import { useStore } from "zustand";

import type { StudyState } from "../state/studyStore";
import { studyStore } from "../state/studyStoreInstance";

/**
 * Provides the study store values and operations needed by React components.
 * Callers receive one focused interface without coordinating the study feature's stores and
 * services themselves.
 */
export const useStudyStore = <T>(selector: (state: StudyState) => T): T => useStore(studyStore, selector);
