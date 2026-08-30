package ua.starnet.cashier.data

import com.google.gson.annotations.SerializedName

data class LoginRequest(val email: String, val password: String)
data class LoginResponse(val token: String?, val user: UserDto?)
data class UserDto(val id: Int?, val name: String?, val email: String?, val role: String?)

data class ErrorResponse(val error: String?)

data class ShiftResponse(val shift: ShiftDto?, val checkbox: CheckboxWrapper?)

/** Checkbox у відповіді shift() — обгортка; у openShift — плоский об'єкт зміни */
data class CheckboxWrapper(
    val enabled: Boolean? = null,
    @SerializedName("shift_open") val shiftOpen: Boolean? = null,
    val shift: CheckboxShiftDto? = null,
    val id: String? = null,
    val serial: Int? = null,
    val status: String? = null,
    val balance: Double? = null,
) {
    fun resolved(): CheckboxShiftDto? = shift ?: id?.let {
        CheckboxShiftDto(it, serial, status, balance)
    }
}
data class ShiftDto(
    val id: Int?,
    val status: String?,
    @SerializedName("register_id") val registerId: Int?,
    @SerializedName("opening_cash") val openingCash: Double?,
    @SerializedName("checkbox_shift_id") val checkboxShiftId: String?,
)

data class CheckboxStatusDto(
    val enabled: Boolean?,
    @SerializedName("shift_open") val shiftOpen: Boolean?,
    val shift: CheckboxShiftDto?,
    val error: String?,
)

data class CheckboxShiftDto(
    val id: String?,
    val serial: Int?,
    val status: String?,
    val balance: Double?,
)

data class OpenShiftRequest(
    @SerializedName("register_id") val registerId: Int,
    @SerializedName("opening_cash") val openingCash: Double,
)

data class CloseShiftRequest(@SerializedName("closing_cash") val closingCash: Double)

data class RegisterDto(
    val id: Int,
    val name: String?,
    val code: String?,
    val balance: Double?,
    @SerializedName("open_shift") val openShift: Boolean?,
)

data class RegistersResponse(val registers: List<RegisterDto>?)

data class CategoryDto(val id: Int, val name: String?)
data class CategoriesResponse(val categories: List<CategoryDto>?)

data class ProductDto(
    val id: Int,
    val name: String?,
    @SerializedName("sale_price") val salePrice: Double?,
    @SerializedName("retail_price") val retailPrice: Double?,
    @SerializedName("is_weighted") val isWeighted: Int?,
    @SerializedName("stock_qty") val stockQty: Double?,
    val barcode: String?,
)

data class ProductsResponse(val products: List<ProductDto>?)

data class SaleItemRequest(
    @SerializedName("product_id") val productId: Int,
    val quantity: Double,
    val price: Double,
    val discount: Double = 0.0,
)

data class SaleRequest(
    val items: List<SaleItemRequest>,
    @SerializedName("customer_id") val customerId: Int? = null,
    @SerializedName("payment_cash") val paymentCash: Double = 0.0,
    @SerializedName("payment_card") val paymentCard: Double = 0.0,
    @SerializedName("payment_deferred") val paymentDeferred: Double = 0.0,
    val notes: String? = null,
    val status: String = "completed",
)

data class SaleDto(
    val id: Int?,
    val total: Double?,
    @SerializedName("fiscal_code") val fiscalCode: String?,
    @SerializedName("is_fiscal") val isFiscal: Int?,
)

data class SettingsResponse(val settings: Map<String, String>?)
data class PrroStatusResponse(
    val enabled: Boolean?,
    @SerializedName("fiscal_default") val fiscalDefault: Boolean?,
)

data class FiscalizeResponse(
    @SerializedName("fiscal_code") val fiscalCode: String?,
)

data class CartItem(
    val productId: Int,
    val name: String,
    val price: Double,
    var qty: Double,
    var discount: Double = 0.0,
)
