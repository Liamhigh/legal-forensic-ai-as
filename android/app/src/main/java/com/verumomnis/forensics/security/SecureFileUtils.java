package com.verumomnis.forensics.security;

import java.io.File;
import java.io.FileOutputStream;
import java.security.SecureRandom;

/**
 * SecureFileUtils - Secure file operations
 * 
 * CONSTITUTIONAL REQUIREMENT:
 * - Secure file deletion: overwrite + delete
 * - No recoverable data after deletion
 */
public class SecureFileUtils {
    
    /**
     * Securely delete a file by overwriting with random data before deletion
     * This prevents data recovery through forensic tools
     */
    public static boolean secureDelete(File file) {
        if (file == null || !file.exists()) {
            return false;
        }
        
        try {
            // Get file size
            long fileSize = file.length();
            
            // Overwrite with random data (3 passes for thorough deletion)
            SecureRandom random = new SecureRandom();
            byte[] buffer = new byte[8192];
            
            for (int pass = 0; pass < 3; pass++) {
                try (FileOutputStream fos = new FileOutputStream(file)) {
                    long remaining = fileSize;
                    while (remaining > 0) {
                        int bytesToWrite = (int) Math.min(buffer.length, remaining);
                        random.nextBytes(buffer);
                        fos.write(buffer, 0, bytesToWrite);
                        remaining -= bytesToWrite;
                    }
                    fos.getFD().sync(); // Force write to disk
                }
            }
            
            // Now delete the file
            return file.delete();
            
        } catch (Exception e) {
            android.util.Log.e("SecureFileUtils", "Failed to securely delete file: " + e.getMessage());
            // Still try regular deletion as fallback
            return file.delete();
        }
    }
    
    /**
     * Securely delete a directory and all its contents recursively
     */
    public static boolean secureDeleteDirectory(File dir) {
        if (dir == null || !dir.exists()) {
            return false;
        }
        
        if (dir.isDirectory()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isDirectory()) {
                        secureDeleteDirectory(file);
                    } else {
                        secureDelete(file);
                    }
                }
            }
        }
        
        return dir.delete();
    }
}
