# Checkliste – die energieweiser

Statisches Formular ohne Cookies und ohne Browser-Speicher. Pflicht-Haken startet leer; ohne Kostentransparenz und Datenschutz wird nicht gesendet.

## Öffnen

Lokal mit PHP (empfohlen): `php -S 127.0.0.1:5176`. Absenden öffnet danach `danke.html`. Auf dem Webspace geht die Mail an kontakt@energieweiser.de.

Lokal ohne PHP: `python3 -m http.server 5175`. Absenden öffnet hilfsweise das E-Mail-Programm.

Live: Ordner auf den Webspace kopieren. PHP muss aktiv sein.

- Formular: `index.html`
- Versand: `senden.php` → E-Mail an kontakt@energieweiser.de
- Danke: `danke.html`
- Datenschutz: `datenschutz.html`

Auf dem Webspace sendet PHP die Mail direkt an kontakt@energieweiser.de.

## Inhalt

```
index.html
senden.php
danke.html
fehler.html
datenschutz.html
css/checkliste.css
js/checkliste.js
assets/
assets/fonts/   Roboto Slab Light / Regular / Bold
```
