package com.verumomnis.forensics;

import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor plugin to launch the native ForensicActivity
 */
@CapacitorPlugin(name = "EmailForensics")
public class EmailForensicsPlugin extends Plugin {
    
    @PluginMethod
    public void openEmailSealer(PluginCall call) {
        Intent intent = new Intent(getActivity(), ForensicActivity.class);
        getActivity().startActivity(intent);
        call.resolve();
    }
}
