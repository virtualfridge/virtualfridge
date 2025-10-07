package com.cpen321.usermanagement.data.remote.dto

data class GoogleLoginRequest(
    val idToken: String
)

data class AuthData(
    val token: String,
    val user: User
)