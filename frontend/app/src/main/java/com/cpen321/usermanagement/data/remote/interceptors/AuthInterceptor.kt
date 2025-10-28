package com.cpen321.usermanagement.data.remote.interceptors

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val tokenProvider: () -> String?) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        val token = tokenProvider()
        if (token == null) {
            return chain.proceed(originalRequest)
        }

        val authedRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()

        val response = chain.proceed(authedRequest)

        // Retry once only on unauthorized, after closing the first response
        if (response.code == 401) {
            try {
                response.close()
            } catch (_: Exception) {
            }

            val retryRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            return chain.proceed(retryRequest)
        }

        return response
    }
}
