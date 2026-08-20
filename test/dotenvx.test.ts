  import { assert, describe, it } from "vitest";

  describe("dotenvx", () => {
    it("should decrypt process.env.HELLO value", () => {
      assert.equal(process.env.HELLO, "World");
    });
  });

