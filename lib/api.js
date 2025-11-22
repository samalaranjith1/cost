const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '')
  ? 'https://flavourheaven.in/costonomy-services'
  : 'https://flavourheaven.in/costonomy-services/';

export function getOutletId() {
  if (typeof window === 'undefined') return 0;
  const userData = localStorage.getItem('userData');
  if (userData) {
    let userDataObject = JSON.parse(userData);
    return userDataObject.outletId;
  }
  return 0;
}

export function getUserData() {
  if (typeof window === 'undefined') return null;
  let userData = localStorage.getItem('userData');
  if (userData) {
    return JSON.parse(userData);
  }
  return null;
}

export function getUserDepartments() {
  if (typeof window === 'undefined') return null;
  let userData = localStorage.getItem('userData');
  if (userData) {
    let userDataObject = JSON.parse(userData);
    let userDepartmentsArray = userDataObject.departments;
    if (userDepartmentsArray?.length) {
      return userDepartmentsArray.join(',');
    }
  }
  return null;
}

export function getRoleId() {
  if (typeof window === 'undefined') return null;
  let userData = localStorage.getItem('userData');
  if (userData) {
    let userDataObject = JSON.parse(userData);
    return userDataObject.roleId;
  }
  return null;
}

export function getDefaultParams() {
  let outletId = 0;
  let userId = 0;
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('userData');
    if (userData) {
      let userDataObject = JSON.parse(userData);
      outletId = userDataObject.outletId;
      userId = userDataObject.id;
    }
  }
  const defaultParams = {
    outlet: outletId,
    userId: userId
  };
  return defaultParams;
}

export function buildUrl(endpoint) {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : API_BASE_URL + '/';
  const path = endpoint.replace(/^\/+/, '');
  return new URL(path, base);
}

export function mergeQueryParams(url, params = {}, defaultParams = {}) {
  const urlObj = url.startsWith('http')
    ? new URL(url)
    : buildUrl(url);

  const allParams = { ...defaultParams, ...params };
  Object.keys(allParams).forEach(key => urlObj.searchParams.set(key, allParams[key]));
  return urlObj;
}

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};

export async function apiRequest(method, endpoint, data = {}, customHeaders = {}) {
  const defaultParams = getDefaultParams();
  const url = method === 'GET'
    ? mergeQueryParams(endpoint, data, defaultParams)
    : (endpoint.startsWith('http')
      ? new URL(endpoint)
      : buildUrl(endpoint));
  const options = {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      ...customHeaders
    }
  };

  if (method !== 'GET') {
    options.body = JSON.stringify({ ...defaultParams, ...data });
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  const contentType = response.headers.get('content-type');
  if (response.status === 204 || !contentType) {
    return null;
  }

  return response.json();
}

export function formatDate(inputDate) {
  const date = new Date(inputDate);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);

  let daySuffix;
  if (day >= 11 && day <= 13) {
    daySuffix = 'th';
  } else {
    switch (day % 10) {
      case 1: daySuffix = 'st'; break;
      case 2: daySuffix = 'nd'; break;
      case 3: daySuffix = 'rd'; break;
      default: daySuffix = 'th'; break;
    }
  }

  return `${day}${daySuffix} ${month} ${year}`;
}

export function clearAuthData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }
}

export async function fileUploadRequest(method, endpoint, formData, customHeaders = {}) {
  const defaultParams = getDefaultParams();
  const urlObj = buildUrl(endpoint);
  Object.keys(defaultParams).forEach(key => urlObj.searchParams.set(key, defaultParams[key]));

  const options = {
    method,
    headers: {
      ...customHeaders
    },
    body: formData
  };

  const response = await fetch(urlObj, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  const contentType = response.headers.get('content-type');
  if (response.status === 204 || !contentType) {
    return null;
  }

  return response.json();
}
