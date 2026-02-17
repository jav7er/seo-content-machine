/**
 * Resilient fetcher with automatic retries for transient errors (502, 503, 504)
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  backoff = 1000
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // If successful or client error (not 5xx), return immediately
    if (response.ok || (response.status >= 400 && response.status < 500)) {
      return response;
    }

    // Retry on 502, 503, 504
    if ([502, 503, 504].includes(response.status) && retries > 0) {
      console.warn(`Transient error ${response.status} fetching ${url}. Retrying in ${backoff}ms... (${retries} left)`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      console.error(`Network error fetching ${url}. Retrying in ${backoff}ms... (${retries} left)`, error);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}
