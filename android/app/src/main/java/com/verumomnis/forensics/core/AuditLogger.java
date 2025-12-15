package com.verumomnis.forensics.core;

import android.content.Context;
import android.util.Log;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.InputStream;
import java.io.PrintWriter;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * AuditLogger - Forensic audit logging
 * 
 * CONSTITUTIONAL REQUIREMENTS:
 * - Append-only audit log
 * - Records: Evidence secured, Analysis started/completed, PDF generated, Blockchain attempt
 * - Hash the audit log (SHA-256)
 * - Embed audit log hash into PDF metadata
 */
public class AuditLogger {
    
    private static final String TAG = "AuditLogger";
    private static final String LOG_FILE_NAME = "forensic_audit.log";
    
    /**
     * Log a forensic event (append-only)
     */
    public static void logEvent(Context ctx, String eventType, String details, String hash) {
        String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US).format(new Date());
        String logEntry = String.format("[%s] %s | %s | hash=%s\n", timestamp, eventType, details, hash);
        
        // Log to Android logcat
        Log.i(TAG, logEntry);
        
        // Append to audit log file (append-only, never overwrite)
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
    
    /**
     * Calculate SHA-256 hash of the audit log
     * CONSTITUTIONAL NOTE: SHA-256 permitted for audit log hashing (not evidence)
     */
    public static String getAuditLogHash(Context ctx) {
        File logFile = getAuditLogFile(ctx);
        
        if (!logFile.exists() || logFile.length() == 0) {
            return "EMPTY_LOG";
        }
        
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            
            try (InputStream fis = new FileInputStream(logFile)) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = fis.read(buffer)) != -1) {
                    digest.update(buffer, 0, bytesRead);
                }
            }
            
            byte[] hashBytes = digest.digest();
            
            // Convert to hex string
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            
            return sb.toString();
        } catch (Exception e) {
            Log.e(TAG, "Failed to hash audit log: " + e.getMessage());
            return "HASH_ERROR";
        }
    }
}
