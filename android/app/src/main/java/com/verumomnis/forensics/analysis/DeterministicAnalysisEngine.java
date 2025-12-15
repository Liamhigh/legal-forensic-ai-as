package com.verumomnis.forensics.analysis;

import com.verumomnis.forensics.core.ForensicVersion;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.security.MessageDigest;

public class DeterministicAnalysisEngine {
    
    private static final String MODEL_VERSION = "RULE_BASED_v1.0";
    
    public static AnalysisResult analyze(File evidenceFile) throws Exception {
        AnalysisResult result = new AnalysisResult();
        result.modelVersion = MODEL_VERSION;
        result.modelHash = getModelHash();
        
        long fileSize = evidenceFile.length();
        String fileName = evidenceFile.getName().toLowerCase();
        
        if (fileName.endsWith(".eml") || fileName.endsWith(".msg")) {
            result.fileType = "EMAIL";
            result.analysis = "Email forensic evidence detected. ";
        } else {
            result.fileType = "UNKNOWN";
            result.analysis = "Unknown file type. ";
        }
        
        if (fileSize == 0) {
            result.findings.add("WARNING: Empty file detected");
            result.riskLevel = "HIGH";
        } else {
            result.findings.add("File size normal");
            result.riskLevel = "LOW";
        }
        
        String sha512 = calculateSHA512(evidenceFile);
        result.evidenceHash = sha512;
        result.analysis += "Analysis complete.";
        
        return result;
    }
    
    private static String getModelHash() {
        try {
            // Use the constitutional version for consistency
            String ruleVersion = "DETERMINISTIC_RULE_ENGINE_" + ForensicVersion.ENGINE_VERSION;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(ruleVersion.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "UNAVAILABLE";
        }
    }
    
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
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
    
    public static class AnalysisResult {
        public String modelVersion;
        public String modelHash;
        public String fileType;
        public String analysis;
        public String riskLevel;
        public String evidenceHash;
        public java.util.List<String> findings = new java.util.ArrayList<>();
    }
}
