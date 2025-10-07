<script setup>
import api from './api';
import {ref, reactive, onMounted} from 'vue';
import { setCookie, getCookie, eraseCookie } from './utils/cookies';

const authMode = ref('login'); // 'login' or 'register'
const registerForm = reactive({ username: '', email: '', password: '' });
const loginForm = reactive({ username: '', password: '' });
const authError = ref(null)

const authResponse = ref(null);
const apiResponse = ref(null);
const error = ref(null);

const accessToken = ref(null);
const apiKey = ref(null);
const apiKeyMessage = ref(null);

// Loading states
const isRegistering = ref(false);
const isLoggingIn = ref(false);
const isCreatingApiKey = ref(false);
const isCallingApi = ref(false);

const params = reactive({
    weather: { city: '', country: '' },
    news: { category: '' },
    github: { username: '' },
    simplePrice: { ids: '', vs_currencies: '' },
    coinDetail: { id: '' },
    marketChart: { id: '', vs_currency: '', days: '' },
    coinHistory: { id: '', date: '' },
    search: { query: '' },
    trending: {},
    exchangeRate: { currency: '' },
    pair: { from: '', to: '', amount: '' }
});

onMounted(() => {
    accessToken.value = getCookie('accessToken');
    apiKey.value = localStorage.getItem('apiKey');
    apiKeyMessage.value = localStorage.getItem('apiKeyMessage');
});

const handleRequest = async (requestFunc) => {
    error.value = null;
    apiResponse.value = null;
    authResponse.value = null;
    try {
        const res = await requestFunc();
        return res.data;
    } catch (err) {
        if (err.response.data.password) {
          authError.value = `password: ${err.response.data.password}`
        } else if (err.response.data.username) {
          authError.value = `username: ${err.response.data.username}`
        } else {
          authError.value = err.response.data.detail
        }
        const errorData = err.response ? err.response.data : { message: err.message };
        error.value = JSON.stringify(errorData, null, 2);
        console.error(err);
    }
};

const register = async () => {
    isRegistering.value = true;
    const data = await handleRequest(() => api.post('/register/', registerForm));
    if (data) {
        authResponse.value = "Registration successful! Please login.";
        authMode.value = 'login';
    }
    isRegistering.value = false;
};

const login = async () => {
    isLoggingIn.value = true;
    const data = await handleRequest(() => api.post('/token/', loginForm));
    if (data && data.access) {
        accessToken.value = data.access;
        setCookie('accessToken', data.access, 7);
        authResponse.value = "Login successful! Now create your API key.";
    }
    isLoggingIn.value = false;
};

const createApiKey = async () => {
    isCreatingApiKey.value = true;
    const token = getCookie('accessToken');
    const data = await handleRequest(() => api.post('/create-api-key/', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
    }));
    console.log(data)
    if (data && data.api_key) {
        apiKey.value = data.api_key;
        apiKeyMessage.value = data.message
        localStorage.setItem('apiKey', data.api_key);
        localStorage.setItem('apiKeyMessage', data.message);
        authResponse.value = `API Key created: ${data.api_key}. Save it securely!`;
    }
    isCreatingApiKey.value = false;
};

const logout = () => {
    accessToken.value = null;
    apiKey.value = null;
    eraseCookie('accessToken');
    localStorage.removeItem('apiKey');
    authResponse.value = "You have been logged out.";
};

const callApi = async (endpointKey) => {
    isCallingApi.value = true;
    const key = localStorage.getItem('apiKey');
    if (!key) {
        error.value = "API Key not found. Please create one first.";
        isCallingApi.value = false;
        return;
    }

    const endpointMap = {
        weather: { url: '/weather/', params: params.weather },
        news: { url: '/news/', params: params.news },
        github: { url: '/github/user/', params: params.github },
        simplePrice: { url: '/simple/price/', params: params.simplePrice },
        coinDetail: { url: '/coins/', params: params.coinDetail },
        marketChart: { url: '/coins/market_chart/', params: params.marketChart },
        coinHistory: { url: '/coins/history/', params: params.coinHistory },
        search: { url: '/search/', params: params.search },
        trending: { url: '/search/trending/', params: {}},
        exchangeRate: { url: '/exchanges-rate/', params: params.exchangeRate },
        pair: { url: '/pair/', params: params.pair }
    };

    const endpoint = endpointMap[endpointKey];
    if (!endpoint) {
        error.value = `Endpoint "${endpointKey}" not found.`;
        isCallingApi.value = false;
        return;
    }

    const data = await handleRequest(() => api.get(endpoint.url, {
        headers: { 'Authorization': `Api-Key ${key}` },
        params: endpoint.params
    }));

    if (data) {
        apiResponse.value = JSON.stringify(data, null, 2);
    }
    isCallingApi.value = false;
};
</script>

<template>
    <div class="container py-5">
        <h1 class="mb-4 text-center">API Aggregator</h1>

        <!-- Authentication Section -->
        <div class="card" v-if="!apiKey">
            <div class="card-header">
                <ul class="nav nav-tabs card-header-tabs">
                    <li class="nav-item">
                        <a class="nav-link" :class="{ active: authMode === 'login' }" @click="authMode = 'login'">Login</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" :class="{ active: authMode === 'register' }" @click="authMode = 'register'">Register</a>
                    </li>
                </ul>
            </div>
            <div class="card-body">
                <!-- Registration Form -->
                <div v-if="authMode === 'register'">
                    <h5 class="card-title">Register New User</h5>
                    <form @submit.prevent="register">
                        <div class="mb-3">
                            <label for="reg-username" class="form-label">Username</label>
                            <input type="text" class="form-control" id="reg-username" v-model="registerForm.username" required :disabled="isRegistering">
                        </div>
                        <div class="mb-3">
                            <label for="reg-email" class="form-label">Email</label>
                            <input type="email" class="form-control" id="reg-email" v-model="registerForm.email" :disabled="isRegistering">
                        </div>
                        <div class="mb-3">
                            <label for="reg-password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="reg-password" v-model="registerForm.password" required :disabled="isRegistering">
                        </div>
                        <button type="submit" class="btn btn-primary" :disabled="isRegistering">
                            <span v-if="isRegistering" class="spinner-border spinner-border-sm me-2" role="status"></span>
                            {{ isRegistering ? 'Registering...' : 'Register' }}
                        </button>
                    </form>
                    <p v-if="authError" class="alert alert-danger mt-3">{{authError}}</p>
                </div>

                <!-- Login Form -->
                <div v-if="authMode === 'login'">
                    <h5 class="card-title">Login</h5>
                    <form @submit.prevent="login">
                        <div class="mb-3">
                            <label for="login-username" class="form-label">Username</label>
                            <input type="text" class="form-control" id="login-username" v-model="loginForm.username" required :disabled="isLoggingIn">
                        </div>
                        <div class="mb-3">
                            <label for="login-password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="login-password" v-model="loginForm.password" required :disabled="isLoggingIn">
                        </div>
                        <button type="submit" class="btn btn-primary" :disabled="isLoggingIn">
                            <span v-if="isLoggingIn" class="spinner-border spinner-border-sm me-2" role="status"></span>
                            {{ isLoggingIn ? 'Logging in...' : 'Login' }}
                        </button>
                    </form>
                    <p v-if="authError" class="alert alert-danger mt-3">{{authError}}</p>
                </div>

                <div v-if="authResponse" class="mt-3 alert alert-info">
                    {{ authResponse }}
                </div>
            </div>
        </div>

        <!-- API Key Creation -->
        <div class="card" v-if="accessToken && !apiKey">
            <div class="card-header">Create API Key</div>
            <div class="card-body">
                <p>You are logged in. Click the button below to generate your API key.</p>
                <button class="btn btn-success" @click="createApiKey" :disabled="isCreatingApiKey">
                    <span v-if="isCreatingApiKey" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    {{ isCreatingApiKey ? 'Creating API Key...' : 'Create API Key' }}
                </button>
            </div>
        </div>

        <div v-if="apiKey" class="alert alert-success">
            <p class="mb-0"><strong>API Key Loaded.</strong> You can now use the endpoints below.</p>
            <p class="mb-0">Your Api key is <strong>{{apiKey}}</strong>, {{apiKeyMessage}}</p>
            <p class="mb-0">Now, you can make a request to the API <strong>"https://apiaggregator.pythonanywhere.com/  "</strong> by including this API key in the header, for example: <strong>"Authorization: Api-Key {{apiKey}}"</strong>. <a href="https://github.com/ruldak/django_api_aggregator/blob/master/README.md#api-services">See the endpoints here.</a></p>
            <p class="mb-0">To test this API, you can use curl, HTTPie, postman, or whatever tool you like.</p>
            <button class="btn btn-sm btn-danger mt-2" @click="logout">Logout & Clear Key</button>
        </div>

        <!-- API Endpoints Section -->
        <div v-if="apiKey">
            <div class="card">
                <div class="card-header">API Endpoints</div>
                <div class="card-body">
                    <div class="row gy-4">
                        <!-- Weather -->
                        <div class="col-md-6">
                            <h5>Weather</h5>
                            <form @submit.prevent="callApi('weather')">
                                <input v-model="params.weather.city" placeholder="City (e.g., Jakarta)" class="form-control mb-2" :disabled="isCallingApi">
                                <input v-model="params.weather.country" placeholder="Country Code (e.g., ID)" class="form-control mb-2" :disabled="isCallingApi">
                                <button type="submit" class="btn btn-secondary" :disabled="isCallingApi">
                                    <span v-if="isCallingApi" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                    {{ isCallingApi ? 'Loading...' : 'Get Weather' }}
                                </button>
                            </form>
                        </div>
                        <!-- News -->
                        <div class="col-md-6">
                            <h5>News</h5>
                            <form @submit.prevent="callApi('news')">
                                <input v-model="params.news.category" placeholder="Category (e.g., technology)" class="form-control mb-2" :disabled="isCallingApi">
                                <button type="submit" class="btn btn-secondary" :disabled="isCallingApi">
                                    <span v-if="isCallingApi" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                    {{ isCallingApi ? 'Loading...' : 'Get News' }}
                                </button>
                            </form>
                        </div>
                        <!-- GitHub User -->
                        <div class="col-md-6">
                            <h5>GitHub User</h5>
                            <form @submit.prevent="callApi('github')">
                                <input v-model="params.github.username" placeholder="GitHub Username" class="form-control mb-2" required :disabled="isCallingApi">
                                <button type="submit" class="btn btn-secondary" :disabled="isCallingApi">
                                    <span v-if="isCallingApi" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                    {{ isCallingApi ? 'Loading...' : 'Get User Info' }}
                                </button>
                            </form>
                        </div>
                        <!-- Crypto Price -->
                        <div class="col-md-6">
                            <h5>Crypto Price</h5>
                            <form @submit.prevent="callApi('simplePrice')">
                                <input v-model="params.simplePrice.ids" placeholder="Coin IDs (e.g., bitcoin,ethereum)" class="form-control mb-2" required :disabled="isCallingApi">
                                <input v-model="params.simplePrice.vs_currencies" placeholder="Currencies (e.g., usd,idr)" class="form-control mb-2" required :disabled="isCallingApi">
                                <button type="submit" class="btn btn-secondary" :disabled="isCallingApi">
                                    <span v-if="isCallingApi" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                    {{ isCallingApi ? 'Loading...' : 'Get Price' }}
                                </button>
                            </form>
                        </div>
                        <!-- Coin Detail -->
                        <div class="col-md-6">
                            <h5>Coin Detail</h5>
                            <form @submit.prevent="callApi('coinDetail')">
                                <input v-model="params.coinDetail.id" placeholder="Coin ID (e.g., bitcoin)" class="form-control mb-2" required :disabled="isCallingApi">
                                <button type="submit" class="btn btn-secondary" :disabled="isCallingApi">
                                    <span v-if="isCallingApi" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                    {{ isCallingApi ? 'Loading...' : 'Get Detail' }}
                                </button>
                            </form>
                        </div>
                        <!-- Coin Market Chart -->
                        <div class="col-md-6">
                            <h5>Coin Market Chart</h5>
                            <form @submit.prevent="callApi('marketChart')">
                                <input v-model="params.marketChart.id" placeholder="Coin ID" class="form-control mb-2" required :disabled="isCallingApi">
                                <input v-model="params.marketChart.vs_currency" placeholder="Currency (e.g., usd)" class="form-control mb-2" required :disabled="isCallingApi">
                                <input v-model="params.marketChart.days" placeholder="Days (e.g., 7)" class="form-control mb-2" required :disabled="isCallingApi">
                                <button type="submit" class="btn btn-secondary" :disabled="isCallingApi">
                                    <span v-if="isCallingApi" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                    {{ isCallingApi ? 'Loading...' : 'Get Chart' }}
                                </button>
                            </form>
                        </div>
                        <!-- Coin History -->
                        <div class="col-md-6">
                            <h5>Coin History</h5>
                            <form @submit.prevent="callApi('coinHistory')">
                                <input v-model="params.coinHistory.id" placeholder="Coin ID" class="form-control mb-2" required :disabled="isCallingApi">
                                <input v-model="params.coinHistory.date" placeholder="Date (dd-mm-yyyy)" class="form-control mb-2" required :disabled="isCallingApi">
                                <button type="submit" class="btn btn-secondary" :disabled="isCallingApi">
                                    <span v-if="isCallingApi" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                    {{ isCallingApi ? 'Loading...' : 'Get History' }}
                                </button>
                            </form>
                        </div>
                        <!-- Search CoinGecko -->
                        <div class="col-md-6">
                            <h5>Search CoinGecko</h5>
                            <form @submit.prevent="callApi('search')">
                                <input v-model="params.search.query" placeholder="Search query" class="form-control mb-2" required :disabled="isCallingApi">
                                <button type="submit" class="btn btn-secondary" :disabled="isCallingApi">
                                    <span v-if="isCallingApi" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                    {{ isCallingApi ? 'Loading...' : 'Search' }}
                                </button>
                            </form>
                        </div>
                        <!-- Trending Search -->
                        <div class="col-md-6">
                            <h5>Trending Search</h5>
                            <form @submit.prevent="callApi('trending')">
                                <button type="submit" class="btn btn-secondary" :disabled="isCallingApi">
                                    <span v-if="isCallingApi" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                    {{ isCallingApi ? 'Loading...' : 'Get Trending' }}
                                </button>
                            </form>
                        </div>
                        <!-- Exchange Rate -->
                        <div class="col-md-6">
                            <h5>Exchange Rate</h5>
                            <form @submit.prevent="callApi('exchangeRate')">
                                <input v-model="params.exchangeRate.currency" placeholder="Base Currency (e.g., USD)" class="form-control mb-2" required :disabled="isCallingApi">
                                <button type="submit" class="btn btn-secondary" :disabled="isCallingApi">
                                    <span v-if="isCallingApi" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                    {{ isCallingApi ? 'Loading...' : 'Get Rates' }}
                                </button>
                            </form>
                        </div>
                        <!-- Convert Currency -->
                        <div class="col-md-6">
                            <h5>Convert Currency</h5>
                            <form @submit.prevent="callApi('pair')">
                                <input v-model="params.pair.from" placeholder="From (e.g., USD)" class="form-control mb-2" required :disabled="isCallingApi">
                                <input v-model="params.pair.to" placeholder="To (e.g., IDR)" class="form-control mb-2" required :disabled="isCallingApi">
                                <input v-model="params.pair.amount" placeholder="Amount (optional)" class="form-control mb-2" :disabled="isCallingApi">
                                <button type="submit" class="btn btn-secondary" :disabled="isCallingApi">
                                    <span v-if="isCallingApi" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                    {{ isCallingApi ? 'Loading...' : 'Convert' }}
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- API Response Area -->
                    <div v-if="apiResponse || error" class="mt-4">
                        <h5>API Response:</h5>
                        <pre v-if="apiResponse" class="response-area">{{ apiResponse }}</pre>
                        <pre v-if="error" class="response-area" style="color: #e06c75;">{{ error }}</pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.response-area {
    background-color: black;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    padding: 1rem;
    max-height: 300px;
    overflow: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
}
</style>
