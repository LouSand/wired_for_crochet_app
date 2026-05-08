import { describe, it, expect } from "vitest";
import {
  hookFormSchema,
  hookUpdateSchema,
  hookUsageSchema,
} from "./hook";

describe("hookFormSchema", () => {
  it("accepts valid minimal input (size only)", () => {
    const result = hookFormSchema.safeParse({ size: "4.0mm" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.size).toBe("4.0mm");
    }
  });

  it("accepts valid full input", () => {
    const input = {
      size: "G/6",
      type: "inline",
      brand: "Clover",
      material: "aluminum",
      yarn_types: [] as string[],
      pattern_types: [] as string[],
    };
    const result = hookFormSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it("rejects empty size", () => {
    const result = hookFormSchema.safeParse({ size: "" });
    expect(result.success).toBe(false);
  });

  it("rejects size exceeding 20 characters", () => {
    const result = hookFormSchema.safeParse({ size: "a".repeat(21) });
    expect(result.success).toBe(false);
  });

  it("rejects type exceeding 50 characters", () => {
    const result = hookFormSchema.safeParse({
      size: "4.0mm",
      type: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects brand exceeding 255 characters", () => {
    const result = hookFormSchema.safeParse({
      size: "4.0mm",
      brand: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("rejects material exceeding 100 characters", () => {
    const result = hookFormSchema.safeParse({
      size: "4.0mm",
      material: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts size at max length (20 characters)", () => {
    const result = hookFormSchema.safeParse({ size: "a".repeat(20) });
    expect(result.success).toBe(true);
  });

  it("accepts type at max length (50 characters)", () => {
    const result = hookFormSchema.safeParse({
      size: "4.0mm",
      type: "a".repeat(50),
    });
    expect(result.success).toBe(true);
  });

  it("accepts brand at max length (255 characters)", () => {
    const result = hookFormSchema.safeParse({
      size: "4.0mm",
      brand: "a".repeat(255),
    });
    expect(result.success).toBe(true);
  });

  it("accepts material at max length (100 characters)", () => {
    const result = hookFormSchema.safeParse({
      size: "4.0mm",
      material: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing size field", () => {
    const result = hookFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("hookUpdateSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = hookUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial updates", () => {
    const result = hookUpdateSchema.safeParse({
      brand: "Tulip",
      material: "steel",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.brand).toBe("Tulip");
      expect(result.data.material).toBe("steel");
    }
  });

  it("still validates field constraints on partial updates", () => {
    const result = hookUpdateSchema.safeParse({
      size: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects type exceeding max length in partial update", () => {
    const result = hookUpdateSchema.safeParse({
      type: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });
});

describe("hookUsageSchema", () => {
  it("accepts valid hook usage data with note", () => {
    const result = hookUsageSchema.safeParse({
      hook_entry_id: "550e8400-e29b-41d4-a716-446655440000",
      project_id: "660e8400-e29b-41d4-a716-446655440000",
      note: "Used for the border",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note).toBe("Used for the border");
    }
  });

  it("accepts valid hook usage data without note", () => {
    const result = hookUsageSchema.safeParse({
      hook_entry_id: "550e8400-e29b-41d4-a716-446655440000",
      project_id: "660e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note).toBeUndefined();
    }
  });

  it("rejects invalid hook_entry_id UUID", () => {
    const result = hookUsageSchema.safeParse({
      hook_entry_id: "not-a-uuid",
      project_id: "660e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid project_id UUID", () => {
    const result = hookUsageSchema.safeParse({
      hook_entry_id: "550e8400-e29b-41d4-a716-446655440000",
      project_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects note exceeding 500 characters", () => {
    const result = hookUsageSchema.safeParse({
      hook_entry_id: "550e8400-e29b-41d4-a716-446655440000",
      project_id: "660e8400-e29b-41d4-a716-446655440000",
      note: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts note at max length (500 characters)", () => {
    const result = hookUsageSchema.safeParse({
      hook_entry_id: "550e8400-e29b-41d4-a716-446655440000",
      project_id: "660e8400-e29b-41d4-a716-446655440000",
      note: "a".repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = hookUsageSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
