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

    @GET("cnc-kb/alarms")
    suspend fun alarms(@Query("fromRevision") fromRevision: Int): AlarmSeedFile
}

data class RevisionResponse(
    @SerializedName("revision") val revision: Int
)

data class AlarmSeedFile(
    @SerializedName("revision") val revision: Int,
    @SerializedName("generatedAt") val generatedAt: String,
    @SerializedName("alarms") val alarms: List<AlarmSeedItem>
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
        if (dao.alarmCount() > 0) return@withContext
        val text = context.assets.open("alarm_seed_v1.json").bufferedReader().use { it.readText() }
        val seed = gson.fromJson(text, AlarmSeedFile::class.java)
        val entities = seed.alarms.map { it.toEntity(seed.revision, gson) }
        dao.upsertAlarms(entities)
        dao.upsertKbMeta(KbMetaEntity(revision = seed.revision, updatedAt = seed.generatedAt, source = "asset"))
    }

    suspend fun syncFromServer(baseUrl: String): Result<Int> = withContext(Dispatchers.IO) {
        runCatching {
            val currentRevision = dao.getKbMeta()?.revision ?: 0
            val api = Retrofit.Builder()
                .baseUrl(if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/")
                .addConverterFactory(GsonConverterFactory.create())
                .client(OkHttpClient.Builder().build())
                .build()
                .create(KnowledgeApi::class.java)

            val remoteRevision = api.revision().revision
            if (remoteRevision <= currentRevision) return@runCatching currentRevision

            val update = api.alarms(currentRevision)
            dao.upsertAlarms(update.alarms.map { it.toEntity(update.revision, gson) })
            dao.upsertKbMeta(
                KbMetaEntity(
                    revision = update.revision,
                    updatedAt = update.generatedAt,
                    source = "remote"
                )
            )
            update.revision
        }
    }

    suspend fun findAlarm(controller: String, modelFamily: String, code: String): AlarmKnowledge? {
        val exact = dao.findAlarmExact(controller, modelFamily, code)
            ?: dao.findAlarmByControllerCode(controller, code)
            ?: dao.findAlarmByCode(code)
            ?: return null
        return exact.toDomain(gson)
    }
}

private fun AlarmSeedItem.toEntity(revision: Int, gson: Gson): AlarmCodeEntity {
    val key = "${controller.uppercase()}|${modelFamily.uppercase()}|${code.uppercase()}"
    return AlarmCodeEntity(
        key = key,
        controller = controller.uppercase(),
        modelFamily = modelFamily.uppercase(),
        code = code.uppercase(),
        title = title,
        severity = severity,
        causesJson = gson.toJson(causes),
        actionsJson = gson.toJson(actions),
        revision = revision
    )
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
