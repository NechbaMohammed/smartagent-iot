package ca.usherbrooke.smartagent.coordinator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Client REST HTTP pour l'intégration avec openHAB 4.
 * Conforme aux objectifs de la Semaine 3 du projet SmartAgent-IoT :
 * "Intégrer le coordinateur RMI avec les règles openHAB (via REST API openHAB)".
 *
 * Utilise l'API standard java.net.http.HttpClient (Java 11+) sans dépendance externe lourde.
 */
public class OpenHabRestClient {

    private static final Logger LOGGER = LoggerFactory.getLogger(OpenHabRestClient.class);
    private static final String DEFAULT_OPENHAB_URL = "http://localhost:8080";
    private static final Duration TIMEOUT = Duration.ofSeconds(3);

    private final String baseUrl;
    private final HttpClient httpClient;

    public OpenHabRestClient() {
        this(DEFAULT_OPENHAB_URL);
    }

    public OpenHabRestClient(String baseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(TIMEOUT)
                .build();
    }

    /**
     * Récupère l'état courant d'un Item openHAB.
     * Exemple : GET /rest/items/SalleA_Temperature/state
     *
     * @param itemName nom de l'Item openHAB (ex: SalleA_Temperature)
     * @return chaîne représentant l'état (ex: "22.4", "UNDEF", "ON"), ou null en cas d'échec
     */
    public String getItemState(String itemName) {
        String url = baseUrl + "/rest/items/" + itemName + "/state";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(TIMEOUT)
                .header("Accept", "text/plain")
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return response.body().trim();
            } else {
                LOGGER.warn("[openHAB REST] Réponse inattendue {} pour l'item '{}' : {}",
                        response.statusCode(), itemName, response.body());
                return null;
            }
        } catch (IOException | InterruptedException e) {
            LOGGER.debug("[openHAB REST] Impossible de joindre openHAB sur {} : {}", url, e.getMessage());
            return null;
        }
    }

    /**
     * Envoie une commande à un Item openHAB.
     * Exemple : POST /rest/items/SalleA_Thermostat avec payload "18.0"
     *
     * @param itemName nom de l'Item
     * @param command valeur de la commande
     * @return true si la commande a été acceptée (HTTP 200/201/202), false sinon
     */
    public boolean sendCommand(String itemName, String command) {
        String url = baseUrl + "/rest/items/" + itemName;
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(TIMEOUT)
                .header("Content-Type", "text/plain")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(command))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            boolean success = (response.statusCode() >= 200 && response.statusCode() < 300);
            if (success) {
                LOGGER.info("[openHAB REST] Commande '{}' envoyée avec succès à l'item '{}' (HTTP {})",
                        command, itemName, response.statusCode());
            } else {
                LOGGER.warn("[openHAB REST] Échec envoi commande à '{}' : HTTP {}", itemName, response.statusCode());
            }
            return success;
        } catch (IOException | InterruptedException e) {
            LOGGER.debug("[openHAB REST] Erreur de communication lors de l'envoi à {} : {}", url, e.getMessage());
            return false;
        }
    }

    public String getBaseUrl() {
        return baseUrl;
    }
}
