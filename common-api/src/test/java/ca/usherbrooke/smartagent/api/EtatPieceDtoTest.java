package ca.usherbrooke.smartagent.api;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class EtatPieceDtoTest {

    @Test
    public void testSerializationJson() {
        EtatPieceDto dto = new EtatPieceDto("salleA", 22.5, 450, true, 21.0);
        String json = dto.toJson();

        assertNotNull(json);
        assertTrue(json.contains("salleA"));
        assertTrue(json.contains("22.5"));
        assertTrue(json.contains("450"));

        EtatPieceDto deserialise = EtatPieceDto.fromJson(json);
        assertEquals("salleA", deserialise.getPiece());
        assertEquals(22.5, deserialise.getTemperature());
        assertEquals(450, deserialise.getLuminosite());
        assertTrue(deserialise.isOccupation());
        assertEquals(21.0, deserialise.getConsigneThermostat());
    }
}
