package ca.usherbrooke.smartagent.agent;

import ca.usherbrooke.smartagent.api.Constantes;
import ca.usherbrooke.smartagent.api.EtatPieceDto;
import org.junit.jupiter.api.Test;

import java.rmi.RemoteException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests unitaires pour la classe AgentPiece (Serveur RMI et état local).
 * Valide les exigences RMI, les getters, la modification de consigne et le format JSON.
 */
public class AgentPieceTest {

    @Test
    public void testInitialisationEtValeursParDefaut() throws RemoteException {
        AgentPiece agent = new AgentPiece(Constantes.SALLE_A, "tcp://localhost:1883");

        assertEquals(Constantes.SALLE_A, agent.getNomPiece());
        assertEquals(20.0, agent.getTemperature(), 0.001);
        assertEquals(300, agent.getLuminosite());
        assertFalse(agent.isOccupee());
        assertFalse(agent.isEnTimeout(), "Un agent fraîchement instancié ne doit pas être en timeout");
    }

    @Test
    public void testSetConsigneTemperature() throws RemoteException {
        AgentPiece agent = new AgentPiece(Constantes.SALLE_B, "tcp://localhost:1883");

        agent.setConsigneTemperature(23.5);

        String json = agent.getEtat();
        assertNotNull(json);
        EtatPieceDto dto = EtatPieceDto.fromJson(json);
        assertEquals(23.5, dto.getConsigneThermostat(), 0.01);
    }

    @Test
    public void testGetEtatEtGetEtatJsonIdentiques() throws RemoteException {
        AgentPiece agent = new AgentPiece(Constantes.CUISINE, "tcp://localhost:1883");

        String etat = agent.getEtat();
        String etatJson = agent.getEtatJson();

        assertNotNull(etat);
        assertNotNull(etatJson);
        assertEquals(etat, etatJson, "getEtat() et getEtatJson() doivent retourner le même contenu");

        EtatPieceDto dto = EtatPieceDto.fromJson(etat);
        assertEquals(Constantes.CUISINE, dto.getPiece());
        assertFalse(dto.isEnTimeout());
    }

    @Test
    public void testTimeoutDetection() throws RemoteException {
        AgentPiece agent = new AgentPiece(Constantes.SALLE_A, "tcp://localhost:1883");
        assertFalse(agent.isEnTimeout());
    }
}
