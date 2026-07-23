# Funksjonsbeskrivelse – Automatisk valg av varme- eller kjølemodus

## 1) Formål

Denne funksjonen velger automatisk driftsmodus **VARME** eller **KJØLING**.
Valgt modus brukes av andre reguleringsfunksjoner.

Funksjonen skal **kun** velge tillatt driftsmodus, og skal ikke:
- regulere temperatursettpunkter
- styre varme-/kjøleeffekt direkte
- starte/stoppe varmepumpen direkte

Normalmodus er **VARME** når kjølebehov ikke er påvist.
Det finnes ingen nøytral modus.

## 2) Kjøretid

- Kjøring: hver dag kl. **20:00**
- Valgt modus beholdes til neste kjøring
- Modus skal ikke endres kontinuerlig gjennom døgnet

## 3) Datagrunnlag

Ved hver kjøring brukes følgende når tilgjengelig:
- Gjennomsnittstemperatur siste 72 timer
- Nåværende utetemperatur
- Prognosert maksimumstemperatur neste døgn
- Prognosert skydekning neste døgn kl. 10:00–18:00
- Gjeldende dato
- Gjeldende driftsmodus

### Prioritet temperaturgrunnlag
1. Gjennomsnitt av tilgjengelige temperaturverdier siste 72 timer
2. Nåværende utetemperatur hvis historikk mangler
3. Kalenderbasert reservefunksjon hvis begge mangler

## 4) Beregnede verdier

### 4.1 Temperaturgrunnlag
- Bruker prioritet over
- Verdien omtales som: **Gjennomsnittstemperatur siste 72 timer**

### 4.2 Soltillegg basert på skydekning (10:00–18:00)
Faste intervaller:
- 0–25 %
- 26–50 %
- 51–75 %
- 76–100 %

Hvis skydekningsprognose mangler: soltillegg = 0 °C.

### 4.3 Makstemperatur neste døgn inkl. soltillegg
`Makstemperatur inkl. soltillegg = Prognosert maks neste døgn + Soltillegg`

Verdien brukes kun som beslutningsgrunnlag.

## 5) Parametere (standard)

| Parameter | Standard |
|---|---:|
| Fast vinterperiode start | 1. november |
| Fast vinterperiode slutt | 1. mars |
| Fast sommerperiode start | 1. juni |
| Fast sommerperiode slutt | 31. august |
| Sommergrense – gjennomsnitt siste 72 timer | 15 °C |
| Start kjøling – makstemperatur inkl. soltillegg | 23 °C |
| Stopp kjøling – makstemperatur inkl. soltillegg | 20 °C |
| Ekstrem varme – prognosert maks neste døgn | 27 °C |
| Soltillegg ved 0–25 % skydekning | 3 °C |
| Soltillegg ved 26–50 % skydekning | 2 °C |
| Soltillegg ved 51–75 % skydekning | 1 °C |
| Soltillegg ved 76–100 % skydekning | 0 °C |

## 5.1) Anbefalt helper (eksempel-YAML)

### Gjennomsnittstemperatur siste 72 timer

```yaml
sensor:
  - platform: statistics
    name: OutdoorTempAvg72h
    entity_id: sensor.outdoor_temperature
    state_characteristic: average_step
    max_age:
      hours: 72
```

## 6) Beslutningsregler (rekkefølge og stopp ved første treff)

1. **Vinterperiode**: alltid VARME
2. **Start kjøling ved etablert varmt vær**: snitt 72t over sommergrense **og** maks inkl. soltillegg over startgrense
3. **Start kjøling ved ekstrem varme**: prognosert maks over ekstremgrense
4. **Behold kjøling (hysterese)**: gjeldende KJØLING og maks inkl. soltillegg over stoppgrense
5. **Behold kjøling ved manglende prognose**: prognose mangler, gjeldende KJØLING, snitt 72t over sommergrense
6. **Reserve ved manglende temperaturgrunnlag**:
   - VARME i vinterperiode
   - KJØLING i sommerperiode
   - behold gjeldende modus i overgangsperioder
7. **Fallback**: VARME

## 7) Gjennomføring av modusendring

Etter beregning sammenlignes beregnet modus med gjeldende modus:
- Ved forskjell: oppdater modus + send varsel
- Ved lik modus: ingen endring i modus
- Ved vesentlig datamangel uten endring: send info-/avviksvarsel
- Ved manuelt kjørt sjekk: send alltid varsel uavhengig av modusendring

## 8) Varsling

Varsel ved modusendring skal inkludere:
- Tittel i formatet `🌡️ Driftsmodus <modus>`
- Kort starttekst (for Regel 2: `Endret til kjøling for kommende natt og morgendagen grunnet vedvarende varmt vær.`)
- Begrunnelse med `Match på regel 2.` på slutten for Regel 2 (vises kun hvis `Vis ekstra begrunnelse` er aktivert, standard: av)
- Manglende data (kun når data faktisk mangler)
- `Manuelt kjørt sjekk.` på slutten av begrunnelsen når automasjonen er manuelt kjørt

Avanserte innstillinger for varsling:
- `Ikke kjør automatisk hver kveld` (standard: av) — sett til av for å deaktivere automatisk kjøring kl. 20:00
- `Ikke send varsel ved manuell kjøring` (standard: av) — sett til av for å ikke sende varsel ved manuell kjøring
- `Vis ekstra begrunnelse` (standard: av) — aktiver for å inkludere detaljert begrunnelse i varselet

## 9) Virkning av valgt modus

### VARME
- Tillat varmedrift
- Tillat elektriske varmeovner
- Sperr kjøledrift

### KJØLING
- Tillat kjøledrift
- Sperr varmedrift
- Sperr elektriske varmeovner

## 10) Feilhåndtering (prioritet)

1. Vinterperiode => VARME
2. Bruk historikk hvis tilgjengelig
3. Ellers bruk nåverdi
4. Hvis begge mangler: kalenderreserve
5. Mangler temperaturprognose: hopp over prognose-regler
6. Mangler skydekning: soltillegg = 0 °C
7. Ved modusendring med manglende data: opplys i varsel
8. Ved vesentlig datamangel uten endring: info-/avviksvarsel

## 11) Statusverdier for feilsøking

Blueprinten skal gjøre sentrale mellomverdier synlige i trace (stegvis variabler), inkludert:
- gjeldende/beregnet modus
- utløsende regel
- snitt 72t, nå-temp, prognose maks, skydekning 10–18, soltillegg, maks inkl. soltillegg
- aktiv kalenderperiode
- datatilgjengelighet (historikk/nå/prognose/skydekning)
- om modus ble endret

## 12) Dokumentasjon

- Blueprint-beskrivelsen lenker til denne README-filen:
  https://github.com/surematu/WebHomeHelpFiles/blob/main/README_automatisk_valg_varme_kjoling.md
- Når blueprinten justeres, skal denne README-filen kontrolleres og oppdateres ved behov.
