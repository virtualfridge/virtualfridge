package com.cpen321.usermanagement.fake

import android.content.Context
import android.util.Log
import com.cpen321.usermanagement.data.local.preferences.TokenManager
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.dto.AuthData
import com.cpen321.usermanagement.data.remote.dto.User
import com.cpen321.usermanagement.data.repository.AuthRepository
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Fake AuthRepository for E2E tests
 *
 * This implementation calls a test-only backend endpoint to get a real JWT token
 * for a test user, allowing tests to make actual API calls without Google authentication.
 */
@Singleton
class FakeAuthRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val tokenManager: TokenManager
) : AuthRepository {

    companion object {
        private const val TAG = "FakeAuthRepository"
        private const val TEST_AUTH_URL = "http://10.0.2.2:3000/api/test-auth/test-user"
    }

    private var cachedUser: User? = null
    private var cachedToken: String? = null

    init {
        // Immediately authenticate on creation using IO dispatcher to avoid NetworkOnMainThreadException
        runBlocking(Dispatchers.IO) {
            authenticateTestUser()
        }
    }

    private suspend fun authenticateTestUser() {
        try {
            Log.d(TAG, "Authenticating test user...")

            val client = OkHttpClient()
            val request = Request.Builder()
                .url(TEST_AUTH_URL)
                .post(okhttp3.RequestBody.create(null, ByteArray(0)))
                .build()

            // Use IO dispatcher for network call
            val (response, responseBody) = withContext(Dispatchers.IO) {
                val resp = client.newCall(request).execute()
                val body = resp.body?.string()
                Pair(resp, body)
            }

            if (response.isSuccessful && responseBody != null) {
                val json = JSONObject(responseBody)
                val data = json.getJSONObject("data")
                val token = data.getString("token")
                val userJson = data.getJSONObject("user")

                cachedToken = token
                cachedUser = User(
                    _id = userJson.getString("_id"),
                    email = userJson.getString("email"),
                    name = userJson.getString("name"),
                    bio = userJson.optString("bio", "Test user bio"),
                    profilePicture = userJson.optString("profilePicture", ""),
                    hobbies = emptyList(),
                    createdAt = null,
                    updatedAt = null
                )

                // Save token to TokenManager and RetrofitClient
                tokenManager.saveToken(token)
                RetrofitClient.setAuthToken(token)

                Log.d(TAG, "Test user authenticated successfully with token: ${token.take(20)}...")
            } else {
                Log.e(TAG, "Failed to authenticate test user: ${response.code} - $responseBody")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error authenticating test user", e)
        }
    }

    override suspend fun signInWithGoogle(context: Context): Result<GoogleIdTokenCredential> {
        return Result.failure(Exception("Not implemented in test"))
    }

    override suspend fun googleSignIn(tokenId: String): Result<AuthData> {
        return if (cachedToken != null && cachedUser != null) {
            Result.success(AuthData(token = cachedToken!!, user = cachedUser!!))
        } else {
            authenticateTestUser()
            if (cachedToken != null && cachedUser != null) {
                Result.success(AuthData(token = cachedToken!!, user = cachedUser!!))
            } else {
                Result.failure(Exception("Test authentication failed"))
            }
        }
    }

    override suspend fun googleSignUp(tokenId: String): Result<AuthData> {
        return googleSignIn(tokenId)
    }

    override suspend fun clearToken(): Result<Unit> {
        tokenManager.clearToken()
        RetrofitClient.setAuthToken(null)
        cachedToken = null
        cachedUser = null
        return Result.success(Unit)
    }

    override suspend fun doesTokenExist(): Boolean {
        return cachedToken != null || tokenManager.getToken().first() != null
    }

    override suspend fun getStoredToken(): String? {
        return cachedToken ?: tokenManager.getToken().first()
    }

    override suspend fun getCurrentUser(): User? {
        return cachedUser
    }

    override suspend fun isUserAuthenticated(): Boolean {
        return cachedToken != null && cachedUser != null
    }
}
