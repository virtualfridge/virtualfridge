package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.AuthData
import com.cpen321.usermanagement.data.remote.dto.GoogleLoginRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthInterface {
    @POST("auth/signin")
    suspend fun googleSignIn(@Body request: GoogleLoginRequest): Response<ApiResponse<AuthData>>

    @POST("auth/signup")
    suspend fun googleSignUp(@Body request: GoogleLoginRequest): Response<ApiResponse<AuthData>>
}
