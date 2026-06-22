import { customType } from "drizzle-orm/pg-core";

/** pgvector 1024 维（百炼 text-embedding-v3） */
export const vector1024 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1024)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    const trimmed = value.replace(/^\[|\]$/g, "");
    if (!trimmed) return [];
    return trimmed.split(",").map(Number);
  },
});
