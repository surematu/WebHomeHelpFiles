# Snøsmelt – Installasjon på et nytt anlegg

Oppskrift for å sette opp hele snøsmelt-løsningen på en ny Home Assistant-instans: værstyring, én automasjon per kontaktor, feilovervåkning, fellesfeil, Pushover-varsel og dashbord.

Oppskriften er skrevet slik at den kan følges både for hånd og av en AI-assistent som jobber i nettleseren (se §9).

Versjon: 2026.11.02

## 1. Hva løsningen består av

| Del | Fil | Antall | Hva den gjør |
|---|---|---|---|
| Hjelpere | [packages/snosmelt_hjelpere.yaml](./packages/snosmelt_hjelpere.yaml) | 1 sett | Lagrer driftsstatus, årsak, tidspunkter og manuell kjøring. Faste entitets-ID-er |
| Snøsmelt - Hent data | [blueprints/automation/snosmelt_hent_data.yaml](./blueprints/automation/snosmelt_hent_data.yaml) | 1 automasjon | Leser værvarselet, avgjør om anlegget skal gå, skriver statustekstene og sender Pushover ved fellesfeil |
| Snøsmelt - Styr utgang | [blueprints/automation/snosmelt_styr_utgang.yaml](./blueprints/automation/snosmelt_styr_utgang.yaml) | 1 automasjon per kontaktor | Slår kontaktoren av og på etter driftsstatusen, overvåker last og spole, sender Pushover ved feil |
| Feilsensorer og fellesfeil | [packages/snosmelt_fellesfeil_eksempel.yaml](./packages/snosmelt_fellesfeil_eksempel.yaml) | 1 per kontaktor, 2 per tavle, 3 for anlegget | Lamper til dashbordet: Feil per kontaktor, Status per tavle, Fellesfeil og Samlestatus |
| Dashbord | [dashboards/snosmelt_dashbord_eksempel.yaml](./dashboards/snosmelt_dashbord_eksempel.yaml) | 3 typer visninger | Startside for bruker, feilsøking for admin, én side per tavle |
| Pushover-script | [blueprints/scripts/varsel_pushover.yaml](./blueprints/scripts/varsel_pushover.yaml) | 1 script | Sender varslene. Må være versjon 2026.08.01 eller nyere |

Funksjonen er beskrevet i [README_snosmelt_hent_data.md](./README_snosmelt_hent_data.md) og [README_snosmelt_styr_utgang.md](./README_snosmelt_styr_utgang.md).

Kjeden er:

```
Værvarsel → Hent data → Snøsmelt - Driftsstatus → Styr utgang (én per kontaktor) → kontaktor
                                                        ↓
              kontaktor Feil → tavle Feil/Status → Fellesfeil → Samlestatus → dashbord og Pushover
```

## 2. Arbeidsregler

Anleggene er i drift og eies av kunder. Går ikke snøsmeltingen, merker mange det.

- **Se først, endre etterpå.** Kartlegg anlegget (§3) uten å endre noe, og avklar planen med den som forvalter anlegget før første endring.
- **Én kontaktor om gangen.** Sett opp én kontaktor, test den ferdig og få den godkjent før de andre legges inn.
- **Aldri to styringer på samme kontaktor.** Finnes det en eldre snøsmelt-automasjon, skal kontaktoren fjernes fra den i samme arbeidsøkt som den nye automasjonen slås på (§6.3).
- **Den gamle løsningen skal virke hele tiden.** Blueprintene bruker egne hjelpere (`snosmelt_*`) og rører ikke eksisterende entiteter. Kontroller likevel at ingen av ID-ene i §5 finnes fra før.
- **Skjul nye sider til de er godkjent.** Sett `visible` til admin-brukeren på nye visninger.
- **Si fra om det som ikke er testet.** Skill mellom «sett virke i Home Assistant» og «bare kontrollert i kode».

## 3. Kartlegging før start

Samle dette før noe opprettes:

| Hva | Hvor det brukes | Eksempel |
|---|---|---|
| Weather-entitet med timevarsel (temperatur, nedbør, luftfuktighet) | Hent data | `weather.forecast_home` |
| Tavler og navn på dem | Tavle-sensorer, tavlesider | Tavle A |
| Per kontaktor: bryter (switch) | Styr utgang, Feil-sensor | `switch.tavle_a_kontaktor_1` |
| Per kontaktor: sensor for last, og normal last når den er inne | Styr utgang, Feil-sensor | `sensor.tavle_a_kontaktor_1_effekt`, 6500 W |
| Per kontaktor: sensor for spoleeffekt og normal verdi (valgfri) | Styr utgang | `sensor.tavle_a_kontaktor_1_spole_effekt`, 2,5 W |
| Eksisterende snøsmelt-automasjoner og hvilke brytere de styrer | §6.3 | – |
| Om Pushover-scriptet finnes, og hvilken versjon | §4 | `script.varsel_pushover_send_melding_webhome` |
| Installerte egendefinerte kort | Dashbord | Bubble Card, plotly-graph |
| Bruker-ID til admin | Skjule sider under testing | Innstillinger → Personer → Brukere |

**Normal last** leses av i historikken til effektsensoren mens kontaktoren er inne. Finnes det ikke historikk, måles den ved å kjøre kontaktoren en kort stund.

Kontroller også hva effektsensoren faktisk måler. Måler én strømtang flere kontaktorer, eller må effekten beregnes fordi spenningsreferansen ikke stemmer, skal dette noteres på tavlesiden (admin-seksjonen).

## 4. Forutsetninger

1. Home Assistant 2025.11.0 eller nyere.
2. Pushover-scriptet `script.varsel_pushover_send_melding_webhome` fra `varsel_pushover.yaml`, versjon **2026.08.01 eller nyere**. Eldre versjoner forstår ikke levetid i timer, og varslene får da feil levetid.
3. Egendefinerte kort fra HACS hvis eksempel-dashbordet brukes uendret: **Bubble Card** (feilsøking og tavlesider) og **plotly-graph** (historikk, kan sløyfes). Startsiden bruker bare standardkort.

## 5. Hjelpere

Opprett hjelperne i [packages/snosmelt_hjelpere.yaml](./packages/snosmelt_hjelpere.yaml), enten ved å legge pakkefila i `/config/packages/` og starte på nytt, eller som hjelpere i brukergrensesnittet.

Entitets-ID-ene er hardkodet i «Hent data» og **må være nøyaktig slik**:

| Navn | Entitets-ID | Merknad |
|---|---|---|
| Snøsmelt - Driftsstatus | `input_boolean.snosmelt_behov` | |
| Snøsmelt - Snø detektert | `input_boolean.snosmelt_sno_detektert` | |
| Snøsmelt - Rim detektert | `input_boolean.snosmelt_rim_detektert` | |
| Snøsmelt - Årsak | `input_text.snosmelt_arsak` | Maks lengde 255 |
| Snøsmelt - Årsak - Utvidet forklaring | `input_text.snosmelt_forklaring` | Maks lengde 255 |
| Snøsmelt - Værdata | `input_text.snosmelt_detaljer` | Maks lengde 255 |
| Snøsmelt - Snø sist aktiv | `input_datetime.snosmelt_sno_sist_aktiv` | Dato og tid |
| Snøsmelt - Rim sist aktivert | `input_datetime.snosmelt_rim_sist_aktivert` | Dato og tid |
| Snøsmelt - Manuellkjøring til | `input_datetime.snosmelt_manuell_til` | Dato og tid |
| Snøsmelt - Sist fullført | `input_datetime.snosmelt_sist_fullfort` | Dato og tid. Trengs for varsel hvis automasjonen stopper |
| Snøsmelt - Feil sist varslet | `input_datetime.snosmelt_feil_sist_varslet` | Dato og tid. Trengs for feilvarsel |
| Snøsmelt - Manuellkjøring | `input_button.snosmelt_manuell_kjoring` | |

Opprettes hjelperne i brukergrensesnittet, lages ID-en av navnet og blir feil (f.eks. `input_boolean.snosmelt_driftsstatus`). Endre ID-en etterpå slik at den er lik tabellen.

**Kontroll:** alle 12 finnes med riktig ID, og de tre tekst-hjelperne har maks lengde 255.

## 6. Automasjoner

### 6.1 Importer blueprintene

Importer begge fra GitHub (Innstillinger → Automasjoner og scener → Blueprints → Importer blueprint):

- `https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/snosmelt_hent_data.yaml`
- `https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/snosmelt_styr_utgang.yaml`

Kontroller versjonsnummeret i beskrivelsen etter import. GitHub kan levere en gammel utgave i noen minutter etter en endring.

### 6.2 Snøsmelt - Hent data

Lag én automasjon. Eneste påkrevde valg er weather-entiteten.

```yaml
alias: Snøsmelt - Hent data
use_blueprint:
  path: surematu/snosmelt_hent_data.yaml
  input:
    weather_entity: weather.forecast_home
```

Standardverdiene er de som er testet. Endres antall timer for manuell kjøring, må teksten på dashbordet rettes tilsvarende.

**Kontroll:** kjør automasjonen én gang og åpne sporingen (trace). Den skal fullføre, «Snøsmelt - Årsak» og «Snøsmelt - Årsak - Utvidet forklaring» skal ha fått tekst, og «Snøsmelt - Sist fullført» skal vise tidspunktet. Stemmer statusen med værvarselet?

### 6.3 Snøsmelt - Styr utgang (én per kontaktor)

Start med **én** kontaktor.

```yaml
alias: Snøsmelt - Styr utgang - Tavle A Kontaktor 1
use_blueprint:
  path: surematu/snosmelt_styr_utgang.yaml
  input:
    demand_entity: input_boolean.snosmelt_behov
    output_switch: switch.tavle_a_kontaktor_1
    output_name: Tavle A Kontaktor 1
    power_sensor: sensor.tavle_a_kontaktor_1_effekt
    power_expected: 6500
    coil_sensor: sensor.tavle_a_kontaktor_1_spole_effekt
    coil_expected: 2.5
```

Rekkefølge når det finnes en eldre styring:

1. Lag den nye automasjonen, men la den være **av**.
2. Fjern kontaktoren fra den gamle automasjonen, og kontroller at den gamle fortsatt styrer de andre.
3. Slå på den nye automasjonen. Kontaktoren skal følge driftsstatusen i løpet av noen sekunder.

Mellom steg 2 og 3 er kontaktoren uten styring. Gjør stegene rett etter hverandre.

**Kontroll:** med driftsstatus AV skal kontaktoren være av. Start manuell kjøring: kontaktoren skal gå inn innen den tilfeldige startforsinkelsen (0 til 30 s) og lasten skal komme opp på normalt nivå. Stopp manuell kjøring: kontaktoren skal gå ut.

## 7. Feilsensorer, fellesfeil og samlestatus

Bruk [packages/snosmelt_fellesfeil_eksempel.yaml](./packages/snosmelt_fellesfeil_eksempel.yaml) som mal, enten som pakkefil eller som mal- og gruppe-hjelpere i brukergrensesnittet med de samme malene.

| Nivå | Entitet (eksempel) | Navn | Regel |
|---|---|---|---|
| Kontaktor | `binary_sensor.<bryter-ID>_feil` (i eksempelfila: `binary_sensor.snosmelt_tavle_a_kontaktor_1_feil`) | `<bryternavn> Feil` | Problem etter 1 minutt når bryteren er på og lasten er under grensen, når driftsstatus er PÅ og bryteren er av, eller når automatikken for kontaktoren er av |
| Tavle | `binary_sensor.snosmelt_<tavle>_feil` | Snøsmelt - `<tavle>` Feil | Problem når én av kontaktorene har feil |
| Tavle | `sensor.snosmelt_<tavle>_status` | Snøsmelt - `<tavle>` Status | Av / På / Problem |
| Anlegg | `binary_sensor.snosmelt_fellesfeil` | Snøsmelt - Fellesfeil | «Hent data» er av, har ikke fullført på over 3 timer, eller en tavle har feil |
| Anlegg | `sensor.snosmelt_fellesfeil_arsak` | Snøsmelt - Fellesfeil årsak | Årsaken i klartekst, eller «Ingen feil» |
| Anlegg | `sensor.snosmelt_samlestatus` | Snøsmelt - Samlestatus | Av / På / Fellesfeil |

- **Grensen for lav last** settes til ca. 70 % av normal last, samme andel som standarden i «Styr utgang».
- **Navn:** feilsensoren til en kontaktor følger navnet til bryteren med « Feil» bak. Alt annet har prefikset «Snøsmelt - ».
- **Ikon:** `mdi:bell-alert` på alle feilsensorer, `device_class: problem`.
- **Faste ID-er:** `binary_sensor.snosmelt_fellesfeil` og `sensor.snosmelt_fellesfeil_arsak` leses av «Hent data» og må hete nøyaktig dette. Uten dem sendes ikke Pushover ved fellesfeil.
- **Reglene «driftsstatus PÅ og bryteren av» og «automatikken er av»** skal bare ligge på kontaktorer som styres av «Styr utgang». Ellers gir kontaktorer som ennå styres av en eldre løsning falsk feil.
- **Automatikk av gir feil.** En kontaktor skal ikke stå i manuell. Slås automatikken av, blir bjella rød etter 1 minutt, fellesfeilen slår inn med årsak «Automatikken for … er av.», og det sendes Pushover hver 24. time til den er slått på igjen.

**Kontroll:** alle sensorene viser OK / Av / «Ingen feil» i normal drift. Slå av automasjonen for én kontaktor: kontaktorens Feil skal gå til Problem etter 1 minutt, deretter tavla, Fellesfeil og Samlestatus.

## 8. Dashbord

Bruk [dashboards/snosmelt_dashbord_eksempel.yaml](./dashboards/snosmelt_dashbord_eksempel.yaml). Fila inneholder tre visninger som limes inn i rå konfigurasjonsredigering og tilpasses der det står «TILPASS».

| Visning | For hvem | Innhold |
|---|---|---|
| Startside (`snosmelt`) | Bruker | Statusboks, Snø og Rim, knapp for manuell kjøring med statusboks, én flis per tavle, knapp til feilsøking (bare admin) |
| Feilsøking (`feilsoking`) | Admin | Alle statusene i hver sin boks, automatikk, historikk, værdata og tidspunkter |
| Tavleside (`tavle-a`) | Bruker og admin | Én boks per kontaktor med effekt, rød bjelle ved feil og robot for automatikken. Egen admin-seksjon med målinger og merknader |

Valg som er gjort, og som bør beholdes for at anleggene skal se like ut:

| Element | Løsning | Hvorfor |
|---|---|---|
| Statusboks på startsiden | Markdown-kort med `ha-alert`: `info` (grå) «Snøsmeltingen er AV», `success` (grønn) «Snøsmelting pågår», `error` (rød) «Fellesfeil» | Skal se ut som en status, ikke som statisk tekst. Bubble Card ble prøvd og forkastet her |
| Tekst i statusboksen | «Snøsmelt - Årsak» først, «Snøsmelt - Årsak - Utvidet forklaring» med liten skrift under | Hovedstatus er kort og endres sjelden, forklaringen gir tilleggsinformasjon |
| Tavle-fliser | Tre like `tile`-kort med `visibility`, grå / gul / rød | Standardkort kan ikke bytte farge etter tekst-tilstand |
| Feil på kontaktor | Underknapp med rød bjelle som bare vises ved feil | Ingen støy i normal drift |
| Automatikk per kontaktor | Underknapp med robot som åpner automasjonen | Viser om automatikken er på. Slås den av, gir det feil og varsel |
| Merknader for admin | Egen seksjon som bare admin ser, med overskrift som slutter på «(Admin)» | Brukeren ser bare det som er relevant |

Begrensninger i Home Assistant som styrer utformingen:

- Markdown-kortet fjerner `style` og `slot`. Ikonet i en `ha-alert` følger typen og kan ikke byttes, og det finnes ingen grå `ha-alert` utover `info`.
- Mal-hjelpere laget i brukergrensesnittet kan ha forsinkelse (`delay_on`), men ikke egne attributter.
- I YAML må `rows` og `columns` i `grid_options` være tall, ikke tekst.

**Kontroll:** åpne hver visning som admin og som vanlig bruker. Kontroller grå tilstand (av), grønn (manuell kjøring) og rød (slå av én kontaktor-automasjon).

## 9. Installasjon gjennom nettleseren (for AI-assistent)

Uten MCP eller filtilgang gjøres alt i brukergrensesnittet. I en innlogget Home Assistant-fane kan de samme kallene som grensesnittet bruker kjøres fra siden:

```js
const hass = document.querySelector('home-assistant').hass;
```

| Oppgave | Kall | Merknad |
|---|---|---|
| Lese entiteter | `hass.states['<entity_id>']` | Brukes til kartlegging og kontroll |
| Opprette hjelper | `hass.callWS({type: 'input_boolean/create', name, icon})`, tilsvarende `input_text` (`max: 255`), `input_datetime` (`has_date: true, has_time: true`) og `input_button` | ID-en lages av navnet og må endres etterpå |
| Endre entitets-ID | `hass.callWS({type: 'config/entity_registry/update', entity_id, new_entity_id})` | |
| Mal- og gruppe-hjelpere | Konfigurasjonsflyt: `hass.callApi('POST', 'config/config_entries/flow', {handler: 'template'})`, deretter stegene flyten ber om | Les feltene i svaret på hvert steg før neste sendes |
| Importere blueprint | `blueprint/import` med `url`, deretter `blueprint/save` med `domain`, `path`, `yaml`, `source_url` og `allow_override: true` | Er GitHub-hurtiglageret gammelt: importer fra `.../blob/<commit-SHA>/...`, men lagre `source_url` mot `main` |
| Lage eller endre automasjon | `hass.callApi('POST', 'config/automation/config/<id>', {alias, use_blueprint: {path, input}})` | Les eksisterende konfigurasjon med `GET` først ved endring |
| Lese sporing | `trace/list` og `trace/get` med `domain: 'automation'`, `item_id` | Kontroller alltid at kjøringen fullførte |
| Dashbord | `lovelace/config` og `lovelace/config/save` med `url_path` | Lagring erstatter **hele** dashbordet. Les først, endre bare de aktuelle visningene, og ta vare på en kopi |

Arbeidsmåte:

1. Kartlegg (§3) og legg frem en plan. Ikke endre noe før planen er godkjent.
2. Følg §4 til §8 i rekkefølge, med kontrollen etter hvert steg.
3. Les tilbake det som ble lagret etter hver endring, og kontroller at alt annet er urørt.
4. Skal en automasjon prøvekjøres uten at det sendes Pushover: lagre den midlertidig med `varsel_ved_manuell_kjoring: false`, kjør den, les sporingen, og lagre den tilbake uten overstyringen.
5. Endringer som gjøres på ett anlegg og som gjelder alle, skal også inn i blueprint, pakkefiler, eksempel-dashbord og README her, med nytt versjonsnummer.

## 10. Sluttkontroll

| Nr. | Test | Forventet |
|---|---|---|
| 1 | Kjør «Hent data» manuelt | Fullfører, årsak og forklaring oppdatert, «Sist fullført» satt |
| 2 | Manuell kjøring på | Driftsstatus PÅ, kontaktoren inne innen 30 s, grønn statusboks, tavle-flis gul |
| 3 | Manuell kjøring av | Driftsstatus følger været igjen, kontaktoren ute |
| 4 | Slå en kontaktor på for hånd mens driftsstatus er AV | Automasjonen slår den av igjen etter ca. 35 s |
| 5 | Slå av kontaktorens automasjon | Rød bjelle på kontaktoren etter 1 minutt, tavla Problem, Fellesfeil, Pushover «🔔 Snøsmelt - Fellesfeil» |
| 6 | Slå automasjonen på igjen | Kontaktoren går inn straks, feilene forsvinner |
| 7 | Slå av «Hent data» | Fellesfeil med årsak «Snøsmeltingen er skrudd av». Det sendes ikke Pushover i dette tilfellet |
| 8 | Vanlig bruker | Ser startside og tavlesider, ikke admin-seksjoner og feilsøking |
| 9 | Første reelle snøfall eller rim | Start, etterdrift og stopp stemmer med statustekstene |

Testene som gir Pushover (nr. 5) avtales på forhånd med den som mottar varslene.

## 11. Etter godkjenning

- Legg inn resten av kontaktorene, én tavle om gangen, med samme rekkefølge som i §6.3.
- Fjern den gamle automasjonen når den ikke styrer noe lenger.
- Fjern `visible` fra visningene og legg knappen til snøsmelt-siden på hovedstartsiden (nederst i eksempel-dashbordet).
- Rett opp tekster som viser til gammel og ny løsning.

## 12. Kjente begrensninger

- Er «Hent data» slått av, sendes ingen Pushover. Fellesfeil-lampa blir rød.
- «Styr utgang» har ingen egen sjekk for at den selv har stoppet. Går ikke kontaktoren inn ved behov, fanges det av feilsensoren og fellesfeilen.
- Spådommen om neste start brukes bare i teksten. Start og stopp følger timene i innstillingene.
