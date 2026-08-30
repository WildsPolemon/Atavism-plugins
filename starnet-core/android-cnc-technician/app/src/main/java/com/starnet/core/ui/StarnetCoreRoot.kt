package com.starnet.core.ui

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.starnet.core.R
import com.starnet.core.data.ChecklistItemEntity
import com.starnet.core.data.JournalEntryEntity
import com.starnet.core.data.ToolEntity
import com.starnet.core.domain.threadReferences

private enum class CoreTab(val title: String) {
    Dashboard("Dashboard"),
    AiDiagnosis("AI Diagnostics"),
    Photo("Photo Vision"),
    Calculators("Calculators"),
    Coordinates("Coordinates"),
    Threads("Thread Ref"),
    Tools("Tools"),
    Checklist("Checklist"),
    Journal("Journal"),
    Plan("Checklist Audit")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StarnetCoreRoot(vm: StarnetCoreViewModel = viewModel()) {
    var selectedTab by remember { mutableStateOf(CoreTab.Dashboard) }
    val tabs = CoreTab.entries.toList()
    val tools by vm.tools.collectAsStateWithLifecycle()
    val checklist by vm.checklist.collectAsStateWithLifecycle()
    val journal by vm.journalEntries.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Starnet Core", fontWeight = FontWeight.Bold)
                        Text("Valchuk Ivan • CNC Setup Assistant", style = MaterialTheme.typography.bodySmall)
                    }
                },
                actions = {
                    TextButton(onClick = { vm.useUkrainian = true }) { Text("UKR") }
                    TextButton(onClick = { vm.useUkrainian = false }) { Text("ENG") }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            ScrollableTabRow(selectedTabIndex = tabs.indexOf(selectedTab), edgePadding = 8.dp) {
                tabs.forEach { tab ->
                    Tab(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        text = { Text(tab.title) }
                    )
                }
            }

            when (selectedTab) {
                CoreTab.Dashboard -> DashboardScreen(checklist)
                CoreTab.AiDiagnosis -> AiDiagnosisScreen(vm)
                CoreTab.Photo -> PhotoScreen(vm)
                CoreTab.Calculators -> CalculatorsScreen(vm)
                CoreTab.Coordinates -> CoordinatesScreen(vm)
                CoreTab.Threads -> ThreadsScreen()
                CoreTab.Tools -> ToolsScreen(vm, tools)
                CoreTab.Checklist -> ChecklistScreen(vm, checklist)
                CoreTab.Journal -> JournalScreen(vm, journal)
                CoreTab.Plan -> PlanScreen()
            }
        }
    }
}

@Composable
private fun ScreenContainer(content: @Composable () -> Unit) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item { content() }
        }
    }
}

@Composable
private fun AppCard(title: String, subtitle: String? = null, body: @Composable () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            if (!subtitle.isNullOrBlank()) {
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            body()
        }
    }
}

@Composable
private fun DashboardScreen(checklist: List<ChecklistItemEntity>) {
    val done = checklist.count { it.isChecked }
    val total = checklist.size.coerceAtLeast(1)
    val percent = (done * 100) / total

    ScreenContainer {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            AppCard(
                title = "CNC Setup Assistant",
                subtitle = "FANUC / Siemens / Mitsubishi support with practical daily modules."
            ) {
                Image(
                    painter = painterResource(id = R.drawable.ic_starnet_core_logo),
                    contentDescription = "Starnet Core Logo",
                    modifier = Modifier.height(72.dp)
                )
                Text("Checklist progress: $done/$total ($percent%)")
                Text("Use tabs for diagnostics, photo OCR, calculators, tools and journal.")
            }
            AppCard(title = "Quick Functions") {
                Text("• AI alarm diagnostics")
                Text("• Photo recognition and explanation")
                Text("• Turning / milling / drilling calculators")
                Text("• Coordinate calculator (PCD / holes / circle split)")
                Text("• Thread quick reference")
                Text("• Tool database")
                Text("• Setup checklist + custom lines")
                Text("• Work journal with problem/solution history")
            }
        }
    }
}

@Composable
private fun AiDiagnosisScreen(vm: StarnetCoreViewModel) {
    var code by remember { mutableStateOf("") }
    var controller by remember { mutableStateOf(vm.selectedController) }
    var modelFamily by remember { mutableStateOf(vm.selectedModelFamily) }
    var syncUrl by remember { mutableStateOf("https://kb.starnetcore.com/") }
    ScreenContainer {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            AppCard(
                vm.tr("AI Alarm Diagnostics", "AI-діагностика аварій"),
                vm.tr("Enter alarm code from controller screen.", "Введіть код помилки з екрана ЧПУ.")
            ) {
                OutlinedTextField(code, { code = it }, label = { Text(vm.tr("Alarm code", "Код помилки")) }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(controller, { controller = it }, label = { Text(vm.tr("Controller", "Контролер")) }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(
                    modelFamily,
                    { modelFamily = it },
                    label = { Text(vm.tr("Model family (0i-TF/31i/828D/M80)", "Серія моделі (0i-TF/31i/828D/M80)")) },
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = {
                        vm.selectedController = controller
                        vm.selectedModelFamily = modelFamily
                        vm.diagnoseAlarm(code, controller, modelFamily)
                    }) { Text(vm.tr("Diagnose", "Діагностувати")) }
                    Button(onClick = { vm.detectAlarmFromRecognizedText() }) { Text(vm.tr("Parse OCR Alarm", "Розпізнати alarm з OCR")) }
                }
                HorizontalDivider()
                OutlinedTextField(
                    syncUrl,
                    { syncUrl = it },
                    label = { Text(vm.tr("Knowledge base sync URL", "URL синхронізації бази знань")) },
                    modifier = Modifier.fillMaxWidth()
                )
                Button(onClick = { vm.syncKnowledgeBase(syncUrl) }) { Text(vm.tr("Sync Knowledge Base", "Синхронізувати базу знань")) }
                Text(
                    vm.tr("KB status", "Статус БЗ") + ": " + (if (vm.useUkrainian) vm.toUkr(vm.kbSyncStatus) else vm.kbSyncStatus),
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    vm.tr("Online alarm lookup URL", "URL онлайн пошуку alarm") + ": ${vm.alarmLookupBaseUrl}",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    vm.tr("Detected FANUC model", "Визначена модель FANUC") + ": ${vm.detectedFanucModel}",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    vm.tr("Detected alarm type", "Визначений тип аварії") + ": ${vm.detectedFanucAlarmType}",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(vm.tr("Parser signature", "Сигнатура парсера") + ": ${vm.lastParserPattern}", style = MaterialTheme.typography.bodySmall)
            }
            AppCard(vm.tr("Diagnosis Result", "Результат діагностики")) {
                val result = vm.alarmResult
                if (result == null) {
                    Text(vm.tr("No diagnosis yet.", "Діагностика ще не виконана."))
                } else {
                    Text("${result.controller} ${result.code}", fontWeight = FontWeight.Bold)
                    Text(if (vm.useUkrainian) vm.toUkr(result.description) else result.description)
                    Text(vm.tr("Possible causes", "Можливі причини"), fontWeight = FontWeight.SemiBold)
                    result.causes.forEach { Text("• " + if (vm.useUkrainian) vm.toUkr(it) else it) }
                    Text(vm.tr("Step-by-step checks", "Покрокова перевірка"), fontWeight = FontWeight.SemiBold)
                    result.checks.forEachIndexed { index, s ->
                        Text("${index + 1}. " + if (vm.useUkrainian) vm.toUkr(s) else s)
                    }
                }
            }
        }
    }
}

@Composable
private fun PhotoScreen(vm: StarnetCoreViewModel) {
    var selectedUri by remember { mutableStateOf<Uri?>(null) }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            selectedUri = uri
            vm.recognizeImage(uri)
        }
    }
    ScreenContainer {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            AppCard(
                vm.tr("Photo Vision", "Розпізнавання фото"),
                vm.tr("Upload machine screen, schematic, detail or drawing photo.", "Завантажте фото екрана, схеми, деталі або креслення.")
            ) {
                Button(onClick = { launcher.launch("image/*") }) { Text(vm.tr("Select photo", "Вибрати фото")) }
                selectedUri?.let {
                    AsyncImage(model = it, contentDescription = "photo", modifier = Modifier.fillMaxWidth().height(220.dp))
                }
            }
            AppCard(vm.tr("AI Output", "Результат AI")) {
                val summary = if (vm.useUkrainian) vm.toUkr(vm.ocrSummary) else vm.ocrSummary
                Text(vm.tr("Summary", "Підсумок") + ": $summary")
                HorizontalDivider()
                Text(vm.ocrText.ifBlank { vm.tr("No extracted text yet.", "Текст ще не розпізнано.") })
                Spacer(Modifier.height(6.dp))
                Text(
                    vm.tr("Detected model", "Визначена модель") + ": ${vm.detectedFanucModel}",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    vm.tr("Detected alarm type", "Визначений тип аварії") + ": ${vm.detectedFanucAlarmType}",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    vm.tr("Detected alarm code", "Визначений код аварії") + ": ${vm.detectedAlarmCode}",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    vm.tr(
                        "Detected alarm parsing works with controller=${vm.selectedController}, model=${vm.selectedModelFamily}.",
                        "Парсер alarm працює для controller=${vm.selectedController}, model=${vm.selectedModelFamily}."
                    ),
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun CalculatorsScreen(vm: StarnetCoreViewModel) {
    var vc by remember { mutableDoubleStateOf(180.0) }
    var diameter by remember { mutableDoubleStateOf(50.0) }
    var rpm by remember { mutableDoubleStateOf(1600.0) }
    var teeth by remember { mutableIntStateOf(4) }
    var fz by remember { mutableDoubleStateOf(0.08) }
    var drillDepth by remember { mutableDoubleStateOf(30.0) }
    var drillFeed by remember { mutableDoubleStateOf(120.0) }

    ScreenContainer {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            AppCard("Turning Calculator") {
                OutlinedTextField(vc.toString(), { vc = it.toDoubleOrNull() ?: vc }, label = { Text("Cutting speed m/min") })
                OutlinedTextField(diameter.toString(), { diameter = it.toDoubleOrNull() ?: diameter }, label = { Text("Diameter mm") })
                Text("RPM: ${vm.calculateTurningRpm(vc, diameter)}", fontWeight = FontWeight.SemiBold)
            }
            AppCard("Milling Calculator") {
                OutlinedTextField(rpm.toString(), { rpm = it.toDoubleOrNull() ?: rpm }, label = { Text("RPM") })
                OutlinedTextField(teeth.toString(), { teeth = it.toIntOrNull() ?: teeth }, label = { Text("Teeth") })
                OutlinedTextField(fz.toString(), { fz = it.toDoubleOrNull() ?: fz }, label = { Text("Feed per tooth mm") })
                Text("Feed rate mm/min: ${"%.1f".format(vm.calculateMillingFeed(rpm, teeth, fz))}", fontWeight = FontWeight.SemiBold)
            }
            AppCard("Drilling Calculator") {
                OutlinedTextField(drillDepth.toString(), { drillDepth = it.toDoubleOrNull() ?: drillDepth }, label = { Text("Depth mm") })
                OutlinedTextField(drillFeed.toString(), { drillFeed = it.toDoubleOrNull() ?: drillFeed }, label = { Text("Feed mm/min") })
                Text("Machining time min: ${"%.3f".format(vm.calculateDrillingTime(drillDepth, drillFeed))}", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun CoordinatesScreen(vm: StarnetCoreViewModel) {
    var pcd by remember { mutableDoubleStateOf(100.0) }
    var holes by remember { mutableIntStateOf(6) }
    var startAngle by remember { mutableDoubleStateOf(0.0) }

    ScreenContainer {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            AppCard("Coordinate Calculator", "PCD, circle split and drilling coordinates.") {
                OutlinedTextField(pcd.toString(), { pcd = it.toDoubleOrNull() ?: pcd }, label = { Text("PCD mm") })
                OutlinedTextField(holes.toString(), { holes = it.toIntOrNull() ?: holes }, label = { Text("Holes count") })
                OutlinedTextField(startAngle.toString(), { startAngle = it.toDoubleOrNull() ?: startAngle }, label = { Text("Start angle °") })
                Button(onClick = { vm.calculateBoltCircle(pcd, holes, startAngle) }) { Text("Generate X/Y Coordinates") }
            }
            AppCard("Generated Points") {
                vm.coordinateResult.ifEmpty { listOf("No points generated.") }.forEach { Text(it) }
            }
        }
    }
}

@Composable
private fun ThreadsScreen() {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                AppCard("Thread Quick Reference", "Metric / Pipe / Inch") {
                    Text("Includes pitch, major/minor diameters and tap drill suggestions.")
                }
            }
            items(threadReferences) { ref ->
                AppCard("${ref.family}: ${ref.designation}") {
                    Text("Pitch: ${ref.pitch}")
                    Text("Major: ${ref.majorDia} mm")
                    Text("Minor: ${ref.minorDia} mm")
                    Text("Tap drill: ${ref.tapDrill} mm")
                }
            }
        }
    }
}

@Composable
private fun ToolsScreen(vm: StarnetCoreViewModel, tools: List<ToolEntity>) {
    var toolNumber by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("Turning") }
    var insert by remember { mutableStateOf("") }
    var holder by remember { mutableStateOf("") }
    var diameter by remember { mutableStateOf("12.0") }
    var material by remember { mutableStateOf("Carbide") }
    var photoUri by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            item {
                AppCard("Tool Database", "Create your local tool catalog.") {
                    OutlinedTextField(toolNumber, { toolNumber = it }, label = { Text("Tool number T") })
                    OutlinedTextField(type, { type = it }, label = { Text("Type") })
                    OutlinedTextField(insert, { insert = it }, label = { Text("Insert") })
                    OutlinedTextField(holder, { holder = it }, label = { Text("Holder") })
                    OutlinedTextField(diameter, { diameter = it }, label = { Text("Diameter mm") })
                    OutlinedTextField(material, { material = it }, label = { Text("Material") })
                    OutlinedTextField(photoUri, { photoUri = it }, label = { Text("Photo URI") })
                    OutlinedTextField(notes, { notes = it }, label = { Text("Notes") })
                    Button(onClick = {
                        vm.addTool(toolNumber, type, insert, holder, diameter.toDoubleOrNull() ?: 0.0, material, photoUri, notes)
                        toolNumber = ""
                        insert = ""
                        holder = ""
                        notes = ""
                    }) { Text("Save Tool") }
                }
            }
            items(tools) { tool ->
                AppCard("${tool.toolNumber} • ${tool.type}") {
                    Text("Insert: ${tool.insertName}")
                    Text("Holder: ${tool.holder}")
                    Text("Diameter: ${tool.diameterMm} mm")
                    Text("Material: ${tool.material}")
                    if (tool.notes.isNotBlank()) Text("Notes: ${tool.notes}")
                }
            }
        }
    }
}

@Composable
private fun ChecklistScreen(vm: StarnetCoreViewModel, items: List<ChecklistItemEntity>) {
    var customItem by remember { mutableStateOf("") }
    val done = items.count { it.isChecked }
    val total = items.size.coerceAtLeast(1)
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            item {
                AppCard("Setup Checklist", "Completed: $done/$total") {
                    OutlinedTextField(customItem, { customItem = it }, label = { Text("Custom checklist line") })
                    Row {
                        Button(onClick = {
                            vm.addChecklistItem(customItem)
                            customItem = ""
                        }) { Text("Add") }
                        Spacer(Modifier.width(8.dp))
                        TextButton(onClick = { vm.seedChecklist() }) { Text("Reset defaults") }
                    }
                }
            }
            items(items) { line ->
                AppCard(line.title) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(if (line.isChecked) "Done" else "Pending")
                        Checkbox(checked = line.isChecked, onCheckedChange = { vm.toggleChecklist(line.id, it) })
                    }
                }
            }
        }
    }
}

@Composable
private fun JournalScreen(vm: StarnetCoreViewModel, entries: List<JournalEntryEntity>) {
    var part by remember { mutableStateOf("") }
    var machine by remember { mutableStateOf("SL2000") }
    var program by remember { mutableStateOf("") }
    var tool by remember { mutableStateOf("") }
    var problems by remember { mutableStateOf("") }
    var solutions by remember { mutableStateOf("") }
    var photo by remember { mutableStateOf("") }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            item {
                AppCard("Work Journal", "Save setup details, issues and final solution.") {
                    OutlinedTextField(part, { part = it }, label = { Text("Part number") })
                    OutlinedTextField(machine, { machine = it }, label = { Text("Machine") })
                    OutlinedTextField(program, { program = it }, label = { Text("Program") })
                    OutlinedTextField(tool, { tool = it }, label = { Text("Tool info") })
                    OutlinedTextField(problems, { problems = it }, label = { Text("Problems") })
                    OutlinedTextField(solutions, { solutions = it }, label = { Text("Solutions") })
                    OutlinedTextField(photo, { photo = it }, label = { Text("Photo URI") })
                    Button(onClick = {
                        vm.addJournalEntry(part, machine, program, tool, problems, solutions, photo)
                        part = ""
                        program = ""
                        problems = ""
                        solutions = ""
                    }) { Text("Save Journal Record") }
                }
            }
            items(entries) { entry ->
                AppCard("${entry.partNumber} • ${entry.machine}") {
                    Text("Program: ${entry.programName}")
                    Text("Tool: ${entry.toolInfo}")
                    Text("Problems: ${entry.problems}")
                    Text("Solutions: ${entry.solutions}")
                    Text("Time: ${entry.createdAt}", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@Composable
private fun PlanScreen() {
    ScreenContainer {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            AppCard("Checklist Mapping (Your Request vs Implemented)") {
                Text("1. AI diagnostics: Done")
                Text("2. Photo recognition: Done")
                Text("3. CNC calculators: Done")
                Text("4. Coordinate calculator: Done")
                Text("5. Thread references: Done")
                Text("6. Tool database: Done")
                Text("7. Setup checklist: Done")
                Text("8. Work journal: Done")
            }
            AppCard("Next Professional Upgrade Pack") {
                Text("• Sync with cloud backend and team accounts")
                Text("• Full alarm library import by control model")
                Text("• Offline/online photo classifier for schematic types")
                Text("• Search/filter and export for tool/journal/checklist data")
            }
        }
    }
}
