package ua.starnet.cashier.ui

import androidx.compose.runtime.*
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException
import ua.starnet.cashier.data.*
import ua.starnet.cashier.hardware.HardwareManager
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class PosUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val user: UserDto? = null,
    val shift: ShiftDto? = null,
    val checkboxShift: CheckboxShiftDto? = null,
    val prroEnabled: Boolean = false,
    val fiscalDefault: Boolean = false,
    val settings: Map<String, String> = emptyMap(),
    val categories: List<CategoryDto> = emptyList(),
    val products: List<ProductDto> = emptyList(),
    val categoryId: Int? = null,
    val search: String = "",
    val cart: List<CartItem> = emptyList(),
    val registers: List<RegisterDto> = emptyList(),
    val showPayment: Boolean = false,
    val showOpenShift: Boolean = false,
    val showSettings: Boolean = false,
    val showCloseShift: Boolean = false,
    val lastSaleId: Int? = null,
    val lastFiscalCode: String? = null,
)

class PosViewModel(private val hw: HardwareManager) : ViewModel() {
    private val _state = MutableStateFlow(PosUiState())
    val state = _state.asStateFlow()

    private fun err(e: Exception): String = when (e) {
        is HttpException -> e.response()?.errorBody()?.string()?.let {
            try { com.google.gson.Gson().fromJson(it, ErrorResponse::class.java).error } catch (_: Exception) { null }
        } ?: "HTTP ${e.code()}"
        else -> e.message ?: "Помилка"
    }

    fun clearError() { _state.value = _state.value.copy(error = null) }

    fun bootstrap() = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        try {
            val token = Prefs.getToken()
            if (token.isNullOrBlank()) {
                _state.value = _state.value.copy(loading = false, user = null)
                return@launch
            }
            val api = ApiClient.get()
            val user = api.me()
            val shiftR = api.shift()
            val settings = api.receiptSettings().settings ?: emptyMap()
            val prro = runCatching { api.prroStatus() }.getOrNull()
            val cats = api.categories().categories ?: emptyList()
            _state.value = _state.value.copy(
                loading = false,
                user = user,
                shift = shiftR.shift,
                checkboxShift = shiftR.checkbox?.resolved(),
                settings = settings,
                prroEnabled = prro?.enabled == true,
                fiscalDefault = prro?.fiscalDefault == true || settings["pos_fiscal_default"] == "1",
                categories = cats,
                showOpenShift = shiftR.shift == null,
            )
            loadProducts()
            if (shiftR.shift == null) loadRegisters()
        } catch (e: Exception) {
            Prefs.setToken(null)
            ApiClient.invalidate()
            _state.value = _state.value.copy(loading = false, user = null, error = err(e))
        }
    }

    fun login(email: String, pass: String) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        try {
            val r = ApiClient.get().login(LoginRequest(email, pass))
            Prefs.setToken(r.token)
            ApiClient.invalidate()
            bootstrap()
        } catch (e: Exception) {
            _state.value = _state.value.copy(loading = false, error = err(e))
        }
    }

    fun logout() = viewModelScope.launch {
        Prefs.setToken(null)
        ApiClient.invalidate()
        _state.value = PosUiState()
    }

    fun loadRegisters() = viewModelScope.launch {
        try {
            val regs = ApiClient.get().myRegisters().registers?.filter { it.openShift != true } ?: emptyList()
            _state.value = _state.value.copy(registers = regs)
        } catch (e: Exception) {
            _state.value = _state.value.copy(error = err(e))
        }
    }

    fun openShift(registerId: Int, cash: Double) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        try {
            val r = ApiClient.get().openShift(OpenShiftRequest(registerId, cash))
            _state.value = _state.value.copy(
                loading = false,
                shift = r.shift,
                checkboxShift = r.checkbox?.resolved(),
                showOpenShift = false,
            )
        } catch (e: Exception) {
            _state.value = _state.value.copy(loading = false, error = err(e))
        }
    }

    fun closeShift(cash: Double) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        try {
            ApiClient.get().closeShift(CloseShiftRequest(cash))
            _state.value = _state.value.copy(loading = false, shift = null, checkboxShift = null, showOpenShift = true, showCloseShift = false, cart = emptyList())
            loadRegisters()
        } catch (e: Exception) {
            _state.value = _state.value.copy(loading = false, error = err(e))
        }
    }

    fun loadProducts() = viewModelScope.launch {
        try {
            val s = _state.value
            val api = ApiClient.get()
            val list = if (s.search.isNotBlank()) api.search(s.search).products
            else api.products(s.categoryId).products
            _state.value = _state.value.copy(products = list ?: emptyList())
        } catch (e: Exception) {
            _state.value = _state.value.copy(error = err(e))
        }
    }

    fun setCategory(id: Int?) {
        _state.value = _state.value.copy(categoryId = id, search = "")
        loadProducts()
    }

    fun setSearch(q: String) {
        _state.value = _state.value.copy(search = q)
        loadProducts()
    }

    fun addToCart(p: ProductDto, qty: Double = 1.0) {
        val price = p.salePrice ?: p.retailPrice ?: 0.0
        val cart = _state.value.cart.toMutableList()
        val i = cart.indexOfFirst { it.productId == p.id }
        if (i >= 0) cart[i] = cart[i].copy(qty = cart[i].qty + qty)
        else cart.add(CartItem(p.id, p.name ?: "Товар", price, qty))
        _state.value = _state.value.copy(cart = cart)
    }

    fun addWeighted(p: ProductDto) = viewModelScope.launch {
        try {
            hw.connectScale()
            val w = hw.readScaleWeight()
            if (w > 0) addToCart(p, w)
        } catch (e: Exception) {
            _state.value = _state.value.copy(error = e.message)
        }
    }

    fun setQty(productId: Int, qty: Double) {
        val cart = _state.value.cart.map {
            if (it.productId == productId) it.copy(qty = qty) else it
        }.filter { it.qty > 0 }
        _state.value = _state.value.copy(cart = cart)
    }

    fun cartTotal(): Double = _state.value.cart.sumOf { it.price * it.qty - it.discount }

    fun openPayment() {
        if (_state.value.cart.isEmpty()) {
            _state.value = _state.value.copy(error = "Додайте товари")
            return
        }
        if (_state.value.shift == null) {
            _state.value = _state.value.copy(error = "Відкрийте зміну")
            return
        }
        _state.value = _state.value.copy(showPayment = true)
    }

    fun completePay(cash: Double, card: Double, deferred: Double, fiscalize: Boolean, print: Boolean) = viewModelScope.launch {
        val total = cartTotal()
        _state.value = _state.value.copy(loading = true, error = null)
        try {
            if (fiscalize && deferred > 0) throw IllegalStateException("Checkbox не підтримує продаж у борг")
            val items = _state.value.cart.map { SaleItemRequest(it.productId, it.qty, it.price, it.discount) }
            val sale = ApiClient.get().sale(SaleRequest(items, paymentCash = cash, paymentCard = card, paymentDeferred = deferred))
            var fiscalCode: String? = sale.fiscalCode
            if (fiscalize && _state.value.prroEnabled && sale.id != null) {
                fiscalCode = ApiClient.get().fiscalize(sale.id).fiscalCode
            }
            if (print) {
                val lines = buildReceiptLines(sale.id, total, cash, card, fiscalCode)
                runCatching { hw.printReceipt(lines) }
            }
            _state.value = _state.value.copy(
                loading = false,
                cart = emptyList(),
                showPayment = false,
                lastSaleId = sale.id,
                lastFiscalCode = fiscalCode,
            )
        } catch (e: Exception) {
            _state.value = _state.value.copy(loading = false, error = err(e))
        }
    }

    fun payViaTerminal(amount: Double, fiscalize: Boolean, print: Boolean, onConfirm: suspend (Double) -> Boolean) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        try {
            hw.privat24Pay(amount, onConfirm)
            val total = cartTotal()
            val items = _state.value.cart.map { SaleItemRequest(it.productId, it.qty, it.price, it.discount) }
            val sale = ApiClient.get().sale(SaleRequest(items, paymentCash = 0.0, paymentCard = amount, paymentDeferred = 0.0))
            var fiscalCode: String? = sale.fiscalCode
            if (fiscalize && _state.value.prroEnabled && sale.id != null) {
                fiscalCode = ApiClient.get().fiscalize(sale.id).fiscalCode
            }
            if (print) {
                val lines = buildReceiptLines(sale.id, total, 0.0, amount, fiscalCode)
                runCatching { hw.printReceipt(lines) }
            }
            _state.value = _state.value.copy(loading = false, cart = emptyList(), showPayment = false, lastSaleId = sale.id, lastFiscalCode = fiscalCode)
        } catch (e: Exception) {
            _state.value = _state.value.copy(loading = false, error = err(e))
        }
    }

    private fun buildReceiptLines(saleId: Int?, total: Double, cash: Double, card: Double, fiscal: String?): List<String> {
        val s = _state.value.settings
        val fmt = SimpleDateFormat("dd.MM.yyyy HH:mm", Locale("uk"))
        val lines = mutableListOf(
            s["company_name"] ?: "StarNet Core",
            s["receipt_address"] ?: "",
            "Чек #${saleId ?: "-"} · ${fmt.format(Date())}",
        )
        _state.value.cart.forEach { lines.add("${it.name} x${it.qty} = ${fmtUah(it.price * it.qty)}") }
        lines.add("РАЗОМ: ${fmtUah(total)}")
        if (cash > 0) lines.add("Готівка: ${fmtUah(cash)}")
        if (card > 0) lines.add("Картка: ${fmtUah(card)}")
        fiscal?.let { lines.add("Фіскальний код: $it") }
        lines.add(s["receipt_footer"] ?: "Дякуємо за покупку!")
        return lines
    }

    fun openCloseShift() { _state.value = _state.value.copy(showCloseShift = true) }
    fun dismissCloseShift() { _state.value = _state.value.copy(showCloseShift = false) }

    fun closePayment() { _state.value = _state.value.copy(showPayment = false) }

    fun toggleSettings(v: Boolean) { _state.value = _state.value.copy(showSettings = v) }

    fun saveServerUrl(url: String) = viewModelScope.launch {
        Prefs.setBaseUrl(url)
        ApiClient.invalidate()
        _state.value = _state.value.copy(error = "URL збережено")
    }

    fun saveHardware(printerIp: String, terminalIp: String, scaleBaud: Int) = viewModelScope.launch {
        Prefs.setPrinterIp(printerIp)
        Prefs.setTerminalIp(terminalIp)
        Prefs.setScaleBaud(scaleBaud)
        _state.value = _state.value.copy(error = "Обладнання збережено")
    }

    fun testPrinter() = viewModelScope.launch {
        try { hw.testPrinter(); _state.value = _state.value.copy(error = "Тест друку OK") }
        catch (e: Exception) { _state.value = _state.value.copy(error = e.message) }
    }

    fun testScale() = viewModelScope.launch {
        try { _state.value = _state.value.copy(error = hw.testScale()) }
        catch (e: Exception) { _state.value = _state.value.copy(error = e.message) }
    }

    fun testTerminal() = viewModelScope.launch {
        _state.value = _state.value.copy(error = hw.testTerminal())
    }

    fun testPrro() = viewModelScope.launch {
        try {
            val r = ApiClient.get().prroTest()
            _state.value = _state.value.copy(error = r["message"]?.toString() ?: "Checkbox OK")
        } catch (e: Exception) { _state.value = _state.value.copy(error = err(e)) }
    }

    private fun fmtUah(n: Double) = String.format(Locale("uk"), "%.2f грн", n)
}
