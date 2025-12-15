package com.verumomnis.forensics.core;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

/**
 * JurisdictionManager - Manages jurisdiction-specific rules and requirements
 * 
 * CONSTITUTIONAL REQUIREMENT:
 * No jurisdiction = no analysis
 * Jurisdiction MUST be explicitly selected
 */
public class JurisdictionManager {
    
    public static class Jurisdiction {
        public final String code;
        public final String name;
        public final String legalSystem;
        public final List<String> authorities;
        public final String notes;
        
        public Jurisdiction(String code, String name, String legalSystem, 
                          List<String> authorities, String notes) {
            this.code = code;
            this.name = name;
            this.legalSystem = legalSystem;
            this.authorities = authorities;
            this.notes = notes;
        }
    }
    
    /**
     * Available jurisdictions
     */
    private static final String[] JURISDICTION_FILES = {
        "jurisdiction_uae",
        "jurisdiction_south_africa",
        "jurisdiction_eu"
    };
    
    /**
     * Load all available jurisdictions
     */
    public static List<Jurisdiction> getAvailableJurisdictions(Context ctx) {
        List<Jurisdiction> jurisdictions = new ArrayList<>();
        
        for (String fileName : JURISDICTION_FILES) {
            try {
                Jurisdiction j = loadJurisdiction(ctx, fileName);
                if (j != null) {
                    jurisdictions.add(j);
                }
            } catch (Exception e) {
                android.util.Log.e("JurisdictionManager", 
                    "Failed to load jurisdiction: " + fileName, e);
            }
        }
        
        return jurisdictions;
    }
    
    /**
     * Load a specific jurisdiction by code
     */
    public static Jurisdiction loadJurisdictionByCode(Context ctx, String code) {
        for (String fileName : JURISDICTION_FILES) {
            try {
                Jurisdiction j = loadJurisdiction(ctx, fileName);
                if (j != null && j.code.equals(code)) {
                    return j;
                }
            } catch (Exception e) {
                // Continue searching
            }
        }
        return null;
    }
    
    /**
     * Load jurisdiction from JSON file
     */
    private static Jurisdiction loadJurisdiction(Context ctx, String fileName) throws Exception {
        int resId = ctx.getResources().getIdentifier(
            fileName, "raw", ctx.getPackageName()
        );
        
        if (resId == 0) {
            throw new IllegalArgumentException("Jurisdiction file not found: " + fileName);
        }
        
        InputStream is = ctx.getResources().openRawResource(resId);
        BufferedReader reader = new BufferedReader(new InputStreamReader(is));
        StringBuilder json = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            json.append(line);
        }
        reader.close();
        
        JSONObject obj = new JSONObject(json.toString());
        
        String code = obj.getString("code");
        String name = obj.getString("name");
        String legalSystem = obj.getString("legal_system");
        String notes = obj.optString("notes", "");
        
        List<String> authorities = new ArrayList<>();
        JSONArray authArray = obj.getJSONArray("authorities");
        for (int i = 0; i < authArray.length(); i++) {
            authorities.add(authArray.getString(i));
        }
        
        return new Jurisdiction(code, name, legalSystem, authorities, notes);
    }
}
