# Driftsmodus – Automatisk valg av varme- eller kjølemodus

## 1. Formål

Denne automasjonen velger automatisk driftsmodus **VINTER** eller **SOMMER** én gang per dag, basert på utetemperatur og værvarselet.

Valgt modus brukes av andre reguleringsfunksjoner (f.eks. varmepumpe-regulering) for å vite om systemet skal kjøre varme eller kjøling.

Automasjonen skal **kun** velge tillatt driftsmodus. Den regulerer ikke temperaturer, varme- eller kjøleeffekt direkte.

## 2. Eksempler på bruk

- **Overgangen vår→sommer:** Gjennomsnittstemperaturen siste 3 dager er over 15 °C og værmeldingen viser maks over 25 °C neste dag. Systemet bytter til SOMMER-modus og varmepumpen kan starte kjøling.
- **Tidlig høst:** Det har vært varmt, men makstemperaturen neste dag er kun 20 °C. Systemet forblir i SOMMER-modus fordi temperaturen fortsatt er over «stoppgrensen».
- **Fast vinterperiode:** Det er 15. november. Uavhengig av vær: systemet velger alltid VINTER i november–februar.
- **Ekstrem varme:** Prognosert maks er 30 °C neste dag. Systemet bytter til SOMMER selv om gjennomsnittstemperaturen er lav.

## 3. FAQ – Ofte stilte spørsmål

**Kan jeg bytte modus manuelt?**
Ja, du kan manuelt endre `input_select.driftsmodus_vinter_sommer` i Home Assistant. Men neste kveld kl. 20:00 vil automasjonen overskrive dette hvis beregnet modus er annerledes.

**Hva skjer om temperaturdata mangler?**
Automasjonen har fallback-logikk: bruker nåværende utetemperatur hvis historikk mangler, og kalenderperiode (faste datoer) som siste utvei. Du vil motta varsel hvis data mangler.

**Hva er fast vinterperiode og sommerperiode?**
Faste perioder er sikkerhetsgrenser: november–februar er alltid VINTER, juni–august er alltid riktig modus basert på beregninger. Disse kan endres i innstillingene.

**Hva er «soltillegg»?**
På dager med lite skyer er sola varmere og den faktiske temperaturen høyere. Soltillegget legger til noen grader på prognosert maksimumstemperatur basert på skydekning – for å gi en mer realistisk vurdering.

**Hva er «hysterese»?**
Hysterese er en buffer som hindrer systemet i å hoppe frem og tilbake mellom VINTER og SOMMER ved grenseverdier. Systemet forblir i SOMMER-modus selv om temperaturen faller litt under «stoppgrensen».

**Varsler automasjonen meg ved modusendring?**
Ja, du får et Pushover-varsel når modus endres, og kan velge å få begrunnelse med i varselet.

## 4. Hva slags info trengs

- En **vær-entitet** i Home Assistant som støtter prognose (f.eks. yr.no)
- En **`input_select`-entitet** med valgene VINTER og SOMMER (standard: `input_select.driftsmodus_vinter_sommer`)
- Følgende entiteter er **hardkodet** og må eksistere i Home Assistant:
  - `sensor.utetemperatur` – nåværende utetemperatur
  - `sensor.utetemperatur_snitt_72_timer` – gjennomsnittstemperatur siste 72 timer (se eksempel i avansert seksjon)

## 5. Innstillinger

**Kalenderperioder:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Fast vinterperiode start | 1. november | Fra denne datoen: alltid VINTER |
| Fast vinterperiode slutt | 1. mars | Til denne datoen: alltid VINTER |
| Fast sommerperiode start | 1. juni | Start av sommerperioden |
| Fast sommerperiode slutt | 31. august | Slutt av sommerperioden |

**Terskler og soltillegg:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Sommergrense – snitt 72 timer | 15 °C | Snitttemperatur over denne → kan bytte til SOMMER |
| Start kjøling – maks neste dag inkl. soltillegg | 25 °C | Skift til SOMMER når maks er over denne |
| Stopp kjøling – maks neste dag inkl. soltillegg | 22 °C | Behold SOMMER mens maks er over denne (hysterese) |
| Ekstrem varme – prognosert maks neste dag | 28 °C | Bytt til SOMMER uavhengig av snitttemperatur |
| Soltillegg ved 0–25 % skydekning | 3 °C | Legges til prognosert maks ved klart vær |
| Soltillegg ved 26–50 % skydekning | 2 °C | Legges til ved litt skydekke |
| Soltillegg ved 51–75 % skydekning | 1 °C | Legges til ved mye skydekke |
| Soltillegg ved 76–100 % skydekning | 0 °C | Ingen tillegg ved overskyet |

**Valgfritt:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Pushover destination | pushover | Mottakergruppe. La stå tomt for å deaktivere varsling |
| Pushover prioritet | 0 | Prioritet for varselet |
| Pushover TTL (sekunder) | 604800 | Levetid for varselet |

**Avansert:**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Kjør automatisk kl. 20:00 | true | Sett til av for å deaktivere automatisk kjøring |
| Send varsel ved manuell kjøring | true | Sett til av for å ikke varsle ved manuell kjøring |
| Vis ekstra begrunnelse | true | Inkluder detaljert begrunnelse i varselet |

## 6. Funksjonsbeskrivelse

Automasjonen kjøres automatisk kl. 20:00 hver kveld og sjekker følgende regler i rekkefølge (stopper ved første treff):

1. **Fast vinterperiode:** Er datoen i vinterperioden? → VINTER
2. **Etablert varmt vær:** Snitt 72t over sommergrense **og** prognosert maks inkl. soltillegg over startgrense → SOMMER
3. **Ekstrem varme:** Prognosert maks over ekstremgrense → SOMMER
4. **Behold SOMMER (hysterese):** Allerede i SOMMER **og** prognosert maks inkl. soltillegg over stoppgrense → behold SOMMER
5. **Behold SOMMER uten prognose:** Allerede i SOMMER, prognose mangler, men snitt 72t er over sommergrense → behold SOMMER
6. **Reserve ved manglende data:** Bruk fast periode eller behold gjeldende modus
7. **Fallback:** VINTER

Beregnet modus sammenlignes med gjeldende modus:
- Ved endring: oppdater modus og send varsel
- Ved lik modus: ingen endring (varsel sendes kun om det er vesentlig datamangel, eller ved manuell kjøring)

## 7. Resultat

- **`input_select.driftsmodus_vinter_sommer`** (eller valgt entitet) settes til VINTER eller SOMMER

## 8. Varsling

Varsling er aktivert som standard (pushover destination er satt til `pushover`).

**Tittel ved modusendring:**
> 🌡️ Driftsmodus SOMMER

eller:
> 🌡️ Driftsmodus VINTER

**Eksempel på melding ved skifte til SOMMER:**
> Endret til sommermodus for kommende natt og morgendagen grunnet vedvarende varmt vær.
>
> Snitt 72t: 16,2 °C | Maks inkl. sol: 26 °C | Skydekke: 15 %
> Match på regel 2.

**Eksempel på varsel, uendret VINTER:**

**Tittel:** 🌡️ Driftsmodus VINTER

**Innhold:**
> Driftsmodus uendret, ingen kjølebehov påvist, forblir vintermodus.
>
> Begrunnelse: Utetemp snitt 72h (18.4) under grense (15) eller makstemperatur inkl. soltillegg (20.3+1) er under grense (22). Skydekke 71%. Detektert temperatur i morgen (20.3) er under grense for ekstrem varme (28). Match på regel 7. Manuelt kjørt sjekk.

Begrunnelsen (regel, verdier) vises kun når «Vis ekstra begrunnelse» er aktivert (standard: på).

## 9. Annet

### 9.1 Virkning av valgt modus

Modus-valget brukes av andre automasjoner (f.eks. varmepumpe-regulering) for å avgjøre om varme eller kjøling er tillatt:

**VINTER:**
- Tillat varmedrift (varmepumpe og panelovner)
- Sperr kjøledrift

**SOMMER:**
- Tillat kjøledrift
- Sperr varmedrift og elektriske varmeovner

## 10. Avansert

### 10.1 Forutsettninger

- **`sensor.utetemperatur`** – nåværende utetemperatur (hardkodet)
- **`sensor.utetemperatur_snitt_72_timer`** – 72-timers snitt (hardkodet)
- **`input_select.driftsmodus_vinter_sommer`** – entitet med valgene VINTER og SOMMER
- Vær-entitet som støtter `weather.get_forecasts` (hourly)
- Pushover-integrasjon og script `script.varsel_pushover_send_melding_webhome`

### 10.2 Eksempler

**`sensor.utetemperatur_snitt_72_timer` (legg i `configuration.yaml`):**
```yaml
sensor:
  - platform: statistics
    name: utetemperatur_snitt_72_timer
    entity_id: sensor.utetemperatur
    state_characteristic: average_step
    max_age:
      hours: 72
```

### 10.3 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| [varmepumpe_regulering.yaml](./blueprints/automation/varmepumpe_regulering.yaml) | Bruker `input_select.driftsmodus_vinter_sommer` for å avgjøre varme/kjøling. Se [README_varmepumpe_regulering.md](./README_varmepumpe_regulering.md) |
| [varsel_pushover.yaml](./blueprints/scripts/varsel_pushover.yaml) | Felles script for Pushover-utsending |

### 10.4 Beregnede verdier og variabler

| Variabel | Beskrivelse |
|---|---|
| Gjennomsnittstemperatur 72t | Lest fra `sensor.utetemperatur_snitt_72_timer` |
| Nåtemperatur | Lest fra `sensor.utetemperatur` (fallback hvis historikk mangler) |
| Soltillegg | Beregnet fra skydekning kl. 10–18 neste dag |
| Maks inkl. soltillegg | Prognosert maks neste dag + soltillegg |
| Utløsende regel | Regel 1–7 som ga det endelige modus-valget |

### 10.5 Feilhåndtering

| Situasjon | Håndtering |
|---|---|
| Driftsmodus-entitet mangler VINTER/SOMMER | Feilvarsel sendes, kjøring avbrytes |
| `sensor.utetemperatur_snitt_72_timer` utilgjengelig | Bruker `sensor.utetemperatur` som fallback |
| Begge temperaturkilder mangler | Kalenderperiode brukes som reserve |
| Temperaturprognose mangler | Prognose-regler hoppes over |
| Skydekning mangler | Soltillegg = 0 °C |
| `sensor.utetemperatur` utilgjengelig | Alltid varsel uavhengig av om historikk kompenserte |

### 10.6 Varsling og debug info

- Alle sentrale mellomverdier er synlige i Home Assistant trace-viewer (stegvise variabler)
- Inkluderer: beregnet modus, utløsende regel, snitt 72t, nå-temp, prognose maks, skydekning, soltillegg, datatilgjengelighet
- «Vis ekstra begrunnelse»-innstillingen inkluderer detaljert begrunnelse i varselet

## 11. Dokumentasjon

- Blueprint-beskrivelsen lenker til denne README-filen:
  https://github.com/surematu/WebHomeHelpFiles/blob/main/README_automatisk_valg_varme_kjoling.md
- Når blueprinten justeres, skal denne README-filen kontrolleres og oppdateres ved behov.
