package com.starnet.core.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.starnet.core.data.StarnetCoreDatabase

class ChecklistBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        val pendingResult = goAsync()
        Thread {
            runCatching {
                val dao = StarnetCoreDatabase.get(context).dao()
                val now = System.currentTimeMillis()
                dao.getChecklistSnapshot().forEach { item ->
                    val dueAt = item.dueAtMillis ?: return@forEach
                    if (!item.isChecked && dueAt > now) {
                        ChecklistReminderScheduler.scheduleReminder(
                            context = context,
                            itemId = item.id,
                            title = item.title,
                            dueAtMillis = dueAt
                        )
                    }
                }
            }
            pendingResult.finish()
        }.start()
    }
}
