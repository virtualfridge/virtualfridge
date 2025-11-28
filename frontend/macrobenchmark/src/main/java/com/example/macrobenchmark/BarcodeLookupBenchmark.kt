package com.example.macrobenchmark

import android.content.Intent
import androidx.benchmark.macro.ExperimentalMetricApi
import androidx.benchmark.macro.CompilationMode
import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.TraceSectionMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@OptIn(ExperimentalMetricApi::class)
class BarcodeLookupBenchmark {

    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    @Test
    fun scanToApiResponse() = benchmarkRule.measureRepeated(
        packageName = "com.cpen321.usermanagement",
        metrics = listOf(TraceSectionMetric("ScanToApiResponse")),
        compilationMode = CompilationMode.None(),
        startupMode = StartupMode.COLD,
        iterations = 10,
        setupBlock = {
            // Ensure cold start
            pressHome()
        }
    ) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val device = androidx.test.uiautomator.UiDevice.getInstance(instrumentation)

        // Launch with custom intent to trigger test barcode
        val intent = Intent().apply {
            action = "com.cpen321.usermanagement.TEST_BARCODE"
            setPackage("com.cpen321.usermanagement")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK)
        }
        instrumentation.context.startActivity(intent)
        device.wait(Until.hasObject(By.pkg("com.cpen321.usermanagement")), 5_000)

        // Handle Android 13+ notification permission dialog if it appears
        // Try resource ids first, then fallback to text
        val allowPermByRes = device.wait(
            Until.findObject(By.res("com.android.permissioncontroller", "permission_allow_button")),
            2_000
        ) ?: device.wait(Until.findObject(By.res("android", "button1")), 1_000)
        allowPermByRes?.click()

        val allowPermByText = device.wait(
            Until.findObject(By.textContains("Allow")),
            1_000
        )
        allowPermByText?.click()

        // If not authenticated, sign in with Google
        val signIn = device.wait(Until.findObject(By.text("Sign in with Google")), 8_000)
        signIn?.click()

        if (signIn != null) {
            // Pick the first account in the chooser
            val acct1 = device.wait(
                Until.findObject(By.res("com.google.android.gms", "account_name")),
                6_000
            ) ?: device.wait(
                Until.findObject(By.res("com.google.android.gms", "account_display_name")),
                2_000
            )
            acct1?.click()
        }

        // Wait for main screen to load (Virtual Fridge title)
        device.wait(Until.hasObject(By.textContains("Virtual Fridge")), 10_000)

        // The intent handler will automatically trigger testSendBarcode() after authentication
        // Wait for Nutella to appear in the fridge list, indicating the barcode was processed
        device.wait(Until.hasObject(By.textContains("Nutella")), 15_000)
    }
}
