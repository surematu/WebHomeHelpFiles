# Funksjonsbeskrivelse – Varsel - Pushover Send Melding (script)

## 1) Formål

Dette script-blueprintet sender standardiserte Pushover-meldinger for WebHome.
Det brukes av automasjonene i repoet og støtter runtime-felt ved script-kall.

## 2) Input og runtime-felter

- Fast blueprint-input: `name` (brukes i tittel og fallback-URL)
- Runtime fields:
  - `title`
  - `message`
  - `destination` (`pushover` eller `pushover_diverse`)
  - `priority`
  - `ttl`
  - `url`
  - `url_title`

## 3) Meldingsbygging

- Tittel bygges som: `<name> - <title>`
- Meldingen får automatisk TTL-suffiks med lesbar tid (sek/min/time/dager)
- Hvis URL/url_title ikke er sendt inn, brukes fallback basert på `name`

## 4) Routing

- `destination == pushover_diverse` → `notify.pushover_diverse`
- Ellers → `notify.pushover`

## 5) Kjøring

- `mode: parallel`
- `max: 10`

## 6) Dokumentasjon

- Blueprint: https://github.com/surematu/WebHomeHelpFiles/blob/main/blueprints/scripts/varsel_pushover.yaml
