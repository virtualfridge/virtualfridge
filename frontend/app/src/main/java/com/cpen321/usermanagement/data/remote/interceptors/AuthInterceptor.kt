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

        val newRequest = originalRequest.newBuilder()
            .addHeader("Authorization", "Bearer $token")
            .build()

        var response = chain.proceed(newRequest)

        // Retry if error
        if (response.code != 200) {
            val retryRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            response = chain.proceed(retryRequest)
        }

        return response
    }
}