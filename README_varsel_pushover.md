# Varsel – Pushover Send Melding (script)

## 1. Formål

Dette scriptet sender standardiserte Pushover-meldinger fra WebHome.
Det brukes som et felles varslingspunkt av alle automasjoner i WebHome-oppsettet, slik at tittelformat, TTL-tekst og mottaker-routing håndteres på ett sted.

Du bruker normalt ikke dette scriptet direkte – det kalles automatisk av de andre automasjonene.

## 2. Eksempler på bruk

- Temperaturautomasjonen bruker dette scriptet til å sende varsel om fryseren.
- Kalender-automasjonen bruker dette til å sende «Varmeplan»-varsel dagen før en hendelse.
- Effektgrense-automasjonen bruker dette til å varsle at kWh-grensen er justert.

## 3. FAQ – Ofte stilte spørsmål

**Hva er Pushover?**
Pushover er en app for telefon og nettbrett som mottar varsler fra Home Assistant. Du må ha Pushover-appen installert og integrasjonen konfigurert i Home Assistant.

**Hva er «destination»?**
Destination avgjør hvilken mottakergruppe i Pushover som får varselet. Standard er `pushover` (alle i gruppen). Bruk `pushover_diverse` for en separat mottakergruppe.

**Kan jeg sende meldinger direkte fra dette scriptet?**
Ja, du kan kalle scriptet manuelt fra Home Assistant med ønsket tittel og melding. Men det er primært ment brukt av andre automasjoner.

**Hva betyr TTL?**
TTL (Time To Live) er levetiden for et varsel i sekunder. Etter denne tiden fjernes varselet fra Pushover-appen automatisk dersom det ikke er lest.

## 4. Hva slags info trengs

- Scriptets navn (settes som blueprint-input og brukes i tittel og fallback-URL)
- Tittel og melding (sendes inn ved kjøring)
- Valgfri URL med lenketekst
- Destinasjon, prioritet og TTL (kan settes ved kjøring, eller bruker standardverdier)

## 5. Innstillinger

**Fast blueprint-input (settes én gang ved installasjon):**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Name | – | Navn som brukes i varseltittel og fallback-URL |

**Runtime-felter (sendes med ved hvert kall):**

| Felt | Standard | Forklaring |
|---|---:|---|
| Tittel | Tittel | Tittel på Pushover-meldingen |
| Melding | Melding | Innholdet i meldingen |
| Destination | pushover | `pushover` eller `pushover_diverse` |
| Priority | 0 | Prioritet (−2 = lavest, 2 = høyest) |
| TTL | 21600 (6 timer) | Levetid for varselet i sekunder |
| URL | (WebHome-lenke) | Valgfri lenke i meldingen |
| URL title | (WebHome-tekst) | Tekst for lenken |

## 6. Funksjonsbeskrivelse

Scriptet bygger en komplett Pushover-melding og sender den:

1. **Tittel:** Bygges som `<name> - <tittel>` (f.eks. «WebHome - KWh-grense»)
2. **TTL-suffiks:** Levetiden formateres til lesbar tekst (sekunder/minutter/timer/dager) og legges til meldingen automatisk
3. **URL/URL-title:** Brukes slik det er sendt inn. Hvis ikke sendt, brukes en fallback basert på `name`
4. **Routing:** `destination == pushover_diverse` → sender til `notify.pushover_diverse`, ellers → `notify.pushover`
5. **Parallell kjøring:** Scriptet kan kjøre opptil 10 samtidige instanser

## 7. Resultat

Sender ett Pushover-varsel til valgt mottakergruppe. Skriver ikke til noen entiteter.

## 8. Avansert

### 8.1 Forutsettninger

- Pushover-integrasjonen (`notify.pushover`) må være konfigurert i Home Assistant.
- Valgfri: `notify.pushover_diverse` for separat mottakergruppe.

### 8.2 Relevante automasjoner og script

Alle automasjoner i WebHome-oppsettet bruker dette scriptet for utsending av Pushover-varsler.

### 8.3 Beregnede verdier og variabler

| Variabel | Beskrivelse |
|---|---|
| Tittel | Bygges som `<name> - <tittel>` |
| TTL-suffiks | Levetid omregnet til lesbar tekst (sek/min/timer/dager) |

### 8.4 Feilhåndtering

Ingen spesiell feilhåndtering i scriptet. Feil i Pushover-integrasjonen vil gi feilmelding i Home Assistant-logg.

### 8.5 Varsling og debug info

Dette scriptet er selve varslingsmekanismen. Meldingsinnholdet styres av den kallende automasjonen.


Ingen debug-varsling. Scriptet er selve varslingskanalen.

## 9. Annet

### 9.1 Kjøringsmodus

Scriptet kjøres i `mode: parallel` med `max: 10`. Det betyr at opptil 10 varsler kan sendes samtidig uten å vente på hverandre.

## 10. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/scripts/varsel_pushover.yaml
