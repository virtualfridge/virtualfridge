package com.cpen321.usermanagement

import android.app.Application
import android.content.Context
import androidx.test.runner.AndroidJUnitRunner
import dagger.hilt.android.testing.HiltTestApplication

/**
 * Custom test runner for Hilt-powered instrumentation tests.
 *
 * This runner is required to use Hilt dependency injection in androidTest.
 * It replaces the application instance with HiltTestApplication during tests.
 *
 * Usage:
 * - Set this as testInstrumentationRunner in build.gradle.kts:
 *   testInstrumentationRunner = "com.cpen321.usermanagement.HiltTestRunner"
 *
 * - Annotate test classes with @HiltAndroidTest
 * - Use @get:Rule val hiltRule = HiltAndroidRule(this) in test classes
 */
class HiltTestRunner : AndroidJUnitRunner() {
    override fun newApplication(
        classLoader: ClassLoader?,
        className: String?,
        context: Context?
    ): Application {
        return super.newApplication(classLoader, HiltTestApplication::class.java.name, context)
    }
}
