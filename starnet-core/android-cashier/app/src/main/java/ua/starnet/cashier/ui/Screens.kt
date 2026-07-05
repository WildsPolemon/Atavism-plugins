package ua.starnet.cashier.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.launch
import ua.starnet.cashier.data.Prefs
import ua.starnet.cashier.data.ProductDto
import ua.starnet.cashier.data.RegisterDto
import ua.starnet.cashier.hardware.HardwareManager
import ua.starnet.cashier.ui.components.*
import ua.starnet.cashier.ui.theme.*

@Composable
fun StarNetNavHost() {
    val ctx = LocalContext.current
    val vm: PosViewModel = viewModel(factory = object : androidx.lifecycle.ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T =
            PosViewModel(HardwareManager(ctx)) as T
    })
    val state by vm.state.collectAsState()

    LaunchedEffect(Unit) { vm.bootstrap() }

    Box(Modifier.fillMaxSize().background(StarBg)) {
        when {
            state.user == null && !state.loading -> LoginScreen(onLogin = vm::login, loading = state.loading, error = state.error)
            state.showOpenShift || state.shift == null -> OpenShiftScreen(
                registers = state.registers, prroEnabled = state.prroEnabled,
                loading = state.loading, error = state.error,
                onOpen = vm::openShift, onLogout = vm::logout,
            )
            else -> SaleScreen(
                state = state, total = vm.cartTotal(),
                onCategory = vm::setCategory, onSearch = vm::setSearch,
                onAdd = { p -> if ((p.isWeighted ?: 0) == 1) vm.addWeighted(p) else vm.addToCart(p) },
                onQty = vm::setQty, onPay = vm::openPayment,
                onSettings = { vm.toggleSettings(true) },
                onCloseShift = vm::openCloseShift, onClearError = vm::clearError,
            )
        }
        LoadingOverlay(state.loading && state.user != null && !state.showOpenShift)
    }

    if (state.showPayment) {
        PaymentDialog(
            total = vm.cartTotal(), prroEnabled = state.prroEnabled,
            fiscalDefault = state.fiscalDefault,
            terminalEnabled = state.settings["pos_terminal_enabled"] == "1",
            loading = state.loading, onDismiss = vm::closePayment,
            onPay = { c, card, def, f, p -> vm.completePay(c, card, def, f, p) },
            onTerminal = { a, f, p, confirm -> vm.payViaTerminal(a, f, p, confirm) },
        )
    }
    if (state.showSettings) {
        SettingsDialog(
            onDismiss = { vm.toggleSettings(false) },
            onSaveServer = vm::saveServerUrl, onSaveHw = vm::saveHardware,
            onTestPrinter = vm::testPrinter, onTestScale = vm::testScale,
            onTestTerminal = vm::testTerminal, onTestPrro = vm::testPrro,
        )
    }
    if (state.showCloseShift) {
        CloseShiftDialog(
            shiftId = state.shift?.id, prroEnabled = state.prroEnabled,
            loading = state.loading, onDismiss = vm::dismissCloseShift,
            onConfirm = vm::closeShift,
        )
    }
}

@Composable
fun LoginScreen(onLogin: (String, String) -> Unit, loading: Boolean, error: String?) {
    var email by remember { mutableStateOf("cashier@starnetcore.local") }
    var pass by remember { mutableStateOf("cashier123") }
    var server by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) { server = Prefs.getBaseUrl() }

    Box(Modifier.fillMaxSize()) {
        StarGradientBg(Modifier.fillMaxSize())
        Row(Modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
            Column(
                Modifier.weight(1f).padding(48.dp),
                verticalArrangement = Arrangement.Center,
            ) {
                Text("StarNet", style = MaterialTheme.typography.headlineLarge, color = StarSurface, fontWeight = FontWeight.Bold)
                Text("Каса", style = MaterialTheme.typography.headlineLarge, color = StarOrange, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(16.dp))
                Text(
                    "Швидка каса для роздрібу.\nПРРО · принтер · ваги · термінал",
                    style = MaterialTheme.typography.bodyLarge,
                    color = StarSurface.copy(0.85f),
                )
            }
            PosCard(Modifier.weight(0.55f).padding(32.dp).fillMaxHeight(0.75f)) {
                SectionTitle("Вхід у систему", Icons.Default.Login)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    server, { server = it },
                    label = { Text("Сервер API") },
                    leadingIcon = { Icon(Icons.Outlined.Cloud, null) },
                    singleLine = true, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    email, { email = it },
                    label = { Text("Email") },
                    leadingIcon = { Icon(Icons.Outlined.Email, null) },
                    singleLine = true, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    pass, { pass = it },
                    label = { Text("Пароль") },
                    leadingIcon = { Icon(Icons.Outlined.Lock, null) },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                )
                error?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, color = StarRed, style = MaterialTheme.typography.bodySmall)
                }
                Spacer(Modifier.height(16.dp))
                PrimaryButton(
                    text = "УВІЙТИ",
                    onClick = { scope.launch { Prefs.setBaseUrl(server); onLogin(email, pass) } },
                    enabled = !loading, loading = loading, modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
fun OpenShiftScreen(
    registers: List<RegisterDto>, prroEnabled: Boolean,
    loading: Boolean, error: String?,
    onOpen: (Int, Double) -> Unit, onLogout: () -> Unit,
) {
    var regId by remember { mutableIntStateOf(registers.firstOrNull()?.id ?: 0) }
    var cash by remember { mutableStateOf("0") }
    LaunchedEffect(registers) { if (registers.isNotEmpty()) regId = registers.first().id }

    Box(Modifier.fillMaxSize()) {
        StarGradientBg(Modifier.fillMaxSize())
        PosCard(Modifier.align(Alignment.Center).widthIn(max = 520.dp).padding(24.dp)) {
            SectionTitle("Відкрити зміну", Icons.Default.Store)
            if (prroEnabled) {
                Spacer(Modifier.height(8.dp))
                InfoBanner("Checkbox (ПРРО): зміна відкриється разом із касовою")
            }
            Spacer(Modifier.height(12.dp))
            registers.forEach { r ->
                val sel = regId == r.id
                Surface(
                    onClick = { regId = r.id },
                    shape = RoundedCornerShape(12.dp),
                    color = if (sel) StarBlueLight else StarBg,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                        .border(if (sel) 2.dp else 1.dp, if (sel) StarBlue else StarBorder, RoundedCornerShape(12.dp)),
                ) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.PointOfSale, null, tint = if (sel) StarBlue else StarMuted)
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text("${r.code ?: ""} ${r.name ?: ""}", fontWeight = FontWeight.SemiBold)
                            Text("Баланс: ${fmtUah(r.balance ?: 0.0)}", style = MaterialTheme.typography.bodySmall)
                        }
                        if (sel) Icon(Icons.Default.CheckCircle, null, tint = StarBlue)
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                cash, { cash = it },
                label = { Text("Готівка на початку зміни") },
                leadingIcon = { Icon(Icons.Outlined.Payments, null) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp),
            )
            error?.let { Text(it, color = StarRed, modifier = Modifier.padding(top = 8.dp)) }
            Spacer(Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(onClick = onLogout, modifier = Modifier.weight(0.35f).height(52.dp)) { Text("Вихід") }
                PrimaryButton(
                    text = if (loading) "..." else "ВІДКРИТИ ЗМІНУ",
                    onClick = { onOpen(regId, cash.toDoubleOrNull() ?: 0.0) },
                    enabled = !loading && regId > 0, loading = loading,
                    modifier = Modifier.weight(0.65f),
                    color = StarGreen,
                )
            }
        }
    }
}

@Composable
fun SaleScreen(
    state: PosUiState, total: Double,
    onCategory: (Int?) -> Unit, onSearch: (String) -> Unit,
    onAdd: (ProductDto) -> Unit, onQty: (Int, Double) -> Unit,
    onPay: () -> Unit, onSettings: () -> Unit,
    onCloseShift: () -> Unit, onClearError: () -> Unit,
) {
    val snack = remember { SnackbarHostState() }
    LaunchedEffect(state.error) { state.error?.let { snack.showSnackbar(it); onClearError() } }

    Column(Modifier.fillMaxSize()) {
        // Header — як AinurPOS
        Surface(color = StarBlue, shadowElevation = 4.dp) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text(state.settings["company_name"] ?: "StarNet Core", color = StarSurface, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        StatusChip("Зміна #${state.shift?.id ?: "-"}", StarSurface)
                        state.checkboxShift?.serial?.let { StatusChip("Checkbox #$it", StarOrange) }
                        state.user?.name?.let { Text(it, color = StarSurface.copy(0.8f), style = MaterialTheme.typography.bodySmall) }
                    }
                }
                IconButton(onClick = onSettings) { Icon(Icons.Outlined.Settings, null, tint = StarSurface) }
                TextButton(onClick = onCloseShift) {
                    Icon(Icons.Outlined.Logout, null, tint = StarSurface, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Закрити зміну", color = StarSurface)
                }
            }
        }

        Scaffold(
            snackbarHost = { SnackbarHost(snack) },
            containerColor = StarBg,
        ) { pad ->
            Row(Modifier.padding(pad).fillMaxSize().padding(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                // Товари
                Column(Modifier.weight(1.4f).fillMaxHeight()) {
                    OutlinedTextField(
                        state.search, onSearch,
                        placeholder = { Text("Пошук або штрих-код...") },
                        leadingIcon = { Icon(Icons.Outlined.Search, null) },
                        trailingIcon = { Icon(Icons.Outlined.QrCodeScanner, null, tint = StarMuted) },
                        singleLine = true, modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                    )
                    Spacer(Modifier.height(8.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        item {
                            FilterChip(
                                selected = state.categoryId == null, onClick = { onCategory(null) },
                                label = { Text("Всі") },
                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = StarBlue, selectedLabelColor = StarSurface),
                            )
                        }
                        items(state.categories) { c ->
                            FilterChip(
                                selected = state.categoryId == c.id, onClick = { onCategory(c.id) },
                                label = { Text(c.name ?: "") },
                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = StarBlue, selectedLabelColor = StarSurface),
                            )
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    LazyVerticalGrid(
                        columns = GridCells.Adaptive(140.dp),
                        modifier = Modifier.fillMaxSize(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        items(state.products) { p ->
                            ProductTile(p, onClick = { onAdd(p) })
                        }
                    }
                }

                // Кошик
                Surface(
                    Modifier.weight(0.75f).fillMaxHeight(),
                    shape = RoundedCornerShape(16.dp),
                    color = StarSurface,
                    shadowElevation = 2.dp,
                ) {
                    Column(Modifier.fillMaxSize().padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.ShoppingCart, null, tint = StarBlue)
                            Spacer(Modifier.width(8.dp))
                            Text("Кошик", style = MaterialTheme.typography.titleMedium)
                            Spacer(Modifier.weight(1f))
                            Text("${state.cart.size} поз.", style = MaterialTheme.typography.bodySmall, color = StarMuted)
                        }
                        HorizontalDivider(Modifier.padding(vertical = 8.dp), color = StarBorder)
                        if (state.cart.isEmpty()) {
                            Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Outlined.ShoppingBag, null, tint = StarBorder, modifier = Modifier.size(48.dp))
                                    Text("Додайте товари", color = StarMuted)
                                }
                            }
                        } else {
                            LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                items(state.cart, key = { it.productId }) { item ->
                                    CartRow(item, onMinus = { onQty(item.productId, item.qty - 1) }, onPlus = { onQty(item.productId, item.qty + 1) })
                                }
                            }
                        }
                        HorizontalDivider(Modifier.padding(vertical = 8.dp), color = StarBorder)
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Разом", style = MaterialTheme.typography.titleMedium)
                            Text(fmtUah(total), style = MaterialTheme.typography.titleLarge, color = StarBlue, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(10.dp))
                        OrangeSaleButton(fmtUah(total), onPay, state.cart.isNotEmpty())
                    }
                }
            }
        }
    }
}

@Composable
fun ProductTile(p: ProductDto, onClick: () -> Unit) {
    val price = p.salePrice ?: p.retailPrice ?: 0.0
    val weighted = (p.isWeighted ?: 0) == 1
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(14.dp),
        color = StarSurface,
        shadowElevation = 1.dp,
        modifier = Modifier.fillMaxWidth().height(120.dp),
    ) {
        Column(Modifier.fillMaxSize().padding(12.dp), verticalArrangement = Arrangement.SpaceBetween) {
            Text(p.name ?: "", maxLines = 2, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
                Text(fmtUah(price), color = StarBlue, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                if (weighted) StatusChip("кг", StarOrange) else {
                    val stock = p.stockQty
                    if (stock != null) Text("${stock.toInt()} шт", style = MaterialTheme.typography.labelSmall, color = StarMuted)
                }
            }
        }
    }
}

@Composable
fun CartRow(item: ua.starnet.cashier.data.CartItem, onMinus: () -> Unit, onPlus: () -> Unit) {
    Surface(shape = RoundedCornerShape(10.dp), color = StarBg) {
        Row(Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(item.name, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Medium)
                Text("${item.qty} × ${fmtUah(item.price)}", style = MaterialTheme.typography.bodySmall, color = StarMuted)
            }
            Text(fmtUah(item.price * item.qty - item.discount), fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 8.dp))
            FilledIconButton(onClick = onMinus, modifier = Modifier.size(36.dp), colors = IconButtonDefaults.filledIconButtonColors(containerColor = StarBorder)) {
                Icon(Icons.Default.Remove, null, modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.width(4.dp))
            FilledIconButton(onClick = onPlus, modifier = Modifier.size(36.dp), colors = IconButtonDefaults.filledIconButtonColors(containerColor = StarBlueLight)) {
                Icon(Icons.Default.Add, null, tint = StarBlue, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
fun PaymentDialog(
    total: Double, prroEnabled: Boolean, fiscalDefault: Boolean,
    terminalEnabled: Boolean, loading: Boolean,
    onDismiss: () -> Unit,
    onPay: (Double, Double, Double, Boolean, Boolean) -> Unit,
    onTerminal: (Double, Boolean, Boolean, suspend (Double) -> Boolean) -> Unit,
) {
    var cash by remember { mutableStateOf(total.toString()) }
    var card by remember { mutableStateOf("0") }
    var fiscal by remember { mutableStateOf(fiscalDefault && prroEnabled) }
    var print by remember { mutableStateOf(true) }
    var tab by remember { mutableIntStateOf(0) }
    var showTerminal by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val quick = listOf(total, kotlin.math.ceil(total / 5) * 5, 200.0, 500.0, 1000.0).distinct().filter { it > 0 }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(Modifier.fillMaxWidth(0.92f).fillMaxHeight(0.88f), shape = RoundedCornerShape(20.dp), color = StarSurface) {
            Row(Modifier.fillMaxSize()) {
                Column(Modifier.weight(0.38f).background(StarBg).padding(20.dp)) {
                    Text("Платежі", style = MaterialTheme.typography.titleLarge)
                    Spacer(Modifier.height(16.dp))
                    SummaryRow("Підсумок", fmtUah(total), bold = true)
                    SummaryRow("Готівка", fmtUah(cash.toDoubleOrNull() ?: 0.0))
                    SummaryRow("Картка", fmtUah(card.toDoubleOrNull() ?: 0.0))
                    val accepted = (cash.toDoubleOrNull() ?: 0.0) + (card.toDoubleOrNull() ?: 0.0)
                    SummaryRow("Прийнято", fmtUah(accepted), bold = true)
                    if (accepted > total) {
                        Spacer(Modifier.height(8.dp))
                        InfoBanner("Решта: ${fmtUah(accepted - total)}", Color(0xFFDCFCE7), StarGreen)
                    }
                    Spacer(Modifier.height(16.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(print, { print = it }); Text("Друкувати чек")
                    }
                    if (prroEnabled) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(fiscal, { fiscal = it }); Text("Фіскалізувати (Checkbox)")
                        }
                    }
                }
                Column(Modifier.weight(0.62f).padding(20.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Прийняти оплату", style = MaterialTheme.typography.titleLarge)
                        IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, null) }
                    }
                    TabRow(selectedTabIndex = tab, containerColor = Color.Transparent) {
                        Tab(selected = tab == 0, onClick = { tab = 0 }, text = { Text("Готівка") })
                        Tab(selected = tab == 1, onClick = { tab = 1 }, text = { Text("Картка") })
                    }
                    Spacer(Modifier.height(12.dp))
                    val amount = if (tab == 0) cash else card
                    OutlinedTextField(
                        amount,
                        { if (tab == 0) cash = it else card = it },
                        label = { Text("Сума") },
                        textStyle = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                    )
                    if (tab == 0) {
                        Spacer(Modifier.height(10.dp))
                        Text("Швидкі суми", style = MaterialTheme.typography.bodySmall, color = StarMuted)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(vertical = 8.dp)) {
                            items(quick) { q ->
                                SuggestionChip(onClick = { cash = q.toString() }, label = { Text(fmtUah(q)) })
                            }
                        }
                    }
                    if (tab == 1 && terminalEnabled) {
                        Spacer(Modifier.height(10.dp))
                        OutlinedButton({ showTerminal = true }, Modifier.fillMaxWidth()) {
                            Icon(Icons.Outlined.CreditCard, null); Spacer(Modifier.width(8.dp)); Text("Privat24 термінал")
                        }
                    }
                    Spacer(Modifier.weight(1f))
                    PrimaryButton(
                        text = "ПРИЙНЯТИ ${fmtUah(total)}",
                        onClick = { onPay(cash.toDoubleOrNull() ?: 0.0, card.toDoubleOrNull() ?: 0.0, 0.0, fiscal, print) },
                        enabled = !loading, loading = loading, modifier = Modifier.fillMaxWidth(), color = StarGreen,
                    )
                }
            }
        }
    }
    if (showTerminal) {
        AlertDialog(
            onDismissRequest = { showTerminal = false },
            title = { Text("Privat24") },
            text = { Text("Проведіть ${fmtUah(total)} на терміналі") },
            confirmButton = { TextButton({ showTerminal = false; scope.launch { onTerminal(total, fiscal, print) { true } } }) { Text("Підтвердити") } },
            dismissButton = { TextButton({ showTerminal = false }) { Text("Скасувати") } },
        )
    }
}

@Composable
fun SummaryRow(label: String, value: String, bold: Boolean = false) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = StarMuted, fontWeight = if (bold) FontWeight.SemiBold else FontWeight.Normal)
        Text(value, fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal)
    }
}

@Composable
fun CloseShiftDialog(shiftId: Int?, prroEnabled: Boolean, loading: Boolean, onDismiss: () -> Unit, onConfirm: (Double) -> Unit) {
    var cash by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { Icon(Icons.Outlined.Logout, null, tint = StarRed) },
        title = { Text("Закрити зміну #$shiftId") },
        text = {
            Column {
                if (prroEnabled) InfoBanner("Checkbox зміна також закриється (Z-звіт)")
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(cash, { cash = it }, label = { Text("Фактична готівка") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(onClick = { onConfirm(cash.toDoubleOrNull() ?: 0.0) }, enabled = !loading, colors = ButtonDefaults.buttonColors(containerColor = StarRed)) {
                Text(if (loading) "..." else "Закрити")
            }
        },
        dismissButton = { TextButton(onDismiss) { Text("Скасувати") } },
    )
}

@Composable
fun SettingsDialog(
    onDismiss: () -> Unit, onSaveServer: (String) -> Unit,
    onSaveHw: (String, String, Int) -> Unit,
    onTestPrinter: () -> Unit, onTestScale: () -> Unit,
    onTestTerminal: () -> Unit, onTestPrro: () -> Unit,
) {
    var server by remember { mutableStateOf("") }
    var printer by remember { mutableStateOf("") }
    var terminal by remember { mutableStateOf("") }
    var baud by remember { mutableStateOf("9600") }
    LaunchedEffect(Unit) {
        server = Prefs.getBaseUrl(); printer = Prefs.getPrinterIp()
        terminal = Prefs.getTerminalIp(); baud = Prefs.getScaleBaud().toString()
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(Modifier.fillMaxWidth(0.9f).fillMaxHeight(0.85f), shape = RoundedCornerShape(20.dp)) {
            Column(Modifier.padding(20.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Налаштування", style = MaterialTheme.typography.headlineMedium)
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, null) }
                }
                Column(Modifier.verticalScroll(rememberScrollState()).weight(1f), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    SettingsBlock("Сервер", Icons.Outlined.Cloud) {
                        OutlinedTextField(server, { server = it }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                        PrimaryButton("Зберегти URL", { onSaveServer(server) }, modifier = Modifier.fillMaxWidth())
                    }
                    SettingsBlock("WiFi принтер", Icons.Outlined.Print) {
                        OutlinedTextField(printer, { printer = it }, placeholder = { Text("192.168.1.50") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                        OutlinedButton({ onTestPrinter() }, Modifier.fillMaxWidth()) { Text("Тест друку") }
                    }
                    SettingsBlock("Ваги USB-COM", Icons.Outlined.Scale) {
                        OutlinedTextField(baud, { baud = it }, label = { Text("Baud rate") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                        OutlinedButton({ onTestScale() }, Modifier.fillMaxWidth()) { Text("Зчитати вагу") }
                    }
                    SettingsBlock("Privat24", Icons.Outlined.CreditCard) {
                        OutlinedTextField(terminal, { terminal = it }, placeholder = { Text("IP терміналу") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                        OutlinedButton({ onTestTerminal() }, Modifier.fillMaxWidth()) { Text("Перевірити") }
                    }
                    SettingsBlock("ПРРО Checkbox", Icons.Outlined.Receipt) {
                        OutlinedButton({ onTestPrro() }, Modifier.fillMaxWidth()) { Text("Тест підключення") }
                    }
                }
                PrimaryButton("Зберегти обладнання", { onSaveHw(printer, terminal, baud.toIntOrNull() ?: 9600) }, modifier = Modifier.fillMaxWidth())
            }
        }
    }
}

@Composable
fun SettingsBlock(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, content: @Composable ColumnScope.() -> Unit) {
    Surface(shape = RoundedCornerShape(14.dp), color = StarBg, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp)) {
            SectionTitle(title, icon)
            content()
        }
    }
}
