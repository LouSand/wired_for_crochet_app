import { describe, it, expect } from "vitest";
import {
  yarnFormSchema,
  yarnUpdateSchema,
  yarnUsageSchema,
  yarnWeightCategorySchema,
  YARN_WEIGHT_CATEGORIES,
} from "./yarn";

describe("yarnFormSchema", () => {
  it("accepts valid minimal input (name only)", () => {
    const result = yarnFormSchema.safeParse({ name: "Merino Wool" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Merino Wool");
      expect(result.data.quantity_owned).toBe(0);
    }
  });

  it("accepts valid full input", () => {
    const input = {
      name: "Cascade 220",
      brand: "Cascade Yarns",
      colour: "Ruby Red",
      shade_code: "9404",
      dye_lot: "LOT123",
      weight_category: "worsted" as const,
      thickness: "Medium",
      fibre_content: "100% Peruvian Highland Wool",
      washing_instructions: "Hand wash cold, lay flat to dry",
      recommended_hook_size: "5.0mm",
      quantity_owned: 4,
      cost_per_unit: 12.99,
    };
    const result = yarnFormSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it("rejects empty name", () => {
    const result = yarnFormSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 255 characters", () => {
    const result = yarnFormSchema.safeParse({ name: "a".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("rejects brand exceeding 255 characters", () => {
    const result = yarnFormSchema.safeParse({
      name: "Test",
      brand: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("rejects colour exceeding 100 characters", () => {
    const result = yarnFormSchema.safeParse({
      name: "Test",
      colour: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects shade_code exceeding 50 characters", () => {
    const result = yarnFormSchema.safeParse({
      name: "Test",
      shade_code: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects dye_lot exceeding 50 characters", () => {
    const result = yarnFormSchema.safeParse({
      name: "Test",
      dye_lot: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid weight_category", () => {
    const result = yarnFormSchema.safeParse({
      name: "Test",
      weight_category: "ultra_chunky",
    });
    expect(result.success).toBe(false);
  });

  it("rejects thickness exceeding 50 characters", () => {
    const result = yarnFormSchema.safeParse({
      name: "Test",
      thickness: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects recommended_hook_size exceeding 20 characters", () => {
    const result = yarnFormSchema.safeParse({
      name: "Test",
      recommended_hook_size: "a".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity_owned", () => {
    const result = yarnFormSchema.safeParse({
      name: "Test",
      quantity_owned: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative cost_per_unit", () => {
    const result = yarnFormSchema.safeParse({
      name: "Test",
      cost_per_unit: -5.99,
    });
    expect(result.success).toBe(false);
  });

  it("defaults quantity_owned to 0 when not provided", () => {
    const result = yarnFormSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity_owned).toBe(0);
    }
  });

  it("accepts zero cost_per_unit", () => {
    const result = yarnFormSchema.safeParse({
      name: "Test",
      cost_per_unit: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("yarnWeightCategorySchema", () => {
  it("accepts all valid weight categories", () => {
    for (const category of YARN_WEIGHT_CATEGORIES) {
      const result = yarnWeightCategorySchema.safeParse(category);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid weight category strings", () => {
    const result = yarnWeightCategorySchema.safeParse("chunky");
    expect(result.success).toBe(false);
  });

  it("validates all expected categories exist", () => {
    expect(YARN_WEIGHT_CATEGORIES).toEqual([
      "lace",
      "fingering",
      "sport",
      "dk",
      "worsted",
      "aran",
      "bulky",
      "super_bulky",
    ]);
  });
});

describe("yarnUpdateSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = yarnUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial updates", () => {
    const result = yarnUpdateSchema.safeParse({
      brand: "New Brand",
      quantity_owned: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.brand).toBe("New Brand");
      expect(result.data.quantity_owned).toBe(10);
    }
  });

  it("still validates field constraints on partial updates", () => {
    const result = yarnUpdateSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid weight_category in partial update", () => {
    const result = yarnUpdateSchema.safeParse({
      weight_category: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("yarnUsageSchema", () => {
  it("accepts valid yarn usage data", () => {
    const result = yarnUsageSchema.safeParse({
      yarn_entry_id: "550e8400-e29b-41d4-a716-446655440000",
      project_id: "660e8400-e29b-41d4-a716-446655440000",
      quantity_used: 2.5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity_used).toBe(2.5);
    }
  });

  it("rejects invalid yarn_entry_id UUID", () => {
    const result = yarnUsageSchema.safeParse({
      yarn_entry_id: "not-a-uuid",
      project_id: "660e8400-e29b-41d4-a716-446655440000",
      quantity_used: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid project_id UUID", () => {
    const result = yarnUsageSchema.safeParse({
      yarn_entry_id: "550e8400-e29b-41d4-a716-446655440000",
      project_id: "not-a-uuid",
      quantity_used: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity_used", () => {
    const result = yarnUsageSchema.safeParse({
      yarn_entry_id: "550e8400-e29b-41d4-a716-446655440000",
      project_id: "660e8400-e29b-41d4-a716-446655440000",
      quantity_used: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero quantity_used", () => {
    const result = yarnUsageSchema.safeParse({
      yarn_entry_id: "550e8400-e29b-41d4-a716-446655440000",
      project_id: "660e8400-e29b-41d4-a716-446655440000",
      quantity_used: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = yarnUsageSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
