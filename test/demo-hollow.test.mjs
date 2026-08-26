/**
 * A deliberately hollow test, planted to demonstrate what the gate does on a pull
 * request. It calls the scanner and asserts nothing, which is exactly the shape
 * `no-assertion` reports, so the audit step fails this branch on purpose and the
 * action posts the finding on the pull request.
 *
 * This file belongs to the demonstration branch and must never be merged.
 */
import test from "node:test";
import { scan } from "../src/scan.mjs";

test("the scanner runs over this repository", () => {
  scan(process.cwd());
});
