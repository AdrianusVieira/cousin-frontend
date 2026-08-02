import {
  formatDate,
  formatDateWithYear,
  formatDelta,
  formatMoney,
  formatMoneyDelta,
  formatPercent,
} from "@/lib/format";

describe("formatMoney", () => {
  it("should always render two fraction digits", () => {
    expect(formatMoney("1234.5")).toBe("1,234.50");
  });

  it("should group thousands with a separator", () => {
    expect(formatMoney("1234567.89")).toBe("1,234,567.89");
  });

  it("should keep the sign on a negative amount", () => {
    expect(formatMoney("-42.75")).toBe("-42.75");
  });

  it("should truncate to one decimal in compact mode above a thousand", () => {
    expect(formatMoney("1234.56", true)).toBe("1.2k");
  });

  it("should compact a negative amount below minus one thousand", () => {
    expect(formatMoney("-2500", true)).toBe("-2.5k");
  });

  it("should fall back to the full format in compact mode below a thousand", () => {
    expect(formatMoney("999.99", true)).toBe("999.99");
  });

  it("should compact exactly one thousand", () => {
    expect(formatMoney("1000", true)).toBe("1.0k");
  });
});

describe("formatDate", () => {
  it("should render an ISO date as day and short month", () => {
    expect(formatDate("2026-06-05")).toBe("Jun 5");
  });

  it("should read the ISO date in local time rather than shifting a day back", () => {
    expect(formatDate("2026-01-01")).toBe("Jan 1");
  });
});

describe("formatDateWithYear", () => {
  it("should append the year to the short date", () => {
    expect(formatDateWithYear("2026-06-05")).toBe("Jun 5, 2026");
  });
});

describe("formatPercent", () => {
  it("should render one decimal place with a percent sign", () => {
    expect(formatPercent(42.35)).toBe("42.4%");
  });

  it("should render a whole number with a trailing decimal", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });
});

describe("formatDelta", () => {
  it("should prefix a positive value with a plus sign", () => {
    expect(formatDelta(3.14)).toBe("+3.1 pts");
  });

  it("should leave the native minus sign on a negative value", () => {
    expect(formatDelta(-3.14)).toBe("-3.1 pts");
  });

  it("should treat zero as positive", () => {
    expect(formatDelta(0)).toBe("+0.0 pts");
  });

  it("should use the supplied unit", () => {
    expect(formatDelta(2, "%")).toBe("+2.0 %");
  });
});

describe("formatMoneyDelta", () => {
  it("should prefix a positive amount with a plus sign", () => {
    expect(formatMoneyDelta("1500")).toBe("+1,500.00");
  });

  it("should not double up the sign on a negative amount", () => {
    expect(formatMoneyDelta("-1500")).toBe("-1,500.00");
  });
});
