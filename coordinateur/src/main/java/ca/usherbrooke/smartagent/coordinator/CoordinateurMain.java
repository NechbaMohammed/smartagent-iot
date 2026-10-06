package ca.usherbrooke.smartagent.coordinator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Lanceur principal pour le Coordinateur central du bâtiment.
 * Se connecte aux agents via RMI et exécute périodiquement l'algorithme d'équilibrage thermique.
 */
public class CoordinateurMain {

    private static final Logger LOGGER = LoggerFactory.getLogger(CoordinateurMain.class);
    private static final long PERIODE_EQUILIBRAGE_MS = 10000L; // 10 secondes

    public static void main(String[] args) {
        LOGGER.info("=== Démarrage du Coordinateur Central SmartAgent-IoT ===");

        CoordinateurBatiment coordinateur = new CoordinateurBatiment();
        coordinateur.connecterAgents();

        // Boucle périodique d'équilibrage
        Thread coordinatorThread = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    coordinateur.equilibrerTemperatures();
                    Thread.sleep(PERIODE_EQUILIBRAGE_MS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                } catch (Exception e) {
                    LOGGER.error("Erreur inattendue dans la boucle du coordinateur : {}", e.getMessage(), e);
                }
            }
        }, "Coordinator-Loop");

        coordinatorThread.start();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            LOGGER.info("Arrêt du coordinateur...");
            coordinatorThread.interrupt();
            LOGGER.info("Coordinateur arrêté.");
        }));
    }
}
