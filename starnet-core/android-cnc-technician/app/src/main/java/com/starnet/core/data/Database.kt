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

    @Query("SELECT * FROM checklist_items ORDER BY id ASC")
    fun observeChecklist(): Flow<List<ChecklistItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addJournalEntry(entry: JournalEntryEntity)

    @Query("SELECT * FROM journal_entries ORDER BY id DESC")
    fun observeJournalEntries(): Flow<List<JournalEntryEntity>>
}

@Database(
    entities = [ToolEntity::class, ChecklistItemEntity::class, JournalEntryEntity::class],
    version = 1,
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
                ).build().also { instance = it }
            }
        }
    }
}
