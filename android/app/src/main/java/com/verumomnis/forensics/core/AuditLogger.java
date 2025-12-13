package com.verumomnis.forensics.core;

import android.content.Context;
import android.util.Log;

import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * AuditLogger - Forensic audit logging
 * Records all forensic operations with timestamps and cryptographic hashes
 */
public class AuditLogger {
    
    private static final String TAG = "AuditLogger";
    private static final String LOG_FILE_NAME = "forensic_audit.log";
    
    /**
     * Log a forensic event
     */
    public static void logEvent(Context ctx, String eventType, String details, String hash) {
        String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US).format(new Date());
        String logEntry = String.format("[%s] %s | %s | hash=%s\n", timestamp, eventType, details, hash);
        
        // Log to Android logcat
        Log.i(TAG, logEntry);
        
        // Append to audit log file
        try {
            File logFile = new File(ctx.getFilesDir(), LOG_FILE_NAME);
            try (PrintWriter pw = new PrintWriter(new FileWriter(logFile, true))) {
                pw.print(logEntry);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to write audit log: " + e.getMessage());
        }
    }
    
    /**
     * Get the audit log file
     */
    public static File getAuditLogFile(Context ctx) {
        return new File(ctx.getFilesDir(), LOG_FILE_NAME);
    }
}
