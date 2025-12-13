package com.verumomnis.forensics.core;

import android.content.Context;
import android.net.Uri;

import com.verumomnis.forensics.security.SealGate;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * CaseFileManager - Manages forensic case files
 * Collects all sealed blobs (emails, reports, etc.) and creates final case file
 */
public class CaseFileManager {
    
    private static final String CASE_DIR = "case_files";
    
    public static class FinalCaseFile {
        public final File file;
        public final String sha512;
        public final String blockchainTx;
        
        public FinalCaseFile(File file, String sha512, String blockchainTx) {
            this.file = file;
            this.sha512 = sha512;
            this.blockchainTx = blockchainTx;
        }
    }
    
    /**
     * Build final case file from all sealed blobs
     * Collects:
     * - email_bundle_*.zip (already sealed)
     * - VO_Forensic_Report_*.pdf (already sealed)
     * - any other sealed artifacts
     * 
     * Then creates a super-sealed ZIP ready for court
     */
    public static FinalCaseFile buildFinalCaseFile(Context ctx, String caseName, String narrative) throws Exception {
        File filesDir = ctx.getFilesDir();
        File caseDir = new File(filesDir, CASE_DIR);
        if (!caseDir.exists()) {
            caseDir.mkdirs();
        }
        
        // Collect all sealed files
        List<File> sealedFiles = new ArrayList<>();
        
        // Find email bundles
        for (File f : filesDir.listFiles()) {
            if (f.getName().startsWith("email_bundle_") && f.getName().endsWith(".zip")) {
                sealedFiles.add(f);
            }
        }
        
        // Find forensic reports
        for (File f : filesDir.listFiles()) {
            if (f.getName().startsWith("VO_Forensic_Report_") && f.getName().endsWith(".pdf")) {
                sealedFiles.add(f);
            }
        }
        
        // Create manifest
        String timestamp = new SimpleDateFormat("yyyy-MM-dd_HHmmss", Locale.US).format(new Date());
        File manifestFile = new File(caseDir, "manifest_" + timestamp + ".txt");
        
        try (PrintWriter pw = new PrintWriter(new FileWriter(manifestFile))) {
            pw.println("FORENSIC CASE FILE MANIFEST");
            pw.println("============================");
            pw.println("Case Name: " + caseName);
            pw.println("Generated: " + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss z", Locale.US).format(new Date()));
            pw.println("Total Evidence Files: " + sealedFiles.size());
            pw.println();
            pw.println("NARRATIVE:");
            pw.println(narrative);
            pw.println();
            pw.println("EVIDENCE FILES:");
            for (int i = 0; i < sealedFiles.size(); i++) {
                File f = sealedFiles.get(i);
                pw.println((i + 1) + ". " + f.getName() + " (" + f.length() + " bytes)");
            }
        }
        
        // Create final ZIP
        String zipName = "CaseFile_" + caseName.replaceAll("[^a-zA-Z0-9]", "_") + "_" + timestamp + ".zip";
        File finalZip = new File(filesDir, zipName);
        
        try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(finalZip))) {
            // Add manifest
            addToZip(zos, manifestFile, manifestFile.getName());
            
            // Add all sealed files
            for (File f : sealedFiles) {
                addToZip(zos, f, f.getName());
            }
        }
        
        // Seal the final ZIP
        SealGate.SealedBlob sealed = SealGate.sealIn(ctx, Uri.fromFile(finalZip));
        
        // Log the event
        AuditLogger.logEvent(ctx, "CASE_FILE_BUILT", 
            "case=" + caseName + " files=" + sealedFiles.size(), 
            sealed.sha512Public);
        
        return new FinalCaseFile(sealed.file, sealed.sha512Public, sealed.blockchainTx);
    }
    
    private static void addToZip(ZipOutputStream zos, File file, String entryName) throws Exception {
        ZipEntry ze = new ZipEntry(entryName);
        zos.putNextEntry(ze);
        
        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = fis.read(buf)) > 0) {
                zos.write(buf, 0, n);
            }
        }
        
        zos.closeEntry();
    }
    
    /**
     * Get count of sealed files available for case building
     */
    public static int getSealedFileCount(Context ctx) {
        File filesDir = ctx.getFilesDir();
        int count = 0;
        
        for (File f : filesDir.listFiles()) {
            if ((f.getName().startsWith("email_bundle_") && f.getName().endsWith(".zip")) ||
                (f.getName().startsWith("VO_Forensic_Report_") && f.getName().endsWith(".pdf"))) {
                count++;
            }
        }
        
        return count;
    }
}
