package ca.usherbrooke.smartagent.agent;

import ca.usherbrooke.smartagent.api.Constantes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.util.ArrayList;
import java.util.List;

/**
 * Lanceur principal pour les serveurs RMI AgentPiece.
 * Démarre le registre RMI sur le port 2199 (si nécessaire),
 * instancie un AgentPiece pour chaque pièce (salleA, salleB, cuisine),
 * les enregistre sous les noms agent-salleA, agent-salleB, agent-cuisine,
 * et initialise leurs abonnements MQTT.
 */
public class AgentPieceMain {

    private static final Logger LOGGER = LoggerFactory.getLogger(AgentPieceMain.class);

    public static void main(String[] args) {
        LOGGER.info("=== Démarrage des serveurs RMI AgentPiece ===");
        String brokerUri = Constantes.MQTT_BROKER_URI;
        if (args.length > 0) {
            brokerUri = args[0];
        }

        try {
            // Création ou récupération du registre RMI sur le port 2199
            Registry registry;
            try {
                registry = LocateRegistry.createRegistry(Constantes.RMI_REGISTRY_PORT);
                LOGGER.info("Registre RMI créé avec succès sur le port {}.", Constantes.RMI_REGISTRY_PORT);
            } catch (Exception e) {
                LOGGER.info("Le registre RMI existe déjà sur le port {}, connexion en cours...", Constantes.RMI_REGISTRY_PORT);
                registry = LocateRegistry.getRegistry(Constantes.RMI_REGISTRY_PORT);
            }

            List<AgentPiece> agents = new ArrayList<>();

            for (String piece : Constantes.PIECES) {
                String rmiBindingName = Constantes.getRmiName(piece);
                AgentPiece agent = new AgentPiece(piece, brokerUri);

                // Enregistrement RMI
                registry.rebind(rmiBindingName, agent);
                LOGGER.info("Agent pour [{}] enregistré dans RMI sous le nom : '{}'", piece, rmiBindingName);

                // Connexion et abonnement MQTT
                try {
                    agent.demarrerMqtt();
                } catch (Exception mqttEx) {
                    LOGGER.warn("Attention: Mosquitto n'est peut-être pas démarré pour {}: {}", piece, mqttEx.getMessage());
                }

                agents.add(agent);
            }

            LOGGER.info("Tous les agents de pièces sont actifs et prêts ! (Appuyez sur Ctrl+C pour arrêter)");

            Registry finalRegistry = registry;
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                LOGGER.info("Arrêt des agents RMI...");
                for (String piece : Constantes.PIECES) {
                    try {
                        finalRegistry.unbind(Constantes.getRmiName(piece));
                    } catch (Exception ignored) {}
                }
                for (AgentPiece agent : agents) {
                    agent.arreter();
                }
                LOGGER.info("Agents RMI déconnectés proprement.");
            }));

        } catch (Exception e) {
            LOGGER.error("Erreur fatale lors du démarrage des agents RMI : {}", e.getMessage(), e);
        }
    }
}
