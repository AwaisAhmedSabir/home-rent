const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem("token");
};

// Make API request
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  getMe: async () => {
    return apiRequest("/auth/me", {
      method: "GET",
    });
  },

  seedCreator: async () => {
    return apiRequest("/auth/seed-creator", {
      method: "POST",
    });
  },

  searchUsers: async (query) => {
    return apiRequest(`/auth/search?q=${encodeURIComponent(query)}`, {
      method: "GET",
    });
  },
};

// Upload API
export const uploadAPI = {
  uploadImage: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    return data;
  },

  deleteImage: async (uuid) => {
    return apiRequest(`/upload/${uuid}`, {
      method: "DELETE",
    });
  },
};

// Posts API
export const postsAPI = {
  getAll: async (query = "") => {
    return apiRequest(`/posts${query}`, {
      method: "GET",
    });
  },

  search: async (query) => {
    return apiRequest(`/posts/search?q=${encodeURIComponent(query)}`, {
      method: "GET",
    });
  },

  getOne: async (id) => {
    return apiRequest(`/posts/${id}`, {
      method: "GET",
    });
  },

  create: async (postData) => {
    return apiRequest("/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  },

  update: async (id, postData) => {
    return apiRequest(`/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(postData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/posts/${id}`, {
      method: "DELETE",
    });
  },
};

// Comments API
export const commentsAPI = {
  getByPost: async (postId) => {
    return apiRequest(`/comments/post/${postId}`, {
      method: "GET",
    });
  },

  create: async (commentData) => {
    return apiRequest("/comments", {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  },

  update: async (id, commentData) => {
    return apiRequest(`/comments/${id}`, {
      method: "PUT",
      body: JSON.stringify(commentData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/comments/${id}`, {
      method: "DELETE",
    });
  },
};

// Likes API
export const likesAPI = {
  toggle: async (postId) => {
    return apiRequest(`/likes/${postId}`, {
      method: "POST",
    });
  },

  getByPost: async (postId) => {
    return apiRequest(`/likes/${postId}`, {
      method: "GET",
    });
  },
};
