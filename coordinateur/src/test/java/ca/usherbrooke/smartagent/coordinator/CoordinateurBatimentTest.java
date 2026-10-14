package ca.usherbrooke.smartagent.coordinator;

import ca.usherbrooke.smartagent.api.Constantes;
import ca.usherbrooke.smartagent.api.IAgentPiece;
import org.junit.jupiter.api.Test;

import java.rmi.RemoteException;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

public class CoordinateurBatimentTest {

    static class MockAgentPiece implements IAgentPiece {
        private final double temperature;
        private final boolean doitPlanter;
        final AtomicReference<Double> consigneRecue = new AtomicReference<>(null);

        MockAgentPiece(double temperature) {
            this(temperature, false);
        }

        MockAgentPiece(double temperature, boolean doitPlanter) {
            this.temperature = temperature;
            this.doitPlanter = doitPlanter;
        }

        @Override
        public double getTemperature() throws RemoteException {
            if (doitPlanter) {
                throw new RemoteException("Simulation panne réseau RMI");
            }
            return temperature;
        }

        @Override public int getLuminosite() throws RemoteException { return 300; }
        @Override public boolean isOccupee() throws RemoteException { return true; }
        @Override public void setConsigneTemperature(double t) throws RemoteException { consigneRecue.set(t); }
        @Override public String getEtat() throws RemoteException { return "{}"; }
    }

    @Test
    public void testEquilibrageThermiqueDifferenceSuperieureA4Degres() {
        CoordinateurBatiment coordinateur = new CoordinateurBatiment();

        // Salle A à 26.0 °C et Salle B à 20.0 °C (écart = 6.0 °C > 4.0 °C)
        MockAgentPiece agentA = new MockAgentPiece(26.0);
        MockAgentPiece agentB = new MockAgentPiece(20.0);
        MockAgentPiece cuisine = new MockAgentPiece(21.0);

        coordinateur.getAgents().put(Constantes.SALLE_A, agentA);
        coordinateur.getAgents().put(Constantes.SALLE_B, agentB);
        coordinateur.getAgents().put(Constantes.CUISINE, cuisine);

        coordinateur.equilibrerTemperatures();

        // Vérification : l'agent le plus chaud (Salle A) a dû recevoir une consigne cible
        assertNotNull(agentA.consigneRecue.get(), "La salle A (la plus chaude) doit recevoir un ajustement de consigne");
        assertEquals(23.0, agentA.consigneRecue.get(), 0.01, "La consigne cible doit être la moyenne (23.0 °C)");
        assertNull(agentB.consigneRecue.get(), "La salle B ne doit pas être modifiée");
    }

    @Test
    public void testAucunEquilibrageSiEcartInferieurA4Degres() {
        CoordinateurBatiment coordinateur = new CoordinateurBatiment();

        // Salle A à 22.0 °C et Salle B à 20.0 °C (écart = 2.0 °C <= 4.0 °C)
        MockAgentPiece agentA = new MockAgentPiece(22.0);
        MockAgentPiece agentB = new MockAgentPiece(20.0);

        coordinateur.getAgents().put(Constantes.SALLE_A, agentA);
        coordinateur.getAgents().put(Constantes.SALLE_B, agentB);

        coordinateur.equilibrerTemperatures();

        assertNull(agentA.consigneRecue.get(), "Aucun ajustement requis car écart <= 4.0 °C");
    }

    @Test
    public void testToleranceAuxPannesRemoteExceptionNePlantePas() {
        CoordinateurBatiment coordinateur = new CoordinateurBatiment();

        // Salle A plante avec RemoteException
        MockAgentPiece agentAEnPanne = new MockAgentPiece(27.0, true);
        // Salle B et Cuisine sont opérationnels avec un écart > 4°C (25.0 vs 19.0)
        MockAgentPiece agentB = new MockAgentPiece(25.0);
        MockAgentPiece agentCuisine = new MockAgentPiece(19.0);

        coordinateur.getAgents().put(Constantes.SALLE_A, agentAEnPanne);
        coordinateur.getAgents().put(Constantes.SALLE_B, agentB);
        coordinateur.getAgents().put(Constantes.CUISINE, agentCuisine);

        // L'appel ne doit pas lancer d'exception et doit continuer sur la paire B - Cuisine
        assertDoesNotThrow(() -> coordinateur.equilibrerTemperatures(),
                "Le coordinateur doit capturer RemoteException et poursuivre l'équilibrage des autres pièces");

        // Salle B doit avoir reçu sa consigne d'ajustement (25.0 + 19.0) / 2 = 22.0 °C
        assertNotNull(agentB.consigneRecue.get(), "Salle B et Cuisine doivent être équilibrées malgré la panne de Salle A");
        assertEquals(22.0, agentB.consigneRecue.get(), 0.01);
    }

    @Test
    public void testMappingItemsOpenHab() {
        CoordinateurBatiment coordinateur = new CoordinateurBatiment();
        assertEquals("SalleA_Thermostat", coordinateur.getOpenHabThermostatItem(Constantes.SALLE_A));
        assertEquals("SalleB_Thermostat", coordinateur.getOpenHabThermostatItem(Constantes.SALLE_B));
        assertEquals("Cuisine_Thermostat", coordinateur.getOpenHabThermostatItem(Constantes.CUISINE));
    }
}
