// Test-side setup uses store actions without changing the production persistence boundary.
export { replaceRemoteDecks } from "@/entities/deck/model/actions/replaceRemoteDecks";
export { startStudy } from "@/entities/study-session/model/actions/startStudy";
export { moveStudySession } from "@/entities/study-session/model/actions/moveStudySession";
export { setStudySessionIndex } from "@/entities/study-session/model/actions/setStudySessionIndex";
