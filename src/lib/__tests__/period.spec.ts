import { currentMonthRange, formatPeriodLabel, monthsBefore } from "@/lib/period";

describe("currentMonthRange", () => {
  it("should start on the first day of the month containing the given date", () => {
    expect(currentMonthRange(new Date(2026, 5, 17)).from).toBe("2026-06-01");
  });

  it("should end on the last day of a 30-day month", () => {
    expect(currentMonthRange(new Date(2026, 5, 17)).to).toBe("2026-06-30");
  });

  it("should end on the last day of a 31-day month", () => {
    expect(currentMonthRange(new Date(2026, 6, 1)).to).toBe("2026-07-31");
  });

  it("should resolve February in a leap year to the 29th", () => {
    expect(currentMonthRange(new Date(2024, 1, 10)).to).toBe("2024-02-29");
  });

  it("should zero-pad a single-digit month", () => {
    expect(currentMonthRange(new Date(2026, 0, 15)).from).toBe("2026-01-01");
  });

  it("should read the system clock when no date is supplied", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 9));

    expect(currentMonthRange()).toEqual({ from: "2026-03-01", to: "2026-03-31" });

    vi.useRealTimers();
  });
});

describe("monthsBefore", () => {
  it("should subtract whole months within the same year", () => {
    expect(monthsBefore("2026-06-15", 3)).toBe("2026-03-15");
  });

  it("should roll back across a year boundary", () => {
    expect(monthsBefore("2026-01-15", 2)).toBe("2025-11-15");
  });

  it("should return the same date when subtracting zero months", () => {
    expect(monthsBefore("2026-06-15", 0)).toBe("2026-06-15");
  });

  // JS `Date` overflows rather than clamping: 31 Mar minus one month is 31 Feb, i.e. 3 Mar.
  it("should overflow into the following month when the day does not exist in the target month", () => {
    expect(monthsBefore("2026-03-31", 1)).toBe("2026-03-03");
  });
});

describe("formatPeriodLabel", () => {
  it("should omit the year when both ends fall in the same year", () => {
    expect(formatPeriodLabel({ from: "2026-06-01", to: "2026-06-30" })).toBe("Jun 1 – Jun 30");
  });

  it("should append the year to the end date when the period crosses a year boundary", () => {
    expect(formatPeriodLabel({ from: "2025-12-01", to: "2026-01-31" })).toBe("Dec 1 – Jan 31 2026");
  });

  it("should render a single-day period as the same date twice", () => {
    expect(formatPeriodLabel({ from: "2026-06-05", to: "2026-06-05" })).toBe("Jun 5 – Jun 5");
  });
});
