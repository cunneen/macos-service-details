  import { assert } from "chai";

  describe("dotenvx", () => {
    it("should decrypt process.env.HELLO value", () => {
      assert.equal(process.env.HELLO, "World");
    });
  });

