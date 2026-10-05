# Restful-Booker – testscenario's per user story

De Postman collection (`Restful-Booker - Example Solution.postman_collection.json`) bevat per user story
een folder met positieve en negatieve scenario's. Hieronder staan ze in Gherkin (Nederlandse keywords).

## Uitvoeren

| Doel | Hoe |
|------|-----|
| Lokaal | `npm start`, daarna `newman run "solution/Restful-Booker - Example Solution.postman_collection.json" -e solution/restful-booker.postman_environment.json` |
| Tegen testomgeving | `newman run ... -e solution/restful-booker.postman_environment.json --env-var baseUrl=https://restful-broker-tst.duckdns.org` |
| CI, lokale app starten | workflow `.github/workflows/postman.yml` (bij elke push/PR, publiceert rapport op GitHub Pages) |
| CI, bestaande omgeving | workflow `.github/workflows/postman-remote.yml` (handmatig, geen deploy; `base_url` is instelbaar) |

Het rapport (`index.html` met alle scenario's + `report.html` met het volledige Newman-rapport) wordt als artifact `newman-report` / `newman-report-remote` geüpload.

Tags: `@positief`, `@negatief`, `@edgecase`. `@bug` markeert een scenario dat het gewenste gedrag toetst en faalt zolang de API afwijkt.

---

## US1 – Health check

```gherkin
# language: nl
Functionaliteit: Health check
  Als beheerder wil ik controleren dat de server draait

  @positief
  Scenario: Server is bereikbaar
    Wanneer ik GET /ping aanroep
    Dan is de status 201
```

## US2 – Nieuwe gebruiker registreren

```gherkin
# language: nl
Functionaliteit: Gebruiker registreren
  Als gebruiker wil ik me registreren zodat ik een token kan aanvragen

  @positief
  Scenario: Registreren met unieke username en geldig wachtwoord
    Wanneer ik POST /register aanroep met een unieke username en een wachtwoord van minstens 6 tekens
    Dan is de status 200
    En bevat de response success: true

  @negatief
  Scenario: Username bestaat al
    Gegeven er is al een gebruiker geregistreerd
    Wanneer ik POST /register aanroep met dezelfde username
    Dan is de status 400
    En is de reason "Username already exists"

  @negatief
  Scenario: Wachtwoord is te kort
    Wanneer ik POST /register aanroep met een wachtwoord van minder dan 6 tekens
    Dan is de status 400
    En is de reason "Password must be at least 6 characters long"

  @negatief
  Scenario: Wachtwoord ontbreekt
    Wanneer ik POST /register aanroep zonder password
    Dan is de status 400
    En is de reason "Username and password are required"

  @negatief
  Scenario: Username ontbreekt
    Wanneer ik POST /register aanroep zonder username
    Dan is de status 400
```

## US3 – Authenticatie

```gherkin
# language: nl
Functionaliteit: Authenticatie
  Als geregistreerde gebruiker wil ik een token ophalen om boekingen te wijzigen

  Achtergrond:
    Gegeven er is een geregistreerde gebruiker

  @positief
  Scenario: Token aanvragen met juiste credentials
    Wanneer ik POST /auth aanroep met de juiste username en het juiste wachtwoord
    Dan is de status 200
    En bevat de response een token

  @negatief
  Scenario: Fout wachtwoord
    Wanneer ik POST /auth aanroep met een fout wachtwoord
    Dan is de status 200
    En bevat de response geen token
    En is de reason "Bad credentials"

  @negatief
  Scenario: Onbekende gebruiker
    Wanneer ik POST /auth aanroep met een username die niet bestaat
    Dan is de status 200
    En bevat de response geen token
```

## US4 – Booking-ids opvragen

```gherkin
# language: nl
Functionaliteit: Booking-ids opvragen
  Als gebruiker wil ik boekingen kunnen opvragen en filteren

  Achtergrond:
    Gegeven er bestaat een booking met een unieke firstname

  @positief
  Scenario: Alle booking-ids opvragen
    Wanneer ik GET /booking aanroep
    Dan is de status 200
    En is de response een array die de nieuwe booking bevat

  @positief
  Scenario: Filteren op firstname
    Wanneer ik GET /booking aanroep met de unieke firstname als filter
    Dan is de status 200
    En bevat de response precies één booking-id, dat van de nieuwe booking

  @edgecase
  Scenario: Filter zonder resultaten
    Wanneer ik GET /booking aanroep met firstname "DoesNotExist123"
    Dan is de status 200
    En is de response een lege array
```

## US5 – Boekingsdetails bekijken

```gherkin
# language: nl
Functionaliteit: Boekingsdetails bekijken
  Als gebruiker wil ik de details van een boeking zien

  @positief
  Scenario: Bestaande booking ophalen
    Gegeven er bestaat een booking
    Wanneer ik GET /booking/{id} aanroep
    Dan is de status 200
    En bevat de response de verwachte velden en waarden
    En duurt het antwoord minstens 3 seconden (opzettelijke vertraging)

  @negatief
  Scenario: Niet-bestaand id
    Wanneer ik GET /booking/999999 aanroep
    Dan is de status 404
```

## US6 – Boeking aanmaken

```gherkin
# language: nl
Functionaliteit: Boeking aanmaken
  Als gebruiker wil ik een boeking aanmaken

  @positief
  Scenario: Boeking aanmaken met geldige data
    Wanneer ik POST /booking aanroep met alle verplichte velden
    Dan is de status 200
    En bevat de response een bookingid
    En bevat de response de opgeslagen data, met totalprice 150

  @negatief @bug
  Scenario: Verplicht veld ontbreekt
    Wanneer ik POST /booking aanroep zonder firstname
    Dan is de status 400
    # De API antwoordt momenteel met 500
```

## US7 – Boeking bijwerken

```gherkin
# language: nl
Functionaliteit: Boeking bijwerken
  Als geauthenticeerde gebruiker wil ik een boeking volledig (PUT) of gedeeltelijk (PATCH) wijzigen

  Achtergrond:
    Gegeven er bestaat een booking
    En ik heb een geldig token

  @positief
  Scenario: Volledige update met geldig token
    Wanneer ik PUT /booking/{id} aanroep met alle velden en mijn token
    Dan is de status 200
    En zijn alle velden bijgewerkt

  @negatief
  Scenario: Volledige update zonder token
    Wanneer ik PUT /booking/{id} aanroep zonder token
    Dan is de status 403

  @negatief
  Scenario: Volledige update met ongeldig token
    Wanneer ik PUT /booking/{id} aanroep met een ongeldig token
    Dan is de status 403

  @negatief
  Scenario: Volledige update met ontbrekend verplicht veld
    Wanneer ik PUT /booking/{id} aanroep zonder firstname
    Dan is de status 400

  @positief
  Scenario: Gedeeltelijke update met token
    Wanneer ik PATCH /booking/{id} aanroep met enkel firstname en totalprice
    Dan is de status 200
    En zijn alleen firstname en totalprice gewijzigd
    En zijn de overige velden ongewijzigd

  @negatief
  Scenario: Gedeeltelijke update zonder token
    Wanneer ik PATCH /booking/{id} aanroep zonder token
    Dan is de status 403

  @negatief
  Scenario: Gedeeltelijke update op niet-bestaand id
    Wanneer ik PATCH /booking/999999 aanroep met mijn token
    Dan is de status 405
    # Gedrag van deze API; 404 zou logischer zijn
```

## US8 – Boeking verwijderen

```gherkin
# language: nl
Functionaliteit: Boeking verwijderen
  Als geauthenticeerde gebruiker wil ik een boeking verwijderen

  Achtergrond:
    Gegeven er bestaat een booking
    En ik heb een geldig token

  @negatief
  Scenario: Verwijderen zonder token
    Wanneer ik DELETE /booking/{id} aanroep zonder token
    Dan is de status 403

  @negatief
  Scenario: Verwijderen van niet-bestaand id
    Wanneer ik DELETE /booking/999999 aanroep met mijn token
    Dan is de status 405
    # Gedrag van deze API; 404 zou logischer zijn

  @positief
  Scenario: Verwijderen met token
    Wanneer ik DELETE /booking/{id} aanroep met mijn token
    Dan is de status 201

  @positief
  Scenario: Verwijderde booking bestaat niet meer
    Gegeven de booking is verwijderd
    Wanneer ik GET /booking/{id} aanroep
    Dan is de status 404

  @negatief
  Scenario: Tweede keer verwijderen
    Gegeven de booking is al verwijderd
    Wanneer ik DELETE /booking/{id} aanroep met mijn token
    Dan is de status 405
```