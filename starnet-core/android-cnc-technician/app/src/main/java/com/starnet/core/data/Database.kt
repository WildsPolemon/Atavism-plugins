package com.starnet.core.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "tools")
data class ToolEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val toolNumber: String,
    val type: String,
    val insertName: String,
    val holder: String,
    val diameterMm: Double,
    val material: String,
    val photoUri: String,
    val notes: String
)

@Entity(tableName = "checklist_items")
data class ChecklistItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val isChecked: Boolean = false
)

@Entity(tableName = "journal_entries")
data class JournalEntryEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val partNumber: String,
    val machine: String,
    val programName: String,
    val toolInfo: String,
    val problems: String,
    val solutions: String,
    val photoUri: String,
    val createdAt: String
)

@Entity(tableName = "alarm_codes")
data class AlarmCodeEntity(
    @PrimaryKey val key: String,
    val controller: String,
    val modelFamily: String,
    val code: String,
    val title: String,
    val severity: String,
    val causesJson: String,
    val actionsJson: String,
    val revision: Int
)

@Entity(tableName = "kb_meta")
data class KbMetaEntity(
    @PrimaryKey val id: Int = 1,
    val revision: Int,
    val updatedAt: String,
    val source: String
)

@Dao
interface StarnetCoreDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertTool(tool: ToolEntity)

    @Query("SELECT * FROM tools ORDER BY id DESC")
    fun observeTools(): Flow<List<ToolEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertChecklistItem(item: ChecklistItemEntity)

    @Query("UPDATE checklist_items SET isChecked = :checked WHERE id = :id")
    suspend fun setChecklistChecked(id: Int, checked: Boolean)

    @Query("DELETE FROM checklist_items")
    suspend fun deleteChecklist()

    @Query("DELETE FROM checklist_items WHERE id = :id")
    suspend fun deleteChecklistItem(id: Int)

    @Query("SELECT * FROM checklist_items ORDER BY id ASC")
    fun observeChecklist(): Flow<List<ChecklistItemEntity>>

    @Query("SELECT * FROM checklist_items ORDER BY id ASC")
    suspend fun getChecklistSnapshot(): List<ChecklistItemEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addJournalEntry(entry: JournalEntryEntity)

    @Query("SELECT * FROM journal_entries ORDER BY id DESC")
    fun observeJournalEntries(): Flow<List<JournalEntryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAlarm(alarm: AlarmCodeEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAlarms(alarms: List<AlarmCodeEntity>)

    @Query("SELECT * FROM alarm_codes WHERE controller = :controller AND modelFamily = :modelFamily AND code = :code LIMIT 1")
    suspend fun findAlarmExact(controller: String, modelFamily: String, code: String): AlarmCodeEntity?

    @Query("SELECT * FROM alarm_codes WHERE controller = :controller AND code = :code LIMIT 1")
    suspend fun findAlarmByControllerCode(controller: String, code: String): AlarmCodeEntity?

    @Query("SELECT * FROM alarm_codes WHERE code = :code LIMIT 1")
    suspend fun findAlarmByCode(code: String): AlarmCodeEntity?

    @Query("SELECT COUNT(*) FROM alarm_codes")
    suspend fun alarmCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertKbMeta(meta: KbMetaEntity)

    @Query("SELECT * FROM kb_meta WHERE id = 1 LIMIT 1")
    suspend fun getKbMeta(): KbMetaEntity?
}

@Database(
    entities = [
        ToolEntity::class,
        ChecklistItemEntity::class,
        JournalEntryEntity::class,
        AlarmCodeEntity::class,
        KbMetaEntity::class
    ],
    version = 2,
    exportSchema = false
)
abstract class StarnetCoreDatabase : RoomDatabase() {
    abstract fun dao(): StarnetCoreDao

    companion object {
        @Volatile
        private var instance: StarnetCoreDatabase? = null

        fun get(context: Context): StarnetCoreDatabase {
            return instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    StarnetCoreDatabase::class.java,
                    "starnet_core.db"
                ).fallbackToDestructiveMigration().build().also { instance = it }
            }
        }
    }
}
