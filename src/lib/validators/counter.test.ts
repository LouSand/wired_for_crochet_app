import { describe, it, expect } from "vitest";
import { counterFormSchema } from "./counter";

describe("counterFormSchema", () => {
  it("accepts valid minimal input (name only)", () => {
    const result = counterFormSchema.safeParse({ name: "Row counter" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Row counter");
      expect(result.data.target_value).toBeUndefined();
      expect(result.data.sort_order).toBeUndefined();
    }
  });

  it("accepts valid full input", () => {
    const input = {
      name: "Stitch counter",
      target_value: 100,
      sort_order: 2,
    };
    const result = counterFormSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it("rejects empty name", () => {
    const result = counterFormSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 100 characters", () => {
    const result = counterFormSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly 100 characters", () => {
    const result = counterFormSchema.safeParse({ name: "a".repeat(100) });
    expect(result.success).toBe(true);
  });

  it("rejects target_value of 0", () => {
    const result = counterFormSchema.safeParse({
      name: "Test",
      target_value: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative target_value", () => {
    const result = counterFormSchema.safeParse({
      name: "Test",
      target_value: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer target_value", () => {
    const result = counterFormSchema.safeParse({
      name: "Test",
      target_value: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts target_value of 1", () => {
    const result = counterFormSchema.safeParse({
      name: "Test",
      target_value: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative sort_order", () => {
    const result = counterFormSchema.safeParse({
      name: "Test",
      sort_order: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts sort_order of 0", () => {
    const result = counterFormSchema.safeParse({
      name: "Test",
      sort_order: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-integer sort_order", () => {
    const result = counterFormSchema.safeParse({
      name: "Test",
      sort_order: 1.5,
    });
    expect(result.success).toBe(false);
  });
});
