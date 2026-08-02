import { ApiError, NetworkError } from "@/lib/api/errors";
import { queryClient } from "@/lib/query";

type RetryFn = (failureCount: number, error: unknown) => boolean;
type RetryDelayFn = (attempt: number) => number;

const defaults = queryClient.getDefaultOptions();

const queryRetry = defaults.queries?.retry as RetryFn;
const queryRetryDelay = defaults.queries?.retryDelay as RetryDelayFn;
const mutationRetry = defaults.mutations?.retry as RetryFn;

const makeApiError = (status: number) =>
  new ApiError(status, { code: "SOME_CODE", message: "Boom" });

describe("query retry policy", () => {
  it("should retry a 5xx response", () => {
    expect(queryRetry(0, makeApiError(500))).toBe(true);
  });

  it("should retry a network failure", () => {
    expect(queryRetry(0, new NetworkError("Network error", undefined, "GET"))).toBe(true);
  });

  it("should not retry a 404", () => {
    expect(queryRetry(0, makeApiError(404))).toBe(false);
  });

  it("should not retry a 422 validation failure", () => {
    expect(queryRetry(0, makeApiError(422))).toBe(false);
  });

  it("should not retry a 401", () => {
    expect(queryRetry(0, makeApiError(401))).toBe(false);
  });

  it("should give up after four attempts", () => {
    expect(queryRetry(4, new NetworkError("Network error"))).toBe(false);
  });

  it("should still retry on the fourth failure", () => {
    expect(queryRetry(3, new NetworkError("Network error"))).toBe(true);
  });
});

describe("query retry delay", () => {
  it("should start at one second", () => {
    expect(queryRetryDelay(0)).toBe(1_000);
  });

  it("should double on each attempt", () => {
    expect(queryRetryDelay(2)).toBe(4_000);
  });

  it("should cap the backoff at fifteen seconds", () => {
    expect(queryRetryDelay(10)).toBe(15_000);
  });
});

describe("mutation retry policy", () => {
  it("should retry a dropped DELETE", () => {
    expect(mutationRetry(0, new NetworkError("Network error", undefined, "DELETE"))).toBe(true);
  });

  it("should retry a dropped PATCH", () => {
    expect(mutationRetry(0, new NetworkError("Network error", undefined, "PATCH"))).toBe(true);
  });

  // A dropped connection can't prove the create didn't reach the server — retrying risks a duplicate.
  it("should never retry a dropped POST", () => {
    expect(mutationRetry(0, new NetworkError("Network error", undefined, "POST"))).toBe(false);
  });

  it("should not retry a NetworkError with no recorded method", () => {
    expect(mutationRetry(0, new NetworkError("Network error"))).toBe(false);
  });

  it("should not retry a 5xx, since the mutation may already have been applied", () => {
    expect(mutationRetry(0, makeApiError(500))).toBe(false);
  });

  it("should give up after two attempts", () => {
    expect(mutationRetry(2, new NetworkError("Network error", undefined, "PATCH"))).toBe(false);
  });
});
