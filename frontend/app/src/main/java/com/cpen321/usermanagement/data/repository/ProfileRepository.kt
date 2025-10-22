package com.cpen321.usermanagement.data.repository

import android.net.Uri
import com.cpen321.usermanagement.data.remote.dto.User

interface ProfileRepository {
    suspend fun getProfile(): Result<User>
    suspend fun updateProfile(name: String?, profilePicture: String?, orNull: String): Result<User>
    suspend fun deleteProfile(user: User): Result<Unit>
    suspend fun updateUserHobbies(hobbies: List<String>): Result<User>
    suspend fun getAvailableHobbies(): Result<List<String>>

    suspend fun uploadImage(image: Uri): Result<String>
}