import axios from 'axios';

const developmentURL = 'http://localhost:8080/api';
const productionURL = 'https://virgy-backend.onrender.com/api';


const baseURL = import.meta.env.DEV ? developmentURL : productionURL;

console.log(`API URL yang sedang digunakan: ${baseURL}`);

const api = axios.create({
  baseURL: baseURL, 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;