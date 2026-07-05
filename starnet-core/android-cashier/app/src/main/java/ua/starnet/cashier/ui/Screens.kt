package ua.starnet.cashier.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.launch
import ua.starnet.cashier.data.Prefs
import ua.starnet.cashier.data.RegisterDto
import ua.starnet.cashier.hardware.HardwareManager
import ua.starnet.cashier.ui.theme.fmtUah

@Composable
fun StarNetNavHost() {
    val ctx = LocalContext.current
    val vm: PosViewModel = viewModel(factory = object : androidx.lifecycle.ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : androidx.lifecycle.ViewModel> create(c: Class<T>): T =
            PosViewModel(HardwareManager(ctx)) as T
    })
    val state by vm.state.collectAsState()

    LaunchedEffect(Unit) { vm.bootstrap() }

    if (state.user == null && !state.loading) {
        LoginScreen(onLogin = vm::login, loading = state.loading, error = state.error)
        return
    }

    if (state.showOpenShift || state.shift == null) {
        OpenShiftScreen(
            registers = state.registers,
            prroEnabled = state.prroEnabled,
            loading = state.loading,
            error = state.error,
            onOpen = vm::openShift,
            onLogout = vm::logout,
        )
        return
    }

    SaleScreen(
        state = state,
        total = vm.cartTotal(),
        onCategory = vm::setCategory,
        onSearch = vm::setSearch,
        onAdd = { p -> if ((p.isWeighted ?: 0) == 1) vm.addWeighted(p) else vm.addToCart(p) },
        onQty = vm::setQty,
        onPay = vm::openPayment,
        onSettings = { vm.toggleSettings(true) },
        onCloseShift = vm::closeShift,
        onClearError = vm::clearError,
    )

    if (state.showPayment) {
        PaymentSheet(
            total = vm.cartTotal(),
            prroEnabled = state.prroEnabled,
            fiscalDefault = state.fiscalDefault,
            terminalEnabled = state.settings["pos_terminal_enabled"] == "1",
            loading = state.loading,
            onDismiss = vm::closePayment,
            onPay = { cash, card, def, fiscal, print -> vm.completePay(cash, card, def, fiscal, print) },
            onTerminal = { amount, fiscal, print, confirm ->
                vm.payViaTerminal(amount, fiscal, print, confirm)
            },
        )
    }

    if (state.showSettings) {
        SettingsSheet(
            onDismiss = { vm.toggleSettings(false) },
            onSaveServer = vm::saveServerUrl,
            onSaveHw = vm::saveHardware,
            onTestPrinter = vm::testPrinter,
            onTestScale = vm::testScale,
            onTestTerminal = vm::testTerminal,
            onTestPrro = vm::testPrro,
        )
    }

    state.error?.let { msg ->
        if (!state.showOpenShift) {
            LaunchedEffect(msg) {
                // snackbar via simple alert - shown in SaleScreen
            }
        }
    }
}

@Composable
fun LoginScreen(onLogin: (String, String) -> Unit, loading: Boolean, error: String?) {
    var email by remember { mutableStateOf("cashier@starnetcore.local") }
    var pass by remember { mutableStateOf("cashier123") }
    var server by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) { server = Prefs.getBaseUrl() }

    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Card(Modifier.widthIn(max = 420.dp).padding(16.dp)) {
            Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("StarNet Каса", style = MaterialTheme.typography.headlineSmall)
                OutlinedTextField(server, { server = it }, label = { Text("Сервер API") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(email, { email = it }, label = { Text("Email") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(pass, { pass = it }, label = { Text("Пароль") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, modifier = Modifier.fillMaxWidth())
                error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
                Button(
                    onClick = { scope.launch { Prefs.setBaseUrl(server); onLogin(email, pass) } },
                    enabled = !loading,
                    modifier = Modifier.fillMaxWidth(),
                ) { if (loading) CircularProgressIndicator(Modifier.size(20.dp)) else Text("Увійти") }
            }
        }
    }
}

@Composable
fun OpenShiftScreen(
    registers: List<RegisterDto>,
    prroEnabled: Boolean,
    loading: Boolean,
    error: String?,
    onOpen: (Int, Double) -> Unit,
    onLogout: () -> Unit,
) {
    var regId by remember { mutableIntStateOf(registers.firstOrNull()?.id ?: 0) }
    var cash by remember { mutableStateOf("0") }

    LaunchedEffect(registers) { if (registers.isNotEmpty()) regId = registers.first().id }

    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Card(Modifier.widthIn(max = 480.dp).padding(16.dp)) {
            Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Відкрити зміну", style = MaterialTheme.typography.headlineSmall)
                if (prroEnabled) {
                    Surface(color = MaterialTheme.colorScheme.primaryContainer) {
                        Text("Checkbox (ПРРО): зміна відкриється автоматично", Modifier.padding(12.dp), style = MaterialTheme.typography.bodySmall)
                    }
                }
                registers.forEach { r ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = regId == r.id, onClick = { regId = r.id })
                        Text("${r.code ?: ""} ${r.name ?: ""}")
                    }
                }
                OutlinedTextField(cash, { cash = it }, label = { Text("Готівка на початку") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), modifier = Modifier.fillMaxWidth())
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onLogout) { Text("Вихід") }
                    Button(onClick = { onOpen(regId, cash.toDoubleOrNull() ?: 0.0) }, enabled = !loading && regId > 0, modifier = Modifier.weight(1f)) {
                        Text(if (loading) "Відкриття..." else "Відкрити зміну")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SaleScreen(
    state: PosUiState,
    total: Double,
    onCategory: (Int?) -> Unit,
    onSearch: (String) -> Unit,
    onAdd: (ua.starnet.cashier.data.ProductDto) -> Unit,
    onQty: (Int, Double) -> Unit,
    onPay: () -> Unit,
    onSettings: () -> Unit,
    onCloseShift: (Double) -> Unit,
    onClearError: () -> Unit,
) {
    val snack = remember { SnackbarHostState() }
    LaunchedEffect(state.error) {
        state.error?.let { snack.showSnackbar(it); onClearError() }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snack) },
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(state.settings["company_name"] ?: "StarNet Core")
                        Text("Зміна #${state.shift?.id ?: "-"}${state.checkboxShift?.serial?.let { " · Checkbox #$it" } ?: ""}", style = MaterialTheme.typography.bodySmall)
                    }
                },
                actions = {
                    IconButton(onClick = onSettings) { Icon(Icons.Default.Settings, null) }
                    TextButton(onClick = { onCloseShift(0.0) }) { Text("Закрити зміну") }
                },
            )
        },
        bottomBar = {
            BottomAppBar {
                Text("Разом: ${fmtUah(total)}", style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                Button(onClick = onPay, enabled = state.cart.isNotEmpty()) { Text("ПРОДАЖ") }
            }
        },
    ) { pad ->
        Row(Modifier.padding(pad).fillMaxSize()) {
            Column(Modifier.weight(1.2f).fillMaxHeight().padding(8.dp)) {
                OutlinedTextField(state.search, onSearch, label = { Text("Пошук / штрих-код") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                LazyRow(Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item { FilterChip(selected = state.categoryId == null, onClick = { onCategory(null) }, label = { Text("Всі") }) }
                    items(state.categories) { c ->
                        FilterChip(selected = state.categoryId == c.id, onClick = { onCategory(c.id) }, label = { Text(c.name ?: "") })
                    }
                }
                LazyVerticalGrid(columns = GridCells.Adaptive(120.dp), modifier = Modifier.fillMaxSize()) {
                    items(state.products) { p ->
                        ElevatedCard(onClick = { onAdd(p) }, modifier = Modifier.padding(4.dp)) {
                            Column(Modifier.padding(8.dp)) {
                                Text(p.name ?: "", style = MaterialTheme.typography.bodyMedium, maxLines = 2)
                                Text(fmtUah(p.salePrice ?: p.retailPrice ?: 0.0), style = MaterialTheme.typography.labelLarge)
                            }
                        }
                    }
                }
            }
            Column(Modifier.weight(0.8f).fillMaxHeight().padding(8.dp)) {
                Text("Кошик", style = MaterialTheme.typography.titleMedium)
                state.cart.forEach { item ->
                    ListItem(
                        headlineContent = { Text(item.name) },
                        supportingContent = { Text("${item.qty} × ${fmtUah(item.price)}") },
                        trailingContent = {
                            Row {
                                IconButton(onClick = { onQty(item.productId, item.qty - 1) }) { Icon(Icons.Default.Remove, null) }
                                IconButton(onClick = { onQty(item.productId, item.qty + 1) }) { Icon(Icons.Default.Add, null) }
                            }
                        },
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentSheet(
    total: Double,
    prroEnabled: Boolean,
    fiscalDefault: Boolean,
    terminalEnabled: Boolean,
    loading: Boolean,
    onDismiss: () -> Unit,
    onPay: (Double, Double, Double, Boolean, Boolean) -> Unit,
    onTerminal: (Double, Boolean, Boolean, suspend (Double) -> Boolean) -> Unit,
) {
    var cash by remember { mutableStateOf(total.toString()) }
    var card by remember { mutableStateOf("0") }
    var fiscal by remember { mutableStateOf(fiscalDefault && prroEnabled) }
    var print by remember { mutableStateOf(true) }
    var showTerminalConfirm by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Оплата ${fmtUah(total)}", style = MaterialTheme.typography.titleLarge)
            OutlinedTextField(cash, { cash = it }, label = { Text("Готівка") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), modifier = Modifier.fillMaxWidth())
            OutlinedTextField(card, { card = it }, label = { Text("Картка") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), modifier = Modifier.fillMaxWidth())
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(print, { print = it })
                Text("Друкувати чек")
            }
            if (prroEnabled) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(fiscal, { fiscal = it })
                    Text("Фіскалізувати чек (Checkbox)")
                }
            }
            if (terminalEnabled) {
                OutlinedButton(onClick = { showTerminalConfirm = true }, modifier = Modifier.fillMaxWidth()) {
                    Text("Оплата через Privat24")
                }
            }
            Button(
                onClick = {
                    onPay(cash.toDoubleOrNull() ?: 0.0, card.toDoubleOrNull() ?: 0.0, 0.0, fiscal, print)
                },
                enabled = !loading,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("ПРИЙНЯТИ") }
        }
    }

    if (showTerminalConfirm) {
        AlertDialog(
            onDismissRequest = { showTerminalConfirm = false },
            title = { Text("Privat24") },
            text = { Text("Проведіть оплату ${fmtUah(total)} на терміналі. Підтвердити?") },
            confirmButton = {
                TextButton(onClick = {
                    showTerminalConfirm = false
                    scope.launch {
                        onTerminal(total, fiscal, print) { true }
                    }
                }) { Text("Так") }
            },
            dismissButton = { TextButton({ showTerminalConfirm = false }) { Text("Ні") } },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsSheet(
    onDismiss: () -> Unit,
    onSaveServer: (String) -> Unit,
    onSaveHw: (String, String, Int) -> Unit,
    onTestPrinter: () -> Unit,
    onTestScale: () -> Unit,
    onTestTerminal: () -> Unit,
    onTestPrro: () -> Unit,
) {
    var server by remember { mutableStateOf("") }
    var printer by remember { mutableStateOf("") }
    var terminal by remember { mutableStateOf("") }
    var baud by remember { mutableStateOf("9600") }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        server = Prefs.getBaseUrl()
        printer = Prefs.getPrinterIp()
        terminal = Prefs.getTerminalIp()
        baud = Prefs.getScaleBaud().toString()
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(Modifier.padding(24.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Налаштування", style = MaterialTheme.typography.titleLarge)
            Text("Сервер", style = MaterialTheme.typography.titleSmall)
            OutlinedTextField(server, { server = it }, modifier = Modifier.fillMaxWidth())
            Button({ onSaveServer(server) }, Modifier.fillMaxWidth()) { Text("Зберегти URL") }

            Text("WiFi принтер (ESC/POS, порт 9100)", style = MaterialTheme.typography.titleSmall)
            OutlinedTextField(printer, { printer = it }, placeholder = { Text("192.168.1.50") }, modifier = Modifier.fillMaxWidth())
            OutlinedButton({ onTestPrinter() }, Modifier.fillMaxWidth()) { Text("Тест друку") }

            Text("Ваги USB-COM (KAS/CAS)", style = MaterialTheme.typography.titleSmall)
            OutlinedTextField(baud, { baud = it }, label = { Text("Baud") }, modifier = Modifier.fillMaxWidth())
            OutlinedButton({ onTestScale() }, Modifier.fillMaxWidth()) { Text("Зчитати вагу") }

            Text("Термінал Privat24", style = MaterialTheme.typography.titleSmall)
            OutlinedTextField(terminal, { terminal = it }, placeholder = { Text("IP терміналу") }, modifier = Modifier.fillMaxWidth())
            OutlinedButton({ onTestTerminal() }, Modifier.fillMaxWidth()) { Text("Перевірити термінал") }

            Text("ПРРО Checkbox", style = MaterialTheme.typography.titleSmall)
            OutlinedButton({ onTestPrro() }, Modifier.fillMaxWidth()) { Text("Тест Checkbox") }

            Button({
                onSaveHw(printer, terminal, baud.toIntOrNull() ?: 9600)
            }, Modifier.fillMaxWidth()) { Text("Зберегти обладнання") }
        }
    }
}
