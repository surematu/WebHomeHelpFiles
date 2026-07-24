# Funksjonsbeskrivelse – Automatisk valg av vinter- eller sommermodus

## 1) Formål

Denne funksjonen velger automatisk driftsmodus **VINTER** eller **SOMMER**.
Valgt modus brukes av andre reguleringsfunksjoner.

Funksjonen skal **kun** velge tillatt driftsmodus, og skal ikke:
- regulere temperatursettpunkter
- styre varme-/kjøleeffekt direkte
- starte/stoppe varmepumpen direkte

Normalmodus er **VINTER** når kjølebehov ikke er påvist.
Det finnes ingen nøytral modus.

## 2) Kjøretid

- Kjøring: hver dag kl. **20:00**
- Valgt modus beholdes til neste kjøring
- Modus skal ikke endres kontinuerlig gjennom døgnet

## 3) Datagrunnlag

Ved hver kjøring brukes følgende når tilgjengelig:
- Gjennomsnittstemperatur siste 72 timer (`sensor.utetemperatur_snitt_72_timer`)
- Nåværende utetemperatur (`sensor.utetemperatur`)
- Prognosert maksimumstemperatur neste døgn
- Prognosert skydekning neste døgn kl. 10:00–18:00
- Gjeldende dato
- Gjeldende driftsmodus

Følgende entiteter er konfigurert som blueprint-input:
- `input_select.driftsmodus_vinter_sommer` – driftsmodus-helper med valgene VINTER og SOMMER (standard, kan endres i UI)

Følgende entiteter er **hardkodet** i blueprinten (konfigureres ikke i UI):
- `sensor.utetemperatur` – nåværende utetemperatur
- `sensor.utetemperatur_snitt_72_timer` – gjennomsnittstemperatur siste 72 timer

### Prioritet temperaturgrunnlag
1. Gjennomsnitt av tilgjengelige temperaturverdier siste 72 timer (`sensor.utetemperatur_snitt_72_timer`)
2. Nåværende utetemperatur (`sensor.utetemperatur`) hvis historikk mangler
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

Blueprinten bruker alltid `sensor.utetemperatur_snitt_72_timer` for 72t snitt
og `sensor.utetemperatur` for nåværende utetemperatur (begge er hardkodet).
`input_select.driftsmodus_vinter_sommer` velges som blueprint-input (standard).

```yaml
sensor:
  - platform: statistics
    name: utetemperatur_snitt_72_timer
    entity_id: sensor.utetemperatur
    state_characteristic: average_step
    max_age:
      hours: 72
```

## 6) Beslutningsregler (rekkefølge og stopp ved første treff)

1. **Vinterperiode**: alltid VINTER
2. **Start sommermodus ved etablert varmt vær**: snitt 72t over sommergrense **og** maks inkl. soltillegg over startgrense
3. **Start sommermodus ved ekstrem varme**: prognosert maks over ekstremgrense
4. **Behold sommermodus (hysterese)**: gjeldende SOMMER og maks inkl. soltillegg over stoppgrense
5. **Behold sommermodus ved manglende prognose**: prognose mangler, gjeldende SOMMER, snitt 72t over sommergrense
6. **Reserve ved manglende temperaturgrunnlag**:
   - VINTER i vinterperiode
   - SOMMER i sommerperiode
   - behold gjeldende modus i overgangsperioder
7. **Fallback**: VINTER

## 7) Gjennomføring av modusendring

Etter beregning sammenlignes beregnet modus med gjeldende modus:
- Ved forskjell: oppdater modus + send varsel
- Ved lik modus: ingen endring i modus
- Ved vesentlig datamangel uten endring: send info-/avviksvarsel
- Ved manuelt kjørt sjekk: send alltid varsel uavhengig av modusendring

## 8) Varsling

Varsel ved modusendring skal inkludere:
- Tittel i formatet `🌡️ Driftsmodus <modus>`
- Kort starttekst:
  - Regel 2 (endring til SOMMER): `Endret til sommermodus for kommende natt og morgendagen grunnet vedvarende varmt vær.`
  - Regel 7 (endring til VINTER): `Endret til vinter for kommende natt og morgendagen grunnet kaldt vær.`
  - Regel 4 (uendret): `Driftsmodus uendret, fortsett med sommermodus grunnet fortsatt forventet kjølebehov.`
  - Regel 7 (uendret): `Driftsmodus uendret, ingen kjølebehov påvist, forblir vintermodus.`
  - Andre regler (uendret): `Driftsmodus uendret (<modus>). Utløsende regel: <regel>.`
  - Modusendring (andre regler): `Driftsmodus er endret fra <gammel> til <ny>. Utløsende regel: <regel>.`
- Begrunnelse med `Match på regel X.` på slutten for alle regler (vises kun hvis `Vis ekstra begrunnelse` er aktivert, standard: på)
  - Regel 1: inkluderer aktuell dato og periodeintervall
  - Regel 2: inkluderer snitt 72t, maks inkl. soltillegg, skydekke
  - Regel 4: inkluderer maks inkl. soltillegg, evt. snitt 72t og skydekke
  - Regel 5: inkluderer snitt 72t
  - Regel 6: inkluderer aktuell dato og periodeinfo
  - Regel 7: inkluderer snitt 72t, maks inkl. soltillegg, skydekke og ekstremgrense
- Manglende data (kun når data faktisk mangler)
- `Manuelt kjørt sjekk.` på slutten av begrunnelsen når automasjonen er manuelt kjørt

Avanserte innstillinger for varsling:
- `Kjør automatisk kl. 20:00 hver kveld` (standard: på) — sett til på for å aktivere automatisk kjøring kl. 20:00; av for å deaktivere
- `Send varsel ved manuell kjøring` (standard: på) — sett til på for å sende varsel ved manuell kjøring; av for ikke å sende varsel
- `Vis ekstra begrunnelse` (standard: på) — aktiver for å inkludere detaljert begrunnelse i varselet

## 9) Virkning av valgt modus

### VINTER
- Tillat varmedrift
- Tillat elektriske varmeovner
- Sperr kjøledrift

### SOMMER
- Tillat kjøledrift
- Sperr varmedrift
- Sperr elektriske varmeovner

## 10) Feilhåndtering (prioritet)

1. **Driftsmodus-validering**: Hvis valgt driftsmodus-entitet mangler eller ikke har valgene VINTER og SOMMER → send feilvarsel og avbryt kjøring
2. Vinterperiode => VINTER
3. Bruk historikk hvis tilgjengelig (`sensor.utetemperatur_snitt_72_timer`)
4. Ellers bruk nåverdi (`sensor.utetemperatur`)
5. Hvis begge mangler: kalenderreserve
6. Mangler temperaturprognose: hopp over prognose-regler
7. Mangler skydekning: soltillegg = 0 °C
8. `sensor.utetemperatur` utilgjengelig: alltid varsel uavhengig av om historikk kompenserte
9. Ved modusendring med manglende data: opplys i varsel
10. Ved vesentlig datamangel uten endring: info-/avviksvarsel

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
