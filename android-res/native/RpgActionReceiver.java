package com.jean.rotinarpg;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import org.json.JSONObject;

// Botão "Feito" da notificação: guarda a missão numa fila e avisa, sem abrir o app.
// O XP entra quando o jogo abrir (o horário que vale é o do toque).
public class RpgActionReceiver extends BroadcastReceiver {
    static final String CHANNEL = "confirmacoes";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        try {
            int notifId = intent.getIntExtra("LocalNotificationId", Integer.MIN_VALUE);
            String src = intent.getStringExtra("LocalNotficationObject");
            JSONObject n = src != null ? new JSONObject(src) : new JSONObject();
            JSONObject extra = n.optJSONObject("extra");
            if (extra == null) extra = new JSONObject();
            String taskId = extra.optString("taskId", "");
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notifId != Integer.MIN_VALUE && nm != null) nm.cancel(notifId);
            if (taskId.isEmpty()) return;

            SharedPreferences p = ctx.getSharedPreferences(RpgNativePlugin.PREFS, Context.MODE_PRIVATE);
            JSONArray q;
            try {
                q = new JSONArray(p.getString("queue", "[]"));
            } catch (Exception e) {
                q = new JSONArray();
            }
            JSONObject item = new JSONObject();
            item.put("taskId", taskId);
            item.put("day", extra.optString("day", ""));
            item.put("at", System.currentTimeMillis());
            q.put(item);
            p.edit().putString("queue", q.toString()).apply();

            if (nm != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    NotificationChannel ch = new NotificationChannel(CHANNEL, "Missões marcadas", NotificationManager.IMPORTANCE_LOW);
                    nm.createNotificationChannel(ch);
                }
                String title = n.optString("title", "Missão");
                int dot = title.indexOf("Missão: ");
                String name = dot >= 0 ? title.substring(dot + 8) : title;
                NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL)
                    .setSmallIcon(android.R.drawable.checkbox_on_background)
                    .setContentTitle("✔ Missão marcada: " + name)
                    .setContentText("O XP entra quando você abrir o jogo.")
                    .setAutoCancel(true)
                    .setTimeoutAfter(15000);
                nm.notify(notifId == Integer.MIN_VALUE ? 4242 : notifId, b.build());
            }
            RpgWidget.refreshAll(ctx);
        } catch (Exception e) {
            // nada a fazer: a missão continua aberta no jogo
        }
    }
}
