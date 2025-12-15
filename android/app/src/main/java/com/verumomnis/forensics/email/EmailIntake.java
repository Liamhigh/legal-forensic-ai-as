package com.verumomnis.forensics.email;

import android.content.Context;
import android.net.Uri;

import com.verumomnis.forensics.core.AuditLogger;
import com.verumomnis.forensics.geo.GeoForensics;
import com.verumomnis.forensics.security.SealGate;
import com.verumomnis.forensics.security.SecureFileUtils;

import org.apache.james.mime4j.dom.Message;
import org.apache.james.mime4j.dom.field.ContentDispositionField;
import org.apache.james.mime4j.message.DefaultMessageBuilder;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.List;
import java.util.Objects;
import java.util.Properties;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import javax.mail.Session;
import javax.mail.internet.MimeMessage;

/**
 * EmailIntake - Forensic email processing
 * One-shot wrapper: URI → sealed e-mail bundle
 */
public class EmailIntake {
    
    public static class SealedEmail {
        public final File sealedBundle;    // ZIP with MIME + headers + attachments + geo + cert
        public final String sha512Public;  // reproducible
        public final String hmacSha512Device;  // device-bound chain-of-custody
        public final String geoSha;        // location lock
        public final String blockchainTx;  // ETH/Polygon or OFFLINE_PENDING
        
        public SealedEmail(File sealedBundle, String sha512Public, String hmacSha512Device, 
                          String geoSha, String blockchainTx) {
            this.sealedBundle = sealedBundle;
            this.sha512Public = sha512Public;
            this.hmacSha512Device = hmacSha512Device;
            this.geoSha = geoSha;
            this.blockchainTx = blockchainTx;
        }
    }
    
    public static SealedEmail intake(Context ctx, Uri emlUri) throws Exception {
        // 1. Preserve raw bytes
        File rawFile = new File(ctx.getFilesDir(), "email_raw_" + System.currentTimeMillis() + ".eml");
        try (InputStream in = ctx.getContentResolver().openInputStream(emlUri);
             OutputStream out = new FileOutputStream(rawFile)) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
        }
        
        // 2. Geolock
        GeoForensics.GeoSnapshot geo = GeoForensics.capture(ctx);
        
        // 3. Parse & analyse
        EmailAnalysis analysis = analyse(rawFile);
        
        // 4. Build working bundle (MIME + headers + attachments + analysis.json)
        File bundleDir = new File(ctx.getFilesDir(), "email_bundle_" + System.currentTimeMillis());
        bundleDir.mkdirs();
        copy(rawFile, new File(bundleDir, "original.eml"));
        writeJson(new File(bundleDir, "analysis.json"), analysis);
        extractAttachments(rawFile, bundleDir);
        
        // 5. Zip bundle
        File zip = new File(ctx.getFilesDir(), "email_bundle_" + System.currentTimeMillis() + ".zip");
        zipFolder(bundleDir, zip);
        
        // 6. Seal the zip (SHA-512 + HMAC + blockchain)
        SealGate.SealedBlob sealed = SealGate.sealIn(ctx, Uri.fromFile(zip));
        
        // 7. Clean up temporary files securely (overwrite + delete)
        SecureFileUtils.secureDeleteDirectory(bundleDir);
        SecureFileUtils.secureDelete(rawFile);
        SecureFileUtils.secureDelete(zip);
        
        AuditLogger.logEvent(ctx, "EMAIL_SEALED", "from=" + analysis.from + " subject=" + analysis.subject, sealed.sha512Public);
        
        return new SealedEmail(sealed.file, sealed.sha512Public, sealed.hmacSha512Device, geo.sha512, sealed.blockchainTx);
    }
    
    /* ---------- helpers ---------- */
    
    private static EmailAnalysis analyse(File eml) throws Exception {
        Session session = Session.getDefaultInstance(new Properties());
        MimeMessage msg = new MimeMessage(session, new FileInputStream(eml));
        
        EmailAnalysis a = new EmailAnalysis();
        a.from = msg.getFrom() == null ? "none" : msg.getFrom()[0].toString();
        a.to = Arrays.toString(msg.getAllRecipients());
        a.subject = msg.getSubject();
        a.sent = msg.getSentDate() == null ? 0 : msg.getSentDate().getTime();
        a.received = msg.getReceivedDate() == null ? 0 : msg.getReceivedDate().getTime();
        a.messageId = msg.getMessageID();
        
        a.headers = new ArrayList<>();
        Enumeration<?> h = msg.getAllHeaderLines();
        while (h.hasMoreElements()) a.headers.add((String) h.nextElement());
        
        a.contradictions = detectContradictions(a);
        
        return a;
    }
    
    private static List<String> detectContradictions(EmailAnalysis a) {
        List<String> c = new ArrayList<>();
        if (a.sent != 0 && a.received != 0 && Math.abs(a.sent - a.received) > 86400000L)
            c.add("Sent/Received gap >24h possible metadata spoof");
        if (a.messageId == null || !a.messageId.contains("@"))
            c.add("Missing or malformed Message-ID");
        return c;
    }
    
    private static void extractAttachments(File eml, File dir) throws Exception {
        // mime4j quick stub – writes attachments to dir
        DefaultMessageBuilder builder = new DefaultMessageBuilder();
        Message message = builder.parseMessage(new FileInputStream(eml));
        
        // Simple attachment extraction
        extractParts(message, dir, 0);
    }
    
    private static int extractParts(org.apache.james.mime4j.dom.Entity entity, File dir, int count) throws Exception {
        if (entity.getBody() instanceof org.apache.james.mime4j.dom.Multipart) {
            org.apache.james.mime4j.dom.Multipart multipart = (org.apache.james.mime4j.dom.Multipart) entity.getBody();
            for (org.apache.james.mime4j.dom.Entity part : multipart.getBodyParts()) {
                count = extractParts(part, dir, count);
            }
        } else if (entity.getDispositionType() != null && 
                   entity.getDispositionType().equals(ContentDispositionField.DISPOSITION_TYPE_ATTACHMENT)) {
            String fname = entity.getFilename();
            if (fname == null) fname = "attachment_" + System.currentTimeMillis() + "_" + count;
            File out = new File(dir, fname);
            
            // Handle both text and binary bodies
            try (InputStream in = getBodyInputStream(entity.getBody());
                 OutputStream os = new FileOutputStream(out)) {
                byte[] buf = new byte[8192];
                int n;
                while ((n = in.read(buf)) != -1) os.write(buf, 0, n);
            }
            count++;
        }
        return count;
    }
    
    private static InputStream getBodyInputStream(org.apache.james.mime4j.dom.Body body) throws Exception {
        if (body instanceof org.apache.james.mime4j.dom.TextBody) {
            return ((org.apache.james.mime4j.dom.TextBody) body).getInputStream();
        } else if (body instanceof org.apache.james.mime4j.dom.BinaryBody) {
            return ((org.apache.james.mime4j.dom.BinaryBody) body).getInputStream();
        } else {
            throw new IllegalArgumentException("Unsupported body type: " + body.getClass().getName());
        }
    }
    
    /* ---------- dto ---------- */
    
    public static class EmailAnalysis {
        public String from, to, subject, messageId;
        public long sent, received;
        public List<String> headers;
        public List<String> contradictions;
    }
    
    /* ---------- io ---------- */
    
    private static void writeJson(File f, EmailAnalysis a) throws IOException {
        try (PrintWriter pw = new PrintWriter(new FileWriter(f))) {
            pw.println("{");
            pw.println("  \"from\": \"" + escape(a.from) + "\",");
            pw.println("  \"to\": \"" + escape(a.to) + "\",");
            pw.println("  \"subject\": \"" + escape(a.subject) + "\",");
            pw.println("  \"sent\": " + a.sent + ",");
            pw.println("  \"received\": " + a.received + ",");
            pw.println("  \"messageId\": \"" + escape(a.messageId) + "\",");
            pw.println("  \"contradictions\": " + a.contradictions.toString());
            pw.println("}");
        }
    }
    
    private static String escape(String s) {
        return s == null ? "" : s.replace("\"", "\\\"");
    }
    
    private static void copy(File src, File dst) throws IOException {
        try (FileInputStream in = new FileInputStream(src);
             FileOutputStream out = new FileOutputStream(dst)) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        }
    }
    
    private static void zipFolder(File srcDir, File zipFile) throws IOException {
        try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(zipFile))) {
            File[] files = srcDir.listFiles();
            if (files == null) return;
            for (File f : files) {
                ZipEntry ze = new ZipEntry(f.getName());
                zos.putNextEntry(ze);
                try (FileInputStream fis = new FileInputStream(f)) {
                    byte[] buf = new byte[8192];
                    int n;
                    while ((n = fis.read(buf)) > 0) zos.write(buf, 0, n);
                }
                zos.closeEntry();
            }
        }
    }
    
    private static void deleteRecursive(File f) {
        if (f.isDirectory()) {
            File[] files = f.listFiles();
            if (files != null) {
                for (File c : files) deleteRecursive(c);
            }
        }
        //noinspection ResultOfMethodCallIgnored
        f.delete();
    }
}
