package ca.usherbrooke.smartagent.sensor;

import ca.usherbrooke.smartagent.api.Constantes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Point d'entrée pour lancer les simulateurs de capteurs pour les trois pièces :
 * salleA, salleB et cuisine (soit 9 flux MQTT au total).
 */
public class SimulateurMain {

    private static final Logger LOGGER = LoggerFactory.getLogger(SimulateurMain.class);

    public static void main(String[] args) {
        LOGGER.info("=== Démarrage du Simulateur de Capteurs SmartAgent-IoT ===");
        String brokerUri = Constantes.MQTT_BROKER_URI;
        if (args.length > 0) {
            brokerUri = args[0];
        }

        LOGGER.info("Connexion au broker MQTT : {}", brokerUri);
        ExecutorService executor = Executors.newFixedThreadPool(Constantes.PIECES.size());
        List<CapteurSimulateur> simulateurs = new ArrayList<>();

        for (String piece : Constantes.PIECES) {
            CapteurSimulateur sim = new CapteurSimulateur(piece, brokerUri);
            simulateurs.add(sim);
            executor.submit(sim);
            LOGGER.info("Thread de simulation lancé pour la pièce : {}", piece);
        }

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            LOGGER.info("Arrêt des simulateurs de capteurs...");
            for (CapteurSimulateur sim : simulateurs) {
                sim.arreter();
            }
            executor.shutdownNow();
            LOGGER.info("Simulateurs arrêtés proprement.");
        }));
    }
}
