import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiClient, clearToken, getToken, hasToken, setToken } from "./api-client";

/** Builds a fetch Response stand-in with a JSON body. */
function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The Headers instance the single fetch call was made with. */
function sentHeaders(fetchMock: ReturnType<typeof mockFetch>): Headers {
  return fetchMock.mock.calls[0][1].headers as Headers;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("token storage", () => {
  /**
   * Route loaders run on the server during SSR, where `localStorage` does
   * not exist. An unguarded reference there crashes the whole render, so
   * every accessor must degrade to "no token" instead of throwing — public
   * endpoints need no token anyway.
   */
  it("degrades to no token when localStorage is unavailable", async () => {
    vi.stubGlobal("localStorage", undefined);

    expect(getToken()).toBeNull();
    expect(hasToken()).toBe(false);
    expect(() => setToken("abc")).not.toThrow();
    expect(() => clearToken()).not.toThrow();

    // A public GET must still go through with no Authorization header.
    const fetchMock = mockFetch(jsonResponse({ data: [] }));
    await expect(apiClient.get("/api/v1/products")).resolves.toEqual([]);
    expect(sentHeaders(fetchMock).has("Authorization")).toBe(false);
  });

  it("round-trips a token and reports presence", () => {
    expect(getToken()).toBeNull();
    expect(hasToken()).toBe(false);

    setToken("abc123");

    expect(getToken()).toBe("abc123");
    expect(hasToken()).toBe(true);

    clearToken();

    expect(getToken()).toBeNull();
    expect(hasToken()).toBe(false);
  });
});

describe("request headers", () => {
  it("attaches a bearer token when one is stored", async () => {
    setToken("abc123");
    const fetchMock = mockFetch(jsonResponse({ data: {} }));

    await apiClient.get("/api/v1/admin/messages");

    expect(sentHeaders(fetchMock).get("Authorization")).toBe("Bearer abc123");
  });

  it("sends no Authorization header when no token is stored", async () => {
    const fetchMock = mockFetch(jsonResponse({ data: {} }));

    await apiClient.get("/api/v1/services");

    expect(sentHeaders(fetchMock).has("Authorization")).toBe(false);
  });

  it("sets a JSON content type for a body", async () => {
    const fetchMock = mockFetch(jsonResponse({ data: {} }));

    await apiClient.post("/api/v1/messages", { name: "زيد" });

    expect(sentHeaders(fetchMock).get("Content-Type")).toBe("application/json");
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ name: "زيد" }));
  });

  it("leaves the content type to the browser for FormData", async () => {
    // Setting it by hand would clobber the multipart boundary and break
    // every image upload.
    const fetchMock = mockFetch(jsonResponse({ data: {} }));

    await apiClient.upload("/api/v1/admin/uploads", new FormData());

    expect(sentHeaders(fetchMock).has("Content-Type")).toBe(false);
  });
});

describe("response unwrapping", () => {
  it("unwraps the data envelope", async () => {
    mockFetch(jsonResponse({ data: { id: 1 } }));

    await expect(apiClient.get("/api/v1/services")).resolves.toEqual({ id: 1 });
  });

  it("returns the whole body when there is no data key", async () => {
    mockFetch(jsonResponse({ status: "ok" }));

    await expect(apiClient.get("/up")).resolves.toEqual({ status: "ok" });
  });

  it("resolves undefined for 204 without parsing a body", async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 204,
      json: () => Promise.reject(new Error("204 has no body to parse")),
    } as unknown as Response);

    await expect(apiClient.delete("/api/v1/admin/messages/1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  /**
   * The distinction getPage() exists for: paginated endpoints carry their
   * paging state in a sibling `meta` key, which the normal unwrap discards.
   */
  it("getPage keeps the meta envelope that get would discard", async () => {
    const body = { data: [{ id: 1 }], meta: { current_page: 2, per_page: 25, total: 30 } };

    mockFetch(jsonResponse(body));
    await expect(apiClient.get("/api/v1/admin/audit-logs")).resolves.toEqual([{ id: 1 }]);

    mockFetch(jsonResponse(body));
    await expect(apiClient.getPage("/api/v1/admin/audit-logs")).resolves.toEqual(body);
  });
});

/** Asserts the promise rejected with an ApiError and hands it back typed. */
async function rejectedApiError(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

describe("error handling", () => {
  it("throws ApiError carrying the status and validation errors", async () => {
    mockFetch(
      jsonResponse(
        { message: "The given data was invalid.", errors: { email: ["required"] } },
        422,
      ),
    );

    const error = await rejectedApiError(apiClient.post("/api/v1/messages", {}));

    expect(error.status).toBe(422);
    expect(error.message).toBe("The given data was invalid.");
    expect(error.errors).toEqual({ email: ["required"] });
  });

  it("falls back to a generic message when the body has none", async () => {
    // Laravel's throttle response and any proxy-generated error can arrive
    // without a `message` key; the client must still throw something usable.
    mockFetch(jsonResponse({}, 429));

    const error = await rejectedApiError(apiClient.get("/api/v1/admin/messages"));

    expect(error.status).toBe(429);
    expect(error.message).toBe("Request failed");
  });

  it("throws ApiError when the error body is not JSON at all", async () => {
    // e.g. an Nginx 502 HTML page — .json() rejects and is caught.
    mockFetch({
      ok: false,
      status: 502,
      json: () => Promise.reject(new SyntaxError("Unexpected token <")),
    } as unknown as Response);

    const error = await rejectedApiError(apiClient.get("/api/v1/services"));

    expect(error.status).toBe(502);
  });
});
