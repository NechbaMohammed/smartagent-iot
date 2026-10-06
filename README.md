# 🏢 SmartAgent-IoT — Plateforme Domotique Multi-Agents

> **Cours :** IFT605 / IFT713 — Systèmes Répartis et Multi-Agents  
> **Institution :** Université de Sherbrooke — Faculté des sciences  
> **Enseignante :** Amal Ben Abdellah  
> **Auteurs :** Mohammed Nechba & Sasha Martineau
> **Technologies clés :** Java 21, Eclipse Mosquitto (MQTT), openHAB 4, Java RMI, Maven  

---

## 📑 Table des matières
1. [Vue d'ensemble et Objectifs du Projet](#1-vue-densemble-et-objectifs-du-projet)
2. [Architecture Globale du Système (Diagramme Mermaid)](#2-architecture-globale-du-système)
3. [Conception Détaillée des Composants](#3-conception-détaillée-des-composants)
4. [Diagramme de Classes UML (Mermaid)](#4-diagramme-de-classes-uml)
5. [Diagrammes de Séquence (Mermaid)](#5-diagrammes-de-séquence)
   - [Scénario 1 : Flux nominal des capteurs vers openHAB](#scénario-1--flux-nominal-des-capteurs)
   - [Scénario 2 : Règle domotique openHAB (Économie d'énergie)](#scénario-2--règle-domotique-openhab)
   - [Scénario 3 : Équilibrage thermique automatique par le Coordinateur](#scénario-3--équilibrage-thermique-par-le-coordinateur)
   - [Scénario 4 : Tolérance aux pannes (Timeout capteur & Crash RMI)](#scénario-4--tolérance-aux-pannes-et-résilience)
6. [Structure Modulaire du Répertoire Git](#6-structure-modulaire-du-répertoire-git)
7. [Feuille de Route & Étapes de Réalisation (S1, S2, S3)](#7-feuille-de-route--étapes-de-réalisation)
8. [Répartition des Tâches entre Binômes](#8-répartition-des-tâches-entre-binômes)
9. [Guide de Démarrage et Commandes d'Exécution](#9-guide-de-démarrage-et-commandes-dexécution)
10. [Grille d'Évaluation & Préparation de la Démonstration](#10-grille-dévaluation--préparation-de-la-démonstration)

---

## 1. Vue d'ensemble et Objectifs du Projet

Le projet **SmartAgent-IoT** a pour but d'implémenter l'infrastructure logicielle répartie d'un étage de bâtiment intelligent comportant **3 pièces** :
- `salleA`
- `salleB`
- `cuisine`

Chaque pièce comporte 3 capteurs physiques (température, luminosité, détection de présence/occupation) et 1 actuateur principal (thermostat de chauffage).

### Les deux paradigmes distribués exploités :
1. **Publish/Subscribe asynchrone (MQTT via Eclipse Mosquitto sur le port 1883) :**
   - Collecte massive et découplée des données capteurs.
   - Transmission des ordres de consigne aux actuateurs.
2. **Appel distant synchrone (Java RMI sur le port 2199) :**
   - Coopération pair-à-pair et supervision hiérarchique entre agents logiciels autonomes.
   - Consultation d'état atomique et pilotage par un coordinateur central.

---

## 2. Architecture Globale du Système

```mermaid
flowchart TB
    subgraph SENSORS["📡 Couche Capteurs Physiques (sensor-simulator)"]
        S_A["Capteurs Salle A<br/>• Température<br/>• Luminosité<br/>• Occupation"]
        S_B["Capteurs Salle B<br/>• Température<br/>• Luminosité<br/>• Occupation"]
        S_C["Capteurs Cuisine<br/>• Température<br/>• Luminosité<br/>• Occupation"]
    end

    subgraph BROKER["🔄 Middleware de Message (Eclipse Mosquitto : 1883)"]
        TOPIC_SENS["batiment/{piece}/capteur/{type}"]
        TOPIC_ACT["batiment/{piece}/actuateur/thermostat"]
    end

    subgraph AGENTS["🤖 Couche Multi-Agents RMI (agent-piece : port 2199)"]
        AG_A["AgentPiece A<br/>(Serveur RMI : agent-salleA)"]
        AG_B["AgentPiece B<br/>(Serveur RMI : agent-salleB)"]
        AG_C["AgentPiece Cuisine<br/>(Serveur RMI : agent-cuisine)"]
    end

    subgraph COORD["⚖️ Couche Supervision & Décision (coordinateur)"]
        CB["CoordinateurBatiment<br/>• Surveillance paires (A-B, B-C)<br/>• Équilibrage si écart > 4.0°C"]
    end

    subgraph OPENHAB["🏠 Supervision Domotique & UI (openHAB 4 : 8080)"]
        OH_THINGS["Things MQTT<br/>(Bridge + 3 Things)"]
        OH_ITEMS["Items<br/>(Temp, Lum, Occ, Thermostat)"]
        OH_RULES["Règles DSL<br/>• Eco si vide (18°C)<br/>• Alerte si > 26°C"]
        OH_UI["Dashboard Web UI"]
    end

    %% Flux de données
    S_A -->|publish toutes les 5s| TOPIC_SENS
    S_B -->|publish toutes les 5s| TOPIC_SENS
    S_C -->|publish toutes les 5s| TOPIC_SENS

    TOPIC_SENS -->|subscribe batiment/salleA/#| AG_A
    TOPIC_SENS -->|subscribe batiment/salleB/#| AG_B
    TOPIC_SENS -->|subscribe batiment/cuisine/#| AG_C

    TOPIC_SENS -->|stateTopic| OH_THINGS
    OH_THINGS --> OH_ITEMS
    OH_ITEMS --> OH_RULES
    OH_ITEMS --> OH_UI

    %% RMI Calls
    CB -->|RMI lookup port 2199| AG_A
    CB -->|RMI lookup port 2199| AG_B
    CB -->|RMI lookup port 2199| AG_C

    CB -.->|"setConsigneTemperature() si écart > 4°C"| AG_A
    CB -.->|"setConsigneTemperature() si écart > 4°C"| AG_B

    %% Command Topics
    AG_A -->|publish consigne| TOPIC_ACT
    AG_B -->|publish consigne| TOPIC_ACT
    AG_C -->|publish consigne| TOPIC_ACT
    OH_RULES -->|commandTopic| TOPIC_ACT
```

---

## 3. Conception Détaillée des Composants

### 3.1. Convention des Topics MQTT
Conformément aux exigences de l'énoncé, l'arborescence des topics est standardisée :
- **Mesures de capteurs (Publiées toutes les 5s) :**
  - `batiment/{piece}/capteur/temperature` (ex: `22.4`)
  - `batiment/{piece}/capteur/luminosite` (ex: `380`)
  - `batiment/{piece}/capteur/occupation` (`true` ou `false`)
- **Commandes d'actuateurs (Publiées sur décision RMI ou règle openHAB) :**
  - `batiment/{piece}/actuateur/thermostat` (ex: `19.0`)

### 3.2. Contrat RMI (`IAgentPiece`)
Chaque agent de pièce expose l'interface distante suivante :
```java
public interface IAgentPiece extends Remote {
    double getTemperature() throws RemoteException;
    int    getLuminosite() throws RemoteException;
    boolean isOccupee() throws RemoteException;
    void   setConsigneTemperature(double t) throws RemoteException;
    String getEtat() throws RemoteException;     // Format JSON
    String getEtatJson() throws RemoteException; // Alias explicite
}
```

### 3.3. Politique d'Équilibrage Thermique (Coordinateur)
- Le bâtiment est modélisé sous forme d'un graphe linéaire de pièces adjacentes :
  - Paire 1 : `salleA` ⟷ `salleB`
  - Paire 2 : `salleB` ⟷ `cuisine`
- **Règle :** Si $|\text{Temp}_1 - \text{Temp}_2| > 4.0^\circ\text{C}$ :
  1. Identifier la pièce la plus chaude.
  2. Calculer une consigne cible : $T_{\text{cible}} = \frac{T_1 + T_2}{2}$.
  3. Appeler `agentPlusChaud.setConsigneTemperature(T_cible)` via RMI.
  4. L'agent publie immédiatement cette consigne sur MQTT (`batiment/{piece}/actuateur/thermostat`).
  5. Journaliser l'événement (pièces, températures, décision, consigne).

### 3.4. Gestion de la Concurrence et Thread-Safety
- **Problématique :** Dans `AgentPiece`, le thread d'écoute réseau MQTT (callback Paho) écrit les données des capteurs, tandis que les threads du pool RMI lisent ces données simultanément.
- **Solution :** Utilisation de variables primitives déclarées `volatile` (`temperature`, `luminosite`, `occupation`, `consigneThermostat`) pour garantir la visibilité mémoire immédiate entre threads sans bloquer les performances.

---

## 4. Diagramme de Classes UML

```mermaid
classDiagram
    direction TB

    %% Module common-api
    class Remote {
        <<interface>>
    }

    class IAgentPiece {
        <<interface>>
        +getTemperature() double
        +getLuminosite() int
        +isOccupee() boolean
        +setConsigneTemperature(double t) void
        +getEtat() String
        +getEtatJson() String
    }

    class Constantes {
        <<utility>>
        +String MQTT_BROKER_URI
        +int RMI_REGISTRY_PORT
        +String SALLE_A
        +String SALLE_B
        +String CUISINE
        +double ECART_TEMPERATURE_MAX
        +int TIMEOUT_CAPTEUR_SECONDES
        +topicCapteur(piece, type)$ String
        +topicActuateur(piece, type)$ String
    }

    class EtatPieceDto {
        -String piece
        -double temperature
        -int luminosite
        -boolean occupation
        -double consigneThermostat
        -String dernierMessageUtc
        -boolean enTimeout
        +toJson() String
        +fromJson(String json)$ EtatPieceDto
    }

    %% Module sensor-simulator
    class Runnable {
        <<interface>>
    }

    class CapteurSimulateur {
        -String piece
        -MqttClient client
        -double currentTemp
        -int currentLum
        -boolean currentOccupation
        +run() void
        +publishTemp() void
        +publishLuminosite() void
        +publishOccupation() void
        +arreter() void
    }

    class SimulateurMain {
        +main(String[] args)$ void
    }

    %% Module agent-piece
    class UnicastRemoteObject {
    }

    class AgentPiece {
        -String nomPiece
        -double temperature
        -int luminosite
        -boolean occupation
        -double consigneThermostat
        -long dernierMessageTimestampMs
        -MqttClient mqttClient
        +demarrerMqtt() void
        +isEnTimeout() boolean
        +setConsigneTemperature(double t) void
        +getEtat() String
    }

    class AgentPieceMain {
        +main(String[] args)$ void
    }

    %% Module coordinateur
    class CoordinateurBatiment {
        -Map agents
        -List pairesAdjacentes
        +connecterAgents() void
        +equilibrerTemperatures() void
    }

    class CoordinateurMain {
        +main(String[] args)$ void
    }

    %% Relations d'héritage et réalisation
    Remote <|-- IAgentPiece
    UnicastRemoteObject <|-- AgentPiece
    IAgentPiece <|.. AgentPiece
    Runnable <|.. CapteurSimulateur

    %% Dépendances entre modules
    AgentPiece ..> Constantes : utilise
    AgentPiece ..> EtatPieceDto : sérialise
    CapteurSimulateur ..> Constantes : utilise
    CoordinateurBatiment ..> IAgentPiece : RMI invoke
    CoordinateurBatiment ..> Constantes : seuils

    SimulateurMain ..> CapteurSimulateur : lance
    AgentPieceMain ..> AgentPiece : RMI registry
    CoordinateurMain ..> CoordinateurBatiment : supervise
```

---

## 5. Diagrammes de Séquence

### Scénario 1 : Flux nominal des capteurs
Ce diagramme illustre la publication périodique des données capteurs et leur propagation vers l'Agent RMI et openHAB.

```mermaid
sequenceDiagram
    autonumber
    actor Minuterie as Horloge (5s)
    participant Sim as CapteurSimulateur (salleA)
    participant MQTT as Broker Mosquitto (1883)
    participant Agent as AgentPiece (salleA)
    participant OH as openHAB 4 UI

    Minuterie->>Sim: Déclenchement du pas (5000 ms)
    Sim->>Sim: Calcule variations (temp, lum, occ)
    Sim->>MQTT: PUBLISH batiment/salleA/capteur/temperature ("22.4")
    Sim->>MQTT: PUBLISH batiment/salleA/capteur/luminosite ("380")
    Sim->>MQTT: PUBLISH batiment/salleA/capteur/occupation ("true")

    par Réception par Agent RMI
        MQTT->>Agent: MESSAGE batiment/salleA/capteur/#
        Agent->>Agent: Met à jour champs volatiles (temperature=22.4, etc.)
        Agent->>Agent: Reset timestamp dernier message
    and Réception par openHAB
        MQTT->>OH: MESSAGE batiment/salleA/capteur/#
        OH->>OH: Met à jour Items (SalleA_Temperature)
        OH->>OH: Rafraîchit Dashboard Web
    end
```

---

### Scénario 2 : Règle domotique openHAB
Ce diagramme montre comment openHAB applique automatiquement une politique d'économie d'énergie dès qu'une pièce devient inoccupée.

```mermaid
sequenceDiagram
    autonumber
    participant Sim as CapteurSimulateur (salleA)
    participant MQTT as Broker Mosquitto (1883)
    participant OH as openHAB (Rules Engine)
    participant Act as Actuateur Thermostat

    Sim->>MQTT: PUBLISH batiment/salleA/capteur/occupation ("false")
    MQTT->>OH: Mise à jour Item SalleA_Occupation = OFF
    Note over OH: Règle DSL déclenchée :<br/>"Economie energie salleA"
    OH->>MQTT: PUBLISH batiment/salleA/actuateur/thermostat ("18.0")
    MQTT->>Act: Réception consigne 18°C
    Note over Act: Le thermostat réduit la puissance
```

---

### Scénario 3 : Équilibrage thermique par le Coordinateur
Ce diagramme détaille la décision du coordinateur central qui détecte un écart excessif ($> 4^\circ\text{C}$) entre deux pièces voisines.

```mermaid
sequenceDiagram
    autonumber
    participant Coord as CoordinateurBatiment
    participant Reg as Registre RMI (2199)
    participant AgA as AgentPiece (salleA)
    participant AgB as AgentPiece (salleB)
    participant MQTT as Broker Mosquitto (1883)

    Coord->>Reg: lookup("agent-salleA") & lookup("agent-salleB")
    Reg-->>Coord: Stubs RMI retournés

    Note over Coord: Boucle d'équilibrage périodique (10s)
    Coord->>AgA: RMI call: getTemperature()
    AgA-->>Coord: 25.5 °C
    Coord->>AgB: RMI call: getTemperature()
    AgB-->>Coord: 19.0 °C

    Note over Coord: Écart = 25.5 - 19.0 = 6.5 °C > 4.0 °C !<br/>Calcul consigne cible = (25.5+19.0)/2 = 22.2 °C
    Coord->>AgA: RMI call: setConsigneTemperature(22.2)
    AgA->>MQTT: PUBLISH batiment/salleA/actuateur/thermostat ("22.2")
    Note over Coord: Journalise l'ajustement dans les logs
```

---

### Scénario 4 : Tolérance aux pannes et résilience
Ce diagramme illustre le comportement du système lors de deux types de défaillances prévues par l'énoncé : coupure d'un capteur MQTT et plantage d'un agent RMI.

```mermaid
sequenceDiagram
    autonumber
    participant SimA as Simulateur Salle A
    participant AgA as AgentPiece Salle A
    participant Coord as CoordinateurBatiment
    participant OH as openHAB

    Note over SimA: Panne réseau ou arrêt du capteur
    SimA--xAgA: Aucun message MQTT envoyé

    Note over AgA: 30 secondes s'écoulent sans message
    Coord->>AgA: RMI call: getEtat()
    Note over AgA: isEnTimeout() == true
    AgA-->>Coord: JSON (enTimeout=true, dernière valeur connue)
    Coord->>Coord: Journalise avertissement : Capteur Salle A en timeout !

    Note over OH: openHAB n'a pas reçu de mise à jour
    OH->>OH: Passe l'Item SalleA_Temperature à UNDEF

    Note over AgA: Crash inopiné du processus AgentPiece A
    Coord->>AgA: RMI call: getTemperature()
    AgA--xCoord: RemoteException (Connexion refusée)
    Note over Coord: Capture RemoteException dans le try/catch !<br/>Coordinateur NE CRASHE PAS.<br/>Poursuit l'équilibrage avec Salle B et Cuisine.
```

---

## 6. Structure Modulaire du Répertoire Git

```text
smartagent-iot/
├── pom.xml                               <-- POM Parent (Java 21, dépendances communes)
├── .gitignore                            <-- Exclusion target/, .idea, logs
├── README.md                             <-- Conception complète & guide
│
├── common-api/                           <-- Contrat d'interface et constantes partagées
│   ├── pom.xml
│   └── src/main/java/ca/usherbrooke/smartagent/api/
│       ├── IAgentPiece.java              <-- Interface RMI distante
│       ├── Constantes.java               <-- Ports, noms, topics MQTT, seuils
│       └── EtatPieceDto.java             <-- Sérialisation JSON et DTO
│
├── sensor-simulator/                     <-- Simulateur de capteurs MQTT
│   ├── pom.xml
│   └── src/main/java/ca/usherbrooke/smartagent/sensor/
│       ├── CapteurSimulateur.java        <-- Générateur de flux (temp, lum, occ)
│       └── SimulateurMain.java           <-- Lance les 3 threads de pièces
│
├── agent-piece/                          <-- Agents de pièces RMI
│   ├── pom.xml
│   └── src/main/java/ca/usherbrooke/smartagent/agent/
│       ├── AgentPiece.java               <-- Serveur RMI + client MQTT
│       └── AgentPieceMain.java           <-- Registre RMI (2199) + 3 agents
│
├── coordinateur/                         <-- Super-agent central
│   ├── pom.xml
│   └── src/main/java/ca/usherbrooke/smartagent/coordinator/
│       ├── CoordinateurBatiment.java     <-- Algorithme d'équilibrage (>4°C)
│       └── CoordinateurMain.java         <-- Boucle de supervision
│
├── openhab-config/                       <-- Configurations openHAB 4
│   ├── things/batiment.things            <-- Bridge Mosquitto + 3 Things
│   ├── items/batiment.items              <-- Items associés aux canaux MQTT
│   └── rules/batiment.rules              <-- Règles DSL (éco énergie + alerte)
│
├── scripts/                              <-- Automatisation de lancement
│   ├── start-all.ps1                     <-- Démarre toute la plateforme
│   └── stop-all.ps1                      <-- Arrête les processus
│
└── doc/                                  <-- Documentation pour le rapport final
    └── diagrams/                         <-- Diagrammes exportés
```

---

## 7. Feuille de Route & Étapes de Réalisation

### 📅 Semaine 1 : Infrastructure IoT & openHAB
1. **Étape 1.1 :** Démarrer le broker local Mosquitto (`mosquitto -v` sur le port 1883).
2. **Étape 1.2 :** Compiler et tester `sensor-simulator`. Vérifier les 9 flux MQTT avec `mosquitto_sub -t "batiment/#" -v`.
3. **Étape 1.3 :** Copier les fichiers `openhab-config/` dans le répertoire openHAB (`conf/things`, `conf/items`, `conf/rules`).
4. **Étape 1.4 :** Valider dans l'interface openHAB que les valeurs s'actualisent en temps réel et que la règle d'économie d'énergie se déclenche quand l'occupation passe à `OFF`.

### 📅 Semaine 2 : Agents Distribués Java RMI
1. **Étape 2.1 :** Compiler `common-api` et vérifier l'interface `IAgentPiece`.
2. **Étape 2.2 :** Implémenter et lancer `agent-piece` sur le port RMI 2199. Vérifier avec un test client que les méthodes `getTemperature()`, `getLuminosite()`, `isOccupee()` retournent les valeurs lues sur MQTT.
3. **Étape 2.3 :** Vérifier que `setConsigneTemperature()` publie bien sur `batiment/{piece}/actuateur/thermostat`.
4. **Étape 2.4 :** Lancer `coordinateur`. Créer un écart volontaire $> 4^\circ\text{C}$ (par exemple en forçant une valeur) et observer l'ajustement automatique dans les logs.

### 📅 Semaine 3 : Intégration, Tests & Rapport
1. **Étape 3.1 :** Tester le timeout de 30 secondes en coupant un simulateur de pièce et vérifier l'affichage `UNDEF` dans openHAB.
2. **Étape 3.2 :** Simuler le crash d'un agent RMI et vérifier que le coordinateur capture `RemoteException` sans s'arrêter.
3. **Étape 3.3 :** Rédiger le rapport de 8 à 12 pages (en réutilisant ce README, les diagrammes Mermaid et les explications d'architecture).
4. **Étape 3.4 :** Répéter le script de démonstration de 10 minutes.

---

## 8. Répartition des Tâches entre Binômes

Pour maximiser l'efficacité sans conflit Git :

| Rôle | Étudiant Responsable | Tâches Assignées |
| :--- | :--- | :--- |
| **Binôme A** | **Responsable IoT & openHAB** | • Module `sensor-simulator` (génération réaliste des 9 flux MQTT).<br>• Configuration openHAB (`batiment.things`, `batiment.items`, `batiment.rules`).<br>• Vérification de l'UI openHAB et des règles DSL d'automatisation. |
| **Binôme B** | **Responsable RMI & Coordination** | • Module `common-api` (`IAgentPiece`, `EtatPieceDto`, `Constantes`).<br>• Module `agent-piece` (Serveur RMI, binding port 2199, abonné MQTT).<br>• Module `coordinateur` (Algorithme d'équilibrage thermique, paires adjacentes). |
| **En commun** | **Mohammed & Binôme** | • Tests de tolérance aux pannes (timeout 30s, crash agent RMI).<br>• Tests unitaires JUnit.<br>• Rédaction du rapport PDF final (8-12 pages).<br>• Démonstration live de 10 min. |

---

## 9. Guide de Démarrage et Commandes d'Exécution

### Prérequis
- **Java 21** (`java -version`)
- **Maven 3.8+** (`mvn -version`)
- **Eclipse Mosquitto** (`mosquitto -v`)
- **openHAB 4** (optionnel pour les tests Java purs, requis pour l'UI et les règles DSL)

### Compilation globale du projet
Depuis la racine `smartagent-iot/` :
```bash
mvn clean package
```

### Lancement étape par étape

#### 1. Démarrer le Broker MQTT
```bash
mosquitto -v
```

#### 2. Lancer les Agents RMI
```bash
mvn -pl agent-piece exec:java -Dexec.mainClass="ca.usherbrooke.smartagent.agent.AgentPieceMain"
```

#### 3. Lancer le Simulateur de Capteurs
```bash
mvn -pl sensor-simulator exec:java -Dexec.mainClass="ca.usherbrooke.smartagent.sensor.SimulateurMain"
```

#### 4. Lancer le Coordinateur Central
```bash
mvn -pl coordinateur exec:java -Dexec.mainClass="ca.usherbrooke.smartagent.coordinator.CoordinateurMain"
```

#### 5. Script PowerShell automatique (Windows)
Pour tout démarrer en une seule commande :
```powershell
.\scripts\start-all.ps1
```

---

## 10. Grille d'Évaluation & Préparation de la Démonstration

### Barème (/100 points)
- **MQTT — Pub/Sub (15 pts) :** Capteurs publient correctement, agents s'abonnent et lisent les valeurs.
- **openHAB Things & Items (10 pts) :** Things MQTT + Items correctement configurés, mesures visibles dans l'UI.
- **openHAB Rules (10 pts) :** $\ge 2$ règles DSL fonctionnelles (économie énergie + alerte).
- **Java RMI (20 pts) :** Interface distante + 3 serveurs AgentPiece enregistrés dans le registre RMI (port 2199).
- **Coordinateur (10 pts) :** Politique d'équilibrage thermique correcte via RMI ($> 4^\circ\text{C}$).
- **Tolérance aux pannes (10 pts) :** Gestion du timeout 30s MQTT + reprise sur erreur `RemoteException`.
- **Rapport PDF (15 pts) :** Architecture claire, diagrammes, justification des choix (8–12 pages).
- **Démonstration (10 pts) :** Maîtrise, fluidité, réponse aux questions pendant les 10 minutes.

### Script de la Démonstration (10 minutes chrono)
1. **[0-2 min] Lancement :** Démarrer Mosquitto, les 3 agents RMI et le coordinateur.
2. **[2-3 min] Visualisation openHAB :** Montrer les mesures en direct dans l'UI web openHAB.
3. **[3-5 min] Automatisation openHAB :** Simuler l'inoccupation d'une pièce $\rightarrow$ la règle DSL baisse le thermostat à 18°C.
4. **[5-7 min] Équilibrage Coordinateur :** Créer un déséquilibre $> 4^\circ\text{C}$ $\rightarrow$ le coordinateur détecte et compense automatiquement.
5. **[7-9 min] Tolérance aux pannes :** Couper un flux MQTT (timeout 30s et état UNDEF) puis tuer un agent RMI (le coordinateur continue son cycle sans crasher).
6. **[9-10 min] Questions :** Réponses aux questions de l'enseignante.
