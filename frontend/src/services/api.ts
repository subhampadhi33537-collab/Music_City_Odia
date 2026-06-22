const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function getHeaders(isMultipart = false) {
  const token = localStorage.getItem('sb-token');
  const headers: Record<string, string> = {};
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export const api = {
  auth: {
    register: async (payload: { full_name: string; phone: string; email: string; password: string }) => {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Failed to create account');
      }

      return res.json();
    },
  },

  songs: {
    list: async (genreId?: string, search?: string) => {
      let url = `${API_BASE_URL}/songs`;
      const params = new URLSearchParams();
      if (genreId) params.append('genre_id', genreId);
      if (search) params.append('search', search);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load songs');
      return res.json();
    },
    
    get: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/songs/${id}`);
      if (!res.ok) throw new Error('Failed to load song details');
      return res.json();
    },
    
    getDownloadUrl: async (id: string) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/songs/${id}/download`, { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to get download link');
      }
      return res.json(); // { download_url: '...' }
    },
    
    getStreamUrl: async (id: string) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/songs/${id}/stream`, { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to get streaming link');
      }
      return res.json(); // { stream_url: '...' }
    }
  },
  
  genres: {
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/genres`);
      if (!res.ok) throw new Error('Failed to load genres');
      return res.json();
    }
  },
  
  orders: {
    create: async (songIds: string[]) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ song_ids: songIds })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create order');
      }
      return res.json();
    },
    
    verify: async (orderId: string, paymentId: string, signature: string) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/orders/verify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Payment verification failed');
      }
      return res.json();
    },
    
    listPurchases: async () => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/me/purchases`, { headers });
      if (!res.ok) throw new Error('Failed to load purchases library');
      return res.json();
    }
  },
  
  admin: {
    listSongs: async () => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/songs`, { headers });
      if (!res.ok) throw new Error('Failed to load admin song inventory');
      return res.json();
    },

    uploadSong: async (formData: FormData) => {
      const headers = await getHeaders(true); // Is multipart
      const res = await fetch(`${API_BASE_URL}/admin/songs`, {
        method: 'POST',
        headers,
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to upload song');
      }
      return res.json();
    },
    
    updateSong: async (id: string, payload: any) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/songs/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update song');
      return res.json();
    },
    
    deleteSong: async (id: string) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/songs/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete song');
      return res.json();
    },
    
    listOrders: async () => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/orders`, { headers });
      if (!res.ok) throw new Error('Failed to load admin orders log');
      return res.json();
    },
    
    getStats: async () => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/stats`, { headers });
      if (!res.ok) throw new Error('Failed to load admin metrics');
      return res.json();
    }
  },

  bookings: {
    submit: async (payload: any) => {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Failed to submit booking');
      }

      return res.json();
    }
  }
};
