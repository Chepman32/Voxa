package com.localsub

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

internal data class LocalSubReminder(
    val id: String,
    val title: String,
    val body: String,
    val delaySeconds: Long,
)

internal object LocalSubReminderScheduler {
  private const val REMINDER_TAG = "localsub-inactivity-reminders"

  fun schedule(context: Context, reminders: List<LocalSubReminder>) {
    val workManager = WorkManager.getInstance(context)
    workManager.cancelAllWorkByTag(REMINDER_TAG)

    reminders.forEach { reminder ->
      val input =
          Data.Builder()
              .putString(LocalSubReminderWorker.KEY_ID, reminder.id)
              .putString(LocalSubReminderWorker.KEY_TITLE, reminder.title)
              .putString(LocalSubReminderWorker.KEY_BODY, reminder.body)
              .build()
      val request =
          OneTimeWorkRequest.Builder(LocalSubReminderWorker::class.java)
              .setInitialDelay(reminder.delaySeconds.coerceAtLeast(60), TimeUnit.SECONDS)
              .setInputData(input)
              .addTag(REMINDER_TAG)
              .build()

      workManager.enqueueUniqueWork(
          "$REMINDER_TAG-${reminder.id}",
          ExistingWorkPolicy.REPLACE,
          request,
      )
    }
  }

  fun cancel(context: Context) {
    WorkManager.getInstance(context).cancelAllWorkByTag(REMINDER_TAG)
  }
}

class LocalSubReminderWorker(
    appContext: Context,
    workerParams: WorkerParameters,
) : Worker(appContext, workerParams) {

  override fun doWork(): Result {
    if (!canPostNotifications(applicationContext)) {
      return Result.success()
    }

    val id = inputData.getString(KEY_ID) ?: return Result.failure()
    val title = inputData.getString(KEY_TITLE) ?: return Result.failure()
    val body = inputData.getString(KEY_BODY) ?: return Result.failure()

    createReminderChannel(applicationContext)
    postReminder(applicationContext, id, title, body)
    return Result.success()
  }

  @SuppressLint("MissingPermission")
  private fun postReminder(context: Context, id: String, title: String, body: String) {
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val contentIntent =
        launchIntent?.let {
          PendingIntent.getActivity(
              context,
              id.hashCode(),
              it,
              PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
          )
        }
    val notification =
        NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setContentIntent(contentIntent)
            .build()

    NotificationManagerCompat.from(context).notify(id.hashCode(), notification)
  }

  companion object {
    internal const val KEY_ID = "id"
    internal const val KEY_TITLE = "title"
    internal const val KEY_BODY = "body"
    private const val CHANNEL_ID = "localsub_gentle_reminders"

    private fun canPostNotifications(context: Context): Boolean {
      if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) {
        return false
      }

      return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
          ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
              PackageManager.PERMISSION_GRANTED
    }

    private fun createReminderChannel(context: Context) {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        return
      }

      val channel =
          NotificationChannel(
                  CHANNEL_ID,
                  context.getString(R.string.notification_channel_reminders),
                  NotificationManager.IMPORTANCE_LOW,
              )
              .apply {
                description =
                    context.getString(R.string.notification_channel_reminders_description)
                enableVibration(false)
                setShowBadge(false)
                setSound(null, null)
              }
      context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
  }
}
