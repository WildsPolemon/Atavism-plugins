package com.starnet.core

import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MainActivityStartupTest {
    @Test
    @Config(sdk = [34])
    fun mainActivity_launchesWithoutCrash() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).setup().get()
        check(!activity.isFinishing) { "MainActivity should stay active after launch" }
    }
}
