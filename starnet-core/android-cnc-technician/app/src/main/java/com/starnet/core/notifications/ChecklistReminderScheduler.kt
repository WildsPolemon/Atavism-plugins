package com.starnet.core.notifications

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

object ChecklistReminderScheduler {
    const val CHANNEL_ID = "checklist_reminders"
    private const val CHANNEL_NAME = "Checklist Reminders"

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Reminders for checklist work plan tasks"
        }
        manager.createNotificationChannel(channel)
    }

    fun scheduleReminder(context: Context, itemId: Int, title: String, dueAtMillis: Long) {
        if (dueAtMillis <= System.currentTimeMillis()) return
        ensureChannel(context)
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pendingIntent = reminderPendingIntent(context, itemId, title)
        alarmManager.setAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            dueAtMillis,
            pendingIntent
        )
    }

    fun cancelReminder(context: Context, itemId: Int) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pendingIntent = reminderPendingIntent(context, itemId, "")
        alarmManager.cancel(pendingIntent)
        pendingIntent.cancel()
    }

    private fun reminderPendingIntent(context: Context, itemId: Int, title: String): PendingIntent {
        val intent = Intent(context, ChecklistReminderReceiver::class.java).apply {
            putExtra(ChecklistReminderReceiver.EXTRA_ITEM_ID, itemId)
            putExtra(ChecklistReminderReceiver.EXTRA_TITLE, title)
        }
        return PendingIntent.getBroadcast(
            context,
            itemId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
