import { describe, it, expect } from "vitest";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

describe("apiSuccess", () => {
  it("returns JSON response with default 200 status", async () => {
    const res = apiSuccess({ id: 1 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1 });
  });

  it("returns JSON response with custom status", async () => {
    const res = apiSuccess({ created: true }, 201);
    expect(res.status).toBe(201);
  });
});

describe("apiError", () => {
  it("returns error JSON with default 500 status", async () => {
    const res = apiError("fail");
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "fail" });
  });

  it("returns error JSON with custom status", async () => {
    const res = apiError("not found", 404);
    expect(res.status).toBe(404);
  });
});

describe("handleApiError", () => {
  it("returns 401 for Unauthorized", async () => {
    const res = handleApiError(new Error("Unauthorized"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 403 for Forbidden", async () => {
    const res = handleApiError(new Error("Forbidden"));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
  });

  it("returns 400 for 余额不足", async () => {
    const res = handleApiError(new Error("余额不足"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "余额不足" });
  });

  it("returns 500 for unknown errors", async () => {
    const res = handleApiError(new Error("something broke"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "服务器内部错误" });
  });

  it("returns 500 for non-Error values", async () => {
    const res = handleApiError("string error");
    expect(res.status).toBe(500);
  });
});
