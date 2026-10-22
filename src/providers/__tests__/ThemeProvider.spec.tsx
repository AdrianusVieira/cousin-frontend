import { act, fireEvent, render, screen } from "@testing-library/react";

import { AppearanceOptions } from "@/components/AppearanceOptions";
import { THEME_STORAGE_KEY, THEMES } from "@/providers/themeContext";
import { ThemeProvider } from "@/providers/ThemeProvider";
import tokens from "@/styles/tokens.css?raw";

let tokenStyle: HTMLStyleElement;
let icon: HTMLLinkElement;

function makeSut() {
  return render(
    <ThemeProvider>
      <AppearanceOptions />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  tokenStyle = document.createElement("style");
  tokenStyle.textContent = tokens;
  document.head.append(tokenStyle);
  icon = document.createElement("link");
  icon.rel = "icon";
  icon.href = "/favicon.svg";
  document.head.append(icon);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true }) as MediaQueryList),
  );
});

afterEach(() => {
  tokenStyle.remove();
  icon.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Cousin appearance", () => {
  it.each(THEMES)("should persist and apply the $label palette", ({ id, label }) => {
    localStorage.setItem(THEME_STORAGE_KEY, id === "light" ? "purple" : "light");
    makeSut();
    fireEvent.click(screen.getByRole("radio", { name: label }));

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(id);
    expect(document.documentElement.dataset.palette).toBe(id);
    expect(document.documentElement.style.colorScheme).toBe(id === "light" ? "light" : "dark");
  });

  it("should restore an explicit palette after remounting", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "purple");
    makeSut();

    expect(screen.getByRole("radio", { name: "Purple" })).toBeChecked();
  });

  it("should migrate the legacy dark preference to Monochrome", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    makeSut();

    expect(screen.getByRole("radio", { name: "Monochrome" })).toBeChecked();
  });

  it("should ignore another app's saved appearance", () => {
    localStorage.setItem("mute-theme", "purple");
    makeSut();

    expect(screen.getByRole("radio", { name: "Monochrome" })).toBeChecked();
  });

  it("should synchronize a theme change from another tab", () => {
    makeSut();
    act(() => {
      localStorage.setItem(THEME_STORAGE_KEY, "blue");
      window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY }));
    });

    expect(screen.getByRole("radio", { name: "Blue" })).toBeChecked();
  });

  it("should restore the system default when storage is cleared in another tab", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "purple");
    makeSut();
    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });

    expect(screen.getByRole("radio", { name: "Monochrome" })).toBeChecked();
  });

  it("should keep the controls working when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Unavailable");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Unavailable");
    });
    makeSut();
    fireEvent.click(screen.getByRole("radio", { name: "Green" }));

    expect(screen.getByRole("radio", { name: "Green" })).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent("Browser storage is unavailable");
  });

  it.each(THEMES)("should recolor the Cousin favicon for $label", ({ id, label, color }) => {
    makeSut();
    fireEvent.click(screen.getByRole("radio", { name: label }));

    const svg = decodeURIComponent(icon.href.split(",")[1]);
    expect(svg).toContain(`fill="${color}"`);
    expect(svg).toContain(
      `fill="${id === "light" ? "#132348" : id === "purple" ? "#eee8fb" : id === "monochrome" ? "#edf1f5" : "#e0edf7"}"`,
    );
    expect(svg).toContain(
      `flood-opacity="${id === "light" ? 0 : id === "monochrome" ? 0.2 : 0.55}"`,
    );
  });

  it("should recolor the favicon after an appearance change in another tab", () => {
    makeSut();
    act(() => {
      localStorage.setItem(THEME_STORAGE_KEY, "green");
      window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY }));
    });

    expect(decodeURIComponent(icon.href)).toContain('fill="#43ef9b"');
  });
});
