import {describe, expect, it} from "vitest";
import {normalizeSeoDate} from "../src/index.js";

describe("normalizeSeoDate", () => {
    it("appends UTC midnight to a date-only string", () => {
        expect(normalizeSeoDate("2025-08-01")).toBe("2025-08-01T00:00:00+00:00");
    });

    it("leaves a full timestamp unchanged", () => {
        expect(normalizeSeoDate("2025-08-01T10:30:00+00:00")).toBe("2025-08-01T10:30:00+00:00");
    });

    it("leaves a non-date string unchanged", () => {
        expect(normalizeSeoDate("not-a-date")).toBe("not-a-date");
    });

    it("matches the pattern without calendar validation", () => {
        expect(normalizeSeoDate("2025-13-99")).toBe("2025-13-99T00:00:00+00:00");
    });

    it("rejects single-digit month or day parts", () => {
        expect(normalizeSeoDate("2025-8-01")).toBe("2025-8-01");
    });
});
