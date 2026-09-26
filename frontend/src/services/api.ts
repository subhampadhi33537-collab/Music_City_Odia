export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const resolveAssetUrl = (url?: string): string => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};

export const normalizeSongRecord = (song: any): SongRecord => {
  return {
    ...song,
    id: String(song.id),
    cover_url: resolveAssetUrl(song.cover_url || song.cover_image_url),
    cover_image_url: resolveAssetUrl(song.cover_image_url || song.cover_url),
    preview_url: resolveAssetUrl(song.preview_url || song.preview_storage_path),
    preview_storage_path: resolveAssetUrl(song.preview_storage_path || song.preview_url),
    drive_stream_url: resolveAssetUrl(song.drive_stream_url || song.full_storage_path),
  };
};

export interface SongRecord {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre_id?: string;
  description?: string;
  lyrics?: string;
  cover_url?: string;
  cover_image_url?: string;
  preview_url: string;
  preview_storage_path?: string;
  full_storage_path?: string;
  drive_file_id?: string;
  drive_web_link?: string;
  drive_download_link?: string;
  drive_stream_url?: string;
  price: number;
  duration_seconds?: number;
  is_featured?: boolean;
  is_published?: boolean;
  genres?: { name: string };
  created_at?: string;
}

export interface DriveStatus {
  configured: boolean;
  folder_id: string;
  folder_url: string;
  auth_method: string;
  storage_mode: string;
  folder_name?: string;
  folder_accessible?: boolean;
  folder_error?: string;
}

export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, delay = 2000): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(35000)
      });
      return response;
    } catch (err: any) {
      if (i === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Failed to connect after multiple retries');
}

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
      const res = await fetchWithRetry(`${API_BASE_URL}/auth/register`, {
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

    login: async (payload: { email: string; password: string }) => {
      const res = await fetchWithRetry(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Invalid email or password');
      }

      return res.json();
    },

    updateProfile: async (payload: { full_name: string; phone: string }) => {
      const headers = await getHeaders();
      const res = await fetchWithRetry(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Failed to update profile');
      }

      return res.json();
    },
  },

  songs: {
    list: async (genreId?: string, search?: string): Promise<SongRecord[]> => {
      let url = `${API_BASE_URL}/songs`;
      const params = new URLSearchParams();
      if (genreId) params.append('genre_id', genreId);
      if (search) params.append('search', search);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error('Failed to load songs');
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeSongRecord) : [];
    },
    
    get: async (id: string): Promise<SongRecord> => {
      const res = await fetchWithRetry(`${API_BASE_URL}/songs/${id}`);
      if (!res.ok) throw new Error('Failed to load song details');
      return normalizeSongRecord(await res.json());
    },
    
    getDownloadUrl: async (id: string) => {
      const headers = await getHeaders();
      const res = await fetchWithRetry(`${API_BASE_URL}/songs/${id}/download`, { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to get download link');
      }
      return res.json(); // { download_url: '...' }
    },
    
    getStreamUrl: async (id: string) => {
      const headers = await getHeaders();
      const res = await fetchWithRetry(`${API_BASE_URL}/songs/${id}/stream`, { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to get streaming link');
      }
      return res.json(); // { stream_url: '...' }
    }
  },
  
  genres: {
    list: async () => {
      const res = await fetchWithRetry(`${API_BASE_URL}/genres`);
      if (!res.ok) throw new Error('Failed to load genres');
      return res.json();
    }
  },
  
  orders: {
    create: async (songIds: string[]) => {
      const headers = await getHeaders();
      const res = await fetchWithRetry(`${API_BASE_URL}/orders`, {
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
      const res = await fetchWithRetry(`${API_BASE_URL}/orders/verify`, {
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
    
    listPurchases: async (): Promise<SongRecord[]> => {
      const headers = await getHeaders();
      const res = await fetchWithRetry(`${API_BASE_URL}/me/purchases`, { headers });
      if (!res.ok) throw new Error('Failed to load purchases library');
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeSongRecord) : [];
    }
  },
  
  admin: {
    listSongs: async (): Promise<SongRecord[]> => {
      const headers = await getHeaders();
      const res = await fetchWithRetry(`${API_BASE_URL}/admin/songs`, { headers });
      if (!res.ok) throw new Error('Failed to load admin song inventory');
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeSongRecord) : [];
    },

    uploadSong: async (formData: FormData) => {
      const headers = await getHeaders(true); // Is multipart
      const res = await fetchWithRetry(`${API_BASE_URL}/admin/songs`, {
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
      const res = await fetchWithRetry(`${API_BASE_URL}/admin/songs/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update song');
      return res.json();
    },
    
    deleteSong: async (id: string) => {
      const headers = await getHeaders();
      const res = await fetchWithRetry(`${API_BASE_URL}/admin/songs/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete song');
      return res.json();
    },
    
    listOrders: async () => {
      const headers = await getHeaders();
      const res = await fetchWithRetry(`${API_BASE_URL}/admin/orders`, { headers });
      if (!res.ok) throw new Error('Failed to load admin orders log');
      return res.json();
    },
    
    getStats: async () => {
      const headers = await getHeaders();
      const res = await fetchWithRetry(`${API_BASE_URL}/admin/stats`, { headers });
      if (!res.ok) throw new Error('Failed to load admin metrics');
      return res.json();
    },

    getDriveStatus: async (): Promise<DriveStatus> => {
      const headers = await getHeaders();
      const res = await fetchWithRetry(`${API_BASE_URL}/admin/drive/status`, { headers });
      if (!res.ok) throw new Error('Failed to load Google Drive status');
      return res.json();
    },

    listBookings: async (status?: string) => {
      const headers = await getHeaders();
      let url = `${API_BASE_URL}/admin/bookings`;
      if (status && status !== 'all') {
        url += `?status=${encodeURIComponent(status)}`;
      }
      const res = await fetchWithRetry(url, { headers });
      if (!res.ok) throw new Error('Failed to load studio bookings');
      return res.json();
    },

    updateBookingStatus: async (id: number | string, newStatus: string) => {
      const headers = await getHeaders();
      const res = await fetchWithRetry(`${API_BASE_URL}/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update booking status');
      return res.json();
    },

    deleteBooking: async (id: number | string) => {
      const headers = await getHeaders();
      const res = await fetchWithRetry(`${API_BASE_URL}/admin/bookings/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete booking');
      return res.json();
    }
  },
  
  bookings: {
    submit: async (payload: any) => {
      const res = await fetchWithRetry(`${API_BASE_URL}/bookings`, {
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
