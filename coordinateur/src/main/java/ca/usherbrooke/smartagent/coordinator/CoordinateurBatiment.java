package ca.usherbrooke.smartagent.coordinator;

import ca.usherbrooke.smartagent.api.Constantes;
import ca.usherbrooke.smartagent.api.IAgentPiece;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.rmi.RemoteException;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Coordinateur central du bâtiment.
 * Se connecte à tous les agents de pièces via Java RMI (port 2199)
 * et applique la politique d'équilibrage thermique :
 * - Paires adjacentes surveillées : salleA–salleB et salleB–cuisine
 * - Si |tempA - tempB| > 4.0 °C, ajuste la consigne de la pièce la plus chaude.
 * - Tolérance aux pannes : capture les RemoteException sans interrompre le cycle global.
 */
public class CoordinateurBatiment {

    private static final Logger LOGGER = LoggerFactory.getLogger(CoordinateurBatiment.class);

    // Définition des paires adjacentes imposées par l'énoncé
    public record PairePieces(String piece1, String piece2) {}

    private final List<PairePieces> pairesAdjacentes = List.of(
            new PairePieces(Constantes.SALLE_A, Constantes.SALLE_B),
            new PairePieces(Constantes.SALLE_B, Constantes.CUISINE)
    );

    private final Map<String, IAgentPiece> agents = new HashMap<>();
    private final String hostRmi;
    private final int portRmi;
    private final OpenHabRestClient openHabClient;

    public CoordinateurBatiment() {
        this("localhost", Constantes.RMI_REGISTRY_PORT, new OpenHabRestClient());
    }

    public CoordinateurBatiment(String hostRmi, int portRmi) {
        this(hostRmi, portRmi, new OpenHabRestClient());
    }

    public CoordinateurBatiment(String hostRmi, int portRmi, OpenHabRestClient openHabClient) {
        this.hostRmi = hostRmi;
        this.portRmi = portRmi;
        this.openHabClient = openHabClient;
    }

    /**
     * Recherche et connecte les stubs RMI de tous les agents de pièces.
     */
    public void connecterAgents() {
        try {
            Registry registry = LocateRegistry.getRegistry(hostRmi, portRmi);
            for (String piece : Constantes.PIECES) {
                String rmiName = Constantes.getRmiName(piece);
                try {
                    IAgentPiece stub = (IAgentPiece) registry.lookup(rmiName);
                    agents.put(piece, stub);
                    LOGGER.info("Connecté au stub RMI de l'agent : '{}'", rmiName);
                } catch (Exception e) {
                    LOGGER.warn("Agent '{}' non disponible dans le registre RMI : {}", rmiName, e.getMessage());
                }
            }
        } catch (Exception e) {
            LOGGER.error("Impossible de contacter le registre RMI sur {}:{} : {}", hostRmi, portRmi, e.getMessage());
        }
    }

    /**
     * Cycle d'équilibrage thermique : vérifie chaque paire adjacente et prend les décisions d'ajustement.
     */
    public void equilibrerTemperatures() {
        LOGGER.info("--- Début du cycle d'équilibrage thermique ---");

        for (PairePieces paire : pairesAdjacentes) {
            String p1 = paire.piece1();
            String p2 = paire.piece2();

            IAgentPiece agent1 = getAgent(p1);
            IAgentPiece agent2 = getAgent(p2);

            if (agent1 == null || agent2 == null) {
                LOGGER.warn("[Paire {} - {}] Impossible d'équilibrer : au moins un agent est hors-ligne.", p1, p2);
                continue;
            }

            try {
                double t1 = agent1.getTemperature();
                double t2 = agent2.getTemperature();
                double diff = Math.abs(t1 - t2);

                LOGGER.info("[Paire {} - {}] Mesures : {} = {} °C, {} = {} °C | Écart = {} °C (Seuil = {} °C)",
                        p1, p2, p1, String.format(java.util.Locale.US, "%.1f", t1),
                        p2, String.format(java.util.Locale.US, "%.1f", t2),
                        String.format(java.util.Locale.US, "%.1f", diff),
                        Constantes.ECART_TEMPERATURE_MAX);

                if (diff > Constantes.ECART_TEMPERATURE_MAX) {
                    // Calcul de la consigne cible (température moyenne ciblée ou baisse de la pièce la plus chaude)
                    String piecePlusChaude = (t1 > t2) ? p1 : p2;
                    IAgentPiece agentPlusChaud = (t1 > t2) ? agent1 : agent2;
                    double consigneCible = (t1 + t2) / 2.0;

                    LOGGER.warn("[DÉCISION ÉQUILIBRAGE] Écart critique détecté ({} °C > {} °C). Ajustement consigne de {} à {} °C",
                            String.format(java.util.Locale.US, "%.1f", diff),
                            Constantes.ECART_TEMPERATURE_MAX,
                            piecePlusChaude,
                            String.format(java.util.Locale.US, "%.1f", consigneCible));

                    // Envoi de la commande via RMI
                    agentPlusChaud.setConsigneTemperature(consigneCible);
                    LOGGER.info("Commande RMI envoyée avec succès à {}", piecePlusChaude);

                    // Notification / Synchronisation avec openHAB via API REST (Semaine 3)
                    if (openHabClient != null) {
                        String openHabItem = getOpenHabThermostatItem(piecePlusChaude);
                        openHabClient.sendCommand(openHabItem, String.format(java.util.Locale.US, "%.1f", consigneCible));
                    }
                } else {
                    LOGGER.debug("[Paire {} - {}] Écart thermique acceptable.", p1, p2);
                }

            } catch (RemoteException e) {
                LOGGER.error("[TOLÉRANCE AUX PANNES] RemoteException lors de l'accès à la paire [{} - {}] : {}. Poursuite du cycle avec les autres agents.",
                        p1, p2, e.getMessage());
                // Invalide le cache pour tenter une reconnexion au prochain cycle
                agents.remove(p1);
                agents.remove(p2);
            }
        }
        LOGGER.info("--- Fin du cycle d'équilibrage ---");
    }

    private IAgentPiece getAgent(String piece) {
        if (!agents.containsKey(piece)) {
            // Tentative de reconnexion dynamique
            try {
                Registry registry = LocateRegistry.getRegistry(hostRmi, portRmi);
                IAgentPiece stub = (IAgentPiece) registry.lookup(Constantes.getRmiName(piece));
                agents.put(piece, stub);
            } catch (Exception ignored) {
                return null;
            }
        }
        return agents.get(piece);
    }

    public String getOpenHabThermostatItem(String piece) {
        if (Constantes.SALLE_A.equalsIgnoreCase(piece)) return "SalleA_Thermostat";
        if (Constantes.SALLE_B.equalsIgnoreCase(piece)) return "SalleB_Thermostat";
        if (Constantes.CUISINE.equalsIgnoreCase(piece)) return "Cuisine_Thermostat";
        return piece + "_Thermostat";
    }

    public Map<String, IAgentPiece> getAgents() {
        return agents;
    }

    public OpenHabRestClient getOpenHabClient() {
        return openHabClient;
    }
}
