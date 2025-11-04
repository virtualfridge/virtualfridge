plugins {
    alias(libs.plugins.android.test)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.example.macrobenchmark"
    compileSdk = 36

    defaultConfig {
        minSdk = 33
        targetSdk = 36

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        testInstrumentationRunnerArguments += mapOf(
            "androidx.benchmark.suppressErrors" to "EMULATOR,LOW-BATTERY")
    }

    buildTypes {
        // This benchmark buildType is used for benchmarking, and should function like your
        // release build (for example, with minification on). It"s signed with a debug key
        // for easy local/CI testing.
        create("benchmark") {
            isDebuggable = true
            signingConfig = getByName("debug").signingConfig
            matchingFallbacks += listOf("release")
        }
    }

    targetProjectPath = ":app"
    experimentalProperties["android.experimental.self-instrumenting"] = true
}

dependencies {
    implementation(libs.androidx.junit)
    implementation(libs.androidx.espresso.core)
    implementation(libs.androidx.uiautomator)
    implementation(libs.androidx.benchmark.macro.junit4)
}

androidComponents {
    beforeVariants(selector().all()) {
        it.enable = it.buildType == "benchmark"
    }
}