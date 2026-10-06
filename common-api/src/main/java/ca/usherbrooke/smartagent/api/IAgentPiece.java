package ca.usherbrooke.smartagent.api;

import java.rmi.Remote;
import java.rmi.RemoteException;

/**
 * Interface distante Java RMI pour la gestion d'une pièce intelligente.
 * Conforme aux spécifications du cours IFT605/IFT713 (Lecture 1 / Projet SmartAgent-IoT).
 * Chaque méthode distante propage obligatoirement une RemoteException.
 */
public interface IAgentPiece extends Remote {

    /**
     * Retourne la dernière température mesurée dans la pièce en degrés Celsius.
     * @return température (°C)
     * @throws RemoteException en cas d'erreur de communication RMI
     */
    double getTemperature() throws RemoteException;

    /**
     * Retourne la dernière luminosité mesurée dans la pièce en Lux.
     * @return luminosité (Lux)
     * @throws RemoteException en cas d'erreur de communication RMI
     */
    int getLuminosite() throws RemoteException;

    /**
     * Indique si la pièce est actuellement occupée par au moins une personne.
     * @return true si occupée, false sinon
     * @throws RemoteException en cas d'erreur de communication RMI
     */
    boolean isOccupee() throws RemoteException;

    /**
     * Modifie la consigne du thermostat de la pièce.
     * Cette méthode doit obligatoirement publier la consigne cible sur le topic MQTT
     * {@code batiment/{piece}/actuateur/thermostat}.
     *
     * @param t nouvelle consigne de température (°C)
     * @throws RemoteException en cas d'erreur de communication RMI
     */
    void setConsigneTemperature(double t) throws RemoteException;

    /**
     * Retourne le résumé d'état complet de la pièce sérialisé en JSON.
     * @return chaîne JSON représentant l'état courant
     * @throws RemoteException en cas d'erreur de communication RMI
     */
    String getEtat() throws RemoteException;

    /**
     * Méthode recommandée par l'énoncé pour obtenir le résumé JSON.
     * Déléguée par défaut à {@link #getEtat()}.
     * @return chaîne JSON
     * @throws RemoteException en cas d'erreur de communication RMI
     */
    default String getEtatJson() throws RemoteException {
        return getEtat();
    }
}
