# Vue API Aggregator

This is a Vue.js frontend for an API aggregator service. It allows users to register, log in, and generate an API key to access multiple APIs from a single point.

## Features

*   **User Authentication:** Register and log in to the service.
*   **API Key Generation:** Create a unique API key for accessing the aggregated APIs.
*   **Multiple API Endpoints:** Access various APIs, including:
    *   Weather
    *   News
    *   GitHub user information
    *   Cryptocurrency prices and data (from CoinGecko)
    *   Exchange rates
*   **Simple Interface:** A clean and straightforward interface for making API requests and viewing responses.

## Backend API

This frontend consumes the API from the following repository: [django_api_aggregator](https://github.com/ruldak/django_api_aggregator)

The live API endpoint is: `https://apiaggregator.pythonanywhere.com/`

## Getting Started

### Prerequisites

*   Node.js and npm (or yarn)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/ruldak/vue_api_aggregator.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd vue_api_aggregator
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Usage

1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to the provided local URL (usually `http://localhost:5173`).

## Available Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run preview`: Serves the production build locally for preview.

## Project Structure

```
.
├── src
│   ├── api.js          # Axios configuration for API requests
│   ├── App.vue         # Main application component
│   ├── main.js         # Entry point of the application
│   ├── assets          # CSS and other assets
│   ├── components      # Reusable Vue components
│   └── utils           # Utility functions (e.g., for cookies)
├── public              # Static assets
├── package.json        # Project dependencies and scripts
└── vite.config.js      # Vite configuration
```

## Dependencies

*   `vue`: ^3.5.22
*   `axios`: ^1.12.2
*   `bootstrap`: ^5.3.8

## Dev Dependencies

*   `@vitejs/plugin-vue`: ^6.0.1
*   `vite`: ^7.1.7

## License

This project is licensed under the MIT License.
