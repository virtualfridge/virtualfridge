package com.cpen321.usermanagement.di

import com.cpen321.usermanagement.data.repository.AuthRepository
import com.cpen321.usermanagement.data.repository.FridgeRepository
import com.cpen321.usermanagement.data.repository.FridgeRepositoryImpl
import com.cpen321.usermanagement.data.repository.NotificationRepository
import com.cpen321.usermanagement.data.repository.NotificationRepositoryImpl
import com.cpen321.usermanagement.data.repository.ProfileRepository
import com.cpen321.usermanagement.data.repository.ProfileRepositoryImpl
import com.cpen321.usermanagement.data.repository.RecipeRepository
import com.cpen321.usermanagement.data.repository.RecipeRepositoryImpl
import com.cpen321.usermanagement.fake.FakeAuthRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.components.SingletonComponent
import dagger.hilt.testing.TestInstallIn
import javax.inject.Singleton

/**
 * Test module that replaces the production RepositoryModule
 * to provide a FakeAuthRepository for E2E tests.
 *
 * FakeAuthRepository gets a REAL JWT token from the backend's test endpoint,
 * allowing tests to make actual API calls without Google authentication.
 */
@Module
@TestInstallIn(
    components = [SingletonComponent::class],
    replaces = [RepositoryModule::class]
)
abstract class TestRepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        fakeAuthRepository: FakeAuthRepository
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
    abstract fun bindFridgeRepository(
        impl: FridgeRepositoryImpl
    ): FridgeRepository
}
