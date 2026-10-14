package ca.usherbrooke.smartagent.coordinator;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class OpenHabRestClientTest {

    @Test
    public void testBaseUrlNormalisation() {
        OpenHabRestClient client1 = new OpenHabRestClient("http://localhost:8080/");
        assertEquals("http://localhost:8080", client1.getBaseUrl());

        OpenHabRestClient client2 = new OpenHabRestClient("http://localhost:8080");
        assertEquals("http://localhost:8080", client2.getBaseUrl());
    }

    @Test
    public void testGestionHorsLigneSansCrash() {
        // Port non ouvert pour tester la résilience réseau
        OpenHabRestClient client = new OpenHabRestClient("http://localhost:59999");

        // Ne doit jamais lever d'exception non gérée, mais retourner null ou false
        String state = client.getItemState("SalleA_Temperature");
        assertNull(state, "Quand openHAB est hors-ligne, getItemState doit retourner null sans lever d'exception");

        boolean sent = client.sendCommand("SalleA_Thermostat", "19.0");
        assertFalse(sent, "Quand openHAB est hors-ligne, sendCommand doit retourner false sans crasher");
    }
}
