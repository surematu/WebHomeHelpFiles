# PWM Output – Bryterstyring basert på 0–100 %-signal

## 1. Formål

Styrer en bryter (switch) med PWM (pulsbreddemodulasjon) basert på et inngangssignal 0–100 %. Høyere prosentandel gir lengre på-tid per syklus. En minimumsgrense for på/av-tid forhindrer at bryteren slår raskt av og på ved lave eller høye verdier. Offset-innstillingen gjør det mulig å forskyve syklusen slik at to PWM-er ved samme prosentandel ikke starter til nøyaktig samme tidspunkt.

Typisk bruksområde er styring av elektriske varmeelementer (panelovner, varmepumpe-tillegg, gulvvarme) der en pidregulator eller romregulator leverer et 0–100 %-signal som ønsket varmeandel.

## 2. Eksempler på bruk

### 2.1 Enkelt rom med 50 % varmeandel

Romregulatoren setter inngangssignalet til 50 %. Med standard 30-minutters periode:
- Bryteren er PÅ de første 15 minuttene av syklusen.
- Bryteren er AV de neste 15 minuttene.
- Syklusen gjentar seg hvert halvtime.

### 2.2 To rom – unngå samtidig oppstart

To identiske oppsett med 50 % varmeandel og 30 min periode:
- Rom A: offset = 0 → bryter PÅ minutt 0–14, AV minutt 15–29.
- Rom B: offset = 15 → bryter AV minutt 0–14, PÅ minutt 15–29.

De to elementene er aldri PÅ samtidig, noe som reduserer effekttopper.

### 2.3 Svært lav eller høy verdi (minimum på/av-tid)

Inngangssignal 3 %, periode 30 min, minimum på/av-tid 5 min:
- Beregnet på-tid: 0,03 × 30 = 0,9 min → under 5 min minimum.
- Effektiv duty: 0 % → bryteren er alltid AV i hele syklusen.

Inngangssignal 97 %, periode 30 min, minimum på/av-tid 5 min:
- Beregnet av-tid: 30 − 29,1 = 0,9 min → under 5 min minimum.
- Effektiv duty: 100 % → bryteren er alltid PÅ i hele syklusen.

## 3. FAQ – Ofte stilte spørsmål

**Hva er PWM?**
PWM (Pulse Width Modulation / pulsbreddemodulasjon) er en teknikk som simulerer en variabel effekt ved å raskt veksle en digital utgang (av/på). 50 % betyr at utgangen er PÅ halvparten av tiden. For trege systemer som romoppvarming oppleves dette som halv effekt.

**Hvorfor minimum på/av-tid?**
Uten en minimumsgrense ville for eksempel 2 % føre til at bryteren er PÅ i 0,6 min (36 sekunder) per syklus. Mange brytere og enheter tåler ikke hyppig av/på-syklus. Minimumsgrensen gjør at svært lave verdier behandles som 0 % (alltid AV) og svært høye som 100 % (alltid PÅ).

**Hva betyr offset?**
Offset forskyver starttidspunktet for syklusen fremover i tid. Sett offset = 15 på den andre av to 30-minutters PWM-er med 50 % last, så slår den andre på akkurat når den første slår av. De to enhetene er aldri PÅ på samme tid.

**Vil automasjonen reagere umiddelbart på en endring i inngangssignalet?**
Automasjonen kjøres hvert minutt og vil fange opp endringen innen ett minutt.

**Hva skjer om bryteren mister signal og blir utilgjengelig?**
Automasjonen reagerer umiddelbart når bryteren kommer tilbake fra utilgjengelig tilstand og setter korrekt PÅ/AV basert på gjeldende fase i syklusen.

**Hva skjer om inngangssignalet er utilgjengelig eller ukjent?**
Inngangsverdien tolkes som 0, noe som betyr at bryteren behandles som 0 % og holdes AV.

## 4. Hva slags info trengs

- En numerisk entitet (input_number, number eller sensor) med verdi 0–100 som representerer ønsket på-andel.
- En switch-entitet som automasjonen skal styre.
- Eventuelt ønsket PWM-periode og offset-verdi.

## 5. Innstillinger

| Innstilling | Standard | Forklaring |
|---|---:|---|
| PWM inngangssignal | – | Entitet med verdi 0–100 % (input_number, number, sensor) |
| Utgangsbryter | – | Bryteren som styres av PWM |
| PWM-periode (min) | 30 | Total lengde på én syklus. Minimum 10 min. |
| Offset (min) | 0 | Forskyver syklusstarten. Bruk ulike verdier på to PWM-er for å unngå synkronisert oppstart. |
| Minimum på/av-tid (min) | 5 | Beregnet tid under dette rundes til 0 % (AV) eller 100 % (PÅ). |

> **Tips om offset:** Sett offset på den ene instansen til halvparten av perioden (f.eks. 15 for 30 min periode) for å sørge for at to 50 %-laster aldri er PÅ samtidig.

## 6. Funksjonsbeskrivelse

Automasjonen kjøres hvert minutt og reagerer i tillegg umiddelbart når bryterens tilstand endrer seg fra «utilgjengelig».

Beregningene ved hvert kjøring:

1. **Les innstillinger:** Henter alle blueprint-inputs til lokale variabler.
2. **Hent inngangsverdier:** Leser inngangssignal (0–100 %), periode, offset, minimum tid og klokkeslett (minutt i døgnet, 0–1439).
3. **Beregn fase:** `fase = (minutt_i_døgnet + offset) % periode`. Gir nåværende posisjon i syklusen (0 ≤ fase < periode).
4. **Beregn rå på-tid:** `på_tid_rå = (duty / 100) × periode`.
5. **Juster for minimum tid:**
   - Hvis `på_tid_rå < min_tid` → effektiv på-tid = 0 (alltid AV).
   - Hvis `periode − på_tid_rå < min_tid` → effektiv på-tid = periode (alltid PÅ).
   - Ellers → effektiv på-tid = rundet rå verdi.
6. **Avgjør ønsket tilstand:** PÅ hvis `fase < effektiv_på_tid`, ellers AV.
7. **Sett brytertilstand:** Slår PÅ eller AV kun hvis gjeldende tilstand er feil. Gjør ingenting om bryteren allerede er i ønsket tilstand.

## 7. Resultat

| Entitet | Hva skrives |
|---|---|
| Konfigurert utgangsbryter | Settes til `on` eller `off` basert på PWM-fase og inngangssignal |

Ingen andre entiteter skrives til.

## 8. Varsling

Denne automasjonen sender ingen varsler til bruker som standard. All tilbakemelding skjer via bryterens tilstand i Home Assistant.

## 9. Annet

- Syklusen er basert på minutter siden midnatt (`time.hour × 60 + time.minute`). Perioder som går opp i 1440 (f.eks. 30, 60, 120 min) gir perfekt daglig justering uten drift.
- Perioder som ikke deler 1440 jevnt (f.eks. 25 min) kan gi marginal syklusdrift mellom dager. Dette er upraktisk for de fleste bruksområder innen romoppvarming.
- Automasjonen kjører i modus `single`: hvis en kjøring ikke er ferdig når neste minutt-trigger ankommer, hoppes den over. Siden logikken er øyeblikkelig (kun variabelberegning + én service-kall), er dette i praksis aldri et problem.

## 10. Avansert

### 10.1 Forutsettninger

- Home Assistant 2025.11.0 eller nyere.
- En switch-entitet som kan styres via `switch.turn_on` / `switch.turn_off`.
- En numerisk entitet med verdi 0–100 for inngangssignalet.
- Ingen eksterne integrasjoner, script eller helpers er påkrevd.

Eksempel på `input_number` helper:

```yaml
input_number:
  rom_varmeandel:
    name: Rom varmeandel (%)
    min: 0
    max: 100
    step: 1
    unit_of_measurement: "%"
    mode: slider
```

### 10.2 Relevante automasjoner og script

| Blueprint | Formål |
|---|---|
| `varmepumpe_regulering.yaml` | Produserer 0–100 %-pådragssignal som kan brukes som PWM-inngang |
| `kalender_kalkulert_varmebehov.yaml` | Kan sette varmenivå (0–100 %) basert på kalender og temperatur |

### 10.3 Beregnede verdier og variabler

| Variabel | Beskrivelse |
|---|---|
| `duty_raw` | Inngangsverdi lest fra entitet, avrundet til 1 desimal (0–100) |
| `period` | PWM-periode i minutter |
| `offset` | Offset i minutter |
| `min_time` | Minimum på/av-tid i minutter |
| `current_minute` | Minutter siden midnatt (0–1439): `now().hour × 60 + now().minute` |
| `phase` | Gjeldende fase i syklusen: `(current_minute + offset) % period` (0 ≤ phase < period) |
| `on_time_raw` | Beregnet rå på-tid: `(duty_raw / 100) × period` |
| `effective_on_time` | Endelig på-tid etter minimumskorrigering (0, avrundet verdi, eller hele perioden) |
| `should_be_on` | Boolean: `phase < effective_on_time` |
| `current_switch_state` | Gjeldende tilstand til bryteren (`on`, `off`, `unavailable`, ...) |

### 10.4 Feilhåndtering

| Scenario | Håndtering |
|---|---|
| Inngangssignal utilgjengelig/ukjent | `float(0)` fallback → duty = 0 → bryter holdes AV |
| Bryter utilgjengelig ved minutt-trigger | `states()` returnerer `'unavailable'` → verken `on` eller `off` → ingen service-kall |
| Bryter kommer tilbake fra utilgjengelig | `from: unavailable`-trigger setter korrekt tilstand innen sekunder |
| Offset større enn periode | Modulo-beregning håndterer dette korrekt automatisk |
| Service-kall feiler (f.eks. timeout) | HA-standard retry/feillogging; neste minutt-trigger retter opp tilstanden |

### 10.5 Varsling og debug info

Ingen debug-varsler. Alle mellomverdier (`phase`, `effective_on_time`, `should_be_on`, `current_switch_state`) er synlige i Home Assistant Trace Viewer for enkelt feilsøk.

For å feilsøke: åpne automasjonen i HA → «Sporlogg» / «Trace» → velg en nylig kjøring → se alle steg og variabelverdier.

## 11. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/automation/pwm_output.yaml
- Home Assistant PWM-konsept: https://www.home-assistant.io/docs/automation/trigger/#time-pattern-trigger
