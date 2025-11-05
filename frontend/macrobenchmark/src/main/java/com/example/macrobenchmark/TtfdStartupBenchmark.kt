package com.example.macrobenchmark

import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.StartupTimingMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.benchmark.macro.CompilationMode
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Measures app startup time, including:
 * - timeToInitialDisplayMs (TTID)
 * - timeToFullDisplayMs (TTFD, via reportFullyDrawn() in your Activity)
 *
 * Make sure your MainActivity calls Activity.reportFullyDrawn()
 * once the initial screen is fully ready.
 */
@RunWith(AndroidJUnit4::class)
class TtfdStartupBenchmark {

    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    @Test
    fun coldStartup_ttid_tffd() {
        benchmarkRule.measureRepeated(
            packageName = "com.cpen321.usermanagement", // <-- REPLACE with your appId from :app
            metrics = listOf(StartupTimingMetric()),
            compilationMode = CompilationMode.None(), // or Partial/Full if you use baseline profiles
            startupMode = StartupMode.COLD,
            iterations = 10
        ) {
            // Go home before each launch so it's a true cold start
            pressHome()
            // Launch the default launcher Activity and wait for first frame
            startActivityAndWait()
        }
    }
}
