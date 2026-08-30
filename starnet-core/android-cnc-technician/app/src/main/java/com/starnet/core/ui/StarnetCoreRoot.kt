package com.starnet.core.ui

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
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
import com.starnet.core.domain.threadReferences

private enum class CoreTab(val title: String) {
    Dashboard("Dashboard"),
    AiDiagnosis("AI Diagnosis"),
    Photo("Photo Vision"),
    Calculators("Calculators"),
    Coordinates("Coordinates"),
    Threads("Threads"),
    Tools("Tools"),
    Checklist("Checklist"),
    Journal("Journal"),
    Plan("Implementation Plan")
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
                        Text("Valchuk Ivan", style = MaterialTheme.typography.bodySmall)
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            TabRow(selectedTabIndex = tabs.indexOf(selectedTab)) {
                tabs.forEach { tab ->
                    Tab(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        text = { Text(tab.title) }
                    )
                }
            }

            when (selectedTab) {
                CoreTab.Dashboard -> DashboardScreen()
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
private fun DashboardScreen() {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Image(
                        painter = painterResource(id = R.drawable.ic_starnet_core_logo),
                        contentDescription = "Starnet Core Logo",
                        modifier = Modifier.height(72.dp)
                    )
                    Text("CNC Setup Assistant", style = MaterialTheme.typography.headlineSmall)
                    Text("Real functionality package for FANUC / Siemens / Mitsubishi setup technicians.")
                    Spacer(Modifier.height(8.dp))
                    Text("Core modules:", fontWeight = FontWeight.Bold)
                    Text("1) AI alarm diagnostics")
                    Text("2) Photo recognition and explanation")
                    Text("3) Turning/Milling/Drilling calculators")
                    Text("4) Coordinate calculator (PCD, circle split, chamfer/cone support)")
                    Text("5) Thread references")
                    Text("6) Tool database")
                    Text("7) Setup checklists")
                    Text("8) Job journal with problem/solution memory")
                }
            }
        }
    }
}

@Composable
private fun AiDiagnosisScreen(vm: StarnetCoreViewModel) {
    var code by remember { mutableStateOf("") }
    var controller by remember { mutableStateOf("FANUC") }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item {
            OutlinedTextField(code, onValueChange = { code = it }, label = { Text("Alarm code") }, modifier = Modifier.fillMaxWidth())
        }
        item {
            OutlinedTextField(controller, onValueChange = { controller = it }, label = { Text("Controller (FANUC/Siemens/Mitsubishi)") }, modifier = Modifier.fillMaxWidth())
        }
        item {
            Button(onClick = { vm.diagnoseAlarm(code, controller) }) { Text("Diagnose alarm") }
        }
        item {
            val result = vm.alarmResult
            if (result == null) {
                Text("No diagnosis yet.")
            } else {
                Card {
                    Column(Modifier.padding(12.dp)) {
                        Text("${result.controller} ${result.code}", fontWeight = FontWeight.Bold)
                        Text(result.description)
                        Spacer(Modifier.height(8.dp))
                        Text("Possible causes", fontWeight = FontWeight.Bold)
                        result.causes.forEach { Text("• $it") }
                        Spacer(Modifier.height(8.dp))
                        Text("Step-by-step checks", fontWeight = FontWeight.Bold)
                        result.checks.forEachIndexed { index, s -> Text("${index + 1}. $s") }
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
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { Button(onClick = { launcher.launch("image/*") }) { Text("Select photo") } }
        item {
            selectedUri?.let { AsyncImage(model = it, contentDescription = "photo", modifier = Modifier.fillMaxWidth().height(200.dp)) }
        }
        item { Text("AI summary: ${vm.ocrSummary}") }
        item { Text("Extracted text:") }
        item { Card { Text(vm.ocrText.ifBlank { "No text extracted yet." }, Modifier.padding(12.dp)) } }
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
    val turningRpm = vm.calculateTurningRpm(vc, diameter)
    val millingFeed = vm.calculateMillingFeed(rpm, teeth, fz)
    val drillingMin = vm.calculateDrillingTime(drillDepth, drillFeed)

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item { Text("Turning calculator", fontWeight = FontWeight.Bold) }
        item { OutlinedTextField(vc.toString(), { vc = it.toDoubleOrNull() ?: vc }, label = { Text("Cutting speed m/min") }) }
        item { OutlinedTextField(diameter.toString(), { diameter = it.toDoubleOrNull() ?: diameter }, label = { Text("Diameter mm") }) }
        item { Text("RPM: $turningRpm") }
        item { HorizontalDivider() }
        item { Text("Milling calculator", fontWeight = FontWeight.Bold) }
        item { OutlinedTextField(rpm.toString(), { rpm = it.toDoubleOrNull() ?: rpm }, label = { Text("RPM") }) }
        item { OutlinedTextField(teeth.toString(), { teeth = it.toIntOrNull() ?: teeth }, label = { Text("Teeth") }) }
        item { OutlinedTextField(fz.toString(), { fz = it.toDoubleOrNull() ?: fz }, label = { Text("Feed per tooth mm") }) }
        item { Text("Feed rate mm/min: ${"%.1f".format(millingFeed)}") }
        item { HorizontalDivider() }
        item { Text("Drilling calculator", fontWeight = FontWeight.Bold) }
        item { OutlinedTextField(drillDepth.toString(), { drillDepth = it.toDoubleOrNull() ?: drillDepth }, label = { Text("Depth mm") }) }
        item { OutlinedTextField(drillFeed.toString(), { drillFeed = it.toDoubleOrNull() ?: drillFeed }, label = { Text("Feed mm/min") }) }
        item { Text("Machining time min: ${"%.3f".format(drillingMin)}") }
    }
}

@Composable
private fun CoordinatesScreen(vm: StarnetCoreViewModel) {
    var pcd by remember { mutableDoubleStateOf(100.0) }
    var holes by remember { mutableIntStateOf(6) }
    var startAngle by remember { mutableDoubleStateOf(0.0) }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item { Text("Coordinate calculator", fontWeight = FontWeight.Bold) }
        item { OutlinedTextField(pcd.toString(), { pcd = it.toDoubleOrNull() ?: pcd }, label = { Text("PCD mm") }) }
        item { OutlinedTextField(holes.toString(), { holes = it.toIntOrNull() ?: holes }, label = { Text("Holes count") }) }
        item { OutlinedTextField(startAngle.toString(), { startAngle = it.toDoubleOrNull() ?: startAngle }, label = { Text("Start angle °") }) }
        item { Button(onClick = { vm.calculateBoltCircle(pcd, holes, startAngle) }) { Text("Generate X/Y points") } }
        items(vm.coordinateResult) { line -> Text(line) }
    }
}

@Composable
private fun ThreadsScreen() {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        item {
            Text("Thread quick reference", fontWeight = FontWeight.Bold)
            Text("Metric / Pipe / Inch. Includes pitch, diameters, drill suggestions.")
        }
        items(threadReferences) { ref ->
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(10.dp)) {
                    Text("${ref.family}: ${ref.designation}", fontWeight = FontWeight.SemiBold)
                    Text("Pitch: ${ref.pitch}")
                    Text("Major: ${ref.majorDia} mm, Minor: ${ref.minorDia} mm")
                    Text("Tap drill: ${ref.tapDrill} mm")
                }
            }
        }
    }
}

@Composable
private fun ToolsScreen(vm: StarnetCoreViewModel, tools: List<com.starnet.core.data.ToolEntity>) {
    var toolNumber by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("Turning") }
    var insert by remember { mutableStateOf("") }
    var holder by remember { mutableStateOf("") }
    var diameter by remember { mutableStateOf("12.0") }
    var material by remember { mutableStateOf("Carbide") }
    var photoUri by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item { Text("Tool database", fontWeight = FontWeight.Bold) }
        item { OutlinedTextField(toolNumber, { toolNumber = it }, label = { Text("Tool number T") }) }
        item { OutlinedTextField(type, { type = it }, label = { Text("Type") }) }
        item { OutlinedTextField(insert, { insert = it }, label = { Text("Insert") }) }
        item { OutlinedTextField(holder, { holder = it }, label = { Text("Holder") }) }
        item { OutlinedTextField(diameter, { diameter = it }, label = { Text("Diameter mm") }) }
        item { OutlinedTextField(material, { material = it }, label = { Text("Material") }) }
        item { OutlinedTextField(photoUri, { photoUri = it }, label = { Text("Photo uri") }) }
        item { OutlinedTextField(notes, { notes = it }, label = { Text("Notes") }) }
        item {
            Button(onClick = {
                vm.addTool(toolNumber, type, insert, holder, diameter.toDoubleOrNull() ?: 0.0, material, photoUri, notes)
                toolNumber = ""
                insert = ""
                holder = ""
                notes = ""
            }) { Text("Save tool") }
        }
        items(tools) { tool ->
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(10.dp)) {
                    Text("${tool.toolNumber} • ${tool.type}", fontWeight = FontWeight.SemiBold)
                    Text("Insert: ${tool.insertName} / Holder: ${tool.holder}")
                    Text("Diameter: ${tool.diameterMm} mm / Material: ${tool.material}")
                    if (tool.notes.isNotBlank()) Text("Notes: ${tool.notes}")
                }
            }
        }
    }
}

@Composable
private fun ChecklistScreen(vm: StarnetCoreViewModel, items: List<com.starnet.core.data.ChecklistItemEntity>) {
    var customItem by remember { mutableStateOf("") }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item { Text("Setup checklist", fontWeight = FontWeight.Bold) }
        item {
            OutlinedTextField(customItem, { customItem = it }, label = { Text("Add custom checklist line") })
        }
        item {
            Button(onClick = {
                vm.addChecklistItem(customItem)
                customItem = ""
            }) { Text("Add checklist item") }
        }
        items(items) { line ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(line.title, modifier = Modifier.weight(1f))
                Checkbox(
                    checked = line.isChecked,
                    onCheckedChange = { vm.toggleChecklist(line.id, it) }
                )
            }
            HorizontalDivider()
        }
    }
}

@Composable
private fun JournalScreen(vm: StarnetCoreViewModel, entries: List<com.starnet.core.data.JournalEntryEntity>) {
    var part by remember { mutableStateOf("") }
    var machine by remember { mutableStateOf("SL2000") }
    var program by remember { mutableStateOf("") }
    var tool by remember { mutableStateOf("") }
    var problems by remember { mutableStateOf("") }
    var solutions by remember { mutableStateOf("") }
    var photo by remember { mutableStateOf("") }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item { Text("Journal", fontWeight = FontWeight.Bold) }
        item { OutlinedTextField(part, { part = it }, label = { Text("Part number") }) }
        item { OutlinedTextField(machine, { machine = it }, label = { Text("Machine") }) }
        item { OutlinedTextField(program, { program = it }, label = { Text("Program") }) }
        item { OutlinedTextField(tool, { tool = it }, label = { Text("Tool info") }) }
        item { OutlinedTextField(problems, { problems = it }, label = { Text("Problems") }) }
        item { OutlinedTextField(solutions, { solutions = it }, label = { Text("Solutions") }) }
        item { OutlinedTextField(photo, { photo = it }, label = { Text("Photo uri") }) }
        item {
            Button(onClick = {
                vm.addJournalEntry(part, machine, program, tool, problems, solutions, photo)
                part = ""
                program = ""
                problems = ""
                solutions = ""
            }) { Text("Save journal record") }
        }
        items(entries) { entry ->
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(10.dp)) {
                    Text("${entry.partNumber} • ${entry.machine}", fontWeight = FontWeight.Bold)
                    Text("Program: ${entry.programName}")
                    Text("Tool: ${entry.toolInfo}")
                    Text("Problems: ${entry.problems}")
                    Text("Solutions: ${entry.solutions}")
                    Text("Time: ${entry.createdAt}")
                }
            }
        }
    }
}

@Composable
private fun PlanScreen() {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item {
            Text("Implementation roadmap", fontWeight = FontWeight.Bold)
            Text("Phase 1 completed: full technician toolbox foundation with local database.")
            Text("Phase 2: cloud sync for alarms/tools/journal and team collaboration.")
            Text("Phase 3: machine-specific packs for SL2000 + FANUC 0i-TF Plus.")
            Text("Phase 4: NC pre-check service integration and digital twin simulation.")
        }
        item {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp)) {
                    Text("Function backlog list", fontWeight = FontWeight.SemiBold)
                    Text("• AI diagnosis with expanded alarm libraries")
                    Text("• OCR + diagram classification enhancement")
                    Text("• Multi-calculator presets by material/tool")
                    Text("• Coordinate generator templates")
                    Text("• Thread database extensions")
                    Text("• Tool photo gallery and QR labels")
                    Text("• Shift-level checklist templates")
                    Text("• Searchable troubleshooting journal")
                }
            }
        }
    }
}
