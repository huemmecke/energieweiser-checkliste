# Checkliste 2026 – die energieweiser

Webformular zur Datenerfassung vor einer Energieberatung für Wohngebäude. Keine Cookies, kein Browser-Speicher. Pflichtfelder starten leer.

Live-Empfänger der ausgefüllten Checkliste: **kontakt@energieweiser.de**

## Ablauf

1. Eigentümerin oder Eigentümer füllt `index.html` aus.
2. Beim Senden prüft `js/checkliste.js` die Pflichtfelder. Fehlen Angaben, erscheint ein Modal mit Sprung zu den Feldern.
3. Läuft PHP (`senden.php`), wird das Formular per POST verschickt. Die Mail geht an `kontakt@energieweiser.de`.
4. Ohne PHP (statische Vorschau, Vercel) öffnet sich hilfsweise das lokale Mailprogramm (`mailto:`).
5. Erfolg: `danke.html`. Fehler oder fehlende Pflichtangaben serverseitig: `fehler.html`.

## Dateien

| Datei | Aufgabe |
| --- | --- |
| `index.html` | Formular, Pflicht-Modal, DSGVO-Text |
| `js/checkliste.js` | Validierung, Mailtext, Versandweg |
| `css/checkliste.css` | Layout, Typografie, Checkboxen, Modal |
| `senden.php` | POST entgegennehmen, Mail bauen, weiterleiten |
| `smtp.php` | Nur lokal: Versand über SMTP (z. B. GMX) |
| `danke.html` | Bestätigung nach dem Versand |
| `fehler.html` | Hinweis, wenn serverseitig etwas fehlt |
| `datenschutz.html` | Separate Datenschutzseite |
| `assets/` | Logo, Pfeil, Roboto Slab (Light, Regular, Bold) |
| `vercel.json` | Vorschau ohne Indexierung |

Nicht im Repository: `smtp-local.php` (Zugangsdaten), `tmp/` (letzte lokale Mail), Testdaten.

## Pflichtfelder

- Name Gebäudeeigentümer/in
- Telefon / E-Mail
- Gebäudeadresse (Straße, PLZ/Ort)
- Haken Kostentransparenz
- Datum, Ort (Angaben)
- Haken Datenschutz
- Datum, Ort (Datenschutz)

Zusätzlich: Honeypot-Feld `faxnummer`. Ist es ausgefüllt, gilt die Anfrage als Spam und wird still auf die Danke-Seite geleitet.

## Versandwege

**Webspace (Produktion):** `senden.php` nutzt PHP `mail()` an `kontakt@energieweiser.de`. PHP muss aktiv sein; den Ordner einfach hochladen.

**Lokal mit PHP:** `php -S 127.0.0.1:5176`. Empfänger sind die Testadressen in `MAIL_TO_TEST`. Optional `smtp-local.php` anlegen (nicht committen):

```php
<?php
return [
    'host' => 'mail.gmx.net',
    'port' => 587,
    'user' => 'adresse@gmx.de',
    'pass' => '',
    'from' => 'adresse@gmx.de',
];
```

Ohne SMTP schreibt PHP nur `tmp/letzte-mail.txt`. Der Mac-eigene Mail-Dienst reicht für GMX nicht.

**Lokal / Vercel ohne PHP:** Nach gültiger Prüfung öffnet `mailto:` das Mailprogramm. Empfänger ist `kontakt@energieweiser.de`.

## Lokal starten

```bash
php -S 127.0.0.1:5176
```

Ohne PHP: `python3 -m http.server 5175`

## Gestaltung

Farben und Schriftgrößen stehen als Tokens in `css/checkliste.css` (`:root`). Schrift ist lokal eingebettetes Roboto Slab. Mobil zuerst, Umbruch bei 640px. Checkboxen und Radios sind eigene Kästchen mit SVG-Häkchen.

## Hinweise

- Cache-Parameter an CSS/JS (`?v=`) nach sichtbaren Änderungen hochzählen.
- DSGVO-Langtext in `index.html` kann später ersetzt werden, ohne die restliche Logik anzufassen.
- Vercel dient nur der Formularvorschau. Der produktive Mailversand bleibt der Webspace.
