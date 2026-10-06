package ca.usherbrooke.smartagent.agent;

import ca.usherbrooke.smartagent.api.Constantes;
import ca.usherbrooke.smartagent.api.EtatPieceDto;
import ca.usherbrooke.smartagent.api.IAgentPiece;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.rmi.RemoteException;
import java.rmi.server.UnicastRemoteObject;
import java.time.Instant;
import java.util.Locale;

/**
 * Implémentation du serveur RMI représentant une pièce intelligente.
 * - S'abonne aux flux MQTT de sa pièce : batiment/{piece}/capteur/#
 * - Met à jour son état interne de manière thread-safe (volatile)
 * - Expose ses méthodes via l'interface distante IAgentPiece
 * - Permet d'ajuster le thermostat via setConsigneTemperature(), qui publie sur MQTT.
 */
public class AgentPiece extends UnicastRemoteObject implements IAgentPiece {

    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = LoggerFactory.getLogger(AgentPiece.class);

    private final String nomPiece;
    private final String brokerUri;

    // État thread-safe partagé entre callback MQTT et appels distants RMI
    private volatile double temperature = 20.0;
    private volatile int luminosite = 300;
    private volatile boolean occupation = false;
    private volatile double consigneThermostat = 20.0;
    private volatile long dernierMessageTimestampMs = System.currentTimeMillis();

    private transient MqttClient mqttClient;

    public AgentPiece(String nomPiece, String brokerUri) throws RemoteException {
        super();
        this.nomPiece = nomPiece;
        this.brokerUri = brokerUri;
    }

    public void demarrerMqtt() throws MqttException {
        String clientId = "Agent-" + nomPiece + "-" + System.currentTimeMillis();
        this.mqttClient = new MqttClient(brokerUri, clientId, null);
        MqttConnectOptions opts = new MqttConnectOptions();
        opts.setAutomaticReconnect(true);
        opts.setCleanSession(true);

        mqttClient.connect(opts);
        LOGGER.info("[Agent {}] Connecté à MQTT ({})", nomPiece, brokerUri);

        String topicAbonnement = Constantes.topicWildcardPiece(nomPiece);
        mqttClient.subscribe(topicAbonnement, (topic, msg) -> {
            traiterMessageMqtt(topic, new String(msg.getPayload(), StandardCharsets.UTF_8));
        });
        LOGGER.info("[Agent {}] Abonné à {}", nomPiece, topicAbonnement);
    }

    private void traiterMessageMqtt(String topic, String payload) {
        dernierMessageTimestampMs = System.currentTimeMillis();
        try {
            if (topic.endsWith(Constantes.TYPE_TEMPERATURE)) {
                this.temperature = Double.parseDouble(payload.trim());
                LOGGER.debug("[Agent {}] Température reçue : {} °C", nomPiece, this.temperature);
            } else if (topic.endsWith(Constantes.TYPE_LUMINOSITE)) {
                this.luminosite = Integer.parseInt(payload.trim());
                LOGGER.debug("[Agent {}] Luminosité reçue : {} Lux", nomPiece, this.luminosite);
            } else if (topic.endsWith(Constantes.TYPE_OCCUPATION)) {
                this.occupation = Boolean.parseBoolean(payload.trim());
                LOGGER.debug("[Agent {}] Occupation reçue : {}", nomPiece, this.occupation);
            }
        } catch (NumberFormatException e) {
            LOGGER.warn("[Agent {}] Donnée MQTT invalide sur {} : {}", nomPiece, topic, payload);
        }
    }

    // === IMPLÉMENTATION DES MÉTHODES RMI DISTANTES ===

    @Override
    public double getTemperature() throws RemoteException {
        verifierTimeout();
        return this.temperature;
    }

    @Override
    public int getLuminosite() throws RemoteException {
        verifierTimeout();
        return this.luminosite;
    }

    @Override
    public boolean isOccupee() throws RemoteException {
        verifierTimeout();
        return this.occupation;
    }

    @Override
    public void setConsigneTemperature(double t) throws RemoteException {
        this.consigneThermostat = t;
        LOGGER.info("[Agent {}] Nouvelle consigne reçue via RMI : {} °C", nomPiece, t);

        // Publication de la consigne sur MQTT pour l'actuateur
        String topicActuateur = Constantes.topicActuateur(nomPiece, Constantes.TYPE_THERMOSTAT);
        String payload = String.format(Locale.US, "%.1f", t);
        publierMqtt(topicActuateur, payload);
    }

    @Override
    public String getEtat() throws RemoteException {
        boolean timeout = isEnTimeout();
        EtatPieceDto dto = new EtatPieceDto(nomPiece, temperature, luminosite, occupation, consigneThermostat);
        dto.setEnTimeout(timeout);
        dto.setDernierMessageUtc(Instant.ofEpochMilli(dernierMessageTimestampMs).toString());
        return dto.toJson();
    }

    private void publierMqtt(String topic, String message) {
        try {
            if (mqttClient != null && mqttClient.isConnected()) {
                MqttMessage msg = new MqttMessage(message.getBytes(StandardCharsets.UTF_8));
                msg.setQos(1); // QoS 1 pour consigne actuateur
                mqttClient.publish(topic, msg);
                LOGGER.info("[Agent {}] Publié consigne sur {} : {}", nomPiece, topic, message);
            } else {
                LOGGER.warn("[Agent {}] Impossible de publier la consigne : client MQTT déconnecté.", nomPiece);
            }
        } catch (MqttException e) {
            LOGGER.error("[Agent {}] Erreur publication MQTT de consigne : {}", nomPiece, e.getMessage());
        }
    }

    public boolean isEnTimeout() {
        long deltaSec = (System.currentTimeMillis() - dernierMessageTimestampMs) / 1000;
        return deltaSec >= Constantes.TIMEOUT_CAPTEUR_SECONDES;
    }

    private void verifierTimeout() {
        if (isEnTimeout()) {
            LOGGER.warn("[Agent {}] ATTENTION : Capteurs en TIMEOUT (> 30s sans message) !", nomPiece);
        }
    }

    public void arreter() {
        try {
            if (mqttClient != null && mqttClient.isConnected()) {
                mqttClient.disconnect();
                mqttClient.close();
            }
        } catch (MqttException e) {
            LOGGER.error("Erreur déconnexion agent MQTT : {}", e.getMessage());
        }
    }

    public String getNomPiece() {
        return nomPiece;
    }
}
