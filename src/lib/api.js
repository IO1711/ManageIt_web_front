export class ApiRequestError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status ?? 500;
    this.code = options.code ?? "REQUEST_FAILED";
    this.details = options.details ?? {};
  }
}

export async function requestJson(path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const requestOptions = {
    method: options.method ?? "GET",
    credentials: "include",
    headers
  };

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    requestOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(path, requestOptions);
  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const errorBody = payload?.error;

    throw new ApiRequestError(
      errorBody?.message ?? `Request failed with status ${response.status}`,
      {
        status: response.status,
        code: errorBody?.code,
        details: errorBody?.details
      }
    );
  }

  return payload;
}

export function getApiErrorMessage(error, fallback = "") {
  if (!error) {
    return fallback;
  }

  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function isApiErrorStatus(error, statusCode) {
  return error instanceof ApiRequestError && error.status === statusCode;
}

export function isApiErrorCode(error, errorCode) {
  return error instanceof ApiRequestError && error.code === errorCode;
}

async function parseResponseBody(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}
