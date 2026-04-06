/**
 * Interface representing the configuration for our mocked fetch response.
 */
export interface MockFetchResponseConfig<T = unknown> {
  ok?: boolean;
  status?: number;
  data?: T;
  errorMessage?: string;
  stringifyData?: boolean; // If true, data will be stringified before being returned by json()
}

/**
 * Helper to mock the global node `fetch` API in Jest.
 * @param config - The desired mock response settings.
 */
export const mockGlobalFetch = <T>(
  config: MockFetchResponseConfig<T>,
): void => {
  const { ok = true, status = 200, data, errorMessage } = config;

  global.fetch = jest.fn().mockImplementation(() => {
    return Promise.resolve({
      ok,
      status,
      // Provide a mock json() method that returns the provided data
      json: () => Promise.resolve(data),
      // Optional text() method if needed in other clients
      text: () =>
        Promise.resolve(
          config.stringifyData ? JSON.stringify(data) : String(data),
        ),
      // Mock statusText for error handling
      statusText: errorMessage || (ok ? 'OK' : 'Internal Server Error'),
    });
  });
};

/**
 * Helper to assert that fetch was called with specific URL and Headers.
 */
export type FetchSpy = jest.MockedFunction<typeof fetch>;
