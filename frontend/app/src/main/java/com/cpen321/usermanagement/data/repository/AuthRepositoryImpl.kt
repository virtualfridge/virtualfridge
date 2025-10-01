package com.cpen321.usermanagement.data.repository

import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
import com.cpen321.usermanagement.BuildConfig
import com.cpen321.usermanagement.data.local.preferences.TokenManager
import com.cpen321.usermanagement.data.remote.api.AuthInterface
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.api.UserInterface
import com.cpen321.usermanagement.data.remote.dto.AuthData
import com.cpen321.usermanagement.data.remote.dto.GoogleLoginRequest
import com.cpen321.usermanagement.data.remote.dto.User
import com.cpen321.usermanagement.utils.JsonUtils
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val authInterface: AuthInterface,
    private val userInterface: UserInterface,
    private val tokenManager: TokenManager
) : AuthRepository {

    companion object {
        private const val TAG = "AuthRepositoryImpl"
    }

    private val credentialManager = CredentialManager.create(context)
    private val signInWithGoogleOption: GetSignInWithGoogleOption =
        GetSignInWithGoogleOption.Builder(
            serverClientId = BuildConfig.GOOGLE_CLIENT_ID
        ).build()

    override suspend fun signInWithGoogle(context: Context): Result<GoogleIdTokenCredential> {
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(signInWithGoogleOption)
            .build()

        return try {
            val response = credentialManager.getCredential(context, request)
            handleSignInWithGoogleOption(response)
        } catch (e: GetCredentialException) {
            Log.e(TAG, "Failed to get credential from CredentialManager", e)
            Result.failure(e)
        }
    }

    private fun handleSignInWithGoogleOption(
        result: GetCredentialResponse
    ): Result<GoogleIdTokenCredential> {
        val credential = result.credential
        return when (credential) {
            is CustomCredential -> {
                if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    try {
                        val googleIdTokenCredential =
                            GoogleIdTokenCredential.createFrom(credential.data)
                        Result.success(googleIdTokenCredential)
                    } catch (e: GoogleIdTokenParsingException) {
                        Log.e(TAG, "Failed to parse Google ID token credential", e)
                        Result.failure(e)
                    }
                } else {
                    Log.e(TAG, "Unexpected type of credential: ${credential.type}")
                    Result.failure(Exception("Unexpected type of credential"))
                }
            }

            else -> {
                Log.e(TAG, "Unexpected type of credential: ${credential::class.simpleName}")
                Result.failure(Exception("Unexpected type of credential"))
            }
        }
    }

    override suspend fun googleSignIn(tokenId: String): Result<AuthData> {
        val googleLoginReq = GoogleLoginRequest(tokenId)
        return try {
            val response = authInterface.googleSignIn(googleLoginReq)
            if (response.isSuccessful && response.body()?.data != null) {
                val authData = response.body()!!.data!!
                tokenManager.saveToken(authData.token)
                RetrofitClient.setAuthToken(authData.token)
                Result.success(authData)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to sign in with Google."
                )
                Log.e(TAG, "Google sign in failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during Google sign in", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during Google sign in", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during Google sign in", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during Google sign in: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun googleSignUp(tokenId: String): Result<AuthData> {
        val googleLoginReq = GoogleLoginRequest(tokenId)
        return try {
            val response = authInterface.googleSignUp(googleLoginReq)
            if (response.isSuccessful && response.body()?.data != null) {
                val authData = response.body()!!.data!!
                tokenManager.saveToken(authData.token)
                RetrofitClient.setAuthToken(authData.token)
                Result.success(authData)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to sign up with Google."
                )
                Log.e(TAG, "Google sign up failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during Google sign up", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during Google sign up", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during Google sign up", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during Google sign up: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun clearToken(): Result<Unit> {
        tokenManager.clearToken()
        RetrofitClient.setAuthToken(null)
        return Result.success(Unit)
    }

    override suspend fun doesTokenExist(): Boolean {
        return tokenManager.getToken().first() != null
    }

    override suspend fun getStoredToken(): String? {
        return tokenManager.getTokenSync()
    }

    override suspend fun getCurrentUser(): User? {
        return try {
            val response = userInterface.getProfile("") // Auth header is handled by interceptor
            if (response.isSuccessful && response.body()?.data != null) {
                response.body()!!.data!!.user
            } else {
                Log.e(
                    TAG,
                    "Failed to get current user: ${response.body()?.message ?: "Unknown error"}"
                )
                null
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout while getting current user", e)
            null
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed while getting current user", e)
            null
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while getting current user", e)
            null
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error while getting current user: ${e.code()}", e)
            null
        }
    }

    override suspend fun isUserAuthenticated(): Boolean {
        val isLoggedIn = doesTokenExist()
        if (isLoggedIn) {
            val token = getStoredToken()
            token?.let { RetrofitClient.setAuthToken(it) }
            // Verify token is still valid by trying to get user profile
            return getCurrentUser() != null
        }
        return false
    }
}
