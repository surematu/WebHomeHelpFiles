# Temperaturalarm – automatisk varsel ved høy temperatur eller sensor-feil

## 1. Formål

Sender varsel via Pushover når en temperatursensor overstiger én av to grenseverdier i en bestemt tid, eller når sensoren slutter å rapportere.

Typisk bruksområde er overvåkning av frysere, kjølerom, serverrom eller andre steder hvor temperaturavvik bør fanges opp raskt.

## 2. Eksempler på bruk

- **Fryserboks:** Sett terskel 1 til −5 °C. Får du varsel vet du at fryseren har steget for høyt og maten kan stå i fare.
- **Serverrom:** Sett terskel 1 til 30 °C og terskel 2 til 35 °C. Rask varsling ved overoppheting.
- **Kjøleskap på hytta:** Brukes til å oppdage at kjøleskapet har sluttet å kjøle under fravær.
- **Defekt sensor:** Varsler automatisk om en temperatursensor slutter å sende data.

## 3. FAQ – Ofte stilte spørsmål

**Hva er forskjellen på terskel 1 og terskel 2?**
Terskel 1 utløser varsel etter 15 minutter over grensen. Terskel 2 brukes gjerne til et enda høyere (mer alvorlig) nivå, og venter 60 minutter. Du kan bruke begge for ulike alvorlighetsgrader.

**Kan jeg stille inn andre verdier enn standardverdiene?**
Ja, alle terskler stilles inn i innstillingene når du oppretter automasjonen.

**Hva skjer om sensoren ikke rapporterer lenger?**
Etter 15 minutter uten verdi sender automasjonen et eget varsel om at sensoren er ukjent.

**Kan jeg bruke ett varselnavn som er enklere å forstå enn sensor-ID-en?**
Ja, du kan sette et egendefinert navn som vises i varselet i stedet for det tekniske sensornavnet.

**Varsler automasjonen kontinuerlig om temperaturen fortsatt er for høy?**
Nei, automasjonen varsler ved selve overgangen (når temperaturen har vært for høy lenge nok). For ny varsling må temperaturen ha gått ned og opp igjen.

## 4. Hva slags info trengs

- En temperatursensor i Home Assistant (f.eks. sensor for fryser, serverrom)
- Grenseverdier (°C) du vil varsles om ved overskridelse
- Pushover-integrasjonen må være satt opp og scriptet `script.varsel_pushover_send_melding_webhome` være installert

## 5. Innstillinger

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Temperatursensor | – | Sensoren som overvåkes |
| Egendefinert sensornavn | (tomt) | Valgfritt navn som vises i varselet. Bruker sensornavnet hvis tomt. |
| Terskel 1 (°C) | −5 | Temperatur over denne verdien i 15 minutter utløser varsel |
| Terskel 2 (°C) | −15 | Temperatur over denne verdien i 60 minutter utløser varsel |
| Pushover destination | pushover | Mottakergruppe for varselet |
| Pushover prioritet | 0 | Prioritet for varselet (−2 = lavest, 2 = høyest) |
| Pushover TTL (sekunder) | 604800 | Levetid for varselet (604800 = 7 dager) |

> **Merk om standardverdiene:** Standard terskel 1 er −5 °C og terskel 2 er −15 °C – disse er tilpasset fryserboks-overvåkning. Juster til aktuelt bruksområde.

## 6. Funksjonsbeskrivelse

Automasjonen overvåker én temperatursensor kontinuerlig via tre uavhengige triggere:

1. **Terskel 1:** Temperaturen stiger over terskel 1 og holder seg der i minst 15 minutter → varsel sendes.
2. **Terskel 2:** Temperaturen stiger over terskel 2 og holder seg der i minst 60 minutter → varsel sendes.
3. **Ukjent:** Sensoren går i tilstand «ukjent» i minst 15 minutter → varsel sendes.

Når en trigger utløses, bestemmes sensornavnet (egendefinert → friendly_name → entity_id) og et Pushover-varsel sendes.

## 7. Resultat

Ingen entiteter skrives til. Resultatet er utelukkende et Pushover-varsel til valgt mottakergruppe.

## 8. Varsling

Varsling er aktiv som standard (pushover destination er satt til `pushover`).

**Tittel:** Sensornavnet (egendefinert navn, eller sensorens friendly_name / entity_id)

**Melding ved terskel 1 (15 min):**
> Temp over −5 °C for 15m.

**Melding ved terskel 2 (60 min):**
> Temp over −15 °C for 60m.

**Melding ved ukjent sensor (15 min):**
> Temp ukjent for 15m.

## 9. Annet

Automasjonen er enkel og har ingen tilleggslogikk utover de tre triggerscenarioene.

## 10. Avansert

### 10.1 Forutsettninger

- Pushover-integrasjonen må være konfigurert i Home Assistant.
- Script-blueprintet `varsel_pushover.yaml` (script `script.varsel_pushover_send_melding_webhome`) må være installert.

### 10.2 Eksempler

Ingen YAML-eksempler for denne automasjonen.

### 10.3 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| [varsel_pushover.yaml](./blueprints/scripts/varsel_pushover.yaml) | Felles script for å sende Pushover-varsler. Brukes av denne automasjonen for utsending. |

### 10.4 Beregnede verdier og variabler

| Variabel | Beskrivelse |
|---|---|
| `sensor_name` | Sensornavnet som vises i varselet. Bruker egendefinert navn → friendly_name → entity_id |

### 10.5 Feilhåndtering

Ingen spesiell feilhåndtering utover de tre triggerscenarioene. Dersom Pushover ikke er konfigurert, vil utsending feile stille uten påvirkning på andre systemer.

### 10.6 Varsling og debug info

Ingen debug-varsling. Alle varsler er informasjonsvarsler til bruker.

## 11. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/temperature_sensor_alarm.yaml
- Pushover script: [README_varsel_pushover.md](./README_varsel_pushover.md)
