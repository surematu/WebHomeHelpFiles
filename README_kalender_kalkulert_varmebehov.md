# Kalender – Kalkulert varmebehov

## 1. Formål

Denne automasjonen beregner automatisk når forvarming og normal varme skal slås på, basert på en kalenderhendelse, nåværende innetemperatur og værmeldingen.

Systemet sørger for at rommet er varmt nok til riktig tid – uten at du trenger å huske å slå på varmen manuelt.

## 2. Eksempler på bruk

- **Firmamøte på kontoret:** Kalenderoppføringen «Møte kl. 09:00» er registrert med riktig sted. Automasjonen starter forvarming rundt kl. 04:00 og normal varme kl. 08:00 – slik at rommet er 23 °C når møtet begynner.
- **Hytta:** Legg inn «Hyttetur» i kalenderen. Systemet beregner når det trengs å starte varmen basert på utetemperaturen og innetemperaturen slik at hytta er varm ved ankomst.
- **Alle hendelser:** Ikke sett nøkkelord – da aktiveres varme for alle kalenderhendelser.

## 3. FAQ – Ofte stilte spørsmål

**Hva er forvarming?**
Forvarming er en periode med lav oppvarming før normal varme, slik at systemet rekker å «starte opp» i god tid. Det er et forvarsel til varmesystemet om at varme snart skal aktiveres.

**Hva bestemmer hvor tidlig forvarming starter?**
Beregningen tar hensyn til temperaturforskjellen mellom nåværende innetemperatur og ønsket temperatur, utetemperaturen, og et ekstra buffer du selv setter. Jo kaldere det er ute, jo lenger tid brukes det å varme opp.

**Hva skjer om kalenderen er tom?**
Ingenting – verken forvarming eller varme aktiveres.

**Hva om jeg ikke vil at alle hendelser skal gi varme?**
Sett «Nøkkelord i kalender location»-feltet til f.eks. «kontor» eller «hytta». Da aktiveres kun varme for hendelser der «location»-feltet inneholder dette nøkkelordet.

**Varsler systemet meg 24 timer i forveien?**
Ja (som standard, kan deaktiveres). Du får varsel om at det er planlagt oppvarming til en hendelse om 24 timer.

**Slår automasjonen av varmen etter hendelsen?**
Ja, begge booleans (`preheat_boolean` og `heat_boolean`) settes av utenfor varmevinduet.

## 4. Hva slags info trengs

- Én eller flere **kalender-entiteter** i Home Assistant
- En **vær-entitet** som støtter timeprognose (f.eks. yr.no)
- En **innetemperatursensor** for rommet som skal varmes opp
- To **input_boolean-entiteter**: én for forvarming, én for normal varme
- Nåværende utetemperatur er **hardkodet** til `sensor.utetemperatur` (endre i YAML ved behov)

## 5. Innstillinger

**Hovedinnganger:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Kalender entiteter | – | Kalendere som sjekkes for hendelser |
| Vær entitet | – | Weather-entitet for timeprognose |
| Innetemperatur sensor | – | Temperaturen inne nå |
| Forvarming bool | – | Slås på i forvarmingsperioden |
| Varme bool | – | Slås på i varmeperioden |
| Nøkkelord i kalender «location» | (tomt) | La stå tomt for alle hendelser. Sett f.eks. «kontor» for å filtrere |
| Måltemperatur (°C) | 23 | Temperaturen som skal nås før hendelsen starter |

**Innstillinger:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Buffer (timer) | 3 | Ekstra timer til beregnet oppvarmingstid (starter forvarming tidligere) |
| Lookahead (timer) | 168 | Hvor langt frem det søkes etter hendelser (168 = 7 dager) |

**Valgfritt:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Status input_text | (tomt) | Valgfri entitet som oppdateres med aktuell status |
| Pushover destination | pushover | Mottakergruppe. La stå tomt for å deaktivere varsling |
| Pushover prioritet | 1 | Prioritet for varselet |
| Pushover TTL (sekunder) | 604800 | Levetid for varselet (604800 = 7 dager) |

## 6. Funksjonsbeskrivelse

Automasjonen kjøres hvert 10. minutt og ved Home Assistant-restart:

1. Henter timeprognose fra vær-entiteten og beregner snitttemperatur for neste 24 timer
2. Finner neste relevante hendelse i kalenderen (filtrert på nøkkelord hvis satt)
3. Beregner oppvarmingshastighet basert på utetemperatur (kaldere ute → lavere oppvarmingshastighet, mer tid trengs)
4. Beregner nødvendig oppvarmingstid: `(grader som trengs / hastighet) + buffer`
5. Regner ut forvarmingsstart (rundet ned til nærmeste :00 eller :30, men ikke senere enn 1 time før hendelsen)
6. Styrer boolean-entitetene:
   - `preheat_boolean`: på i forvarmingsvinduet (fra beregnet forvarmingsstart til varmevinduet)
   - `heat_boolean`: på i varmevinduet (fra 15 min før hendelsen til hendelsens slutt)
   - Begge av utenfor disse vinduene

## 7. Resultat

- **`preheat_boolean`** settes til `on` i forvarmingsperioden, `off` ellers
- **`heat_boolean`** settes til `on` i varmeperioden, `off` ellers
- Valgfri **`input_text`** oppdateres med aktuell status (neste hendelse, beregnede tider)

## 8. Varsling

Varsling er aktivert som standard (pushover destination er satt til `pushover`). Varsel sendes ca. 24 timer før neste hendelse.

**Tittel:**
> 🔥 Varmeplan 🔥

**Eksempel på melding (varme planlagt):**
> Det kommer en hendelse om 24 timer, det er planlagt oppvarming.
> Forvarming starter kl. 04:00, normal varme fra kl. 08:45.

**Eksempel på melding (ingen varme):**
> Ingen varme for hendelse om 24 timer (sted inneholder ikke «kontor») – Team-møte

For å deaktivere varsling, tøm feltet «Pushover destination» i innstillingene.

## 9. Annet

### 9.1 Nøkkelord-filtrering

Nøkkelordet sjekkes mot «location»-feltet i kalenderhendelsen (uavhengig av store/små bokstaver). Brukes nøkkelord vil automasjonen i tillegg alltid beregne «første hendelse uansett» parallelt – for bruk i 24t-varselet.

## 10. Avansert

### 10.1 Forutsettninger

- **`sensor.utetemperatur`** – nåværende utetemperatur (hardkodet, endre i YAML ved behov)
- Vær-entitet som støtter `weather.get_forecasts`
- Kalender-entiteter i Home Assistant
- To `input_boolean`-entiteter
- Pushover-integrasjon og script `script.varsel_pushover_send_melding_webhome` (for varsling)
- Valgfri: `input_text` for statusoppdatering

### 10.2 Eksempler

Ingen YAML-eksempler for denne automasjonen.

### 10.3 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| [varsel_pushover.yaml](./blueprints/scripts/varsel_pushover.yaml) | Felles script for Pushover-utsending |

### 10.4 Beregnede verdier og variabler

| Variabel | Beskrivelse |
|---|---|
| `io_outdoor_temp_comming` | Snitttemperatur beregnet fra forecast (neste 24 timer) |
| `tempchange_degreePerHour` | Oppvarmingshastighet i °C/time (avhenger av utetemperatur) |
| `tempchange_degreeIncreaseReq` | Grader som trengs: `måltemperatur − innetemperatur` (min 0) |
| `tempchange_hoursNeededForGoal` | Nødvendig tid: `(behov / hastighet) + buffer` |
| `startdata_ts_preheatingstart` | Beregnet forvarmingsstart (rundet ned til :00 eller :30) |
| `startdata_ts_nexteventstart` | Beregnet varmestartidspunkt (15 min før hendelsen) |

**Oppvarmingshastighet etter utetemperatur:**

| Utetemp (snitt 24t) | Hastighet |
|---|---:|
| ≤ −13 °C | 0,3 °C/time |
| ≤ −9 °C | 0,4 °C/time |
| ≤ −5 °C | 0,5 °C/time |
| ≤ 0 °C | 0,5 °C/time |
| ≤ 5 °C | 0,6 °C/time |
| > 5 °C | 0,2 °C/time |

### 10.5 Feilhåndtering

| Situasjon | Håndtering |
|---|---|
| Kalenderen er tom | Ingen boolean aktiveres |
| Nøkkelord ikke funnet i noen hendelse | Ingen boolean aktiveres |
| Forecast mangler | Faller tilbake til `sensor.utetemperatur` |
| Hendelsen er passert | Begge booleans settes av |

### 10.6 Varsling og debug info

- Valgfri `input_text` viser aktuell beregningsstatus
- 24t-varselet sendes når neste hendelse er omtrent 24 timer frem i tid
- Pushover-varselet inkluderer planlagte tidspunkter for forvarming og varme

## 11. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/kalender_kalkulert_varmebehov.yaml
- Pushover script: [README_varsel_pushover.md](./README_varsel_pushover.md)
