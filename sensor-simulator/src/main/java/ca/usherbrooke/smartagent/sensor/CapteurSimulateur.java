package ca.usherbrooke.smartagent.sensor;

import ca.usherbrooke.smartagent.api.Constantes;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Random;

/**
 * Simulateur de capteurs pour une pièce donnée.
 * Publie toutes les 5 secondes les 3 mesures sur le broker MQTT :
 * - batiment/{piece}/capteur/temperature (ex: 21.4)
 * - batiment/{piece}/capteur/luminosite  (ex: 380)
 * - batiment/{piece}/capteur/occupation  (ex: true)
 */
public class CapteurSimulateur implements Runnable {

    private static final Logger LOGGER = LoggerFactory.getLogger(CapteurSimulateur.class);

    private final String piece;
    private final String brokerUri;
    private final Random rnd = new Random();
    private volatile boolean running = true;
    private MqttClient client;

    // Plages réalistes simulées
    private double currentTemp;
    private int currentLum;
    private boolean currentOccupation;

    public CapteurSimulateur(String piece, String brokerUri) {
        this.piece = piece;
        this.brokerUri = brokerUri;
        // Initialisation réaliste selon la pièce
        this.currentTemp = 20.0 + rnd.nextDouble() * 3.0; // 20.0 - 23.0 °C
        this.currentLum = 300 + rnd.nextInt(200);         // 300 - 500 Lux
        this.currentOccupation = rnd.nextBoolean();
    }

    public void initClient() throws MqttException {
        String clientId = "Simulator-" + piece + "-" + System.currentTimeMillis();
        this.client = new MqttClient(brokerUri, clientId, null);
        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);
        options.setConnectionTimeout(10);
        try {
            client.connect(options);
        } catch (MqttException e) {
            // Libere les ressources du client rate avant une nouvelle tentative
            try { client.close(); } catch (MqttException ignored) { }
            client = null;
            throw e;
        }
        LOGGER.info("[{}] Connecté au broker MQTT ({})", piece, brokerUri);
    }

    @Override
    public void run() {
        try {
            // Tolérance au démarrage : si le broker n'est pas encore prêt, on réessaie toutes les 3 s
            while (running && !Thread.currentThread().isInterrupted()
                    && (client == null || !client.isConnected())) {
                try {
                    initClient();
                } catch (MqttException e) {
                    LOGGER.warn("[{}] Broker MQTT indisponible ({}). Nouvelle tentative dans 3 s...", piece, e.getMessage());
                    Thread.sleep(3000);
                }
            }

            while (running && !Thread.currentThread().isInterrupted()) {
                publishTemp();
                publishLuminosite();
                publishOccupation();

                Thread.sleep(Constantes.PERIODE_SIMULATION_MS);
            }
        } catch (InterruptedException e) {
            LOGGER.info("[{}] Simulateur interrompu.", piece);
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            LOGGER.error("[{}] Erreur dans la boucle de simulation : {}", piece, e.getMessage(), e);
        } finally {
            deconnecter();
        }
    }

    public void publishTemp() {
        // Variation progressive réaliste (-0.3 à +0.3 °C)
        double delta = (rnd.nextDouble() - 0.5) * 0.6;
        currentTemp = Math.max(16.0, Math.min(28.0, currentTemp + delta));
        String val = String.format(Locale.US, "%.1f", currentTemp);
        publish(Constantes.topicCapteur(piece, Constantes.TYPE_TEMPERATURE), val);
    }

    public void publishLuminosite() {
        // Variation progressive (-30 à +30 Lux)
        int delta = rnd.nextInt(61) - 30;
        currentLum = Math.max(50, Math.min(1000, currentLum + delta));
        publish(Constantes.topicCapteur(piece, Constantes.TYPE_LUMINOSITE), String.valueOf(currentLum));
    }

    public void publishOccupation() {
        // Changement d'état occasionnel (15% de chance)
        if (rnd.nextDouble() < 0.15) {
            currentOccupation = !currentOccupation;
        }
        publish(Constantes.topicCapteur(piece, Constantes.TYPE_OCCUPATION), String.valueOf(currentOccupation));
    }

    private void publish(String topic, String message) {
        try {
            if (client != null && client.isConnected()) {
                MqttMessage mqttMsg = new MqttMessage(message.getBytes(StandardCharsets.UTF_8));
                mqttMsg.setQos(0);
                client.publish(topic, mqttMsg);
                LOGGER.debug("Publié -> {} : {}", topic, message);
            }
        } catch (MqttException e) {
            LOGGER.warn("[{}] Échec de publication sur {} : {}", piece, topic, e.getMessage());
        }
    }

    public void arreter() {
        this.running = false;
        deconnecter();
    }

    private void deconnecter() {
        try {
            if (client != null && client.isConnected()) {
                client.disconnect();
                client.close();
                LOGGER.info("[{}] Déconnecté de MQTT.", piece);
            }
        } catch (MqttException e) {
            LOGGER.error("Erreur lors de la déconnexion : {}", e.getMessage());
        }
    }

    // Accesseurs pour tests
    public double getCurrentTemp() { return currentTemp; }
    public void setCurrentTemp(double t) { this.currentTemp = t; }
    public int getCurrentLum() { return currentLum; }
    public boolean isCurrentOccupation() { return currentOccupation; }
}
