package ca.usherbrooke.smartagent.api;

import java.util.List;

/**
 * Constantes globales et conventions de nommage du projet SmartAgent-IoT.
 * Centralise les ports, les préfixes de topics MQTT, les noms RMI et les seuils de gestion.
 */
public final class Constantes {

    private Constantes() {
        // Empêche l'instanciation
    }

    // === CONFIGURATION RÉSEAU & MIDDLEWARE ===
    public static final String MQTT_BROKER_HOST = "localhost";
    public static final int MQTT_BROKER_PORT = 1883;
    public static final String MQTT_BROKER_URI = "tcp://" + MQTT_BROKER_HOST + ":" + MQTT_BROKER_PORT;

    public static final int RMI_REGISTRY_PORT = 2199;

    // === PIÈCES ET AGENTS DU BÂTIMENT ===
    public static final String SALLE_A = "salleA";
    public static final String SALLE_B = "salleB";
    public static final String CUISINE = "cuisine";

    public static final List<String> PIECES = List.of(SALLE_A, SALLE_B, CUISINE);

    public static final String RMI_PREFIX = "agent-";

    public static String getRmiName(String piece) {
        return RMI_PREFIX + piece;
    }

    // === TOPICS MQTT (Convention de nommage) ===
    public static final String TOPIC_PREFIX = "batiment/";
    public static final String CAPTEUR_PREFIX = "/capteur/";
    public static final String ACTUATEUR_PREFIX = "/actuateur/";

    public static final String TYPE_TEMPERATURE = "temperature";
    public static final String TYPE_LUMINOSITE = "luminosite";
    public static final String TYPE_OCCUPATION = "occupation";
    public static final String TYPE_THERMOSTAT = "thermostat";

    public static String topicCapteur(String piece, String type) {
        return TOPIC_PREFIX + piece + CAPTEUR_PREFIX + type;
    }

    public static String topicActuateur(String piece, String type) {
        return TOPIC_PREFIX + piece + ACTUATEUR_PREFIX + type;
    }

    public static String topicWildcardPiece(String piece) {
        return TOPIC_PREFIX + piece + CAPTEUR_PREFIX + "#";
    }

    // === RÈGLES DE GESTION & TIMEOUTS ===
    /** Écart maximal admissible entre deux pièces adjacentes (°C). */
    public static final double ECART_TEMPERATURE_MAX = 4.0;

    /** Délai sans message MQTT avant de considérer un capteur en timeout (secondes). */
    public static final int TIMEOUT_CAPTEUR_SECONDES = 30;

    /** Période de publication des capteurs simulés (millisecondes). */
    public static final long PERIODE_SIMULATION_MS = 5000L;
}
