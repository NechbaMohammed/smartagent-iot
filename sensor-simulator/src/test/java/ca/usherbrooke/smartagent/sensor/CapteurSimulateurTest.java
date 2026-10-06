package ca.usherbrooke.smartagent.sensor;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class CapteurSimulateurTest {

    @Test
    public void testPlagesRealistesSimulateur() {
        CapteurSimulateur sim = new CapteurSimulateur("salleA", "tcp://localhost:1883");

        // Vérification des plages initiales
        assertTrue(sim.getCurrentTemp() >= 18.0 && sim.getCurrentTemp() <= 26.0,
                "La température initiale doit être comprise entre 18 et 26 °C");
        assertTrue(sim.getCurrentLum() >= 100 && sim.getCurrentLum() <= 800,
                "La luminosité initiale doit être comprise entre 100 et 800 Lux");

        // Test de variation progressive
        double prevTemp = sim.getCurrentTemp();
        sim.publishTemp(); // recalcule la température
        double diff = Math.abs(sim.getCurrentTemp() - prevTemp);
        assertTrue(diff <= 1.0, "La variation de température par pas de 5s doit être progressive");
    }
}
