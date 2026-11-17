# Snøsmelt – Hent data (overordnet)

## 1. Formål

Overordnet automasjon for et snøsmelteanlegg. Henter timevarsel fra en weather-entitet, avgjør om det er behov for snøsmelting (snø, rim/is, etterdrift eller manuell kjøring) og skriver resultatet til hjelpere som kan vises i et dashbord. Resultatet «Snøsmelt behov» brukes av én eller flere «Snøsmelt - Styr utgang»-automasjoner, én per kontaktor.

Det trengs bare én slik automasjon per anlegg.

## 2. Eksempler på bruk

### 2.1 Snøfall i vente

Det er −2 °C og meldt 0,6 mm nedbør de neste 3 timene. «Snø detektert» og «Snøsmelt behov» slås PÅ, og årsaken blir «Start snøsmelt, nedbør detektert. (Varmt, sjekk de neste 3 timene.)».

### 2.2 Etterdrift

Snøfallet er over. «Snø detektert» slås AV, men «Snøsmelt behov» holdes PÅ i 3 timer (6 timer når det er kaldt) for å smelte det som ligger igjen.

### 2.3 Manuell kjøring

Vaktmester trykker på knappen «Snøsmelt manuell kjøring». Anlegget går i 6 timer uansett vær. Et nytt trykk i løpet av de 6 timene stopper manuell kjøring.

## 3. FAQ – Ofte stilte spørsmål

**Slår denne automasjonen på varmekablene?**
Nei. Den bestemmer bare om det er behov. Selve utgangene styres av «Snøsmelt - Styr utgang» (én per kontaktor).

**Hvor ofte hentes været?**
Én gang i timen (minutt 30), ved omstart av Home Assistant, og med en gang manuell kjøring slås av eller på.

**Hva er forskjellen på «varmt» og «kaldt»?**
Når laveste temperatur de neste timene er −5 °C eller lavere, regnes det som kaldt. Da ser automasjonen lenger frem (6 timer i stedet for 3) og kjører lengre etterdrift (6 timer i stedet for 3).

**Hva er rimfare?**
Når lufttemperaturen er nær duggpunktet og under +2 °C, kan det danne seg rim eller is selv uten nedbør.

**Hva skjer hvis værvarselet ikke er tilgjengelig?**
Snø og rim settes til AV, og årsaken blir «Ingen gyldige værdata.». Etterdrift og manuell kjøring virker fortsatt.

**Kan jeg bruke blueprintet på et annet anlegg?**
Ja. Opprett hjelperne (se §10.1), importer blueprintet og velg hjelperne i automasjonen.

## 4. Hva slags info trengs

- En weather-entitet med timevarsel (f.eks. Met.no).
- Åtte hjelpere (én valgfri i tillegg), se §10.1. Disse kan opprettes samlet med `packages/snosmelt_hjelpere.yaml`.
- Scriptet `script.varsel_pushover_send_melding_webhome` hvis varsling skal brukes.

## 5. Innstillinger

**Hovedinnganger og hjelpere**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Værvarsel | – | Weather-entitet med timevarsel |
| Snøsmelt behov | – | input_boolean. Hovedresultatet |
| Årsak for driftsmodus | – | input_text (maks 255 tegn) |
| Snø detektert | – | input_boolean |
| Rim/is detektert | – | input_boolean |
| Snø sist aktiv | – | input_datetime (dato + tid) |
| Rim sist aktivert | – | input_datetime (dato + tid) |
| Manuell kjøring til | – | input_datetime (dato + tid) |
| Manuell kjøring knapp | – | input_button |
| Detaljer (valgfri) | tom | input_text (maks 255 tegn) med nedbør, temperatur, fukt og duggpunkt |

**Innstillinger**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Stopp – for varmt | 2 °C | Laveste temperatur over denne gir ingen snøsmelting. Rimfare krever også temperatur under denne |
| Stopp – for kaldt | −10 °C | Høyeste temperatur under denne gir ingen snøsmelting på snøfall |
| Grense kaldt/varmt | −5 °C | Laveste temperatur lik eller under denne gir «kaldt» |
| Nedbørsgrense | 0,1 mm | Sum meldt nedbør i vinduet som gir behov |
| Timer å sjekke – varmt | 3 t | Hvor langt frem det sjekkes når det er varmt |
| Timer å sjekke – kaldt | 6 t | Hvor langt frem det sjekkes når det er kaldt |
| Etterdrift – varmt | 3 t | Etterdrift når det er varmt |
| Etterdrift – kaldt | 6 t | Etterdrift når det er kaldt |
| Rimfare – avstand til duggpunkt | 1,5 °C | Rimfare når temperatur − duggpunkt er mindre enn dette |
| Manuell kjøring – varighet | 6 t | Hvor lenge ett trykk på knappen kjører anlegget |

**Varsling (Valgfri)**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Pushover destination (valgfri) | pushover | Trengs normalt ikke å justeres. Ved flere ulike grupper kan denne justeres slik at den blir sendt ulikt. |
| Pushover priority | 0 | −2 (Sendes uten varsling), −1 (varsling uten lyd), 0 (Varsel med lyd), 1 (Høy prioritet, rødt varsel, omgår stilleperiode), 2 (nødvarsel som gjentas til det bekreftes). |
| Levetid varsel (timer) | 6 | Hvor lenge skal varslet være synlig før det forsvinner? |
| Send varsel når snøsmelting starter | false | Varsel når «Snøsmelt behov» går fra AV til PÅ |
| Send varsel ved manuell kjøring | true | Sett til true for å sende varsel når automasjonen kjøres manuelt. Sett til false for å ikke sende varsel ved manuell kjøring. |

> Levetid sendes til scriptet i timer. Scriptet regner om til sekunder, som er det Pushover bruker.

## 6. Funksjonsbeskrivelse

1. **Knapp for manuell kjøring:** Ved trykk settes «Manuell kjøring til» til nå + varighet. Er manuell kjøring allerede aktiv, settes tidspunktet til nå (stopp). Endringen starter en ny beregning.
2. **Hent timevarsel** fra weather-entiteten.
3. **Kaldt eller varmt:** Laveste temperatur i «kaldt»-vinduet (standard 6 timer) sammenlignes med grensen (−5 °C). Dette bestemmer hvor mange timer som sjekkes og hvor lang etterdriften er.
4. **Nøkkelverdier** for valgt vindu: sum nedbør, laveste/høyeste temperatur, høyeste fukt, og temperatur/fukt for første time.
5. **Duggpunkt** for første time beregnes med Magnus-formelen.
6. **Snø:** det finnes værdata, det er ikke for varmt, ikke for kaldt, og sum nedbør er minst nedbørsgrensen.
7. **Rim/is:** temperatur − duggpunkt er under marginen og temperaturen er under «for varmt»-grensen.
8. **Tidspunkter:** «Snø sist aktiv» settes til nå hver gang snø er detektert. «Rim sist aktivert» settes bare når rimfare går fra AV til PÅ.
9. **Etterdrift:** aktiv så lenge det er kortere enn etterdriftstiden siden det siste av de to tidspunktene.
10. **Manuell kjøring:** aktiv så lenge «Manuell kjøring til» er i fremtiden.
11. **Samlet behov** = snø ELLER rim ELLER etterdrift ELLER manuell. Skrives til «Snøsmelt behov» kun ved endring.
12. **Årsak og detaljer** skrives til tekst-hjelperne, og hendelsen `webhome_snosmelt_update` sendes med alle verdier.

## 7. Resultat

| Entitet | Hva skrives |
|---|---|
| Snøsmelt behov | PÅ/AV – samlet behov |
| Snø detektert | PÅ/AV |
| Rim/is detektert | PÅ/AV |
| Årsak for driftsmodus | Tekst, f.eks. «Stopp. Lite/ingen nedbør. (Varmt, sjekk de neste 3 timene.)» |
| Detaljer (valgfri) | Tekst, f.eks. «Nedbør 0.4 mm · Temp -2.5 til -1.0 °C · Fukt maks 87 % · Duggpunkt -4.2 °C» |
| Snø sist aktiv | Tidspunkt for siste kjøring med snø detektert |
| Rim sist aktivert | Tidspunkt da rimfare sist slo inn |
| Manuell kjøring til | Settes av knappen (start/stopp) |

## 8. Varsling

Ingen varsler er aktive som standard, bortsett fra statusvarsel når automasjonen kjøres manuelt fra Home Assistant:

- **Tittel:** `🔔 Snøsmelt - Hent data (manuell kjøring)`
- **Melding:** behov PÅ/AV, årsak og detaljer.

Valgfritt varsel når snøsmelting starter (av som standard):

- **Tittel:** `❄️ Snøsmelting aktivert`
- **Melding:** `Årsak: Start snøsmelt, nedbør detektert. (Varmt, sjekk de neste 3 timene.)`

## 9. Annet

### 9.1 Visning i dashbord

Hjelperne kan vises direkte: «Snøsmelt behov» som hovedknapp, «Snø detektert» og «Rim/is detektert» som underknapper, «Årsak» og «Detaljer» som tekst, og «Snøsmelt manuell kjøring» som trykknapp.

### 9.2 Kjøring sammen med en eldre løsning

Blueprintet bruker egne hjelpere og sin egen hendelse, og skriver ikke til noe annet. Det kan derfor kjøres side om side med en eksisterende snøsmelt-løsning mens det testes.

## 10. Avansert

### 10.1 Forutsettninger

- Home Assistant 2025.11.0 eller nyere.
- Weather-integrasjon med timevarsel som gir `temperature`, `precipitation` og `humidity` (f.eks. Met.no).
- `script.varsel_pushover_send_melding_webhome` (fra `blueprints/scripts/varsel_pushover.yaml`) hvis varsling brukes.
- Hjelpere. Enklest: kopier `packages/snosmelt_hjelpere.yaml` til `/config/packages/` og start på nytt. Eller opprett dem manuelt under Innstillinger → Enheter og tjenester → Hjelpere:

| Type | Foreslått navn | Entitets-ID | Merknad |
|---|---|---|---|
| Bryter (input_boolean) | Snøsmelt behov | `input_boolean.snosmelt_behov` | |
| Bryter (input_boolean) | Snøsmelt snø detektert | `input_boolean.snosmelt_sno_detektert` | |
| Bryter (input_boolean) | Snøsmelt rim detektert | `input_boolean.snosmelt_rim_detektert` | |
| Tekst (input_text) | Snøsmelt årsak | `input_text.snosmelt_arsak` | Maks lengde 255 |
| Tekst (input_text) | Snøsmelt detaljer | `input_text.snosmelt_detaljer` | Valgfri. Maks lengde 255 |
| Dato og tid (input_datetime) | Snøsmelt snø sist aktiv | `input_datetime.snosmelt_sno_sist_aktiv` | Dato og tid |
| Dato og tid (input_datetime) | Snøsmelt rim sist aktivert | `input_datetime.snosmelt_rim_sist_aktivert` | Dato og tid |
| Dato og tid (input_datetime) | Snøsmelt manuell kjøring til | `input_datetime.snosmelt_manuell_til` | Dato og tid |
| Knapp (input_button) | Snøsmelt manuell kjøring | `input_button.snosmelt_manuell_kjoring` | |

> Tekst-hjelpere har 100 tegn som standard maks-lengde. Sett den til 255, ellers kan årsaksteksten bli avvist.

### 10.2 Eksempler

**Aktivere packages i `configuration.yaml`:**
```yaml
homeassistant:
  packages: !include_dir_named packages
```

**Valgfri sensor fra hendelsen (om du vil ha tallverdier som egne entiteter):**
```yaml
template:
  - trigger:
      - trigger: event
        event_type: webhome_snosmelt_update
    sensor:
      - name: Snøsmelt nedbør kommende timer
        unique_id: snosmelt_nedbor_kommende_timer
        unit_of_measurement: mm
        state: "{{ trigger.event.data.precip_sum }}"
```

### 10.3 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| `snosmelt_styr_utgang.yaml` | Styrer én utgang ut fra «Snøsmelt behov», og overvåker last og spole |
| `scripts/varsel_pushover.yaml` | Sender Pushover-varslene |

### 10.4 Beregnede verdier og variabler

| Variabel | Beskrivelse |
|---|---|
| `fc_list` | Timevarselet fra weather-entiteten |
| `min_temp_cold_window` | Laveste temperatur i «kaldt»-vinduet |
| `is_cold_mode` | true når `min_temp_cold_window` ≤ grense kaldt/varmt |
| `hours_to_check` / `afterrun_hours` | Valgt vindu og etterdrift for gjeldende modus |
| `prec_list`, `temp_list`, `hum_list` | Verdier for valgt vindu |
| `has_data` | true når alle tre listene har verdier |
| `precip_sum`, `min_temp`, `max_temp`, `max_hum` | Nøkkelverdier for vinduet |
| `temp_now`, `hum_now`, `dew_point` | Første time i varselet og beregnet duggpunkt |
| `too_warm`, `too_cold`, `precip_expected` | Delvilkår for snø |
| `snow_detected`, `frost_detected` | Snø og rim nå |
| `afterrun_active`, `afterrun_remaining_h` | Etterdrift |
| `manual_active`, `manual_remaining_h` | Manuell kjøring |
| `demand` | Samlet behov |
| `reason_combined`, `details_text` | Tekstene som skrives til hjelperne |

Hendelsen `webhome_snosmelt_update` inneholder: `demand_entity`, `demand`, `reason`, `snow_detected`, `frost_detected`, `afterrun_active`, `manual_active`, `has_data`, `is_cold_mode`, `precip_sum`, `min_temp`, `max_temp`, `max_hum`, `dew_point`, `min_temp_cold_window`.

### 10.5 Feilhåndtering

| Scenario | Håndtering |
|---|---|
| Værvarselet feiler eller er tomt | `has_data` = false. Snø og rim settes AV. Etterdrift og manuell kjøring virker fortsatt |
| Varselet mangler fukt eller nedbør | Verdier som ikke er tall filtreres bort. Mangler en hel liste, blir `has_data` false |
| Omstart av Home Assistant | Beregningen kjøres 3 minutter etter oppstart |
| Knappen får ny tilstand ved oppstart | Triggeren ignorerer overganger fra/til `unknown`/`unavailable`, så manuell kjøring startes ikke av en omstart |
| Tidspunkt-hjelper er tom | Tolkes som «aldri», altså ingen etterdrift/manuell kjøring |

### 10.6 Varsling og debug info

Ingen egne debug-varsler. Alle mellomverdier er synlige i sporloggen (Trace) til automasjonen, steg for steg. Kjør automasjonen manuelt for å få gjeldende status tilsendt på Pushover.

### 10.7 Forskjeller fra den opprinnelige «Snøsmelt - Hent data»

- Resultatet skrives til hjelpere i stedet for til YAML-definerte template-sensorer.
- Manuell kjøring styres av en input_button i stedet for et eget script, og utløpet treffes på tidspunktet (ikke først ved neste time).
- Tidspunkter lagres med minutt-presisjon, og etterdrift regnes nøyaktig fra tidspunktet (uten en ekstra time).
- Hendelsen heter `webhome_snosmelt_update` (tidligere `metno_next6h_update`).

## 11. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/snosmelt_hent_data.yaml
- Hjelpere: https://github.com/surematu/WebHomeHelpFiles/blob/main/packages/snosmelt_hjelpere.yaml
- Home Assistant packages: https://www.home-assistant.io/docs/configuration/packages/
- weather.get_forecasts: https://www.home-assistant.io/integrations/weather/#action-weatherget_forecasts
