import axios from 'axios';

// Membuat instance axios dengan konfigurasi dasar
const api = axios.create({
  // URL dasar ke backend Spring Boot Anda
  baseURL: 'http://localhost:8080/api', 
});

// Ini adalah bagian penting: INTERCEPTOR
// Kode di dalam interceptor ini akan berjalan SECARA OTOMATIS
// setiap kali Anda akan mengirim request menggunakan 'api'
api.interceptors.request.use(
  (config) => {
    // 1. Ambil token dari localStorage
    const token = localStorage.getItem('token');
    
    // 2. Jika token ada, tambahkan ke header Authorization
    if (token) {
      // Formatnya harus "Bearer [spasi] [token]"
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 3. Kembalikan konfigurasi yang sudah dimodifikasi
    return config;
  },
  (error) => {
    // Lakukan sesuatu jika ada error pada request
    return Promise.reject(error);
  }
);

export default api;