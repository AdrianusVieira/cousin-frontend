import { BRAND_ACCENT_PATH, BRAND_BODY_PATH, BRAND_VIEW_BOX } from "./brandGeometry";

export { BRAND_ACCENT_PATH, BRAND_BODY_PATH, BRAND_VIEW_BOX } from "./brandGeometry";

// Favicon colors must be resolved: standalone SVGs cannot inherit the page's tokens.
export function brandSvg(accent: string, body: string, glow: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BRAND_VIEW_BOX}"><defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="18" flood-color="${accent}" flood-opacity="${glow}"/></filter></defs><g fill-rule="evenodd" filter="url(#glow)"><path fill="${body}" d="${BRAND_BODY_PATH}"/><path fill="${accent}" d="${BRAND_ACCENT_PATH}"/></g></svg>`;
}
