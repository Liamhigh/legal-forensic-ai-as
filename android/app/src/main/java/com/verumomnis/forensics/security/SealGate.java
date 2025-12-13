package com.verumomnis.forensics.security;

import android.content.Context;
import android.net.Uri;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;

/**
 * SealGate - Cryptographic sealing for forensic evidence
 * Provides SHA-512 hash sealing and blockchain timestamp support
 */
public class SealGate {
    
    public static class SealedBlob {
        public final File file;
        public final String sha512Public;
        public final String blockchainTx;
        
        public SealedBlob(File file, String sha512Public, String blockchainTx) {
            this.file = file;
            this.sha512Public = sha512Public;
            this.blockchainTx = blockchainTx;
        }
    }
    
    /**
     * Seal a file with SHA-512 hash and blockchain timestamp
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
        
        // Calculate SHA-512 hash
        String sha512 = calculateSHA512(file);
        
        // In a production system, this would submit to blockchain
        // For now, we generate a mock transaction ID
        String blockchainTx = "0x" + sha512.substring(0, 16) + "_" + System.currentTimeMillis();
        
        return new SealedBlob(file, sha512, blockchainTx);
    }
    
    /**
     * Calculate SHA-512 hash of a file
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
}
