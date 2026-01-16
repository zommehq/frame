import { describe, expect, it } from "bun:test";
import { MessageEvent } from "../src/constants";

describe("constants", () => {
  describe("MessageEvent", () => {
    it("should have lifecycle message types", () => {
      expect(MessageEvent.INIT).toBe("__INIT__");
      expect(MessageEvent.READY).toBe("__READY__");
    });

    it("should have property message type", () => {
      expect(MessageEvent.ATTRIBUTE_CHANGE).toBe("__ATTRIBUTE_CHANGE__");
    });

    it("should have event message types", () => {
      expect(MessageEvent.EVENT).toBe("__EVENT__");
      expect(MessageEvent.CUSTOM_EVENT).toBe("__CUSTOM_EVENT__");
    });

    it("should have function message types", () => {
      expect(MessageEvent.FUNCTION_CALL).toBe("__FUNCTION_CALL__");
      expect(MessageEvent.FUNCTION_RESPONSE).toBe("__FUNCTION_RESPONSE__");
      expect(MessageEvent.FUNCTION_RELEASE).toBe("__FUNCTION_RELEASE__");
      expect(MessageEvent.FUNCTION_RELEASE_BATCH).toBe("__FUNCTION_RELEASE_BATCH__");
    });

    it("should have exactly 9 message types", () => {
      const keys = Object.keys(MessageEvent);
      expect(keys).toHaveLength(9);
    });

    it("should have all message types prefixed with double underscore", () => {
      const values = Object.values(MessageEvent);
      values.forEach((value) => {
        expect(value).toMatch(/^__[A-Z_]+__$/);
      });
    });
  });
});
