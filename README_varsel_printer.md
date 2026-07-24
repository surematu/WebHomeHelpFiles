# Varsel – Printer – Blekk/Toner lavt

## 1. Formål

Denne automasjonen finner automatisk alle printer-sensorer i Home Assistant og sender varsel via Pushover når blekk eller toner er lavere enn en valgt terskel.

Du slipper å huske å sjekke printernivåene manuelt – automasjonen gjør det for deg på et fast tidspunkt i uken, og kan også sjekke rett etter at printeren kobles til igjen.

## 2. Eksempler på bruk

- **Hjemmekontor:** Sender varsel onsdag morgen hvis blekket er under 10 %. Aldri mer overraskelse når du skal skrive ut viktige dokumenter.
- **Etter wake-up:** Printeren kobles til igjen etter strømbrudd – automasjonen venter litt og sjekker deretter blekknivåene.
- **Kontormiljø:** Varsler om toner i en laserprinter er under grensen.

## 3. FAQ – Ofte stilte spørsmål

**Finner automasjonen printeren min automatisk?**
Ja, den søker i alle sensor-entiteter etter enheter som inneholder nøkkelordet `printer` (standard) og matcher blekk/toner-begreper. Endrer du nøkkelordet, kan den finne andre enheter.

**Hva om jeg har flere printere?**
Automasjonen grupperer sensorer per printer og rapporterer alle med avvik i én samlet melding.

**Sender den varsel hvis blekknivået er OK?**
Nei, varsel sendes kun når minst én sensor er under terskelen.

**Hva er «wake-up»-funksjonen?**
Hvis du velger en eller flere «wake-up»-entiteter (f.eks. en nettverksswitch), kan automasjonen trigges når de går fra utilgjengelig til tilgjengelig. Den venter da konfigurerbar tid (standard 6 timer) for stabilisering før den sjekker.

**Hva skjer om printeren er av eller utilgjengelig?**
Sensorer med ugyldige verdier (ikke 0–100 %, ikke prosent-enhet) filtreres automatisk bort.

## 4. Hva slags info trengs

- Printer-sensorer i Home Assistant (hentes automatisk basert på nøkkelord)
- Pushover-integrasjonen må være satt opp og scriptet `script.varsel_pushover_send_melding_webhome` installert

## 5. Innstillinger

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Pushover destination | pushover | Mottakergruppe for varselet |
| Pushover prioritet | 0 | Prioritet for varselet (−2 = lavest, 2 = høyest) |
| Pushover TTL (sekunder) | 604800 | Levetid for varselet (604800 = 7 dager) |
| Blekkterskel (%) | 10 | Varsle når blekk/toner er under denne verdien |
| Tid for planlagt sjekk | 09:00 | Tidspunkt for den planlagte sjekken |
| Ukedag(er) for planlagt sjekk | Onsdag | Ukedager sjekken kjøres |
| Nøkkelord for auto-detektering | printer | Søkeord i entity_id for å finne printer-sensorer |
| Wake-up entities | (tomt) | Entiteter som trigger sjekk ved oppstart/tilgjengelig |
| Ventetid etter online (minutter) | 360 | Minutter å vente etter wake-up før sjekk |
| Legg til debug-detaljer | false | Legger til ekstra teknisk info i varselet |

## 6. Funksjonsbeskrivelse

**Ved planlagt sjekk (valgt ukedag og tidspunkt):**
1. Automasjonen søker gjennom alle `sensor.*`-entiteter etter nøkkelordet (standard: `printer`)
2. Filtrerer på blekk/toner-begreper i entity_id eller friendly name
3. Krever at enheten har prosent-verdier (enhet `%` eller verdi 0–100)
4. Grupperer sensorer per printer
5. Finner laveste verdi per farge/type under terskelen
6. Bygger en samlet melding for alle printere med avvik
7. Sender varsel kun hvis det faktisk finnes avvik

**Ved wake-up trigger:**
Venter konfigurert antall minutter, deretter kjøres samme logikk som planlagt sjekk.

## 7. Resultat

Ingen entiteter skrives til. Resultatet er et Pushover-varsel hvis noen printer er under terskelen.

## 8. Varsling

Varsling er aktiv som standard (pushover destination er satt til `pushover`).

**Tittel:**
> 🟠 Printer – Blekk 🟠

**Eksempel på melding:**
> Canon PIXMA:
> - Svart: 8 %
> - Cyan: 5 %

Varsel sendes kun hvis minst én sensor er under terskelen.

## 9. Annet

### 9.1 Deteksjon av printer-sensorer

Automasjonen bruker et nøkkelord (`printer` som standard) for å finne relevante sensorer. Printerens sensorer må ha dette nøkkelordet i entity_id for å bli funnet. Sensorer med ugyldige verdier (feil enhet, utenfor 0–100 %) ignoreres automatisk.

## 10. Avansert

### 10.1 Forutsettninger

- Printer-integrasjon i Home Assistant som eksponerer blekk/toner-sensorer (f.eks. IPP, Brother, Canon-integrasjoner)
- Sensorene må ha nøkkelordet (standard `printer`) i entity_id
- Pushover-integrasjon og script `script.varsel_pushover_send_melding_webhome`

### 10.2 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| [varsel_pushover.yaml](./blueprints/scripts/varsel_pushover.yaml) | Felles script for Pushover-utsending |

### 10.3 Beregnede verdier og variabler

| Variabel | Beskrivelse |
|---|---|
| `matching_entities` | Liste over funne printer-sensorer som matcher nøkkelord og er gyldige |
| `grouped` | Sensorer gruppert per printer |
| `final_message` | Samlet meldingstekst for alle printere med avvik |

### 10.4 Feilhåndtering

| Situasjon | Håndtering |
|---|---|
| Ingen sensorer funnet | Ingen varsel sendes |
| Sensorverdier utenfor 0–100 % | Filtreres bort automatisk |
| Alle sensorer over terskel | Ingen varsel sendes |
| Wake-up entity utilgjengelig | Trigger aktiveres ikke |

### 10.5 Varsling og debug info

- Sett «Legg til debug-detaljer» til `true` for å få trigger-info, tellerverdier og match-statistikk i varselet
- Nyttig ved feilsøking om forventede printere ikke dukker opp i varselet

## 11. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/varsel_printer.yaml
- Pushover script: [README_varsel_pushover.md](./README_varsel_pushover.md)
