import axios from 'axios';

const api = axios.create({
    baseURL: 'https://apiaggregator.pythonanywhere.com/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;
