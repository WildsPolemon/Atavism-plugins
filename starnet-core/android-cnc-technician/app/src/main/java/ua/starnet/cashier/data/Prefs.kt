package ua.starnet.cashier.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

private val Context.dataStore by preferencesDataStore("starnet_cashier")

object Prefs {
    private lateinit var app: Context
    private val KEY_TOKEN = stringPreferencesKey("token")
    private val KEY_BASE_URL = stringPreferencesKey("base_url")
    private val KEY_PRINTER_IP = stringPreferencesKey("printer_ip")
    private val KEY_TERMINAL_IP = stringPreferencesKey("terminal_ip")
    private val KEY_SCALE_BAUD = stringPreferencesKey("scale_baud")

    fun init(ctx: Context) { app = ctx.applicationContext }

    suspend fun getToken(): String? = app.dataStore.data.first()[KEY_TOKEN]
    suspend fun setToken(v: String?) {
        app.dataStore.edit { if (v.isNullOrBlank()) it.remove(KEY_TOKEN) else it[KEY_TOKEN] = v }
    }

    suspend fun getBaseUrl(): String = app.dataStore.data.first()[KEY_BASE_URL] ?: "http://10.0.2.2:8080"
    suspend fun setBaseUrl(v: String) { app.dataStore.edit { it[KEY_BASE_URL] = v.trimEnd('/') } }

    suspend fun getPrinterIp(): String = app.dataStore.data.first()[KEY_PRINTER_IP] ?: ""
    suspend fun setPrinterIp(v: String) { app.dataStore.edit { it[KEY_PRINTER_IP] = v } }

    suspend fun getTerminalIp(): String = app.dataStore.data.first()[KEY_TERMINAL_IP] ?: ""
    suspend fun setTerminalIp(v: String) { app.dataStore.edit { it[KEY_TERMINAL_IP] = v } }

    suspend fun getScaleBaud(): Int = (app.dataStore.data.first()[KEY_SCALE_BAUD] ?: "9600").toIntOrNull() ?: 9600
    suspend fun setScaleBaud(v: Int) { app.dataStore.edit { it[KEY_SCALE_BAUD] = v.toString() } }

    fun getBaseUrlBlocking(): String = runBlocking { getBaseUrl() }
}
