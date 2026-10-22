import "@testing-library/jest-dom/vitest";

// jsdom does not implement native modal dialogs. Browser QA covers focus trapping,
// Escape handling, and focus return; this shim exposes the open state to form tests.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
}
