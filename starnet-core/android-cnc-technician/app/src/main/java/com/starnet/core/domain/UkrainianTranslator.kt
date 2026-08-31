package com.starnet.core.domain

object UkrainianTranslator {
    private val glossary = linkedMapOf(
        "Knowledge base loaded from local seed." to "Базу знань завантажено з локального seed-файлу.",
        "Sync in progress..." to "Синхронізація виконується...",
        "Sync failed" to "Помилка синхронізації",
        "Knowledge base synced to revision" to "Базу знань синхронізовано до ревізії",
        "AI local mode enabled. Cloud lookup optional." to "Локальний AI режим увімкнено. Cloud-пошук необов'язковий.",
        "Cloud lookup URL is empty. AI local mode is still active." to "URL cloud-пошуку порожній. Локальний AI режим продовжує працювати.",
        "Checking cloud lookup server..." to "Перевірка cloud-сервера пошуку...",
        "Cloud lookup server ready (revision" to "Cloud-сервер пошуку доступний (ревізія",
        "Cloud lookup unavailable, using AI local mode" to "Cloud-пошук недоступний, використовується локальний AI режим",
        "AI local diagnosis for" to "Локальна AI-діагностика для",
        "Detected CNC controller screen." to "Виявлено екран ЧПУ контролера.",
        "Detected machine nameplate" to "Виявлено табличку (nameplate) верстата",
        "Detected electrical schematic content." to "Виявлено електричну схему.",
        "Detected hydraulic scheme/context." to "Виявлено гідравлічну схему.",
        "Detected engineering drawing-style annotations." to "Виявлено анотації інженерного креслення.",
        "Image analyzed. Manual review recommended." to "Зображення проаналізовано. Рекомендована ручна перевірка.",
        "Possible causes" to "Можливі причини",
        "Step-by-step checks" to "Покрокова перевірка",
        "No diagnosis yet." to "Діагностика ще не виконана.",
        "No image analyzed yet." to "Зображення ще не проаналізовано."
    )

    fun toUkrainian(source: String): String {
        var result = source
        glossary.forEach { (en, uk) ->
            result = result.replace(en, uk, ignoreCase = false)
        }
        return result
    }
}
