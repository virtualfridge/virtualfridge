package com.cpen321.usermanagement.di

import com.cpen321.usermanagement.data.repository.AuthRepository
import com.cpen321.usermanagement.data.repository.AuthRepositoryImpl
import com.cpen321.usermanagement.data.repository.FridgeRepository
import com.cpen321.usermanagement.data.repository.FridgeRepositoryImpl
import com.cpen321.usermanagement.data.repository.NotificationRepository
import com.cpen321.usermanagement.data.repository.NotificationRepositoryImpl
import com.cpen321.usermanagement.data.repository.ProfileRepository
import com.cpen321.usermanagement.data.repository.ProfileRepositoryImpl
import com.cpen321.usermanagement.data.repository.RecipeRepository
import com.cpen321.usermanagement.data.repository.RecipeRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    // --- Bind repositories to their implementations ---
    @Binds
    abstract fun bindAuthRepository(
        impl: AuthRepositoryImpl
    ): AuthRepository

    @Binds
    abstract fun bindProfileRepository(
        impl: ProfileRepositoryImpl
    ): ProfileRepository

    @Binds
    abstract fun bindRecipeRepository(
        impl: RecipeRepositoryImpl
    ): RecipeRepository

    @Binds
    abstract fun bindNotificationRepository(
        impl: NotificationRepositoryImpl
    ): NotificationRepository

    @Binds
    abstract fun bidFridgeRepository(
        impl: FridgeRepositoryImpl
    ): FridgeRepository
}
