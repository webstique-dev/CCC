const rawBase = import.meta.env.VITE_API_BASE_URL || window.CARGO_APP_API_BASE || '/api';
const API_BASE = rawBase.replace(/\/+$/, '');

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('cargo_token');
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('cargo_token');
    localStorage.removeItem('cargo_user');
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Session expired. Please log in again.');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      const msg = data.detail?.message || data.detail || 'Request failed';
      const error = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      error.data = data;
      error.status = response.status;
      throw error;
    }
    return data;
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response;
}

export const api = {
  login: (username, password) =>
    request('/auth/token', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => request('/auth/me'),

  getInvoices: (search, status) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'All') params.append('status', status);
    const qs = params.toString();
    return request(`/invoices${qs ? `?${qs}` : ''}`);
  },

  getTrash: (search, status) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'All') params.append('status', status);
    const qs = params.toString();
    return request(`/invoices/trash${qs ? `?${qs}` : ''}`);
  },

  getInvoice: (id) => request(`/invoices/${id}`),

  updateInvoice: (id, payload) =>
    request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteInvoice: (id) =>
    request(`/invoices/${id}`, {
      method: 'DELETE',
    }),

  restoreInvoice: (id) =>
    request(`/invoices/${id}/restore`, {
      method: 'POST',
    }),

  permanentDeleteInvoice: (id) =>
    request(`/invoices/${id}/permanent`, {
      method: 'DELETE',
    }),

  uploadInvoice: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/invoices/upload', {
      method: 'POST',
      body: formData,
    });
  },

  validateInvoice: (id) =>
    request(`/invoices/${id}/validate`, {
      method: 'POST',
    }),

  generatePdf: (id) =>
    request(`/invoices/${id}/generate`, {
      method: 'POST',
    }),

  getPdfBlob: async (id) => {
    const res = await request(`/invoices/${id}/pdf`);
    return await res.blob();
  },

  getPdfUrl: (id) => `${API_BASE}/invoices/${id}/pdf`,
};
