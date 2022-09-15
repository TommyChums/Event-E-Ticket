import supabase from "../supabase";

export default async function makeAuthenticatedRequest(url, method = 'GET', body = null) {
  const accessToken = supabase.auth.session().access_token;

  if (!accessToken) {
    return { error: 'No Access Token found', data: null };
  }

  const upperMethod = method.toUpperCase();

  const fetchConfig = {
    method: upperMethod,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'same-origin',
  };

  if (upperMethod === 'POST' && body) {
    fetchConfig.body = JSON.stringify(body);
  }

  const apiResponse = await fetch(url, fetchConfig).then((res) => res)

  const apiResponseJson = await apiResponse.json();

  const apiError = apiResponse.ok ? null : apiResponseJson.error || 'Internal Server Error';

  return { error: apiError, data: apiResponseJson };
};

export function makeAuthenticatedPostRequest(url, body) {
  return makeAuthenticatedRequest(url, 'POST', body);
};

export function makeAuthenticatedGetRequest(url, body) {
  return makeAuthenticatedRequest(url, 'GET');
};
