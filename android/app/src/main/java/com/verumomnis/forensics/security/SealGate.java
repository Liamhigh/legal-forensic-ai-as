package com.verumomnis.forensics.security;

import android.content.Context;
import android.net.Uri;
import android.provider.Settings;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * SealGate - Cryptographic sealing for forensic evidence
 * 
 * CONSTITUTIONAL REQUIREMENTS:
 * - ALL evidence hashing MUST use SHA-512 (NOT SHA-256)
 * - Dual hashing: Public SHA-512 + Device-bound HMAC-SHA512
 * - SHA-256 may ONLY be used for AI model file hashing
 */
public class SealGate {
    
    public static class SealedBlob {
        public final File file;
        public final String sha512Public;        // Public, reproducible SHA-512
        public final String hmacSha512Device;    // Device-bound HMAC-SHA512 for chain-of-custody
        public final String blockchainTx;
        
        public SealedBlob(File file, String sha512Public, String hmacSha512Device, String blockchainTx) {
            this.file = file;
            this.sha512Public = sha512Public;
            this.hmacSha512Device = hmacSha512Device;
            this.blockchainTx = blockchainTx;
        }
    }
    
    /**
     * Seal a file with dual hashing: SHA-512 (public) + HMAC-SHA512 (device-bound)
     * 
     * CONSTITUTIONAL REQUIREMENT:
     * - Public SHA-512: reproducible, court-verifiable
     * - Device HMAC-SHA512: chain-of-custody, device-bound
     */
    public static SealedBlob sealIn(Context ctx, Uri fileUri) throws Exception {
        File file;
        
        // If it's a file URI, get the file directly
        if ("file".equals(fileUri.getScheme())) {
            file = new File(fileUri.getPath());
        } else {
            // For content URIs, create a temporary file and copy content
            file = File.createTempFile("seal_", ".tmp", ctx.getCacheDir());
            try (InputStream in = ctx.getContentResolver().openInputStream(fileUri);
                 java.io.OutputStream out = new java.io.FileOutputStream(file)) {
                if (in == null) {
                    throw new IOException("Cannot open input stream for URI");
                }
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
            }
        }
        
        // Calculate Public SHA-512 hash (reproducible)
        String sha512Public = calculateSHA512(file);
        
        // Calculate Device-bound HMAC-SHA512 (chain-of-custody)
        String hmacSha512Device = calculateDeviceHMAC(ctx, file);
        
        // Blockchain anchoring - honest state
        // If offline or unprovisioned, mark as OFFLINE_PENDING
        String blockchainTx = determineBlockchainState(sha512Public);
        
        return new SealedBlob(file, sha512Public, hmacSha512Device, blockchainTx);
    }
    
    /**
     * Calculate SHA-512 hash of a file
     * CONSTITUTIONAL REQUIREMENT: SHA-512 ONLY for evidence
     */
    private static String calculateSHA512(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-512");
        
        try (InputStream fis = new FileInputStream(file)) {
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
    }
    
    /**
     * Calculate device-bound HMAC-SHA512 for chain-of-custody
     * Uses Android device ID as the key to bind hash to this specific device
     */
    private static String calculateDeviceHMAC(Context ctx, File file) throws Exception {
        // Get device-specific ID (secure and unique to this device)
        String deviceId = Settings.Secure.getString(
            ctx.getContentResolver(), 
            Settings.Secure.ANDROID_ID
        );
        
        // Use HMAC-SHA512 with device ID as key
        Mac hmac = Mac.getInstance("HmacSHA512");
        SecretKeySpec keySpec = new SecretKeySpec(deviceId.getBytes("UTF-8"), "HmacSHA512");
        hmac.init(keySpec);
        
        try (InputStream fis = new FileInputStream(file)) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                hmac.update(buffer, 0, bytesRead);
            }
        }
        
        byte[] hmacBytes = hmac.doFinal();
        
        // Convert to hex string
        StringBuilder sb = new StringBuilder();
        for (byte b : hmacBytes) {
            sb.append(String.format("%02x", b));
        }
        
        return sb.toString();
    }
    
    /**
     * Determine blockchain anchor state
     * CONSTITUTIONAL REQUIREMENT: Honest state - no faking transaction hashes
     * 
     * If online and provisioned: Return real transaction hash
     * If offline or unprovisioned: Return OFFLINE_PENDING
     */
    private static String determineBlockchainState(String sha512) {
        // TODO: In production, attempt to submit to blockchain here
        // For now, we honestly report offline/unprovisioned state
        
        // Check if blockchain service is available and configured
        boolean blockchainAvailable = false; // Would check actual service here
        
        if (blockchainAvailable) {
            // Would return actual transaction hash from blockchain submission
            return "0x" + sha512.substring(0, 64); // Example format
        } else {
            // Honest reporting: we are offline or not provisioned
            return "OFFLINE_PENDING";
        }
    }
    
    /**
     * Calculate SHA-256 hash (ONLY for AI model files)
     * CONSTITUTIONAL NOTE: SHA-256 is ONLY permitted for AI model file hashing
     */
    public static String calculateModelHashSHA256(File modelFile) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        
        try (InputStream fis = new FileInputStream(modelFile)) {
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
    }
}
