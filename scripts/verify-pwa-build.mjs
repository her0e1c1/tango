import path from "node:path";
import { verifyPwaBuild } from "./pwa-build-verifier.mjs";

verifyPwaBuild(path.resolve(process.cwd(), "build"));
console.log("Verified production PWA artifacts.");
