package com.jean.rotinarpg;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.widget.RemoteViews;
import java.io.File;
import org.json.JSONArray;
import org.json.JSONObject;

// Widget: herói se mexendo (4 quadros num ViewFlipper) e a próxima missão.
public class RpgWidget extends AppWidgetProvider {

    static void refreshAll(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        int[] ids = m.getAppWidgetIds(new ComponentName(ctx, RpgWidget.class));
        for (int id : ids) update(ctx, m, id);
    }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) update(ctx, m, id);
    }

    static void update(Context ctx, AppWidgetManager m, int id) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.rpg_widget);
        SharedPreferences p = ctx.getSharedPreferences(RpgNativePlugin.PREFS, Context.MODE_PRIVATE);
        int[] img = { R.id.w_f0, R.id.w_f1, R.id.w_f2, R.id.w_f3 };
        int n = p.getInt("w_frames", 0);
        for (int i = 0; i < 4; i++) {
            File f = new File(ctx.getFilesDir(), "widget_" + (n > 0 ? i % n : 0) + ".png");
            if (f.exists()) {
                Bitmap b = BitmapFactory.decodeFile(f.getAbsolutePath());
                if (b != null) v.setImageViewBitmap(img[i], b);
            }
        }
        // próxima missão: a primeira que ainda não passou (até 30 min de atraso)
        String time = "--:--", name = "Abra o jogo para atualizar", sub = p.getString("w_status", "");
        try {
            JSONArray next = new JSONArray(p.getString("w_next", "[]"));
            long now = System.currentTimeMillis();
            for (int i = 0; i < next.length(); i++) {
                JSONObject o = next.getJSONObject(i);
                if (o.optLong("at", 0) >= now - 30 * 60000L) {
                    time = o.optString("time", "--:--");
                    name = o.optString("name", "");
                    break;
                }
                if (i == next.length() - 1) { time = "✔"; name = "Missões do dia cumpridas!"; }
            }
            if (next.length() == 0) { time = "✔"; name = "Nenhuma missão agora"; }
        } catch (Exception e) {
            // mantém o texto padrão
        }
        v.setTextViewText(R.id.w_time, time);
        v.setTextViewText(R.id.w_name, name);
        v.setTextViewText(R.id.w_sub, sub);

        Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (open != null) {
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
            v.setOnClickPendingIntent(R.id.w_root, PendingIntent.getActivity(ctx, 0, open, flags));
        }
        m.updateAppWidget(id, v);
    }
}
