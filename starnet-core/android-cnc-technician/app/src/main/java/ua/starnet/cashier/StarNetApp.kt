package ua.starnet.cashier

import android.app.Application
import ua.starnet.cashier.data.Prefs

class StarNetApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Prefs.init(this)
    }
}
