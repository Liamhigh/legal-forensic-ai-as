package com.verumomnis.forensics.geo;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.telephony.CellInfo;
import android.telephony.TelephonyManager;

import androidx.core.app.ActivityCompat;

import java.security.MessageDigest;
import java.util.List;

/**
 * GeoForensics - Geolocation capture for forensic evidence
 * Captures GPS, Wi-Fi, cell tower, and timestamp information
 */
public class GeoForensics {
    
    public static class GeoSnapshot {
        public final double latitude;
        public final double longitude;
        public final float accuracy;
        public final long timestamp;
        public final String provider;
        public final String wifiInfo;
        public final String cellInfo;
        public final String sha512;
        
        public GeoSnapshot(double latitude, double longitude, float accuracy, long timestamp, 
                          String provider, String wifiInfo, String cellInfo) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.accuracy = accuracy;
            this.timestamp = timestamp;
            this.provider = provider;
            this.wifiInfo = wifiInfo;
            this.cellInfo = cellInfo;
            this.sha512 = calculateHash();
        }
        
        private String calculateHash() {
            try {
                String data = latitude + "," + longitude + "," + accuracy + "," + 
                             timestamp + "," + provider + "," + wifiInfo + "," + cellInfo;
                MessageDigest digest = MessageDigest.getInstance("SHA-512");
                byte[] hash = digest.digest(data.getBytes());
                
                StringBuilder sb = new StringBuilder();
                for (byte b : hash) {
                    sb.append(String.format("%02x", b));
                }
                return sb.toString();
            } catch (Exception e) {
                return "hash_error_" + System.currentTimeMillis();
            }
        }
    }
    
    /**
     * Capture current geolocation and device context
     */
    public static GeoSnapshot capture(Context ctx) {
        double latitude = 0.0;
        double longitude = 0.0;
        float accuracy = 0.0f;
        String provider = "unknown";
        long timestamp = System.currentTimeMillis();
        
        // Try to get location
        if (ActivityCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_FINE_LOCATION) 
                == PackageManager.PERMISSION_GRANTED) {
            LocationManager locationManager = (LocationManager) ctx.getSystemService(Context.LOCATION_SERVICE);
            if (locationManager != null) {
                Location lastLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                if (lastLocation == null) {
                    lastLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                }
                if (lastLocation != null) {
                    latitude = lastLocation.getLatitude();
                    longitude = lastLocation.getLongitude();
                    accuracy = lastLocation.getAccuracy();
                    provider = lastLocation.getProvider();
                    timestamp = lastLocation.getTime();
                }
            }
        }
        
        // Capture Wi-Fi info
        String wifiInfo = captureWifiInfo(ctx);
        
        // Capture cell tower info
        String cellInfo = captureCellInfo(ctx);
        
        return new GeoSnapshot(latitude, longitude, accuracy, timestamp, provider, wifiInfo, cellInfo);
    }
    
    private static String captureWifiInfo(Context ctx) {
        try {
            if (ActivityCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_WIFI_STATE) 
                    == PackageManager.PERMISSION_GRANTED) {
                WifiManager wifiManager = (WifiManager) ctx.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                if (wifiManager != null && wifiManager.isWifiEnabled()) {
                    WifiInfo wifiInfo = wifiManager.getConnectionInfo();
                    if (wifiInfo != null) {
                        return "SSID:" + wifiInfo.getSSID() + ",BSSID:" + wifiInfo.getBSSID();
                    }
                }
            }
        } catch (Exception e) {
            return "wifi_error";
        }
        return "wifi_unavailable";
    }
    
    private static String captureCellInfo(Context ctx) {
        try {
            TelephonyManager telephonyManager = (TelephonyManager) ctx.getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager != null) {
                if (ActivityCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_FINE_LOCATION) 
                        == PackageManager.PERMISSION_GRANTED) {
                    List<CellInfo> cellInfoList = telephonyManager.getAllCellInfo();
                    if (cellInfoList != null && !cellInfoList.isEmpty()) {
                        return "cells:" + cellInfoList.size();
                    }
                }
            }
        } catch (Exception e) {
            return "cell_error";
        }
        return "cell_unavailable";
    }
}
