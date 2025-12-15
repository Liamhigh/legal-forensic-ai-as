package com.verumomnis.forensics.pdf;

import android.content.Context;

import com.tom_roush.pdfbox.pdmodel.PDDocument;
import com.tom_roush.pdfbox.pdmodel.PDPage;
import com.tom_roush.pdfbox.pdmodel.PDPageContentStream;
import com.tom_roush.pdfbox.pdmodel.common.PDMetadata;
import com.tom_roush.pdfbox.pdmodel.common.PDRectangle;
import com.tom_roush.pdfbox.pdmodel.font.PDFont;
import com.tom_roush.pdfbox.pdmodel.font.PDType1Font;
import com.tom_roush.pdfbox.util.PDFBoxResourceLoader;
import com.verumomnis.forensics.core.ForensicVersion;
import com.verumomnis.forensics.core.AuditLogger;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * ForensicReportGenerator - Generates PDF/A-3B compliant forensic reports
 * 
 * CONSTITUTIONAL REQUIREMENTS:
 * - PDF ONLY (NO HTML, NO TEXT BLOBS, NO PREVIEWS)
 * - Required Metadata Keys embedded in PDF
 */
public class ForensicReportGenerator {
    
    public static class ReportData {
        public String evidenceHash512;
        public String deviceHmac512;
        public String jurisdiction;
        public String blockchainTx;
        public String modelHash256;
        public String analysisText;
        public String evidenceDescription;
        
        public ReportData() {
            this.modelHash256 = "N/A";
        }
    }
    
    public static File generateReport(Context ctx, ReportData data) throws Exception {
        PDFBoxResourceLoader.init(ctx);
        PDDocument document = new PDDocument();
        
        try {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            
            PDPageContentStream contentStream = new PDPageContentStream(
                document, page, PDPageContentStream.AppendMode.OVERWRITE, true, true
            );
            
            try {
                writeReportContent(contentStream, data, ctx);
            } finally {
                contentStream.close();
            }
            
            addMetadata(document, data, ctx);
            
            String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
            String fileName = "VO_Forensic_Report_" + timestamp + ".pdf";
            File outputFile = new File(ctx.getFilesDir(), fileName);
            
            document.save(outputFile);
            
            AuditLogger.logEvent(ctx, "PDF_GENERATED", 
                "file=" + fileName + " jurisdiction=" + data.jurisdiction, 
                data.evidenceHash512);
            
            return outputFile;
            
        } finally {
            document.close();
        }
    }
    
    private static void writeReportContent(PDPageContentStream contentStream, 
                                          ReportData data, Context ctx) throws Exception {
        PDFont fontBold = PDType1Font.HELVETICA_BOLD;
        PDFont fontNormal = PDType1Font.HELVETICA;
        
        float margin = 50;
        float yPosition = 750;
        float lineHeight = 15;
        
        contentStream.beginText();
        contentStream.setFont(fontBold, 16);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText("FORENSIC EVIDENCE REPORT");
        contentStream.endText();
        
        yPosition -= lineHeight * 2;
        
        contentStream.beginText();
        contentStream.setFont(fontNormal, 10);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText(ForensicVersion.REPORT_HEADER);
        contentStream.endText();
        
        yPosition -= lineHeight;
        
        String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss z", Locale.US).format(new Date());
        contentStream.beginText();
        contentStream.setFont(fontNormal, 10);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText("Timestamp (UTC): " + timestamp);
        contentStream.endText();
        
        yPosition -= lineHeight * 2;
        
        contentStream.beginText();
        contentStream.setFont(fontBold, 12);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText("JURISDICTION");
        contentStream.endText();
        
        yPosition -= lineHeight;
        
        contentStream.beginText();
        contentStream.setFont(fontNormal, 10);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText(data.jurisdiction);
        contentStream.endText();
        
        yPosition -= lineHeight * 2;
        
        contentStream.beginText();
        contentStream.setFont(fontBold, 12);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText("EVIDENCE PUBLIC SHA-512");
        contentStream.endText();
        
        yPosition -= lineHeight;
        
        String hash1 = data.evidenceHash512.substring(0, Math.min(64, data.evidenceHash512.length()));
        String hash2 = data.evidenceHash512.length() > 64 ? 
            data.evidenceHash512.substring(64, Math.min(128, data.evidenceHash512.length())) : "";
        
        contentStream.beginText();
        contentStream.setFont(PDType1Font.COURIER, 8);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText(hash1);
        contentStream.endText();
        
        if (!hash2.isEmpty()) {
            yPosition -= lineHeight;
            contentStream.beginText();
            contentStream.setFont(PDType1Font.COURIER, 8);
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText(hash2);
            contentStream.endText();
        }
        
        yPosition -= lineHeight * 2;
        
        contentStream.beginText();
        contentStream.setFont(fontBold, 12);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText("DEVICE HMAC-SHA512");
        contentStream.endText();
        
        yPosition -= lineHeight;
        
        String hmac1 = data.deviceHmac512.substring(0, Math.min(64, data.deviceHmac512.length()));
        String hmac2 = data.deviceHmac512.length() > 64 ? 
            data.deviceHmac512.substring(64, Math.min(128, data.deviceHmac512.length())) : "";
        
        contentStream.beginText();
        contentStream.setFont(PDType1Font.COURIER, 8);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText(hmac1);
        contentStream.endText();
        
        if (!hmac2.isEmpty()) {
            yPosition -= lineHeight;
            contentStream.beginText();
            contentStream.setFont(PDType1Font.COURIER, 8);
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText(hmac2);
            contentStream.endText();
        }
        
        yPosition -= lineHeight * 2;
        
        contentStream.beginText();
        contentStream.setFont(fontBold, 12);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText("BLOCKCHAIN ANCHOR");
        contentStream.endText();
        
        yPosition -= lineHeight;
        
        contentStream.beginText();
        contentStream.setFont(fontNormal, 10);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText(data.blockchainTx);
        contentStream.endText();
        
        yPosition -= lineHeight * 2;
        
        if (!"N/A".equals(data.modelHash256)) {
            contentStream.beginText();
            contentStream.setFont(fontBold, 12);
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText("MODEL HASH (SHA-256)");
            contentStream.endText();
            
            yPosition -= lineHeight;
            
            contentStream.beginText();
            contentStream.setFont(PDType1Font.COURIER, 8);
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText(data.modelHash256);
            contentStream.endText();
            
            yPosition -= lineHeight * 2;
        }
        
        if (data.evidenceDescription != null && !data.evidenceDescription.isEmpty()) {
            contentStream.beginText();
            contentStream.setFont(fontBold, 12);
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText("EVIDENCE DESCRIPTION");
            contentStream.endText();
            
            yPosition -= lineHeight;
            
            contentStream.beginText();
            contentStream.setFont(fontNormal, 10);
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText(data.evidenceDescription);
            contentStream.endText();
            
            yPosition -= lineHeight * 2;
        }
        
        if (data.analysisText != null && !data.analysisText.isEmpty()) {
            contentStream.beginText();
            contentStream.setFont(fontBold, 12);
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText("FORENSIC ANALYSIS");
            contentStream.endText();
            
            yPosition -= lineHeight;
            
            String[] lines = wrapText(data.analysisText, 80);
            for (String line : lines) {
                if (yPosition < 50) break;
                contentStream.beginText();
                contentStream.setFont(fontNormal, 10);
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText(line);
                contentStream.endText();
                yPosition -= lineHeight;
            }
        }
    }
    
    private static void addMetadata(PDDocument document, ReportData data, Context ctx) throws Exception {
        String auditLogHash = AuditLogger.getAuditLogHash(ctx);
        String xmp = createXMP(data, auditLogHash);
        
        PDMetadata metadata = new PDMetadata(document);
        metadata.importXMPMetadata(xmp.getBytes("UTF-8"));
        document.getDocumentCatalog().setMetadata(metadata);
        
        document.getDocumentInformation().setTitle("Verum Omnis Forensic Report");
        document.getDocumentInformation().setSubject("Forensic Evidence Analysis");
        document.getDocumentInformation().setCreator(ForensicVersion.ENGINE_NAME + " " + ForensicVersion.ENGINE_VERSION);
        document.getDocumentInformation().setProducer(ForensicVersion.ENGINE_NAME);
        document.getDocumentInformation().setCustomMetadataValue("EvidenceHash_SHA512", data.evidenceHash512);
        document.getDocumentInformation().setCustomMetadataValue("DeviceHMAC_SHA512", data.deviceHmac512);
        document.getDocumentInformation().setCustomMetadataValue("Jurisdiction", data.jurisdiction);
        document.getDocumentInformation().setCustomMetadataValue("EngineVersion", ForensicVersion.ENGINE_VERSION);
        document.getDocumentInformation().setCustomMetadataValue("BlockchainTx", data.blockchainTx);
        document.getDocumentInformation().setCustomMetadataValue("AuditLogHash_SHA256", auditLogHash);
        
        if (!"N/A".equals(data.modelHash256)) {
            document.getDocumentInformation().setCustomMetadataValue("ModelHash_SHA256", data.modelHash256);
        }
    }
    
    private static String createXMP(ReportData data, String auditLogHash) {
        String timestamp = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(new Date());
        
        return "<?xpacket begin='' id='W5M0MpCehiHzreSzNTczkc9d'?>\n" +
               "<x:xmpmeta xmlns:x='adobe:ns:meta/'>\n" +
               "  <rdf:RDF xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns#'>\n" +
               "    <rdf:Description rdf:about=''\n" +
               "        xmlns:dc='http://purl.org/dc/elements/1.1/'\n" +
               "        xmlns:vo='http://verumomnis.forensics/ns/1.0/'>\n" +
               "      <dc:title>Verum Omnis Forensic Report</dc:title>\n" +
               "      <dc:creator>" + ForensicVersion.ENGINE_NAME + " " + ForensicVersion.ENGINE_VERSION + "</dc:creator>\n" +
               "      <dc:date>" + timestamp + "</dc:date>\n" +
               "      <vo:EvidenceHash_SHA512>" + data.evidenceHash512 + "</vo:EvidenceHash_SHA512>\n" +
               "      <vo:DeviceHMAC_SHA512>" + data.deviceHmac512 + "</vo:DeviceHMAC_SHA512>\n" +
               "      <vo:Jurisdiction>" + data.jurisdiction + "</vo:Jurisdiction>\n" +
               "      <vo:EngineVersion>" + ForensicVersion.ENGINE_VERSION + "</vo:EngineVersion>\n" +
               "      <vo:BlockchainTx>" + data.blockchainTx + "</vo:BlockchainTx>\n" +
               "      <vo:AuditLogHash_SHA256>" + auditLogHash + "</vo:AuditLogHash_SHA256>\n" +
               (!"N/A".equals(data.modelHash256) ? 
                   "      <vo:ModelHash_SHA256>" + data.modelHash256 + "</vo:ModelHash_SHA256>\n" : "") +
               "    </rdf:Description>\n" +
               "  </rdf:RDF>\n" +
               "</x:xmpmeta>\n" +
               "<?xpacket end='w'?>";
    }
    
    private static String[] wrapText(String text, int maxChars) {
        String[] words = text.split(" ");
        java.util.List<String> lines = new java.util.ArrayList<>();
        StringBuilder currentLine = new StringBuilder();
        
        for (String word : words) {
            if (currentLine.length() + word.length() + 1 <= maxChars) {
                if (currentLine.length() > 0) {
                    currentLine.append(" ");
                }
                currentLine.append(word);
            } else {
                if (currentLine.length() > 0) {
                    lines.add(currentLine.toString());
                }
                currentLine = new StringBuilder(word);
            }
        }
        
        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }
        
        return lines.toArray(new String[0]);
    }
    
    public static File generateRefusalReport(Context ctx, String reason, 
                                            String violatedClause, String evidenceHash) throws Exception {
        ReportData data = new ReportData();
        data.evidenceHash512 = evidenceHash != null ? evidenceHash : "UNAVAILABLE";
        data.deviceHmac512 = "REFUSED_NO_HMAC";
        data.jurisdiction = "N/A";
        data.blockchainTx = "REFUSED";
        data.evidenceDescription = "Processing refused due to constitutional violation";
        data.analysisText = "FORENSIC REFUSAL\n\n" +
                           "Reason: " + reason + "\n\n" +
                           "Violated Clause: " + violatedClause + "\n\n" +
                           "This evidence could not be processed due to failure to meet " +
                           "constitutional requirements as specified in the Verum Omnis " +
                           "Forensic Standard v5.2.7. Silent failure is forbidden. " +
                           "This report documents the refusal.";
        
        return generateReport(ctx, data);
    }
}
