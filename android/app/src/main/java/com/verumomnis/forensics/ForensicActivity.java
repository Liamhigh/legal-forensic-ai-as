package com.verumomnis.forensics;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;

import com.verumomnis.forensics.email.EmailIntake;

import java.io.File;

/**
 * ForensicActivity - Native Android UI for email forensics
 */
public class ForensicActivity extends AppCompatActivity {
    
    private TextView status;
    private TextView resultText;
    private ActivityResultLauncher<Intent> emailLauncher;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forensic);
        
        status = findViewById(R.id.status);
        resultText = findViewById(R.id.result_text);
        
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
                        new Thread(() -> sealEmail(uri)).start();
                    }
                }
            }
        );
        
        // Set up button click listener
        Button btnEmail = findViewById(R.id.btn_email);
        btnEmail.setOnClickListener(v -> pickEmail());
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
                status.setText("Sealing e-mail…");
                resultText.setText("Processing...");
            });
            
            EmailIntake.SealedEmail sealed = EmailIntake.intake(this, uri);
            
            runOnUiThread(() -> {
                status.setText("E-mail sealed: " + sealed.sealedBundle.getName());
                resultText.setText(
                    "Sealed successfully!\n" +
                    "SHA-512: " + sealed.sha512Public.substring(0, 16) + "...\n" +
                    "Geo Hash: " + sealed.geoSha.substring(0, 16) + "...\n" +
                    "Blockchain: " + sealed.blockchainTx
                );
                shareFile(sealed.sealedBundle);
            });
        } catch (Exception e) {
            runOnUiThread(() -> {
                status.setText("E-mail seal failed");
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
}
