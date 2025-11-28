package com.example.macrobenchmark

import android.app.Activity
import android.app.Application
import android.app.Instrumentation
import android.os.SystemClock
import androidx.benchmark.macro.CompilationMode
import androidx.benchmark.macro.ExperimentalMetricApi
import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.TraceSectionMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.runner.lifecycle.ActivityLifecycleMonitorRegistry
import androidx.test.runner.lifecycle.Stage
import androidx.test.uiautomator.By
import androidx.test.uiautomator.BySelector
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
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
            pressHome()
        }
    ) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val device = UiDevice.getInstance(instrumentation)
        val activityTracker = ActivityTracker()

        registerActivityCallbacks(instrumentation, activityTracker)

        startActivityAndWait()

        handleNotificationPermissionIfNeeded(device)
        maybeSignIn(device)

        waitForObjectStable(device, By.textContains("Virtual Fridge"), 60_000)

        // Open the scanner/camera screen, then trigger the test barcode directly on the ViewModel
        waitForObjectStable(device, By.textContains("Scan"), 5_000)?.click()
        handleCameraPermissionIfNeeded(device)

        val mainViewModel = awaitMainViewModel(instrumentation, activityTracker)

        instrumentation.runOnMainSync {
            mainViewModel.clearTestBarcodeState()
            mainViewModel.testSendBarcode()
        }

        if (!waitForTestBarcodeResponse(mainViewModel, instrumentation)) {
            throw IllegalStateException("Test barcode response not received in time")
        }

        // Give the UI a moment to surface the result screen if it is shown
        waitForObjectStable(device, By.textContains("Barcode Result"), 8_000)
    }

    private fun handleNotificationPermissionIfNeeded(device: UiDevice) {
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
    }

    private fun handleCameraPermissionIfNeeded(device: UiDevice) {
        val allowForeground = device.wait(
            Until.findObject(By.res("com.android.permissioncontroller", "permission_allow_foreground_only_button")),
            2_000
        )
        allowForeground?.click()

        val allowOnce = device.wait(
            Until.findObject(By.res("com.android.permissioncontroller", "permission_allow_one_time_button")),
            1_000
        )
        allowOnce?.click()

        val allow = device.wait(Until.findObject(By.textContains("Allow")), 1_000)
        allow?.click()
    }

    private fun maybeSignIn(device: UiDevice) {
        val signIn = device.wait(Until.findObject(By.text("Sign in with Google")), 8_000)
        signIn?.click()

        if (signIn != null) {
            val account = device.wait(
                Until.findObject(By.res("com.google.android.gms", "account_name")),
                6_000
            ) ?: device.wait(
                Until.findObject(By.res("com.google.android.gms", "account_display_name")),
                2_000
            )
            account?.click()
        }
    }

    private fun awaitMainViewModel(
        instrumentation: Instrumentation,
        tracker: ActivityTracker,
        timeoutMs: Long = 60_000
    ): MainViewModelProxy {
        val start = SystemClock.uptimeMillis()
        var viewModel: MainViewModelProxy? = null
        while (viewModel == null && SystemClock.uptimeMillis() - start < timeoutMs) {
            val activity = tracker.resumedActivity() ?: currentResumedActivity()
            viewModel = activity?.let { getMainViewModelFromActivity(it) }
            if (viewModel == null) {
                Thread.sleep(200)
            }
        }
        return viewModel ?: error("MainViewModel not available; is MainActivity resumed?")
    }

    private fun getMainViewModelFromActivity(activity: Activity): MainViewModelProxy? {
        return runCatching {
            val providerClass = Class.forName("androidx.lifecycle.ViewModelProvider")
            val ownerClass = Class.forName("androidx.lifecycle.ViewModelStoreOwner")
            if (!ownerClass.isInstance(activity)) return@runCatching null

            val mainViewModelClass = Class.forName("com.cpen321.usermanagement.ui.viewmodels.MainViewModel")
            val providerConstructor = providerClass.getConstructor(ownerClass)
            val provider = providerConstructor.newInstance(activity)

            val getMethod = providerClass.getMethod("get", Class::class.java)
            val viewModel = getMethod.invoke(provider, mainViewModelClass)
            MainViewModelProxy(checkNotNull(viewModel))
        }.getOrNull()
    }

    private fun waitForTestBarcodeResponse(
        viewModel: MainViewModelProxy,
        instrumentation: Instrumentation,
        timeoutMs: Long = 45_000
    ): Boolean {
        val start = SystemClock.uptimeMillis()
        var hasResponse = false
        while (!hasResponse && SystemClock.uptimeMillis() - start < timeoutMs) {
            instrumentation.runOnMainSync {
                val uiState = viewModel.uiStateValue()
                val response = uiState?.let { state ->
                    state.javaClass.getMethod("getTestBarcodeResponse").invoke(state)
                }
                hasResponse = response != null
            }
            if (!hasResponse) {
                Thread.sleep(250)
            }
        }
        return hasResponse
    }

    private fun registerActivityCallbacks(
        instrumentation: Instrumentation,
        tracker: ActivityTracker
    ) {
        instrumentation.runOnMainSync {
            val app = instrumentation.targetContext.applicationContext as? Application
            app?.registerActivityLifecycleCallbacks(tracker)
        }
    }

    private fun waitForObjectStable(
        device: UiDevice,
        selector: BySelector,
        timeoutMs: Long
    ): UiObject2? {
        val deadline = SystemClock.uptimeMillis() + timeoutMs
        var obj: UiObject2? = null
        while (SystemClock.uptimeMillis() < deadline) {
            obj = device.wait(Until.findObject(selector), 2_000)
            if (obj != null) {
                return obj
            }
        }
        return obj
    }
}

private fun currentResumedActivity(): Activity? {
    var resumed: Activity? = null
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
        val activities = ActivityLifecycleMonitorRegistry.getInstance()
            .getActivitiesInStage(Stage.RESUMED)
        resumed = activities.firstOrNull()
    }
    return resumed
}

private class ActivityTracker : Application.ActivityLifecycleCallbacks {
    @Volatile
    private var resumed: Activity? = null

    fun resumedActivity(): Activity? = resumed

    override fun onActivityResumed(activity: Activity) {
        resumed = activity
    }

    override fun onActivityPaused(activity: Activity) {
        if (resumed === activity) resumed = null
    }

    override fun onActivityDestroyed(activity: Activity) {
        if (resumed === activity) resumed = null
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: android.os.Bundle?) = Unit
    override fun onActivityStarted(activity: Activity) = Unit
    override fun onActivityStopped(activity: Activity) = Unit
    override fun onActivitySaveInstanceState(activity: Activity, outState: android.os.Bundle) = Unit
}

private class MainViewModelProxy(private val delegate: Any) {
    fun clearTestBarcodeState() {
        delegate.javaClass.getMethod("clearTestBarcodeState").invoke(delegate)
    }

    fun testSendBarcode() {
        delegate.javaClass.getMethod("testSendBarcode").invoke(delegate)
    }

    fun uiStateValue(): Any? {
        val uiState = delegate.javaClass.getMethod("getUiState").invoke(delegate)
        return uiState?.javaClass?.getMethod("getValue")?.invoke(uiState)
    }
}
