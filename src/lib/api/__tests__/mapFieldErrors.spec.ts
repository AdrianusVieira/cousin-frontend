import type { UseFormSetError } from "react-hook-form";

import { ApiError, NetworkError } from "@/lib/api/errors";
import { mapFieldErrors } from "@/lib/api/mapFieldErrors";

type SetError = UseFormSetError<Record<string, unknown>>;

const makeSut = () => {
  const setErrorSpy = vi.fn() as unknown as SetError;

  return { setErrorSpy, sut: mapFieldErrors };
};

const makeValidationError = (fields?: Record<string, string>) =>
  new ApiError(422, { code: "VALIDATION_FAILED", message: "Invalid payload", fields });

describe("mapFieldErrors", () => {
  it("should report that it mapped a 422 carrying fields", () => {
    const { setErrorSpy, sut } = makeSut();

    expect(sut(makeValidationError({ amount: "must be positive" }), setErrorSpy)).toBe(true);
  });

  it("should forward each field message to setError", () => {
    const { setErrorSpy, sut } = makeSut();

    sut(makeValidationError({ amount: "must be positive" }), setErrorSpy);

    expect(setErrorSpy).toHaveBeenCalledWith("amount", { message: "must be positive" });
  });

  it("should map every field in the envelope", () => {
    const { setErrorSpy, sut } = makeSut();

    sut(makeValidationError({ amount: "must be positive", dueDate: "is required" }), setErrorSpy);

    expect(setErrorSpy).toHaveBeenCalledTimes(2);
  });

  it("should ignore a 409 business-rule error", () => {
    const { setErrorSpy, sut } = makeSut();
    const error = new ApiError(409, {
      code: "DELETE_BLOCKED",
      message: "In use",
      fields: { name: "x" },
    });

    expect(sut(error, setErrorSpy)).toBe(false);
  });

  it("should not touch setError for a non-422 status", () => {
    const { setErrorSpy, sut } = makeSut();
    const error = new ApiError(409, {
      code: "DELETE_BLOCKED",
      message: "In use",
      fields: { name: "x" },
    });

    sut(error, setErrorSpy);

    expect(setErrorSpy).not.toHaveBeenCalled();
  });

  it("should ignore a 422 with no fields map", () => {
    const { setErrorSpy, sut } = makeSut();

    expect(sut(makeValidationError(), setErrorSpy)).toBe(false);
  });

  // `{}` is truthy, so an empty fields map is treated as mapped. The caller then holds the
  // modal open with nothing rendered under any input. Documenting current behaviour.
  it("should report a 422 with an empty fields map as mapped", () => {
    const { setErrorSpy, sut } = makeSut();

    expect(sut(makeValidationError({}), setErrorSpy)).toBe(true);
  });

  it("should set no field error for a 422 with an empty fields map", () => {
    const { setErrorSpy, sut } = makeSut();

    sut(makeValidationError({}), setErrorSpy);

    expect(setErrorSpy).not.toHaveBeenCalled();
  });

  it("should ignore a NetworkError", () => {
    const { setErrorSpy, sut } = makeSut();

    expect(sut(new NetworkError("Network error"), setErrorSpy)).toBe(false);
  });

  it("should ignore a non-error value", () => {
    const { setErrorSpy, sut } = makeSut();

    expect(sut(null, setErrorSpy)).toBe(false);
  });
});
