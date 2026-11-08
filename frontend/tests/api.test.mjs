import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/api.js";

test("1. GET thanh cong tra ve du lieu JSON", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.match(url, /\/sections$/);
    assert.equal(options.method, "GET");
    return new Response(JSON.stringify([{ class_id: "WEB-01" }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const data = await api("/sections");
    assert.deepEqual(data, [{ class_id: "WEB-01" }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("2. POST voi body JSON truyen dung header va nhan 201", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.match(url, /\/enrollments$/);
    assert.equal(options.method, "POST");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.equal(
      options.body,
      JSON.stringify({ student_id: "22000004", class_section_id: "WEB-01" }),
    );
    return new Response(JSON.stringify({ message: "Dang ky thanh cong" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const data = await api("/enrollments", {
      method: "POST",
      body: { student_id: "22000004", class_section_id: "WEB-01" },
    });
    assert.equal(data.message, "Dang ky thanh cong");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("3. DELETE thanh cong tra 204 No Content -> api() tra ve null", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.method, "DELETE");
    return new Response(null, { status: 204 });
  };

  try {
    const data = await api("/enrollments/22000004/WEB-01", {
      method: "DELETE",
    });
    assert.equal(data, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("4. HTTP 404 tra detail dang chuoi nem loi dung status", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({ detail: "Khong tim thay sinh vien" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    await assert.rejects(
      async () => {
        await api("/students/99999999/enrollments");
      },
      (err) => {
        assert.equal(err.status, 404);
        assert.match(err.message, /Khong tim thay sinh vien/);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("5. HTTP 409 Conflict tra detail het cho nem dung loi", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({ detail: "Lop hoc phan da het cho" }),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    await assert.rejects(
      async () => {
        await api("/enrollments", {
          method: "POST",
          body: { student_id: "22000002", class_section_id: "RACE-01" },
        });
      },
      (err) => {
        assert.equal(err.status, 409);
        assert.match(err.message, /Lop hoc phan da het cho/);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("6. HTTP 422 tra detail dang mang (Pydantic) ghep cac message", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        detail: [
          { msg: "String should have at least 8 characters" },
          { msg: "Invalid format" },
        ],
      }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    await assert.rejects(
      async () => {
        await api("/enrollments", {
          method: "POST",
          body: { student_id: "123", class_section_id: "WEB-01" },
        });
      },
      (err) => {
        assert.equal(err.status, 422);
        assert.match(
          err.message,
          /String should have at least 8 characters; Invalid format/,
        );
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("7. Loi mang / mat ket noi nem thong bao huong dan Backend/CORS", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  try {
    await assert.rejects(
      async () => {
        await api("/health");
      },
      (err) => {
        assert.match(err.message, /Không nhận được phản hồi API/);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("8. Yeu cau bi huy boi AbortController nem lai AbortError", async () => {
  const originalFetch = globalThis.fetch;
  const abortError = new Error("The operation was aborted");
  abortError.name = "AbortError";

  globalThis.fetch = async () => {
    throw abortError;
  };

  try {
    await assert.rejects(
      async () => {
        const controller = new AbortController();
        controller.abort();
        await api("/sections", { signal: controller.signal });
      },
      (err) => {
        assert.equal(err.name, "AbortError");
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

