package ua.starnet.cashier.data

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @GET("api/auth/me")
    suspend fun me(): UserDto

    @GET("api/pos/shift")
    suspend fun shift(): ShiftResponse

    @POST("api/pos/shift/open")
    suspend fun openShift(@Body body: OpenShiftRequest): ShiftResponse

    @POST("api/pos/shift/close")
    suspend fun closeShift(@Body body: CloseShiftRequest): ShiftResponse

    @GET("api/pos/my-registers")
    suspend fun myRegisters(): RegistersResponse

    @GET("api/pos/products")
    suspend fun products(@Query("category_id") categoryId: Int? = null): ProductsResponse

    @GET("api/products/categories")
    suspend fun categories(): CategoriesResponse

    @GET("api/pos/search")
    suspend fun search(@Query("q") q: String): ProductsResponse

    @GET("api/barcode/{code}")
    suspend fun barcode(@Path("code") code: String): ProductDto

    @POST("api/pos/sale")
    suspend fun sale(@Body body: SaleRequest): SaleDto

    @GET("api/pos/receipt-settings")
    suspend fun receiptSettings(): SettingsResponse

    @PUT("api/settings")
    suspend fun updateSettings(@Body body: Map<String, String>): SettingsResponse

    @GET("api/prro/status")
    suspend fun prroStatus(): PrroStatusResponse

    @GET("api/prro/shift")
    suspend fun prroShift(): CheckboxStatusDto

    @POST("api/prro/test")
    suspend fun prroTest(): Map<String, Any?>

    @POST("api/prro/fiscalize/{id}")
    suspend fun fiscalize(@Path("id") saleId: Int): FiscalizeResponse
}

object ApiClient {
    @Volatile private var api: ApiService? = null

    suspend fun get(): ApiService {
        val base = Prefs.getBaseUrl()
        val token = Prefs.getToken()
        val cached = api
        if (cached != null && cachedBaseUrl == base && cachedToken == token) return cached
        synchronized(this) {
            if (api != null && cachedBaseUrl == base && cachedToken == token) return api!!
            cachedBaseUrl = base
            cachedToken = token
            val client = OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .addInterceptor(Interceptor { chain ->
                    val req = chain.request().newBuilder()
                        .addHeader("Content-Type", "application/json")
                        .apply { if (!token.isNullOrBlank()) addHeader("Authorization", "Bearer $token") }
                        .build()
                    chain.proceed(req)
                })
                .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
                .build()
            api = Retrofit.Builder()
                .baseUrl(if (base.endsWith("/")) base else "$base/")
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ApiService::class.java)
            return api!!
        }
    }

    fun invalidate() {
        synchronized(this) { api = null }
    }

    private var cachedBaseUrl: String? = null
    private var cachedToken: String? = null
}
