package com.cpen321.usermanagement.di

import com.cpen321.usermanagement.data.repository.AuthRepository
import com.cpen321.usermanagement.data.repository.AuthRepositoryImpl
import com.cpen321.usermanagement.data.repository.FoodItemRepository
import com.cpen321.usermanagement.data.repository.FoodItemRepositoryImpl
import com.cpen321.usermanagement.data.repository.FoodTypeRepository
import com.cpen321.usermanagement.data.repository.FoodTypeRepositoryImpl
import com.cpen321.usermanagement.data.repository.ProfileRepository
import com.cpen321.usermanagement.data.repository.ProfileRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideAuthRepository(
        authRepositoryImpl: AuthRepositoryImpl
    ): AuthRepository {
        return authRepositoryImpl
    }

    @Provides
    @Singleton
    fun provideProfileRepository(
        profileRepositoryImpl: ProfileRepositoryImpl
    ): ProfileRepository {
        return profileRepositoryImpl
    }

    @Provides
    @Singleton
    fun provideFoodItemRepository(
        foodItemRepositoryImpl: FoodItemRepositoryImpl
    ): FoodItemRepository {
        return foodItemRepositoryImpl
    }

    @Provides
    @Singleton
    fun provideFoodTypeRepository(
        foodTypeRepositoryImpl: FoodTypeRepositoryImpl
    ): FoodTypeRepository {
        return foodTypeRepositoryImpl
    }
}
