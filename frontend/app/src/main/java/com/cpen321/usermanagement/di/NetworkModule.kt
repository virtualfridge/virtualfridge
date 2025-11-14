package com.cpen321.usermanagement.di

import com.cpen321.usermanagement.data.remote.api.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideAuthService(): AuthInterface {
        return RetrofitClient.authInterface
    }

    @Provides
    @Singleton
    fun provideUserService(): UserInterface {
        return RetrofitClient.userInterface
    }

    @Provides
    @Singleton
    fun provideMediaService(): ImageInterface {
        return RetrofitClient.imageInterface
    }

    @Provides
    @Singleton
    fun provideFridgeService(): FridgeInterface {
        return RetrofitClient.fridgeInterface
    }

    @Provides
    @Singleton
    fun provideRecipeService(): RecipeInterface {
        return RetrofitClient.recipeInterface
    }

    @Provides
    @Singleton
    fun provideNotificationService(): NotificationInterface {
        return RetrofitClient.notificationInterface
    }
}
