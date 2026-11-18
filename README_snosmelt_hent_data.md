# Snøsmelt – Hent data (overordnet)

## 1. Formål

Overordnet automasjon for et snøsmelteanlegg. Henter timevarsel fra en weather-entitet, avgjør om det er behov for snøsmelting (snø, rim/is, etterdrift eller manuell kjøring) og skriver resultatet til hjelpere som kan vises i et dashbord. Resultatet «Snøsmelt behov» brukes av én eller flere «Snøsmelt - Styr utgang»-automasjoner, én per kontaktor.

Det trengs bare én slik automasjon per anlegg.

## 2. Eksempler på bruk

### 2.1 Snøfall i vente

Det er −2 °C og meldt 0,6 mm nedbør de neste 3 timene. «Snø detektert» og «Snøsmelt behov» slås PÅ, og årsaken blir «Start. Meldt snø de neste 3 timene.».

### 2.2 Etterdrift

Snøfallet er over. «Snø detektert» slås AV, men «Snøsmelt behov» holdes PÅ i 4 timer (7 timer når det er kaldt) for å smelte det som ligger igjen.

### 2.3 Manuell kjøring

Vaktmester trykker på knappen «Snøsmelt manuell kjøring». Anlegget går i 6 timer uansett vær. Et nytt trykk i løpet av de 6 timene stopper manuell kjøring.

## 3. FAQ – Ofte stilte spørsmål

**Slår denne automasjonen på varmekablene?**
Nei. Den bestemmer bare om det er behov. Selve utgangene styres av «Snøsmelt - Styr utgang» (én per kontaktor).

**Hvor ofte hentes været?**
Én gang i timen (minutt 30), ved omstart av Home Assistant, og med en gang manuell kjøring slås av eller på.

**Hva er forskjellen på «varmt» og «kaldt»?**
Når laveste temperatur de neste timene er −5 °C eller lavere, regnes det som kaldt. Da ser automasjonen lenger frem (6 timer i stedet for 3) og kjører lengre etterdrift (7 timer i stedet for 4).

**Hva er rimfare?**
Når lufttemperaturen er nær duggpunktet og under +2 °C, kan det danne seg rim eller is selv uten nedbør.

**Hva skjer hvis værvarselet ikke er tilgjengelig?**
Snø og rim settes til AV, og årsaken blir «Ingen gyldige værdata.». Etterdrift og manuell kjøring virker fortsatt.

**Kan jeg bruke blueprintet på et annet anlegg?**
Ja. Opprett hjelperne (se §10.1) og importer blueprintet. Hjelperne har faste entitets-ID-er og velges ikke i automasjonen, så det eneste som må velges er værvarselet.

**Kan jeg ha to anlegg i samme Home Assistant?**
Nei. Hjelperne er hardkodet, så det kan bare være én «Snøsmelt - Hent data» per Home Assistant.

## 4. Hva slags info trengs

- En weather-entitet med timevarsel (f.eks. Met.no).
- Åtte hjelpere (to valgfrie i tillegg) med faste entitets-ID-er, se §10.1. De er hardkodet i blueprintet og må finnes i Home Assistant. Opprett dem samlet med `packages/snosmelt_hjelpere.yaml`.
- Scriptet `script.varsel_pushover_send_melding_webhome` hvis varsling skal brukes.

## 5. Innstillinger

**Hovedinnganger**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Værvarsel | – | Weather-entitet med timevarsel |

Hjelperne velges ikke her. De er hardkodet, se §10.1.

**Innstillinger**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Stopp – for varmt | 2 °C | Laveste temperatur over denne gir ingen snøsmelting. Rimfare krever også temperatur under denne |
| Stopp – for kaldt | −10 °C | Høyeste temperatur under denne gir ingen snøsmelting på snøfall |
| Grense kaldt/varmt | −5 °C | Laveste temperatur lik eller under denne gir «kaldt» |
| Nedbørsgrense | 0,1 mm | Sum meldt nedbør i vinduet som gir behov |
| Timer å sjekke – varmt | 3 t | Hvor langt frem det sjekkes når det er varmt |
| Timer å sjekke – kaldt | 6 t | Hvor langt frem det sjekkes når det er kaldt |
| Etterdrift – varmt | 4 t | Etterdrift når det er varmt, regnet fra siste kjøring med snø |
| Etterdrift – kaldt | 7 t | Etterdrift når det er kaldt, regnet fra siste kjøring med snø |
| Rimfare – avstand til duggpunkt | 1,5 °C | Rimfare når temperatur − duggpunkt er mindre enn dette |
| Manuell kjøring – varighet | 6 t | Hvor lenge ett trykk på knappen kjører anlegget |

**Varsling (Valgfri)**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Pushover destination (valgfri) | pushover | Trengs normalt ikke å justeres. Ved flere ulike grupper kan denne justeres slik at den blir sendt ulikt. |
| Pushover priority | 0 | −2 (Sendes uten varsling), −1 (varsling uten lyd), 0 (Varsel med lyd), 1 (Høy prioritet, rødt varsel, omgår stilleperiode), 2 (nødvarsel som gjentas til det bekreftes). |
| Levetid varsel (timer) | 168 | Hvor lenge skal varslet være synlig før det forsvinner? |
| Send varsel når snøsmelting starter | true | Varsel når «Snøsmelt behov» går fra AV til PÅ |
| Send varsel ved manuell kjøring | true | Sett til true for å sende varsel når automasjonen kjøres manuelt. Sett til false for å ikke sende varsel ved manuell kjøring. |

> Levetid sendes til scriptet i timer. Scriptet regner om til sekunder, som er det Pushover bruker.

## 6. Funksjonsbeskrivelse

1. **Knapp for manuell kjøring:** Ved trykk settes «Manuell kjøring til» til nå + varighet. Er manuell kjøring allerede aktiv, settes tidspunktet til nå (stopp). Endringen starter en ny beregning.
2. **Hent timevarsel** fra weather-entiteten. Er den utilgjengelig, ventes det i opptil 5 minutter på at den kommer tilbake. Døgnvarselet hentes også, men brukes bare til å spå neste start.
3. **Kaldt eller varmt:** Laveste temperatur i «kaldt»-vinduet (standard 6 timer) sammenlignes med grensen (−5 °C). Dette bestemmer hvor mange timer som sjekkes og hvor lang etterdriften er.
4. **Nøkkelverdier** for valgt vindu: sum nedbør, laveste/høyeste temperatur, høyeste fukt, og temperatur/fukt for første time.
5. **Duggpunkt** for første time beregnes med Magnus-formelen.
6. **Snø:** det finnes værdata, det er ikke for varmt, ikke for kaldt, og sum nedbør er minst nedbørsgrensen.
7. **Rim/is:** temperatur − duggpunkt er under marginen og temperaturen er under «for varmt»-grensen.
8. **Tidspunkter:** «Snø sist aktiv» settes til nå hver gang snø er detektert. «Rim sist aktivert» settes bare når rimfare går fra AV til PÅ.
9. **Etterdrift:** aktiv så lenge det er kortere enn etterdriftstiden siden det siste av de to tidspunktene.
10. **Manuell kjøring:** aktiv så lenge «Manuell kjøring til» er i fremtiden.
11. **Samlet behov** = snø ELLER rim ELLER etterdrift ELLER manuell. Skrives til «Snøsmelt behov» kun ved endring.
12. **Årsak, forklaring og detaljer** skrives til tekst-hjelperne, og hendelsen `webhome_snosmelt_update` sendes med alle verdier.

### 6.1 Statustekster

Automasjonen avgjør først hvilken situasjon som gjelder, og skriver den ut på to måter:

- **Årsak (hovedstatus):** én kort, konkret setning. Den endrer seg bare når situasjonen skifter.
- **Forklaring (ekstrastatus):** gjentar ikke årsaken, men legger til tall og når anlegget ser ut til å starte neste gang.

| Situasjon | Årsak (hovedstatus, kort) | Forklaring (ekstrastatus, lang) |
|---|---|---|
| Snø | Start. Meldt snø de neste 3 timene. | Det er meldt 0,6 mm, og det er −2,0 °C. Anlegget går for å holde bakken fri for snø. |
| Frost | Start. Fare for frost. | Det er −1,0 °C og fuktig luft, bare 0,4 °C over duggpunktet. Anlegget går for å holde bakken tørr. |
| Etterdrift | Etterdrift etter snøfall. | Anlegget går i 2 timer til for å smelte og tørke opp det som ligger igjen. |
| Manuell kjøring | Manuell kjøring til kl. 05:58. | Uten manuell kjøring: Stopp. Lite/ingen nedbør og ingen fare for frost de neste 3 timene. |
| Av, ingen snø meldt | Stopp. Lite/ingen nedbør og ingen fare for frost de neste 3 timene. | De neste 5 dagene ser det ikke ut til å bli behov for snøsmelting. |
| Av, snø senere (innen 48 t) | Stopp. Lite/ingen nedbør og ingen fare for frost de neste 3 timene. | I morgen rundt kl. 18 er det meldt snø, som vil starte snøsmeltingen. |
| Av, frost senere (innen 48 t) | Stopp. Lite/ingen nedbør og ingen fare for frost de neste 3 timene. | I dag rundt kl. 18 er det meldt fare for rim, som vil starte snøsmeltingen. |
| Av, snø om flere dager | Stopp. Lite/ingen nedbør og ingen fare for frost de neste 3 timene. | Lørdag 21. nov. er det meldt snø, som trolig vil starte snøsmeltingen. |
| Av, for varmt | Stopp. For varmt de neste 3 timene. | Det er +4,0 °C eller varmere, så snøen smelter av seg selv. De neste 5 dagene ser det ikke ut til å bli behov for snøsmelting. |
| Av, for kaldt | Stopp. For kaldt de neste 6 timene. | Det er −15,0 °C eller kaldere. Anlegget starter ikke på snøfall når det er så kaldt. I dag rundt kl. 22 er det meldt snø, som vil starte snøsmeltingen. |
| Ingen værdata | Stopp. Værvarselet er ikke tilgjengelig. | Anlegget starter ikke på vær før varselet er tilbake. |

- Går manuell kjøring samtidig med snø, frost eller etterdrift, viser årsaken været, og forklaringen får tillegget «Anlegget er også startet manuelt og går til kl. 05:58.».
- Etterdrift etter frost gir årsaken «Etterdrift etter frost.».
- «For varmt» og «for kaldt» kan ha alle tre variantene av neste start (klokkeslett, dag eller ikke behov).
- I tekstene kalles nedbør innenfor temperaturgrensene «snø».
- Hvordan neste start spås, står i §9.2.

## 7. Resultat

| Entitet | Hva skrives |
|---|---|
| Snøsmelt behov | PÅ/AV – samlet behov |
| Snø detektert | PÅ/AV |
| Rim/is detektert | PÅ/AV |
| Årsak for driftsmodus | Kort og konkret hovedstatus, f.eks. «Stopp. Lite/ingen nedbør og ingen fare for frost de neste 3 timene.» |
| Forklaring (valgfri) | Ekstra informasjon som ikke gjentar årsaken, f.eks. «De neste 5 dagene ser det ikke ut til å bli behov for snøsmelting.» |
| Detaljer (valgfri) | Tekst, f.eks. «Nedbør 0.4 mm · Temp -2.5 til -1.0 °C · Fukt maks 87 % · Duggpunkt -4.2 °C» |
| Snø sist aktiv | Tidspunkt for siste kjøring med snø detektert |
| Rim sist aktivert | Tidspunkt da rimfare sist slo inn |
| Manuell kjøring til | Settes av knappen (start/stopp) |

## 8. Varsling

Varsel når snøsmelting starter («Snøsmelt behov» går fra AV til PÅ):

- **Tittel:** `❄️ Snøsmelting aktivert`
- **Melding:** `Årsak: Start. Meldt snø de neste 3 timene.`

Statusvarsel når automasjonen kjøres manuelt fra Home Assistant:

- **Tittel:** `🔔 Snøsmelt - Hent data (manuell kjøring)`
- **Melding:** behov PÅ/AV, årsak og detaljer.

Begge kan slås av i innstillingene.

## 9. Annet

### 9.1 Visning i dashbord

Hjelperne kan vises direkte: «Snøsmelt behov» som hovedknapp, «Snø detektert» og «Rim/is detektert» som underknapper, «Årsak» og «Detaljer» som tekst, og «Snøsmelt manuell kjøring» som trykknapp.

### 9.2 Neste start

Statustekstene er beskrevet i §6.1. Her står det hvordan setningen om neste start lages.

Når anlegget er av og det finnes værdata, legges det til en setning om når det ser ut til å starte neste gang:

| Kilde | Rekkevidde | Hva som spås | Eksempel |
|---|---|---|---|
| Timevarsel | Så langt timevarselet rekker (Met.no: 48 timer) | Snø og rim, med klokkeslett. De vanlige reglene kjøres time for time fremover | «I morgen rundt kl. 18 er det meldt snø, som vil starte snøsmeltingen.» |
| Døgnvarsel | Dagene etter timevarselet (Met.no: til og med dag 5) | Kun snø, uten klokkeslett: nedbør over grensen, laveste temperatur ikke over «for varmt» og høyeste ikke under «for kaldt» | «Lørdag 21. nov. er det meldt snø, som trolig vil starte snøsmeltingen.» |
| Ingen treff | – | – | «De neste 5 dagene ser det ikke ut til å bli behov for snøsmelting.» |

Klokkeslettet er når anlegget ville startet, altså opptil «timer å sjekke» før selve nedbøren. Spådommen brukes bare i teksten. Start og stopp følger fortsatt bare de vanlige timene i §5.

### 9.3 Kjøring sammen med en eldre løsning

Blueprintet bruker egne hjelpere og sin egen hendelse, og skriver ikke til noe annet. Det kan derfor kjøres side om side med en eksisterende snøsmelt-løsning mens det testes.

## 10. Avansert

### 10.1 Forutsettninger

- Home Assistant 2025.11.0 eller nyere.
- Weather-integrasjon med timevarsel som gir `temperature`, `precipitation` og `humidity` (f.eks. Met.no).
- `script.varsel_pushover_send_melding_webhome` (fra `blueprints/scripts/varsel_pushover.yaml`) hvis varsling brukes.
- Hjelpere med **nøyaktig disse entitets-ID-ene** (hardkodet i blueprintet). Enklest: kopier `packages/snosmelt_hjelpere.yaml` til `/config/packages/` og start på nytt. Eller opprett dem manuelt under Innstillinger → Enheter og tjenester → Hjelpere, og kontroller at entitets-ID-en blir lik tabellen:

| Type | Foreslått navn | Entitets-ID (må være lik) | Merknad |
|---|---|---|---|
| Bryter (input_boolean) | Snøsmelt behov | `input_boolean.snosmelt_behov` | |
| Bryter (input_boolean) | Snøsmelt snø detektert | `input_boolean.snosmelt_sno_detektert` | |
| Bryter (input_boolean) | Snøsmelt rim detektert | `input_boolean.snosmelt_rim_detektert` | |
| Tekst (input_text) | Snøsmelt årsak | `input_text.snosmelt_arsak` | Maks lengde 255 |
| Tekst (input_text) | Snøsmelt forklaring | `input_text.snosmelt_forklaring` | Valgfri (hoppes over hvis den ikke finnes). Maks lengde 255 |
| Tekst (input_text) | Snøsmelt detaljer | `input_text.snosmelt_detaljer` | Valgfri (hoppes over hvis den ikke finnes). Maks lengde 255 |
| Dato og tid (input_datetime) | Snøsmelt snø sist aktiv | `input_datetime.snosmelt_sno_sist_aktiv` | Dato og tid |
| Dato og tid (input_datetime) | Snøsmelt rim sist aktivert | `input_datetime.snosmelt_rim_sist_aktivert` | Dato og tid |
| Dato og tid (input_datetime) | Snøsmelt manuell kjøring til | `input_datetime.snosmelt_manuell_til` | Dato og tid. Opprettet manuelt blir ID-en `…_manuell_kjoring_til` – endre den til `…_manuell_til` |
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

Automasjonen er bygget for å være enkel å etterprøve i sporloggen (Trace): hvert steg gjør én ting, og værdataene legges i små tabeller med bare de kolonnene som brukes. Rådataene fra værvarselet ligger bare i stegene «Hent timevarsel» og «Hent døgnvarsel».

**Tabeller**

| Variabel | Steg | Innhold |
|---|---|---|
| `hourly_table` | 7 | Én rad per time i timevarselet: `i`, `tid` (f.eks. «ons 07:00»), `temp`, `nedbor`, `fukt` |
| `window_table` | 9 | Radene fra `hourly_table` som avgjør behovet akkurat nå (3 eller 6 timer) |
| `prediction_table` | 14 | Én rad per fremtidig time, til og med første treff: `tid`, `modus` (kaldt/varmt), `timer`, `nedbor_sum`, `temp_min`, `temp_maks`, `temp`, `duggpunkt`, `sno`, `frost` |
| `daily_table` | 16 | Én rad per døgn: `dato`, `dager_frem`, `temp_hoy`, `temp_lav`, `nedbor`, `etter_timevarsel`, `sno` |

**Vurdering nå**

| Variabel | Beskrivelse |
|---|---|
| `min_temp_cold_window`, `is_cold_mode` | Laveste temperatur i «kaldt»-vinduet, og om det gir kaldt-modus |
| `hours_to_check`, `afterrun_hours` | Valgt vindu og etterdrift for gjeldende modus |
| `temp_list`, `prec_list`, `hum_list`, `has_data` | Kolonnene fra `window_table`, og om alle tre har verdier |
| `precip_sum`, `min_temp`, `max_temp`, `max_hum` | Nøkkelverdier for vinduet |
| `temp_now`, `hum_now`, `dew_point` | Første time i vinduet og beregnet duggpunkt |
| `too_warm`, `too_cold`, `precip_expected`, `snow_detected` | Delvilkår for snø, og resultatet |
| `dew_point_margin`, `frost_near_dew_point`, `frost_cold_enough`, `frost_detected` | Delvilkår for rim, og resultatet |

**Neste start**

| Variabel | Beskrivelse |
|---|---|
| `prediction_last_row`, `prediction_hit` | Siste rad i spådomstabellen, og om den er et treff |
| `daily_hits` | Radene i døgntabellen med snø |
| `next_start_hourly`, `next_start_daily` | Første spådde start som `snow\|tidspunkt` eller `frost\|tidspunkt`, tom hvis ingen |
| `forecast_days` | Antall dager frem døgnvarselet dekker |

**Behov og tekster**

| Variabel | Beskrivelse |
|---|---|
| `afterrun_active`, `afterrun_remaining_h` | Etterdrift |
| `manual_active`, `manual_remaining_h`, `manual_until_text` | Manuell kjøring |
| `weather_demand`, `demand` | Behov fra vær (snø, rim eller etterdrift), og samlet behov |
| `reason_weather`, `reason_combined` | Årsak ut fra været, og årsaken som skrives til hjelperen |
| `explanation_weather`, `next_start_text`, `explanation_text` | Delene av forklaringen, og forklaringen som skrives til hjelperen |
| `details_text` | Værdata som tekst |

Hendelsen `webhome_snosmelt_update` inneholder: `demand_entity`, `demand`, `reason`, `explanation`, `next_start_hourly`, `next_start_daily`, `snow_detected`, `frost_detected`, `afterrun_active`, `manual_active`, `has_data`, `is_cold_mode`, `precip_sum`, `min_temp`, `max_temp`, `max_hum`, `dew_point`, `min_temp_cold_window`.

### 10.5 Feilhåndtering

| Scenario | Håndtering |
|---|---|
| Weather-entiteten er utilgjengelig | Automasjonen venter i opptil 5 minutter på at den kommer tilbake før varselet hentes |
| Værvarselet feiler eller er tomt | `has_data` = false. Snø og rim settes AV. Etterdrift og manuell kjøring virker fortsatt |
| Døgnvarsel mangler | Neste start spås bare fra timevarselet |
| Varselet mangler fukt eller nedbør | Verdier som ikke er tall filtreres bort. Mangler en hel liste, blir `has_data` false |
| Omstart av Home Assistant | Beregningen kjøres 3 minutter etter oppstart |
| Knappen får ny tilstand ved oppstart | Triggeren ignorerer overganger fra `unavailable`, til `unknown`/`unavailable`, og kjøringer uten forrige tilstand, så manuell kjøring startes ikke av en omstart. Første trykk på en helt ny knapp (fra `unknown`) virker |
| Tidspunkt-hjelper er tom | Tolkes som «aldri», altså ingen etterdrift/manuell kjøring |
| En hjelper mangler eller har annen entitets-ID | Automasjonen feiler i steget som skriver til hjelperen (synlig i sporloggen). «Detaljer» er unntaket og hoppes over |

### 10.6 Varsling og debug info

Ingen egne debug-varsler. Feilsøking gjøres i sporloggen (Trace) til automasjonen:

| Spørsmål | Se på steg | Variabel |
|---|---|---|
| Hvilke værdata ble brukt? | 9 – Vurderingstabell | `window_table` |
| Hvorfor ble det (ikke) snø? | 10 og 12 | `precip_sum`, `min_temp`, `max_temp`, `too_warm`, `too_cold`, `precip_expected`, `snow_detected` |
| Hvorfor ble det (ikke) rim? | 11 og 13 | `dew_point`, `dew_point_margin`, `frost_near_dew_point`, `frost_cold_enough`, `frost_detected` |
| Hvorfor står det at neste start er da? | 14 – Spådomstabell | Siste rad i `prediction_table` er treffet. Radene over viser hvorfor timene før ikke ga start |
| Hvorfor er en dag med, eller ikke med? | 16 – Døgntabell | `daily_table` |
| Hvorfor er behovet på? | 21, 22 og 23 | `afterrun_active`, `manual_active`, `demand` |

Kjør automasjonen manuelt for å få gjeldende status tilsendt på Pushover.

### 10.7 Forskjeller fra den opprinnelige «Snøsmelt - Hent data»

- Resultatet skrives til hjelpere i stedet for til YAML-definerte template-sensorer.
- Manuell kjøring styres av en input_button i stedet for et eget script, og utløpet treffes på tidspunktet (ikke først ved neste time).
- Årsaksteksten er skrevet om til en kort, konkret hovedstatus (se §9.2), og er ikke lenger lik teksten i den opprinnelige automasjonen.
- Tidspunkter lagres med minutt-presisjon, og etterdrift regnes nøyaktig fra tidspunktet. Den opprinnelige automasjonen rundet ned til hel time og la på én time, slik at «3 og 6 timer» i praksis ga 4 og 7 timer. Standard er derfor 4 og 7 timer her, som gir samme gangtid.
- Hendelsen heter `webhome_snosmelt_update` (tidligere `metno_next6h_update`).

## 11. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/snosmelt_hent_data.yaml
- Hjelpere: https://github.com/surematu/WebHomeHelpFiles/blob/main/packages/snosmelt_hjelpere.yaml
- Home Assistant packages: https://www.home-assistant.io/docs/configuration/packages/
- weather.get_forecasts: https://www.home-assistant.io/integrations/weather/#action-weatherget_forecasts
