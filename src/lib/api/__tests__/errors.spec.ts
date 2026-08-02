import { ApiError, isApiError, NetworkError } from "@/lib/api/errors";

const makeSut = (status: number, fields?: Record<string, string>) => {
  const sut = new ApiError(status, {
    code: "VALIDATION_FAILED",
    message: "Invalid payload",
    fields,
  });

  return { sut };
};

describe("ApiError", () => {
  it("should expose the envelope message as the Error message", () => {
    const { sut } = makeSut(422);

    expect(sut.message).toBe("Invalid payload");
  });

  it("should carry the HTTP status", () => {
    const { sut } = makeSut(422);

    expect(sut.status).toBe(422);
  });

  it("should carry the envelope code", () => {
    const { sut } = makeSut(422);

    expect(sut.code).toBe("VALIDATION_FAILED");
  });

  it("should expose the field map when the envelope carries one", () => {
    const { sut } = makeSut(422, { amount: "must be positive" });

    expect(sut.fields).toEqual({ amount: "must be positive" });
  });

  it("should leave fields undefined when the envelope omits them", () => {
    const { sut } = makeSut(409);

    expect(sut.fields).toBeUndefined();
  });

  it("should be named ApiError so it survives serialization boundaries", () => {
    const { sut } = makeSut(500);

    expect(sut.name).toBe("ApiError");
  });

  it("should flag a 422 as a validation failure", () => {
    const { sut } = makeSut(422);

    expect(sut.isValidation).toBe(true);
  });

  it("should not flag a 409 as a validation failure", () => {
    const { sut } = makeSut(409);

    expect(sut.isValidation).toBe(false);
  });

  it("should flag a 409 as a business-rule block", () => {
    const { sut } = makeSut(409);

    expect(sut.isBusinessRule).toBe(true);
  });

  it("should flag a 401 as unauthorized", () => {
    const { sut } = makeSut(401);

    expect(sut.isUnauthorized).toBe(true);
  });

  it("should not flag a 403 as unauthorized", () => {
    const { sut } = makeSut(403);

    expect(sut.isUnauthorized).toBe(false);
  });
});

describe("NetworkError", () => {
  it("should retain the originating HTTP method so the retry policy can inspect it", () => {
    const sut = new NetworkError("Network error", new TypeError("failed to fetch"), "POST");

    expect(sut.method).toBe("POST");
  });

  it("should retain the underlying cause", () => {
    const cause = new TypeError("failed to fetch");
    const sut = new NetworkError("Network error", cause);

    expect(sut.cause).toBe(cause);
  });

  it("should be named NetworkError", () => {
    const sut = new NetworkError("Network error");

    expect(sut.name).toBe("NetworkError");
  });
});

describe("isApiError", () => {
  it("should accept an ApiError", () => {
    const { sut } = makeSut(422);

    expect(isApiError(sut)).toBe(true);
  });

  it("should reject a NetworkError", () => {
    expect(isApiError(new NetworkError("Network error"))).toBe(false);
  });

  it("should reject a plain object shaped like an ApiError", () => {
    expect(isApiError({ code: "VALIDATION_FAILED", status: 422 })).toBe(false);
  });

  it("should reject null", () => {
    expect(isApiError(null)).toBe(false);
  });
});
