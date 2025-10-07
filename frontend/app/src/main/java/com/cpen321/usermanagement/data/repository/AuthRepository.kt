package com.cpen321.usermanagement.data.repository

import android.content.Context
import com.cpen321.usermanagement.data.remote.dto.AuthData
import com.cpen321.usermanagement.data.remote.dto.User
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential

interface AuthRepository {
    suspend fun signInWithGoogle(context: Context): Result<GoogleIdTokenCredential>
    suspend fun googleSignIn(tokenId: String): Result<AuthData>
    suspend fun googleSignUp(tokenId: String): Result<AuthData>
    suspend fun clearToken(): Result<Unit>
    suspend fun doesTokenExist(): Boolean
    suspend fun getStoredToken(): String?
    suspend fun getCurrentUser(): User?
    suspend fun isUserAuthenticated(): Boolean
}