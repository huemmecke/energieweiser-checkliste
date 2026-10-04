# Checkliste 2026 – die energieweiser

Webformular zur Datenerfassung vor einer Energieberatung für Wohngebäude. Keine Cookies, kein Browser-Speicher. Pflichtfelder starten leer.

Empfänger der ausgefüllten Checkliste: **kontakt@energieweiser.de**

## Ablauf

1. Eigentümerin oder Eigentümer füllt `index.html` aus.
2. Beim Senden prüft `js/checkliste.js` die Pflichtfelder. Fehlen Angaben, erscheint ein Modal mit Sprung zu den Feldern.
3. `senden.php` nimmt das Formular entgegen und verschickt die Mail an `kontakt@energieweiser.de`.
4. Erfolg: `danke.html`. Fehler oder fehlende Pflichtangaben: `fehler.html`.

Ohne PHP (z. B. Vercel-Vorschau) öffnet sich hilfsweise das Mailprogramm.

## Dateien

| Datei | Aufgabe |
| --- | --- |
| `index.html` | Formular, Pflicht-Modal, DSGVO-Text |
| `js/checkliste.js` | Validierung, Mailtext, Versandweg |
| `css/checkliste.css` | Layout, Typografie, Checkboxen, Modal |
| `senden.php` | POST entgegennehmen, Mail bauen, weiterleiten |
| `danke.html` | Bestätigung nach dem Versand |
| `fehler.html` | Hinweis, wenn serverseitig etwas fehlt |
| `datenschutz.html` | Separate Datenschutzseite |
| `assets/` | Logo, Pfeil, Roboto Slab (Light, Regular, Bold) |

## Pflichtfelder

- Name Gebäudeeigentümer/in
- Telefon / E-Mail
- Gebäudeadresse (Straße, PLZ/Ort)
- Haken Kostentransparenz
- Datum, Ort (Angaben)
- Haken Datenschutz
- Datum, Ort (Datenschutz)

Ein unsichtbares Feld `website` fangen Bots, die jedes Textfeld füllen. Echte Absender sehen es nicht. Name und Typ sind bewusst kein Telefon/Fax, damit der Browser nichts automatisch einträgt.

## Live

Ordner auf den Webspace kopieren. PHP muss aktiv sein. `senden.php` sendet per `mail()` an `kontakt@energieweiser.de`.

## Gestaltung

Farben und Schriftgrößen stehen als Tokens in `css/checkliste.css` (`:root`). Schrift ist lokal eingebettetes Roboto Slab. Mobil zuerst, Umbruch bei 640px.

## Hinweise

- Cache-Parameter an CSS/JS (`?v=`) nach sichtbaren Änderungen hochzählen.
- DSGVO-Langtext in `index.html` kann später ersetzt werden, ohne die restliche Logik anzufassen.
- Vercel ist nur Formularvorschau. Der produktive Mailversand bleibt der Webspace.
