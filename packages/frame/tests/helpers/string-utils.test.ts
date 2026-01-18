import { describe, expect, it } from "bun:test";
import { camelCase, kebabCase } from "../../src/helpers/string-utils";

describe("string-utils", () => {
  describe("kebabCase", () => {
    it("should convert camelCase to kebab-case", () => {
      expect(kebabCase("userName")).toBe("user-name");
      expect(kebabCase("userNameId")).toBe("user-name-id");
      expect(kebabCase("userId")).toBe("user-id");
    });

    it("should convert PascalCase to kebab-case", () => {
      expect(kebabCase("UserName")).toBe("user-name");
      expect(kebabCase("UserNameId")).toBe("user-name-id");
      expect(kebabCase("UserId")).toBe("user-id");
    });

    it("should convert snake_case to kebab-case", () => {
      expect(kebabCase("user_name")).toBe("user-name");
      expect(kebabCase("user_name_id")).toBe("user-name-id");
      expect(kebabCase("user_id")).toBe("user-id");
    });

    it("should convert dot.case to kebab-case", () => {
      expect(kebabCase("user.name")).toBe("user-name");
      expect(kebabCase("user.name.id")).toBe("user-name-id");
    });

    it("should convert spaces to kebab-case", () => {
      expect(kebabCase("user name")).toBe("user-name");
      expect(kebabCase("user name id")).toBe("user-name-id");
    });

    it("should handle already kebab-case", () => {
      expect(kebabCase("user-name")).toBe("user-name");
      expect(kebabCase("user-name-id")).toBe("user-name-id");
    });

    it("should handle mixed formats", () => {
      expect(kebabCase("userName_id")).toBe("user-name-id");
      expect(kebabCase("user.name_Id")).toBe("user-name-id");
      expect(kebabCase("User Name-id")).toBe("user-name-id");
    });

    it("should handle multiple separators", () => {
      expect(kebabCase("user__name")).toBe("user-name");
      expect(kebabCase("user  name")).toBe("user-name");
      expect(kebabCase("user..name")).toBe("user-name");
    });

    it("should trim leading/trailing hyphens", () => {
      expect(kebabCase("-userName-")).toBe("user-name");
      expect(kebabCase("_userName_")).toBe("user-name");
    });

    it("should handle single words", () => {
      expect(kebabCase("user")).toBe("user");
      expect(kebabCase("User")).toBe("user");
      expect(kebabCase("USER")).toBe("user");
    });

    it("should handle empty string", () => {
      expect(kebabCase("")).toBe("");
    });
  });

  describe("camelCase", () => {
    it("should convert kebab-case to camelCase", () => {
      expect(camelCase("user-name")).toBe("userName");
      expect(camelCase("user-name-id")).toBe("userNameId");
      expect(camelCase("user-id")).toBe("userId");
    });

    it("should convert snake_case to camelCase", () => {
      expect(camelCase("user_name")).toBe("userName");
      expect(camelCase("user_name_id")).toBe("userNameId");
      expect(camelCase("user_id")).toBe("userId");
    });

    it("should convert dot.case to camelCase", () => {
      expect(camelCase("user.name")).toBe("userName");
      expect(camelCase("user.name.id")).toBe("userNameId");
    });

    it("should convert spaces to camelCase", () => {
      expect(camelCase("user name")).toBe("userName");
      expect(camelCase("user name id")).toBe("userNameId");
    });

    it("should convert PascalCase to camelCase", () => {
      expect(camelCase("UserName")).toBe("userName");
      expect(camelCase("UserNameId")).toBe("userNameId");
      expect(camelCase("UserId")).toBe("userId");
    });

    it("should handle already camelCase", () => {
      expect(camelCase("userName")).toBe("userName");
      expect(camelCase("userNameId")).toBe("userNameId");
    });

    it("should handle mixed formats", () => {
      expect(camelCase("user-name_id")).toBe("userNameId");
      expect(camelCase("user.name-Id")).toBe("userNameId");
      expect(camelCase("User Name_id")).toBe("userNameId");
    });

    it("should remove special characters", () => {
      expect(camelCase("user@name")).toBe("username");
      expect(camelCase("user#name$id")).toBe("usernameid");
    });

    it("should handle single words", () => {
      expect(camelCase("user")).toBe("user");
      expect(camelCase("User")).toBe("user");
      expect(camelCase("USER")).toBe("user");
    });

    it("should handle empty string", () => {
      expect(camelCase("")).toBe("");
    });
  });

  describe("round-trip conversions", () => {
    it("should convert kebab → camel → kebab", () => {
      const original = "user-name-id";
      const camel = camelCase(original);
      const back = kebabCase(camel);
      expect(back).toBe(original);
    });

    it("should convert camel → kebab → camel", () => {
      const original = "userNameId";
      const kebab = kebabCase(original);
      const back = camelCase(kebab);
      expect(back).toBe(original);
    });
  });
});
