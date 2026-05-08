import { describe, it, expect } from "vitest";
import {
  projectFormSchema,
  projectUpdateSchema,
  projectStatusSchema,
  projectDifficultySchema,
  PROJECT_STATUSES,
  PROJECT_DIFFICULTIES,
} from "./project";

describe("projectFormSchema", () => {
  it("accepts valid minimal input (name only)", () => {
    const result = projectFormSchema.safeParse({ name: "My Scarf" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Scarf");
      expect(result.data.status).toBe("planned");
    }
  });

  it("accepts valid full input", () => {
    const input = {
      name: "Baby Blanket",
      description: "A soft blanket for my niece",
      status: "in_progress" as const,
      difficulty: "intermediate" as const,
      customer_name: "Jane Doe",
      date_started: "2024-03-15",
      date_completed: "2024-06-01",
      hourly_rate_override: 25.5,
      pattern_id: "550e8400-e29b-41d4-a716-446655440000",
      currency: "USD" as const,
    };
    const result = projectFormSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it("rejects empty name", () => {
    const result = projectFormSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 255 characters", () => {
    const result = projectFormSchema.safeParse({ name: "a".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = projectFormSchema.safeParse({
      name: "Test",
      status: "invalid_status",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid difficulty", () => {
    const result = projectFormSchema.safeParse({
      name: "Test",
      difficulty: "impossible",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative hourly_rate_override", () => {
    const result = projectFormSchema.safeParse({
      name: "Test",
      hourly_rate_override: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = projectFormSchema.safeParse({
      name: "Test",
      date_started: "March 15, 2024",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for pattern_id", () => {
    const result = projectFormSchema.safeParse({
      name: "Test",
      pattern_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects customer_name exceeding 255 characters", () => {
    const result = projectFormSchema.safeParse({
      name: "Test",
      customer_name: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("defaults status to planned when not provided", () => {
    const result = projectFormSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("planned");
    }
  });
});

describe("projectStatusSchema", () => {
  it("accepts all valid statuses", () => {
    for (const status of PROJECT_STATUSES) {
      const result = projectStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status strings", () => {
    const result = projectStatusSchema.safeParse("done");
    expect(result.success).toBe(false);
  });
});

describe("projectDifficultySchema", () => {
  it("accepts all valid difficulties", () => {
    for (const difficulty of PROJECT_DIFFICULTIES) {
      const result = projectDifficultySchema.safeParse(difficulty);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid difficulty strings", () => {
    const result = projectDifficultySchema.safeParse("impossible");
    expect(result.success).toBe(false);
  });
});

describe("projectUpdateSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = projectUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial updates", () => {
    const result = projectUpdateSchema.safeParse({
      status: "completed",
      date_completed: "2024-06-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("completed");
      expect(result.data.date_completed).toBe("2024-06-01");
    }
  });

  it("still validates field constraints on partial updates", () => {
    const result = projectUpdateSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status in partial update", () => {
    const result = projectUpdateSchema.safeParse({
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
