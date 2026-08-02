import {
  chartColor,
  formatChartDate,
  formatChartMonth,
  formatChartTick,
  seriesColor,
} from "@/lib/chart";

const PALETTE_SIZE = 6;

describe("chartColor", () => {
  it("should resolve a semantic key against the dark theme", () => {
    expect(chartColor("net", "dark")).toBe("#569cd6");
  });

  it("should resolve the same semantic key to a different hue in the light theme", () => {
    expect(chartColor("net", "light")).toBe("#267f99");
  });

  it("should give each semantic key its own hue within a theme", () => {
    const keys = ["net", "outcome", "revenue"] as const;

    expect(new Set(keys.map((key) => chartColor(key, "dark"))).size).toBe(keys.length);
  });
});

describe("seriesColor", () => {
  it("should return a distinct colour for every index within the palette", () => {
    const colors = Array.from({ length: PALETTE_SIZE }, (_, i) => seriesColor(i, "dark"));

    expect(new Set(colors).size).toBe(PALETTE_SIZE);
  });

  it("should wrap around once the palette is exhausted", () => {
    expect(seriesColor(PALETTE_SIZE, "dark")).toBe(seriesColor(0, "dark"));
  });

  it("should stay in range for an index far beyond the palette", () => {
    expect(seriesColor(PALETTE_SIZE * 3 + 2, "light")).toBe(seriesColor(2, "light"));
  });

  it("should resolve the theme variant of the requested index", () => {
    expect(seriesColor(0, "light")).toBe("#267f99");
  });
});

describe("formatChartDate", () => {
  it("should format an ISO date coming off an axis as a short date", () => {
    expect(formatChartDate("2026-06-05")).toBe("Jun 5");
  });
});

describe("formatChartMonth", () => {
  it("should render a term as short month and two-digit year", () => {
    expect(formatChartMonth("2026-07-01")).toBe("Jul 26");
  });

  it("should read the term in local time rather than shifting to the previous month", () => {
    expect(formatChartMonth("2026-01-01")).toBe("Jan 26");
  });
});

describe("formatChartTick", () => {
  it("should hide the zero tick", () => {
    expect(formatChartTick(0)).toBe("");
  });

  it("should round a sub-thousand value to a whole number", () => {
    expect(formatChartTick(842.6)).toBe("843");
  });

  it("should render one decimal between one and ten thousand", () => {
    expect(formatChartTick(1500)).toBe("1.5k");
  });

  it("should drop the decimal at ten thousand and above", () => {
    expect(formatChartTick(12500)).toBe("13k");
  });

  it("should compact a negative value using its magnitude", () => {
    expect(formatChartTick(-2500)).toBe("-2.5k");
  });

  it("should drop the decimal for a negative value beyond minus ten thousand", () => {
    expect(formatChartTick(-12500)).toBe("-13k");
  });
});
