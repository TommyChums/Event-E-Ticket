export default async function makeAuthenticatedRequest(url, method = 'GET', body = null) {
  const upperMethod = method.toUpperCase();

  const fetchConfig = {
    method: upperMethod,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin'
  };

  if (upperMethod === 'POST' && body) {
    fetchConfig.body = JSON.stringify(body);
  }

  const apiResponse = await fetch(url, fetchConfig).then((res) => res);

  const apiResponseJson = await apiResponse.json();

  const apiError = apiResponse.ok ? null : apiResponseJson.error || 'Internal Server Error';

  return { error: apiError, data: apiResponseJson };
};

export function makeAuthenticatedPostRequest(url, body) {
  return makeAuthenticatedRequest(url, 'POST', body);
};

export function makeAuthenticatedGetRequest(url) {
  return makeAuthenticatedRequest(url, 'GET');
};
