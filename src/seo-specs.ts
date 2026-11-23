export type DateOnly = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;
export type SeoDateInput = DateOnly | (string & {});

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeSeoDate(input: SeoDateInput): string {
    if (typeof input === "string" && dateOnlyRegex.test(input)) {
        return `${input}T00:00:00+00:00`;
    }
    return input;
}
