package com.verumomnis.forensics;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.Spinner;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;

import com.verumomnis.forensics.core.JurisdictionManager;
import com.verumomnis.forensics.email.EmailIntake;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * ForensicActivity - Native Android UI for email forensics
 * 
 * CONSTITUTIONAL REQUIREMENTS (v5.2.7):
 * - Jurisdiction MUST be explicitly selected (no jurisdiction = no analysis)
 * - Show progress states: Securing, Analyzing, Sealing, Anchoring/Queued
 * - Display engine version v5.2.7
 * - All outputs MUST be sealed
 */
public class ForensicActivity extends AppCompatActivity {
    
    // Display constants
    private static final int HASH_DISPLAY_LENGTH = 16;
    
    private TextView status;
    private TextView resultText;
    private Spinner jurisdictionSpinner;
    private ActivityResultLauncher<Intent> emailLauncher;
    
    private List<JurisdictionManager.Jurisdiction> jurisdictions;
    private String selectedJurisdictionCode = null;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forensic);
        
        status = findViewById(R.id.status);
        resultText = findViewById(R.id.result_text);
        jurisdictionSpinner = findViewById(R.id.jurisdiction_spinner);
        
        // Load jurisdictions
        loadJurisdictions();
        
        // Register activity result launcher for email picker
        emailLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                    Uri uri = result.getData().getData();
                    if (uri != null) {
                        try {
                            getContentResolver().takePersistableUriPermission(
                                uri, 
                                Intent.FLAG_GRANT_READ_URI_PERMISSION
                            );
                        } catch (Exception e) {
                            // Permission may not be available for all URIs
                        }
                        // Check jurisdiction is selected
                        if (selectedJurisdictionCode == null) {
                            runOnUiThread(() -> {
                                status.setText("ERROR: No jurisdiction selected");
                                resultText.setText("CONSTITUTIONAL REQUIREMENT VIOLATED:\n" +
                                    "No jurisdiction = no analysis.\n" +
                                    "Please select a jurisdiction before processing evidence.");
                            });
                            return;
                        }
                        new Thread(() -> sealEmail(uri)).start();
                    }
                }
            }
        );
        
        // Set up button click listener
        Button btnEmail = findViewById(R.id.btn_email);
        btnEmail.setOnClickListener(v -> pickEmail());
        
        Button btnBuildCase = findViewById(R.id.btn_build_case);
        btnBuildCase.setOnClickListener(v -> buildCaseFile());
        
        updateSealedFileCount();
    }
    
    /**
     * Load available jurisdictions and populate spinner
     */
    private void loadJurisdictions() {
        jurisdictions = JurisdictionManager.getAvailableJurisdictions(this);
        
        List<String> jurisdictionNames = new ArrayList<>();
        jurisdictionNames.add("-- Select Jurisdiction (Required) --");
        for (JurisdictionManager.Jurisdiction j : jurisdictions) {
            jurisdictionNames.add(j.name + " (" + j.code + ")");
        }
        
        ArrayAdapter<String> adapter = new ArrayAdapter<>(
            this, 
            android.R.layout.simple_spinner_item, 
            jurisdictionNames
        );
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        jurisdictionSpinner.setAdapter(adapter);
        
        jurisdictionSpinner.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(android.widget.AdapterView<?> parent, android.view.View view, int position, long id) {
                if (position == 0) {
                    selectedJurisdictionCode = null;
                } else {
                    selectedJurisdictionCode = jurisdictions.get(position - 1).code;
                }
            }
            
            @Override
            public void onNothingSelected(android.widget.AdapterView<?> parent) {
                selectedJurisdictionCode = null;
            }
        });
    }
    
    private void updateSealedFileCount() {
        int count = com.verumomnis.forensics.core.CaseFileManager.getSealedFileCount(this);
        resultText.setText("Sealed files available: " + count);
    }
    
    private void pickEmail() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*");
        i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
            "message/rfc822",
            "application/octet-stream"
        });
        emailLauncher.launch(i);
    }
    
    private void sealEmail(Uri uri) {
        try {
            runOnUiThread(() -> {
                status.setText("Progress: Securing evidence...");
                resultText.setText("Processing...");
            });
            
            EmailIntake.SealedEmail sealed = EmailIntake.intake(this, uri);
            
            runOnUiThread(() -> {
                status.setText("✓ E-mail sealed: " + sealed.sealedBundle.getName());
                resultText.setText(
                    "Sealed successfully!\n\n" +
                    "Public SHA-512: " + sealed.sha512Public.substring(0, HASH_DISPLAY_LENGTH) + "...\n" +
                    "Device HMAC-SHA512: " + sealed.hmacSha512Device.substring(0, HASH_DISPLAY_LENGTH) + "...\n" +
                    "Geo Hash: " + sealed.geoSha.substring(0, HASH_DISPLAY_LENGTH) + "...\n" +
                    "Blockchain: " + sealed.blockchainTx + "\n" +
                    "Jurisdiction: " + selectedJurisdictionCode
                );
                updateSealedFileCount();
                shareFile(sealed.sealedBundle);
            });
        } catch (Exception e) {
            runOnUiThread(() -> {
                status.setText("✗ E-mail seal failed");
                resultText.setText("Error: " + e.getMessage());
            });
        }
    }
    
    private void shareFile(File file) {
        try {
            Uri fileUri = FileProvider.getUriForFile(
                this,
                getApplicationContext().getPackageName() + ".fileprovider",
                file
            );
            
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("application/zip");
            shareIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            
            startActivity(Intent.createChooser(shareIntent, "Share sealed email bundle"));
        } catch (Exception e) {
            runOnUiThread(() -> resultText.setText("Share failed: " + e.getMessage()));
        }
    }
    
    private void buildCaseFile() {
        // Check jurisdiction is selected
        if (selectedJurisdictionCode == null) {
            runOnUiThread(() -> {
                status.setText("ERROR: No jurisdiction selected");
                resultText.setText("CONSTITUTIONAL REQUIREMENT VIOLATED:\n" +
                    "No jurisdiction = no analysis.\n" +
                    "Please select a jurisdiction before building case file.");
            });
            return;
        }
        
        new Thread(() -> {
            try {
                runOnUiThread(() -> {
                    status.setText("Progress: Building final case file…");
                    resultText.setText("Processing...");
                });
                
                String caseName = "ForensicCase_" + System.currentTimeMillis();
                String narrative = "Forensic case file containing all sealed evidence. " +
                                 "Jurisdiction: " + selectedJurisdictionCode;
                
                com.verumomnis.forensics.core.CaseFileManager.FinalCaseFile caseFile = 
                    com.verumomnis.forensics.core.CaseFileManager.buildFinalCaseFile(this, caseName, narrative);
                
                runOnUiThread(() -> {
                    status.setText("✓ Case file built: " + caseFile.file.getName());
                    resultText.setText(
                        "Case file sealed successfully!\n\n" +
                        "SHA-512: " + caseFile.sha512.substring(0, HASH_DISPLAY_LENGTH) + "...\n" +
                        "Blockchain: " + caseFile.blockchainTx + "\n" +
                        "Jurisdiction: " + selectedJurisdictionCode
                    );
                    shareFile(caseFile.file);
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    status.setText("✗ Case file build failed");
                    resultText.setText("Error: " + e.getMessage());
                });
            }
        }).start();
    }
}
