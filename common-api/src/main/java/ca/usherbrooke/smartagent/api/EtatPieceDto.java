package ca.usherbrooke.smartagent.api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.Serializable;
import java.time.Instant;

/**
 * Objet de transfert de données (DTO) représentant l'état d'une pièce.
 * Sérialisable pour transmission réseau et facilement convertible en JSON.
 */
public class EtatPieceDto implements Serializable {

    private static final long serialVersionUID = 1L;
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

    private String piece;
    private double temperature;
    private int luminosite;
    private boolean occupation;
    private double consigneThermostat;
    private String dernierMessageUtc;
    private boolean enTimeout;

    public EtatPieceDto() {
        this.dernierMessageUtc = Instant.now().toString();
    }

    public EtatPieceDto(String piece, double temperature, int luminosite, boolean occupation, double consigneThermostat) {
        this.piece = piece;
        this.temperature = temperature;
        this.luminosite = luminosite;
        this.occupation = occupation;
        this.consigneThermostat = consigneThermostat;
        this.dernierMessageUtc = Instant.now().toString();
        this.enTimeout = false;
    }

    public String toJson() {
        return GSON.toJson(this);
    }

    public static EtatPieceDto fromJson(String json) {
        return GSON.fromJson(json, EtatPieceDto.class);
    }

    // Getters et Setters
    public String getPiece() { return piece; }
    public void setPiece(String piece) { this.piece = piece; }

    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }

    public int getLuminosite() { return luminosite; }
    public void setLuminosite(int luminosite) { this.luminosite = luminosite; }

    public boolean isOccupation() { return occupation; }
    public void setOccupation(boolean occupation) { this.occupation = occupation; }

    public double getConsigneThermostat() { return consigneThermostat; }
    public void setConsigneThermostat(double consigneThermostat) { this.consigneThermostat = consigneThermostat; }

    public String getDernierMessageUtc() { return dernierMessageUtc; }
    public void setDernierMessageUtc(String dernierMessageUtc) { this.dernierMessageUtc = dernierMessageUtc; }

    public boolean isEnTimeout() { return enTimeout; }
    public void setEnTimeout(boolean enTimeout) { this.enTimeout = enTimeout; }

    @Override
    public String toString() {
        return String.format("[%s] Temp=%.1f°C, Lum=%d Lux, Occ=%b, Consigne=%.1f°C, Timeout=%b",
                piece, temperature, luminosite, occupation, consigneThermostat, enTimeout);
    }
}
