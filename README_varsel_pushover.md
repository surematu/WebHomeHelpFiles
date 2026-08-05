# Varsel – Pushover Send Melding (script)

## 1. Formål

Dette scriptet sender standardiserte Pushover-meldinger fra WebHome.
Det brukes som et felles varslingspunkt av alle automasjoner i WebHome-oppsettet, slik at tittelformat, TTL-tekst og mottaker-routing håndteres på ett sted.

Du bruker normalt ikke dette scriptet direkte – det kalles automatisk av de andre automasjonene.

## 2. Eksempler på bruk

- Temperaturautomasjonen bruker dette scriptet til å sende varsel om fryseren.
- Kalender-automasjonen bruker dette til å sende «Varmeplan»-varsel dagen før en hendelse.
- Effektgrense-automasjonen bruker dette til å varsle at kWh-grensen er justert.

## 3. FAQ – Ofte stilte spørsmål

**Hva er Pushover?**
Pushover er en app for telefon og nettbrett som mottar varsler fra Home Assistant. Du må ha Pushover-appen installert og integrasjonen konfigurert i Home Assistant.

**Hva er «destination»?**
Destination avgjør hvilken mottakergruppe i Pushover som får varselet. Standard er `pushover` (alle i gruppen). Bruk `pushover_diverse` for en separat mottakergruppe.

**Kan jeg sende meldinger direkte fra dette scriptet?**
Ja, du kan kalle scriptet manuelt fra Home Assistant med ønsket tittel og melding. Men det er primært ment brukt av andre automasjoner.

**Hva betyr TTL?**
TTL (Time To Live) er levetiden for et varsel i timer. Etter denne tiden fjernes varselet fra Pushover-appen automatisk dersom det ikke er lest. Scriptet regner om fra timer til sekunder internt.

## 4. Hva slags info trengs

- Scriptets navn (settes som blueprint-input og brukes i tittel og fallback-URL)
- Tittel og melding (sendes inn ved kjøring)
- Valgfri URL med lenketekst
- Destinasjon, prioritet og TTL (kan settes ved kjøring, eller bruker standardverdier)

## 5. Innstillinger

**Fast blueprint-input (settes én gang ved installasjon):**

| Innstilling | Standard | Forklaring |
|---|---:|---|
| Name | – | Navn som brukes i varseltittel og fallback-URL |

**Runtime-felter (sendes med ved hvert kall):**

| Felt | Standard | Forklaring |
|---|---:|---|
| Tittel | Tittel | Tittel på Pushover-meldingen |
| Melding | Melding | Innholdet i meldingen |
| Destination | pushover | `pushover` eller `pushover_diverse` |
| Priority | 0 | Prioritet (−2 = lavest, 2 = høyest) |
| TTL | 6 (timer) | Levetid for varselet i timer |
| URL | (WebHome-lenke) | Valgfri lenke i meldingen |
| URL title | (WebHome-tekst) | Tekst for lenken |

## 6. Funksjonsbeskrivelse

Scriptet bygger en komplett Pushover-melding og sender den:

1. **Tittel:** Bygges som `<name> - <tittel>` (f.eks. «WebHome - KWh-grense»)
2. **TTL-suffiks:** Levetiden (i timer) omregnes internt til sekunder, deretter formateres til lesbar tekst (sekunder/minutter/timer/dager) og legges til meldingen automatisk
3. **URL/URL-title:** Brukes slik det er sendt inn. Hvis ikke sendt, brukes en fallback basert på `name`
4. **Routing:** `destination == pushover_diverse` → sender til `notify.pushover_diverse`, ellers → `notify.pushover`
5. **Parallell kjøring:** Scriptet kan kjøre opptil 10 samtidige instanser

## 7. Resultat

Sender ett Pushover-varsel til valgt mottakergruppe. Skriver ikke til noen entiteter.

## 8. Varsling

Dette scriptet er selve varslingsmekanismen. Meldingsinnholdet styres av den kallende automasjonen.

## 9. Annet

### 9.1 Kjøringsmodus

Scriptet kjøres i `mode: parallel` med `max: 10`. Det betyr at opptil 10 varsler kan sendes samtidig uten å vente på hverandre.

## 10. Avansert

### 10.1 Forutsettninger

- Pushover-integrasjonen (`notify.pushover`) må være konfigurert i Home Assistant.
- Valgfri: `notify.pushover_diverse` for separat mottakergruppe.

### 10.2 Eksempler

Ingen YAML-eksempler for dette scriptet.

### 10.3 Relevante automasjoner og script

Alle automasjoner i WebHome-oppsettet bruker dette scriptet for utsending av Pushover-varsler.

### 10.4 Beregnede verdier og variabler

| Variabel | Beskrivelse |
|---|---|
| Tittel | Bygges som `<name> - <tittel>` |
| call_ttl_hours | Input TTL i timer |
| call_ttl_seconds | TTL omregnet til sekunder (timer × 3600) |
| TTL-suffiks | Levetid omregnet til lesbar tekst (sek/min/timer/dager) |

### 10.5 Feilhåndtering

Ingen spesiell feilhåndtering i scriptet. Feil i Pushover-integrasjonen vil gi feilmelding i Home Assistant-logg.

### 10.6 Varsling og debug info

Ingen debug-varsling. Scriptet er selve varslingskanalen.

### 10.7 Felles varslingsmønster for automasjoner

Alle automasjoner i WebHome-oppsettet følger et felles mønster for varsling. Dette gjør det enkelt å forstå og feilsøke automasjonene.

#### Blueprint-input (varsling-seksjonen)

```yaml
pushover_destination:
  name: Pushover destination (valgfri)
  description: >
    Trengs normalt ikke å justeres. Ved flere ulike grupper kan denne justeres
    slik at den blir sendt ulikt.
  default: pushover
  selector:
    text:

pushover_priority:
  name: Pushover priority
  description: >
    −2 (Sendes uten varsling), −1 (varsling uten lyd), 0 (Varsel med lyd),
    1 (Høy prioritet, rødt varsel, omgår stilleperiode),
    2 (nødvarsel som gjentas til det bekreftes).
  default: 0
  selector:
    number:
      min: -2
      max: 2
      step: 1
      mode: box

pushover_ttl_hours:
  name: Levetid varsel (timer)
  description: Hvor lenge skal varslet være synlig før det forsvinner?
  default: 168
  selector:
    number:
      min: 0
      max: 168
      step: 1
      unit_of_measurement: h
      mode: box
```

> **Merk:** TTL-verdien sendes til scriptet i timer. Scriptet regner om fra timer til sekunder internt.

#### Blueprint-input (avansert-seksjonen)

```yaml
varsel_ved_manuell_kjoring:
  name: Send varsel ved manuell kjøring
  description: >
    Sett til true for å sende varsel når automasjonen kjøres manuelt.
    Sett til false for å ikke sende varsel ved manuell kjøring.
  default: true
  selector:
    boolean:
```

Feltet plasseres i `avansert`-seksjonen (collapsed som standard), sammen med andre debug/avanserte innstillinger.

#### Variable-oppsettet (steg 0 / innstillinger)

```yaml
pushover_destination: !input pushover_destination
pushover_priority: !input pushover_priority
pushover_ttl_hours: !input pushover_ttl_hours
io_varsel_ved_manuell_kjoring: !input varsel_ved_manuell_kjoring
is_manual_run: "{{ trigger is none or trigger.platform not in ['time_pattern', 'state'] }}"
```

> **Tilpass trigger-listen** for din automasjon – erstatt `time_pattern` og `state` med de faktiske triggerene automasjonen bruker. `trigger is none` dekker manuell kjøring fra UI.

> **TTL-standardverdi i float():** Bruk automasjonens standard-timer som fallback, f.eks. `float(168)` for 168 timer (7 dager) eller `float(6)` for 6 timer. Konvertering til sekunder skjer nå inne i scriptet.

#### Deteksjon av manuell kjøring

En automasjon er «kjørt manuelt» når `trigger is none`. Dette skjer når automasjonen kjøres fra Home Assistant-UI, via developer tools, eller fra en annen automasjon via `automation.trigger`.

Automasjoner som normalt trigges av tid/tilstand vil alltid ha `trigger.platform` satt. En manuell kjøring gir `trigger == none` (ikke `trigger.platform == 'manual'` – det er en vanlig misforståelse).

#### Varsle ved manuell kjøring

```yaml
- alias: Varsling ved manuell kjøring (valgfri)
  choose:
    - conditions:
        - condition: template
          value_template: "{{ is_manual_run and io_varsel_ved_manuell_kjoring and (pushover_destination | string | trim) != '' }}"
      sequence:
        - action: script.varsel_pushover_send_melding_webhome
          data:
            title: "🔔 AutomasjonNavn (manuell kjøring)"
            message: |-
              Kjørt manuelt. Gjeldende status: ...
            destination: "{{ pushover_destination }}"
            priority: "{{ pushover_priority | int(0) }}"
            ttl_hours: "{{ pushover_ttl_hours }}"
```

Varselet legges som siste steg i automasjonen, etter all logikk er utført. På denne måten reflekterer meldingen det endelige resultatet av kjøringen.

#### Oppsummering

| Hva | Beskrivelse |
|---|---|
| Input-navn | `varsel_ved_manuell_kjoring` |
| Intern variabel | `io_varsel_ved_manuell_kjoring` |
| TTL-input | `pushover_ttl_hours` (timer) |
| TTL til sending | `ttl_hours` (timer, sendes til scriptet; scriptet konverterer til sekunder) |
| Manuell kjøring | `is_manual_run: "{{ trigger is none or trigger.platform not in ['...'] }}"` |
| Betingelse for varsel | `is_manual_run and io_varsel_ved_manuell_kjoring and pushover_destination != ''` |

## 11. Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/scripts/varsel_pushover.yaml
