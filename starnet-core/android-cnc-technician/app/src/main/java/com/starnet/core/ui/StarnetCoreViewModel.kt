package com.starnet.core.ui

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.starnet.core.data.ChecklistItemEntity
import com.starnet.core.data.JournalEntryEntity
import com.starnet.core.data.StarnetCoreDatabase
import com.starnet.core.data.ToolEntity
import com.starnet.core.domain.AlarmKnowledge
import com.starnet.core.domain.alarmKnowledgeBase
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

class StarnetCoreViewModel(application: Application) : AndroidViewModel(application) {
    private val dao = StarnetCoreDatabase.get(application).dao()
    val tools = dao.observeTools().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val checklist = dao.observeChecklist().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val journalEntries = dao.observeJournalEntries().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    var ocrText: String = ""
    var ocrSummary: String = "No image analyzed yet."
    var alarmResult: AlarmKnowledge? = null
    var coordinateResult: List<String> = emptyList()

    init {
        viewModelScope.launch {
            if (checklist.value.isEmpty()) {
                seedChecklist()
            }
        }
    }

    fun seedChecklist() {
        viewModelScope.launch {
            listOf(
                "Workpiece clamped",
                "Tool setup verified",
                "Offsets entered",
                "Work zero confirmed",
                "Program reviewed",
                "Dry run completed",
                "Single block test completed"
            ).forEach { item ->
                dao.upsertChecklistItem(ChecklistItemEntity(title = item))
            }
        }
    }

    fun toggleChecklist(id: Int, checked: Boolean) {
        viewModelScope.launch { dao.setChecklistChecked(id, checked) }
    }

    fun addChecklistItem(title: String) {
        if (title.isBlank()) return
        viewModelScope.launch { dao.upsertChecklistItem(ChecklistItemEntity(title = title.trim())) }
    }

    fun addTool(
        toolNumber: String,
        type: String,
        insertName: String,
        holder: String,
        diameterMm: Double,
        material: String,
        photoUri: String,
        notes: String
    ) {
        if (toolNumber.isBlank()) return
        viewModelScope.launch {
            dao.upsertTool(
                ToolEntity(
                    toolNumber = toolNumber.trim(),
                    type = type.trim(),
                    insertName = insertName.trim(),
                    holder = holder.trim(),
                    diameterMm = diameterMm,
                    material = material.trim(),
                    photoUri = photoUri.trim(),
                    notes = notes.trim()
                )
            )
        }
    }

    fun addJournalEntry(
        partNumber: String,
        machine: String,
        programName: String,
        toolInfo: String,
        problems: String,
        solutions: String,
        photoUri: String
    ) {
        if (partNumber.isBlank()) return
        val timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
        viewModelScope.launch {
            dao.addJournalEntry(
                JournalEntryEntity(
                    partNumber = partNumber.trim(),
                    machine = machine.trim(),
                    programName = programName.trim(),
                    toolInfo = toolInfo.trim(),
                    problems = problems.trim(),
                    solutions = solutions.trim(),
                    photoUri = photoUri.trim(),
                    createdAt = timestamp
                )
            )
        }
    }

    fun diagnoseAlarm(code: String, controller: String) {
        val normalizedCode = code.trim().uppercase()
        val normalizedController = controller.trim().uppercase()
        alarmResult = alarmKnowledgeBase.firstOrNull {
            it.code.uppercase() == normalizedCode && it.controller.uppercase() == normalizedController
        } ?: alarmKnowledgeBase.firstOrNull {
            it.code.uppercase() == normalizedCode
        }
    }

    fun calculateBoltCircle(pcd: Double, holes: Int, startAngle: Double = 0.0) {
        if (pcd <= 0 || holes <= 0) {
            coordinateResult = listOf("Invalid values.")
            return
        }
        val radius = pcd / 2.0
        coordinateResult = (0 until holes).map { index ->
            val angleDeg = startAngle + (360.0 / holes) * index
            val angleRad = angleDeg * PI / 180.0
            val x = radius * cos(angleRad)
            val y = radius * sin(angleRad)
            "P${index + 1}: X=${"%.3f".format(x)} Y=${"%.3f".format(y)} A=${"%.2f".format(angleDeg)}°"
        }
    }

    fun calculateTurningRpm(cuttingSpeed: Double, diameter: Double): Int {
        if (cuttingSpeed <= 0 || diameter <= 0) return 0
        return ((1000 * cuttingSpeed) / (PI * diameter)).roundToInt()
    }

    fun calculateMillingFeed(rpm: Double, teeth: Int, feedPerTooth: Double): Double {
        if (rpm <= 0 || teeth <= 0 || feedPerTooth <= 0) return 0.0
        return rpm * teeth * feedPerTooth
    }

    fun calculateDrillingTime(depth: Double, feedMmPerMin: Double): Double {
        if (depth <= 0 || feedMmPerMin <= 0) return 0.0
        return depth / feedMmPerMin
    }

    fun recognizeImage(uri: Uri) {
        val app = getApplication<Application>()
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
        val image = InputImage.fromFilePath(app, uri)
        recognizer.process(image)
            .addOnSuccessListener { text ->
                ocrText = text.text
                val lower = text.text.lowercase()
                ocrSummary = when {
                    lower.contains("alarm") || lower.contains("ps") ->
                        "Possible CNC controller alarm screen detected."
                    lower.contains("v") && lower.contains("a") && lower.contains("hydraulic") ->
                        "Possible hydraulic or electrical sheet detected."
                    lower.contains("m") && lower.contains("x") ->
                        "Possible drawing/thread annotation detected."
                    else -> "Image text extracted. Review manually."
                }
            }
            .addOnFailureListener { err ->
                ocrSummary = "Recognition failed: ${err.message}"
                ocrText = ""
            }
    }
}
