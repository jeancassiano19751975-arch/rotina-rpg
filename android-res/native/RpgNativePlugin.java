package com.jean.rotinarpg;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;

// Ponte do jogo com o Android: missões marcadas pela notificação, ícone que evolui,
// instalar atualização e widget.
@CapacitorPlugin(name = "RpgNative")
public class RpgNativePlugin extends Plugin {
    static final String PREFS = "rotina_rpg";
    static final int ICONS = 6;

    // Missões marcadas como "Feito" pela notificação sem abrir o app.
    @PluginMethod
    public void takeQueue(PluginCall call) {
        SharedPreferences p = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = p.getString("queue", "[]");
        p.edit().putString("queue", "[]").apply();
        JSObject ret = new JSObject();
        JSArray items;
        try {
            items = new JSArray(raw);
        } catch (Exception e) {
            items = new JSArray();
        }
        ret.put("items", items);
        call.resolve(ret);
    }

    // Troca o ícone do app (um activity-alias para cada fase do herói).
    @PluginMethod
    public void setIcon(PluginCall call) {
        int idx = call.getInt("idx", 0);
        if (idx < 0 || idx >= ICONS) idx = 0;
        Context ctx = getContext();
        PackageManager pm = ctx.getPackageManager();
        String pkg = ctx.getPackageName();
        try {
            // liga o novo primeiro, depois desliga os outros (o app nunca fica sem ícone)
            pm.setComponentEnabledSetting(new ComponentName(pkg, pkg + ".Hero" + idx),
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
            for (int i = 0; i < ICONS; i++) {
                if (i == idx) continue;
                pm.setComponentEnabledSetting(new ComponentName(pkg, pkg + ".Hero" + i),
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Não deu para trocar o ícone: " + e.getMessage());
        }
    }

    // Abre o instalador do Android para o APK baixado.
    @PluginMethod
    public void installApk(PluginCall call) {
        String path = call.getString("path", "");
        if (path.startsWith("file://")) path = path.substring(7);
        Context ctx = getContext();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !ctx.getPackageManager().canRequestPackageInstalls()) {
                Intent s = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + ctx.getPackageName()));
                s.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(s);
                JSObject ret = new JSObject();
                ret.put("needPermission", true);
                call.resolve(ret);
                return;
            }
            File f = new File(path);
            Uri uri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", f);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(i);
            JSObject ret = new JSObject();
            ret.put("needPermission", false);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Não deu para abrir a instalação: " + e.getMessage());
        }
    }

    // Widget: quadros do herói (PNG em base64), próximas missões e linha de status.
    @PluginMethod
    public void updateWidget(PluginCall call) {
        Context ctx = getContext();
        try {
            JSArray frames = call.getArray("frames", new JSArray());
            for (int i = 0; i < frames.length() && i < 4; i++) {
                String b64 = frames.getString(i);
                int comma = b64.indexOf(',');
                if (comma >= 0) b64 = b64.substring(comma + 1);
                byte[] data = Base64.decode(b64, Base64.DEFAULT);
                FileOutputStream out = new FileOutputStream(new File(ctx.getFilesDir(), "widget_" + i + ".png"));
                out.write(data);
                out.close();
            }
            JSArray next = call.getArray("next", new JSArray());
            SharedPreferences.Editor ed = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
            ed.putString("w_next", next.toString());
            ed.putString("w_status", call.getString("status", ""));
            ed.putInt("w_frames", Math.min(4, frames.length()));
            ed.apply();
            RpgWidget.refreshAll(ctx);
            call.resolve();
        } catch (Exception e) {
            call.reject("Widget: " + e.getMessage());
        }
    }
}
