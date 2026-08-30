package com.starnet.core.data

import android.content.Context
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.starnet.core.domain.AlarmKnowledge
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Query

private interface KnowledgeApi {
    @GET("cnc-kb/revision")
    suspend fun revision(): RevisionResponse

    @GET("cnc-kb/lookup")
    suspend fun lookup(
        @Query("controller") controller: String,
        @Query("modelFamily") modelFamily: String,
        @Query("code") code: String
    ): AlarmLookupResponse
}

data class RevisionResponse(
    @SerializedName("revision") val revision: Int
)

data class AlarmLookupResponse(
    @SerializedName("found") val found: Boolean,
    @SerializedName("alarm") val alarm: AlarmSeedItem?
)

data class AlarmSeedItem(
    @SerializedName("controller") val controller: String,
    @SerializedName("modelFamily") val modelFamily: String,
    @SerializedName("code") val code: String,
    @SerializedName("title") val title: String,
    @SerializedName("severity") val severity: String,
    @SerializedName("causes") val causes: List<String>,
    @SerializedName("actions") val actions: List<String>
)

class AlarmKnowledgeRepository(
    private val context: Context,
    private val dao: StarnetCoreDao,
    private val gson: Gson = Gson()
) {
    suspend fun ensureSeedLoaded() = withContext(Dispatchers.IO) {
        // Alarm diagnostics now run in online lookup mode.
        // Keep compatibility with previous initialization calls.
        return@withContext
    }

    suspend fun syncFromServer(baseUrl: String): Result<Int> = withContext(Dispatchers.IO) {
        runCatching { buildApi(baseUrl).revision().revision }
    }

    suspend fun findAlarmOnline(baseUrl: String, controller: String, modelFamily: String, code: String): AlarmKnowledge? =
        withContext(Dispatchers.IO) {
            runCatching {
                val response = buildApi(baseUrl).lookup(controller, modelFamily, code)
                if (!response.found) return@runCatching null
                response.alarm?.toDomain()
            }.getOrNull()
        }

    suspend fun findAlarm(controller: String, modelFamily: String, code: String): AlarmKnowledge? {
        // Fallback for legacy local records if they already exist.
        val exact = dao.findAlarmExact(controller, modelFamily, code)
            ?: dao.findAlarmByControllerCode(controller, code)
            ?: dao.findAlarmByCode(code)
            ?: return null
        return exact.toDomain(gson)
    }

    private fun buildApi(baseUrl: String): KnowledgeApi {
        return Retrofit.Builder()
            .baseUrl(if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/")
            .addConverterFactory(GsonConverterFactory.create())
            .client(OkHttpClient.Builder().build())
            .build()
            .create(KnowledgeApi::class.java)
    }
}

private fun AlarmCodeEntity.toDomain(gson: Gson): AlarmKnowledge {
    val causes = gson.fromJson(causesJson, Array<String>::class.java).toList()
    val actions = gson.fromJson(actionsJson, Array<String>::class.java).toList()
    return AlarmKnowledge(
        code = code,
        controller = controller,
        description = title,
        causes = causes,
        checks = actions
    )
}

private fun AlarmSeedItem.toDomain(): AlarmKnowledge {
    return AlarmKnowledge(
        code = code.uppercase(),
        controller = controller.uppercase(),
        description = title,
        causes = causes,
        checks = actions
    )
}
