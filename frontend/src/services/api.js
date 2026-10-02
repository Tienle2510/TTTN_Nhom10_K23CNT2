import axios from "axios";

const api = axios.create({

    baseURL:
        "http://localhost:3000/api",

    headers: {
        "Content-Type":
            "application/json"
    }
});


/*
|--------------------------------------------------------------------------
| GẮN ACCESS TOKEN
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(

    (config) => {

        const token =
            localStorage.getItem(
                "secretToken"
            );

        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },

    (error) => {

        return Promise.reject(
            error
        );
    }
);


/*
|--------------------------------------------------------------------------
| REFRESH TOKEN
|--------------------------------------------------------------------------
*/

let isRefreshing = false;

let waitingRequests = [];


function processWaitingRequests(
    error,
    token = null
) {

    waitingRequests.forEach(
        (request) => {

            if (error) {

                request.reject(
                    error
                );

            } else {

                request.resolve(
                    token
                );
            }
        }
    );

    waitingRequests = [];
}


/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(

    (response) => {

        return response;
    },

    async (error) => {

        const originalRequest =
            error.config;


        /*
        |--------------------------------------------------------------------------
        | KHÔNG PHẢI 401
        |--------------------------------------------------------------------------
        */

        if (
            error.response?.status !==
            401 ||
            originalRequest?._retry
        ) {

            return Promise.reject(
                error
            );
        }


        /*
        |--------------------------------------------------------------------------
        | LẤY REFRESH TOKEN
        |--------------------------------------------------------------------------
        */

        const refreshToken =
            localStorage.getItem(
                "refreshToken"
            );


        if (!refreshToken) {

            localStorage.removeItem(
                "secretToken"
            );

            localStorage.removeItem(
                "refreshToken"
            );

            localStorage.removeItem(
                "user"
            );

            window.location.href =
                "/login";

            return Promise.reject(
                error
            );
        }


        /*
        |--------------------------------------------------------------------------
        | ĐANG REFRESH
        |--------------------------------------------------------------------------
        */

        if (isRefreshing) {

            return new Promise(
                (
                    resolve,
                    reject
                ) => {

                    waitingRequests.push({
                        resolve,
                        reject
                    });
                }
            ).then(
                (token) => {

                    originalRequest
                        .headers
                        .Authorization =
                        `Bearer ${token}`;

                    return api(
                        originalRequest
                    );
                }
            );
        }


        originalRequest._retry =
            true;

        isRefreshing =
            true;


        try {

            const response =
                await axios.post(

                    "http://localhost:3000/api/auth/refresh",

                    {
                        refreshToken
                    }
                );


            const newToken =
                response.data.secretToken;


            /*
            |--------------------------------------------------------------------------
            | LƯU TOKEN MỚI
            |--------------------------------------------------------------------------
            */

            localStorage.setItem(
                "secretToken",
                newToken
            );


            /*
            |--------------------------------------------------------------------------
            | CHẠY LẠI CÁC REQUEST ĐANG CHỜ
            |--------------------------------------------------------------------------
            */

            processWaitingRequests(
                null,
                newToken
            );


            /*
            |--------------------------------------------------------------------------
            | CHẠY LẠI REQUEST BAN ĐẦU
            |--------------------------------------------------------------------------
            */

            originalRequest
                .headers
                .Authorization =
                `Bearer ${newToken}`;


            return api(
                originalRequest
            );

        } catch (refreshError) {

            processWaitingRequests(
                refreshError,
                null
            );


            localStorage.removeItem(
                "secretToken"
            );

            localStorage.removeItem(
                "refreshToken"
            );

            localStorage.removeItem(
                "user"
            );


            window.location.href =
                "/login";


            return Promise.reject(
                refreshError
            );

        } finally {

            isRefreshing =
                false;
        }
    }
);


export default api;