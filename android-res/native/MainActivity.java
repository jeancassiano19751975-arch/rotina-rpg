package com.jean.rotinarpg;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RpgNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
