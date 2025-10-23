package com.cpen321.usermanagement.di

import com.cpen321.usermanagement.services.ComputerVisionService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object ComputerVisionModule {

    @Provides
    @Singleton
    fun provideComputerVisionService(): ComputerVisionService {
        return ComputerVisionService()
    }
}