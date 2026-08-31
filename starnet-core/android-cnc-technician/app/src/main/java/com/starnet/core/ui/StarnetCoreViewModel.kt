package com.starnet.core.ui

import android.app.Application
import android.net.Uri
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.starnet.core.data.AlarmKnowledgeRepository
import com.starnet.core.data.ChecklistItemEntity
import com.starnet.core.data.JournalEntryEntity
import com.starnet.core.data.StarnetCoreDatabase
import com.starnet.core.data.ToolEntity
import com.starnet.core.domain.AlarmCodeNormalizer
import com.starnet.core.domain.AlarmKnowledge
import com.starnet.core.domain.AlarmParser
import com.starnet.core.domain.FanucScreenAnalyzer
import com.starnet.core.domain.UkrainianTranslator
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

class StarnetCoreViewModel(application: Application) : AndroidViewModel(application) {
    private val dao = StarnetCoreDatabase.get(application).dao()
    private val repository = AlarmKnowledgeRepository(application, dao)
    val tools = dao.observeTools().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val checklist = dao.observeChecklist().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val journalEntries = dao.observeJournalEntries().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    var ocrText by mutableStateOf("")
    var ocrPreview by mutableStateOf("No extracted text yet.")
    var ocrSummary by mutableStateOf("No image analyzed yet.")
    var alarmResult by mutableStateOf<AlarmKnowledge?>(null)
    var coordinateResult by mutableStateOf<List<String>>(emptyList())
    var selectedController by mutableStateOf("FANUC")
    var selectedModelFamily by mutableStateOf("0i-TF")
    var alarmLookupBaseUrl by mutableStateOf("https://kb.starnetcore.com/")
    var lastParserPattern by mutableStateOf("n/a")
    var kbSyncStatus by mutableStateOf("AI local mode enabled. Cloud lookup optional.")
    var kbAlarmCount by mutableStateOf(0)
    var useUkrainian by mutableStateOf(true)
    var detectedFanucModel by mutableStateOf("n/a")
    var detectedFanucAlarmType by mutableStateOf("n/a")
    var detectedAlarmCode by mutableStateOf("n/a")
    var detectedAlarmConfidence by mutableStateOf(0f)
    var detectedAlarmCandidates by mutableStateOf<List<String>>(emptyList())

    init {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                repository.ensureSeedLoaded()
            }
            kbSyncStatus = "AI local mode enabled. Cloud lookup optional."
            kbAlarmCount = 0
            if (checklist.value.isEmpty()) {
                seedChecklist()
            }
        }
    }

    fun syncKnowledgeBase(baseUrl: String) {
        if (baseUrl.isBlank()) {
            kbSyncStatus = "Cloud lookup URL is empty. AI local mode is still active."
            return
        }
        viewModelScope.launch(Dispatchers.IO) {
            kbSyncStatus = "Checking cloud lookup server..."
            val result = repository.syncFromServer(baseUrl.trim())
            kbSyncStatus = if (result.isSuccess) {
                alarmLookupBaseUrl = baseUrl.trim()
                "Cloud lookup server ready (revision ${result.getOrNull()})."
            } else {
                "Cloud lookup unavailable, using AI local mode: ${result.exceptionOrNull()?.message}"
            }
            kbAlarmCount = 0
        }
    }

    fun tr(en: String, uk: String): String = if (useUkrainian) uk else en
    fun toUkr(source: String): String = UkrainianTranslator.toUkrainian(source)

    fun seedChecklist() {
        viewModelScope.launch {
            dao.deleteChecklist()
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

    fun diagnoseAlarm(code: String, controller: String, modelFamily: String) {
        val normalizedCode = AlarmCodeNormalizer.normalize(controller.trim().uppercase(), code.trim().uppercase())
        val normalizedController = controller.trim().uppercase()
        val normalizedModel = modelFamily.trim().uppercase()
        viewModelScope.launch(Dispatchers.IO) {
            lastParserPattern = "manual input"
            alarmResult = repository.findAlarmOnline(
                alarmLookupBaseUrl,
                normalizedController,
                normalizedModel,
                normalizedCode
            ) ?: repository.findAlarm(normalizedController, normalizedModel, normalizedCode)
                ?: buildLocalAiDiagnosis(normalizedController, normalizedModel, normalizedCode, detectedFanucAlarmType)
        }
    }

    fun detectAlarmFromRecognizedText() {
        val parsed = AlarmParser.parse(selectedController, selectedModelFamily, ocrText)
        if (parsed == null) {
            alarmResult = null
            lastParserPattern = "No alarm signature matched."
            return
        }
        lastParserPattern = parsed.matchedPattern
        viewModelScope.launch(Dispatchers.IO) {
            val modelForLookup = if (selectedController.uppercase() == "FANUC" && detectedFanucModel != "n/a") {
                detectedFanucModel
            } else {
                selectedModelFamily
            }
            val normalized = AlarmCodeNormalizer.normalize(selectedController, parsed.code, detectedFanucAlarmType)
            alarmResult = repository.findAlarmOnline(
                alarmLookupBaseUrl,
                selectedController,
                modelForLookup,
                normalized
            ) ?: repository.findAlarm(selectedController, modelForLookup, normalized)
                ?: buildLocalAiDiagnosis(selectedController, modelForLookup, normalized, detectedFanucAlarmType)
        }
    }

    private fun buildLocalAiDiagnosis(
        controller: String,
        modelFamily: String,
        normalizedCode: String,
        fanucTypeHint: String?
    ): AlarmKnowledge {
        val type = when {
            normalizedCode.startsWith("SV") || fanucTypeHint == "SERVO" -> "SERVO"
            normalizedCode.startsWith("SP") || fanucTypeHint == "SPINDLE" -> "SPINDLE"
            normalizedCode.startsWith("PS") || fanucTypeHint == "P/S" -> "P/S"
            normalizedCode.startsWith("OT") || fanucTypeHint == "OVERTRAVEL" -> "OVERTRAVEL"
            normalizedCode.startsWith("OH") || fanucTypeHint == "OVERHEAT" -> "OVERHEAT"
            normalizedCode.startsWith("DS") || fanucTypeHint == "DATA" -> "DATA"
            else -> "GENERAL"
        }

        val (causes, checks) = when (type) {
            "SERVO" -> Pair(
                listOf("Axis overload or mechanical binding", "Encoder/feedback issue", "Amplifier ready/power chain issue"),
                listOf("Check alarm history and axis suffix", "Inspect axis movement, lubrication, and brake", "Check drive/encoder cables and servo amplifier status LEDs")
            )
            "SPINDLE" -> Pair(
                listOf("Spindle load too high", "Spindle amplifier communication fault", "Position coder mismatch or cable issue"),
                listOf("Reduce load and retry low-speed test", "Verify spindle amp alarms and cable integrity", "Check spindle orientation/coder parameters")
            )
            "P/S" -> Pair(
                listOf("Program format/modality error", "Unsupported option command", "Parameter/state mismatch"),
                listOf("Locate offending block on alarm screen", "Verify postprocessor/control variant", "Check recent parameter changes then reset")
            )
            "OVERTRAVEL" -> Pair(
                listOf("Soft/hard limit exceeded", "Incorrect work offset/tool offset", "Wrong reference return state"),
                listOf("Jog out in safe direction", "Check G54/offsets and stroke limit params", "Perform reference return if required")
            )
            "OVERHEAT" -> Pair(
                listOf("Cabinet cooling issue", "Motor/amp thermal load", "Blocked airflow or fan fault"),
                listOf("Inspect fans and filters", "Lower duty/load and monitor temperature", "Check ambient temperature and cabinet ventilation")
            )
            "DATA" -> Pair(
                listOf("APC battery low/zero", "Reference position lost", "Data/communication inconsistency"),
                listOf("Check APC battery with machine-safe procedure", "Run reference return", "Verify detector/cable communication path")
            )
            else -> Pair(
                listOf("Alarm category unclear from OCR/manual input", "Controller-specific condition", "Machine-builder ladder condition"),
                listOf("Capture full alarm line from CNC screen", "Retry with model/type selection", "Escalate with controller model + alarm screenshot")
            )
        }

        return AlarmKnowledge(
            code = normalizedCode,
            controller = controller,
            description = "AI local diagnosis for $controller $modelFamily, code $normalizedCode, type $type.",
            causes = causes,
            checks = checks
        )
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
        viewModelScope.launch(Dispatchers.IO) {
            runCatching {
                val image = InputImage.fromFilePath(app, uri)
                val textRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
                val labeler = ImageLabeling.getClient(ImageLabelerOptions.DEFAULT_OPTIONS)
                val textResult = textRecognizer.process(image).await()
                val labelResult = labeler.process(image).await()
                ocrText = textResult.text
                val labels = labelResult.map { it.text.lowercase() to it.confidence }.toMap()
                ocrSummary = classifyPhoto(ocrText.lowercase(), labels)
                if (selectedController.uppercase() == "FANUC") {
                    val detection = FanucScreenAnalyzer.detect(ocrText)
                    detectedFanucModel = detection.modelFamily ?: "n/a"
                    detectedFanucAlarmType = detection.alarmType ?: "n/a"
                    detectedAlarmCode = detection.rawCode ?: "n/a"
                    detectedAlarmConfidence = detection.confidence
                    detectedAlarmCandidates = detection.candidateCodes.map {
                        AlarmCodeNormalizer.normalize(selectedController, it, detection.alarmType)
                    }
                    if (!detection.modelFamily.isNullOrBlank()) {
                        selectedModelFamily = detection.modelFamily
                    }
                }
                ocrPreview = buildOcrPreview(ocrText, ocrSummary, detectedAlarmConfidence)
            }.onFailure { err ->
                ocrSummary = "Recognition failed: ${err.message}"
                ocrText = ""
                ocrPreview = "No extracted text yet."
                detectedFanucModel = "n/a"
                detectedFanucAlarmType = "n/a"
                detectedAlarmCode = "n/a"
                detectedAlarmConfidence = 0f
                detectedAlarmCandidates = emptyList()
            }
        }
    }

    private fun buildOcrPreview(rawText: String, summary: String, confidence: Float): String {
        val cleaned = rawText
            .replace("\r", "\n")
            .lines()
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .map { it.replace("\\s+".toRegex(), " ") }

        val topLines = cleaned.take(8)
        val compact = topLines.joinToString(" | ")
        val limited = if (compact.length > 220) compact.take(220) + "..." else compact
        val cncRelevant = summary.contains("CNC", ignoreCase = true) ||
            summary.contains("alarm", ignoreCase = true) ||
            confidence >= 0.6f

        return when {
            limited.isBlank() -> "No extracted text yet."
            !cncRelevant -> "Non-CNC/alarm context photo detected. OCR text is noisy; use a clear CNC-screen alarm photo for diagnostics."
            else -> limited
        }
    }

    private fun classifyPhoto(text: String, labels: Map<String, Float>): String {
        val score = mutableMapOf(
            "cnc-screen" to 0f,
            "nameplate" to 0f,
            "electrical" to 0f,
            "hydraulic" to 0f,
            "part-photo" to 0f,
            "drawing" to 0f
        )

        fun bump(key: String, value: Float) {
            score[key] = (score[key] ?: 0f) + value
        }

        if (Regex("""\b(ALARM|P\/S|SV|M30|G0[0-3]|G5[4-9]|MDI|AUTO|HANDLE|PROGRAM|RUN\s*TIME|ABSOLUTE|RELATIVE|PARTS)\b""").containsMatchIn(text.uppercase())) {
            bump("cnc-screen", 3.0f)
        }
        if (Regex("""\b(SERIAL\s*NO|MODEL\s*NO|VOLT|KW|RATED|MANUFACTURE|FANUC\s*LTD)\b""").containsMatchIn(text.uppercase())) {
            bump("nameplate", 1.8f)
        }
        if (Regex("""\b(380V|220V|PLC|CONTACTOR|RELAY|SCHEMATIC)\b""").containsMatchIn(text.uppercase())) bump("electrical", 2.3f)
        if (Regex("""\b(HYDRAULIC|BAR|PUMP|VALVE|OIL)\b""").containsMatchIn(text.uppercase())) bump("hydraulic", 2.3f)
        if (Regex("""\b(Ø|R[0-9]|M[0-9]+X|RA\s*[0-9])\b""").containsMatchIn(text.uppercase())) bump("drawing", 2.5f)

        labels.forEach { (label, confidence) ->
            when {
                label.contains("machine") || label.contains("monitor") || label.contains("display") -> bump("cnc-screen", confidence)
                label.contains("label") || label.contains("text") || label.contains("barcode") -> bump("nameplate", confidence)
                label.contains("diagram") || label.contains("line") || label.contains("drawing") -> bump("drawing", confidence)
                label.contains("metal") || label.contains("steel") || label.contains("tool") -> bump("part-photo", confidence)
            }
        }

        val winner = score.maxByOrNull { it.value } ?: return "Image analyzed but category is uncertain."
        return when (winner.key) {
            "cnc-screen" -> "Detected CNC controller screen. Use AI Diagnostics to parse alarm text and resolve issue."
            "nameplate" -> "Detected machine nameplate/spec plate. Capture controller model and serial data for setup profile."
            "electrical" -> "Detected electrical schematic content. Verify voltage, relay chain and PLC I/O references."
            "hydraulic" -> "Detected hydraulic scheme/context. Inspect pressure, valve states and pump condition."
            "part-photo" -> "Detected part/tool photo. Use journal or tool database to save this process evidence."
            "drawing" -> "Detected engineering drawing-style annotations. Use calculators/coordinates/thread reference for setup."
            else -> "Image analyzed. Manual review recommended."
        }
    }
}
