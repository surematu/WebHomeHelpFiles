# Kontaktor-overvåking – Installasjon på et nytt anlegg

Oppskrift for å sette opp overvåking av kontaktorer som skal ligge inne (f.eks. elkolber i varmtvannsberedere) på en ny Home Assistant-instans: én robot per kontaktor, feil-hjelpere, tavlestatus, fellesfeil, overordnet robot, Pushover og dashbord. Oppsettet er det samme som for tappevann på vtoppen.

Oppskriften er skrevet slik at den kan følges både for hånd og av en AI-assistent som jobber i nettleseren (se §11).

I eksemplene står **«Tappevann»** for anlegget og **«RS50-54»** for en tavle. Bytt med anleggets egne navn.

Versjon: 2026.11.00

## 1. Hva løsningen består av

| Del | Fil | Antall | Hva den gjør |
|---|---|---|---|
| Kontaktor - Overvåking | [blueprints/automation/kontaktor_overvaking.yaml](./blueprints/automation/kontaktor_overvaking.yaml) | 1 robot per kontaktor | Sjekker ikke på, spole, ingen last, ikke full last, henger inne og vern. Varsler hva som er feil, og «OK igjen» |
| Feil-hjelper | – | 1 per kontaktor | input_boolean som roboten slår PÅ ved feil og AV når kontaktoren er OK |
| Status-sensorer | [packages/kontaktor_overvaking_status_eksempel.yaml](./packages/kontaktor_overvaking_status_eksempel.yaml) | 2 per tavle, 3 for anlegget | Antall feil og status per tavle, antall feil totalt, Fellesfeil og Fellesfeil årsak |
| Kontaktor - Fellesfeil varsel | [blueprints/automation/kontaktor_fellesfeil.yaml](./blueprints/automation/kontaktor_fellesfeil.yaml) | 1 robot for anlegget | Varsler straks når en robot er AV, samlet påminnelse og «Tilbake i normal drift» |
| Feil sist varslet | – | 1 for anlegget | input_datetime som den overordnede roboten bruker |
| Dashbord | [dashboards/kontaktor_overvaking_dashbord_eksempel.yaml](./dashboards/kontaktor_overvaking_dashbord_eksempel.yaml) | 3 typer visninger | Oversikt, én side per tavle, admin info |
| Pushover-script | [blueprints/scripts/varsel_pushover.yaml](./blueprints/scripts/varsel_pushover.yaml) | 1 script | Sender varslene. Versjon 2026.08.01 eller nyere |

Funksjonen er beskrevet i [README_kontaktor_overvaking.md](./README_kontaktor_overvaking.md) og [README_kontaktor_fellesfeil.md](./README_kontaktor_fellesfeil.md).

Kjeden er:

```
bryter + spole + last → <bryternavn> - Robot → <bryternavn> Feil (feil-hjelper)
                                                        ↓
           Antall feil per tavle → Status per tavle → Antall feil totalt → Fellesfeil + Fellesfeil årsak
                                                        ↓
                                  <Anlegg> - Robot (overordnet) → Pushover
```

Hvem varsler hva:

| Hvem | Sender |
|---|---|
| Robot per kontaktor | Feilvarsel med hva som er feil, og «OK igjen» |
| Overordnet robot | Straks-varsel når en robot er AV, samlet påminnelse hver 24. time så lenge Fellesfeil står, «Tilbake i normal drift» bare hvis den selv har varslet |

## 2. Arbeidsregler

Anleggene er i drift og eies av kunder. Går ikke varmtvannet, merker mange det.

- **Se først, endre etterpå.** Kartlegg (§3 og §4) uten å endre noe, og avklar planen med den som forvalter anlegget.
- **Én kontaktor først.** Sett opp én kontaktor, sjekk sporloggen, og få den godkjent før de andre legges inn.
- **Ikke slå kontaktorer av for å teste.** Overvåkingen skal kunne testes uten å røre utgangene (§12).
- **Kontaktorkortet skal aldri kunne slå av en kontaktor.** Bruk kortet slik det er i eksemplet (alle trykk åpner info).
- **Den gamle løsningen skal virke hele tiden.** Nye sider legges som egne visninger og skjules for andre enn admin til de er godkjent.
- **Si fra om det som ikke er testet.** Skill mellom «sett virke i Home Assistant» og «bare kontrollert i kode».

## 3. Kartlegging før start

| Hva | Hvor det brukes | Eksempel |
|---|---|---|
| Tavler og navn på dem | Status-sensorer, tavlesider | RS50-54 |
| Per kontaktor: bryter (switch) og navnet | Robot, feil-hjelper | `switch.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1`, «VVB XK1 (+RS52=434.002-XO01.1)» |
| Per kontaktor: sensor for spoleeffekt | Robot | `sensor.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_kontaktor_effekt` |
| Per kontaktor: sensor for last | Robot | `sensor.tavle_rs52_rs52_434_002_xi1_vvb_xk1_effekt_kalkulert` |
| Per kontaktor: vern fra reléet (Shelly: Overcurrent, Overheating, Overvoltage, Overpowering) | Robot | `binary_sensor.<bryter-ID>_overcurrent` |
| Kontaktorer som står AV med vilje | Sluttkontroll | Disse vil gi «Ikke på»-feil |
| Pushover-scriptet og versjon | §5 | `script.varsel_pushover_send_melding_webhome` |
| Bubble Card installert (HACS) | Dashbord | – |
| Systembilder med temperaturer (picture-elements) | Oversikt | Fra eksisterende dashbord |
| Bruker-ID til admin | Skjule sider under testing | Innstillinger → Personer → Brukere |

Kontroller også hva lastsensoren faktisk måler. Med én strømtang per kurs i IT-nett faller målt effekt til ca. 58 % (1/√3) når ett av elementene på den målte lederen kobler ut på termostat. Det er normal drift, og noteres i admin-delen på tavlesiden.

## 4. Finn grensene

Se på historikken for spole og last for hver kontaktor, 3–7 døgn (mer i [README_kontaktor_overvaking.md](./README_kontaktor_overvaking.md) §10.7):

| Verdi | Slik finner du den | Eksempel (vtoppen) |
|---|---|---|
| Spole – forventet effekt | Normal spoleeffekt når kontaktoren ligger inne | 1,4–1,9 W |
| Last – full effekt | Høyeste vanlige nivå som nås **hver dag** | 6500 W (RS52), 8700 W og 7900 W (RS60) |
| Ingen last – forsinkelse | Minst 2–3 ganger lengste normale pause med 0 W | 60 min (lengste pause var 20 min) |
| Ikke full last | Behold 80 % / 24 t hvis full effekt nås hver dag. Sett 0 % ellers | 80 % / 24 t |

## 5. Forutsetninger

1. Home Assistant 2025.11.0 eller nyere.
2. Pushover-scriptet `script.varsel_pushover_send_melding_webhome` fra `varsel_pushover.yaml`, versjon **2026.08.01 eller nyere**.
3. **Bubble Card** fra HACS hvis eksempel-dashbordet brukes.

## 6. Hjelpere

| Hjelper | Type | Navn | Entitets-ID | Merknad |
|---|---|---|---|---|
| Feil per kontaktor | input_boolean | `<bryternavn> Feil` | `input_boolean.<bryter-ID uten switch.>_feil` | Ikon `mdi:bell-alert` |
| Feil sist varslet | input_datetime (dato og tid) | `<Anlegg> - Feil sist varslet` | `input_datetime.<anlegg>_feil_sist_varslet` | Ikon `mdi:bell-ring`. Sett til 2000-01-01 00:00 når den er laget |

Opprettes hjelperne i brukergrensesnittet, lages ID-en av navnet. Endre ID-en etterpå slik at den følger tabellen, f.eks. `switch.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1` → `input_boolean.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_feil`.

## 7. Robot per kontaktor

### 7.1 Importer blueprintene

- `https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/kontaktor_overvaking.yaml`
- `https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/kontaktor_fellesfeil.yaml`

Kontroller versjonsnummeret i beskrivelsen etter import.

### 7.2 Lag roboten for én kontaktor

**Navn:** `<bryternavn> - Robot`. Entitets-ID: bryterens ID + `_robot` (endres under innstillingene for automasjonen etter lagring).

```yaml
alias: VVB XK1 (+RS52=434.002-XO01.1) - Robot
use_blueprint:
  path: surematu/kontaktor_overvaking.yaml
  input:
    output_switch: switch.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1
    notify_prefix: Tappevann
    expected_state: alltid_pa
    fault_latch: input_boolean.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_feil
    coil_sensor: sensor.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_kontaktor_effekt
    coil_expected: 1.7
    power_sensor: sensor.tavle_rs52_rs52_434_002_xi1_vvb_xk1_effekt_kalkulert
    power_full: 6500
    protection_sensors:
      - binary_sensor.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_overcurrent
      - binary_sensor.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_overheating
      - binary_sensor.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_overvoltage
      - binary_sensor.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_overpowering
    send_scheduled_reminder: false   # den overordnede roboten (§9) sender samlet påminnelse
```

- `expected_state: alltid_pa` for kontaktorer som skal ligge inne hele tiden. `ingen` for kontaktorer som styres av noe annet.
- `auto_turn_on` står AV som standard. Slå den bare på når det er avtalt.

**Skru roboten av og på én gang etter at den er lagret.** Da kjører oppstartsjekken, og en feil som allerede står (f.eks. en kontaktor som er AV) blir registrert etter 5 minutter.

**Kontroll:** åpne sporloggen (trace). Kjøringen skal fullføre, `monitor_table` (steg 11) skal vise riktige målinger og grenser, og `feil_na` skal være false for en kontaktor som virker.

### 7.3 Resten av kontaktorene

Lag resten på samme måte, med grenser fra §4. Skru hver robot av og på én gang. Kontaktorer som står AV vil gå i feil og sende Pushover etter 5 minutter.

## 8. Status-sensorer

Bruk [packages/kontaktor_overvaking_status_eksempel.yaml](./packages/kontaktor_overvaking_status_eksempel.yaml), som pakkefil eller som mal-hjelpere i brukergrensesnittet med de samme malene (slik det er gjort på vtoppen).

| Nivå | Entitets-ID | Navn | Regel |
|---|---|---|---|
| Tavle | `sensor.<anlegg>_<tavle>_antall_feil` | `<Anlegg> - <tavle> Antall feil` | Antall kontaktorer der feil-hjelperen er PÅ eller roboten er AV. Tom liste = ukjent |
| Tavle | `sensor.<anlegg>_<tavle>_status` | `<Anlegg> - <tavle> Status` | I drift / Problem / Ikke overvåket |
| Anlegg | `sensor.<anlegg>_antall_feil` | `<Anlegg> - Antall feil` | Summen av tavlene |
| Anlegg | `binary_sensor.<anlegg>_fellesfeil` | `<Anlegg> - Fellesfeil` | En tavle har Problem, eller den overordnede roboten er AV. `device_class: problem` |
| Anlegg | `sensor.<anlegg>_fellesfeil_arsak` | `<Anlegg> - Fellesfeil årsak` | F.eks. «RS60-62: feil på XK3, XK4.» eller «Ingen feil» (maks 255 tegn) |

- Listene over kontaktorer står i malen for Antall feil på hver tavle og i Fellesfeil årsak. Legges en kontaktor til eller fjernes, må begge oppdateres (og robot-listen i den overordnede roboten, §9).
- Ikon: `mdi:bell-alert` på feil og antall, `mdi:water-boiler` (eller passende) på tavlestatus.
- Endres en mal-hjelper senere, må alle feltene sendes inn på nytt (f.eks. `device_class: problem` på Fellesfeil), ellers forsvinner de.

**Kontroll:** i normal drift viser tavlene «I drift», Antall feil 0 og Fellesfeil OK. Slå feil-hjelperen for én kontaktor PÅ i noen sekunder (under 2 minutter, ellers nullstiller roboten den og sender «OK igjen»): tavla skal gå til Problem og Fellesfeil til PÅ, og tilbake når den slås AV.

## 9. Overordnet robot

**Navn:** `<Anlegg> - Robot`, entitets-ID `automation.<anlegg>_robot`.

```yaml
alias: Tappevann - Robot
use_blueprint:
  path: surematu/kontaktor_fellesfeil.yaml
  input:
    common_fault: binary_sensor.tappevann_fellesfeil
    common_fault_reason: sensor.tappevann_fellesfeil_arsak
    fault_notified: input_datetime.tappevann_feil_sist_varslet
    notify_prefix: Tappevann
    robots:
      - automation.tavle_rs52_vvb_xk1_rs52_434_002_xo01_1_robot
      # … alle robotene per kontaktor
```

Ta med `automation.<anlegg>_robot` i Fellesfeil og Fellesfeil årsak (se eksempelfila), så den vises som feil når den er AV.

**Kontroll:** skru roboten av og på. Sporloggen (steg 6, `decision_text`) skal si hva den vurderte. Står Fellesfeil fordi en kontaktor har feil, skal den ikke sende noe (kontaktorens robot har varslet).

## 10. Dashbord

Bruk [dashboards/kontaktor_overvaking_dashbord_eksempel.yaml](./dashboards/kontaktor_overvaking_dashbord_eksempel.yaml).

| Visning | For hvem | Innhold |
|---|---|---|
| Oversikt (`v2`) | Bruker | Statusboks med årsak, Fellesfeil, antall kontaktorer med feil, én flis per tavle (grønn / rød / grå), systembilder med temperaturer, knapp til admin info (bare admin) |
| Tavleside (`v2-<tavle>`) | Bruker og admin | Statusboks for tavla, ett Bubble Card per kontaktor, varmepumpe, admin-del med målinger og 24 t graf |
| Admin info (`v2-admin`) | Admin | Statusboks med feilinformasjon, Bubble Card for alle status-hjelperne, den overordnede roboten og «Feil sist varslet» |

Valg som er gjort, og som bør beholdes for at anleggene skal se like ut:

| Element | Løsning | Hvorfor |
|---|---|---|
| Kontaktorkort | Bubble Card `switch`, lyser når PÅ. `tap_action`, `button_action` med `double_tap_action: none` og `hold_action: more-info` | Ser ut som snøsmelt, men et trykk kan aldri slå av kontaktoren |
| Underknapper | Last, spole, rød bjelle (bare ved feil), robot. `.bubble-sub-button-3` rød | Feil vises bare når den står |
| Statusboks | Markdown med `ha-alert` og teksten fra Fellesfeil årsak | Samme som snøsmelt |
| Tavle-fliser | Tre `tile`-kort med `visibility` | Standardkort kan ikke bytte farge etter tekst-tilstand |
| Graf over last | `statistics-graph` med 5-minutters snitt | En vanlig historikkgraf av lastsensorer som oppdateres hvert par sekund henter over en million punkter per visning |
| Admin | Egen underside med knapp fra oversikten | Brukeren ser bare det som er relevant |

**Kontroll:** åpne hver visning som admin. Kontroller at ingen kort viser «Entitet ikke funnet».

## 11. Installasjon gjennom nettleseren (for AI-assistent)

Bruk de samme kallene som i [README_snosmelt_installasjon.md](./README_snosmelt_installasjon.md) §9 (hjelpere, entitets-ID, mal-hjelpere, blueprint-import, automasjoner, sporlogg, dashbord). I tillegg:

| Oppgave | Kall | Merknad |
|---|---|---|
| Endre en mal-hjelper | `config/config_entries/options/flow` med `handler: <entry_id>`, les `data_schema` (forslagsverdiene er dagens oppsett), send inn alle feltene igjen | Felt som ikke sendes, forsvinner |
| Finne alle steder en entitet brukes | Søk i alle dashbord (`lovelace/config`), alle automasjoner (`config/automation/config/<id>`) og alle mal-hjelpere (options-flyt, avbryt med `DELETE`) | Gjør dette før en entitets-ID endres |
| Kjøre oppstartsjekken | `automation.turn_off` og `automation.turn_on` på roboten | En ny robot må skrus av og på én gang |
| Teste malene uten å lagre | `render_template` med `variables` | Fanger feil i Jinja før blueprinten tas i bruk |
| Validere en blueprint | `blueprint/substitute` og deretter `validate_config` | Sjekker at triggere og handlinger er gyldige med valgte innganger |

## 12. Sluttkontroll

| Nr. | Test | Forventet |
|---|---|---|
| 1 | Sporlogg for hver robot etter av/på | Fullført, riktige målinger, ingen feil for kontaktorer som virker |
| 2 | Kontaktor som står AV med vilje | Feil-hjelper PÅ etter 5 min, rød bjelle, tavla Problem, Pushover fra roboten |
| 3 | Feil-hjelper PÅ i noen sekunder | Tavla Problem og Fellesfeil PÅ, tilbake når den slås AV |
| 4 | Skru av én robot i over 1 minutt (avtales med mottaker) | «🔔 <Anlegg> - Fellesfeil: Overvåkingen er skrudd AV for …» |
| 5 | Skru den på igjen | Står ingen annen feil: «✅ <Anlegg> - Tilbake i normal drift» etter 1 minutt |
| 6 | Kjør den overordnede roboten manuelt | Statusmelding på Pushover |
| 7 | Vanlig bruker | Ser ikke admin-delene |

Testene som gir Pushover (nr. 4–6) avtales på forhånd med den som mottar varslene.

## 13. Kjente begrensninger

- Med én strømtang per kurs vises ikke et dødt element som ikke henger på den målte lederen. Spolesjekken viser at kontaktoren trekker inn, ikke at hovedkontaktene leder.
- Oppstartsjekken dekker ikke på, spole, henger inne og vern. «Ingen last» og «Ikke full last» fanges når avviket oppstår på nytt etter en omstart.
- Forsinkelsene (f.eks. 24 t for «Ikke full last») starter på nytt ved omstart av Home Assistant.
- Er den overordnede roboten AV, sendes ingen fellesfeil-varsler. Fellesfeil-lampa blir rød.
- Listene over kontaktorer må holdes like i Antall feil per tavle og Fellesfeil årsak.
