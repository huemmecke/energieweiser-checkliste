<?php
declare(strict_types=1);

const MAIL_TO = 'kontakt@energieweiser.de';
const MAIL_TO_TEST = 'mhuemmecke@gmx.de, neubauer@energieweiser.de';
const MAIL_FROM = 'Checkliste <kontakt@energieweiser.de>';

function clean(string $value): string
{
    $value = str_replace(["\r", "\n", "\0"], ' ', $value);
    return trim($value);
}

function post(string $key): string
{
    if (!isset($_POST[$key]) || is_array($_POST[$key])) {
        return '';
    }
    return clean((string) $_POST[$key]);
}

function postList(string $key): array
{
    if (!isset($_POST[$key])) {
        return [];
    }
    $value = $_POST[$key];
    if (!is_array($value)) {
        $value = [$value];
    }
    $out = [];
    foreach ($value as $item) {
        $item = clean((string) $item);
        if ($item !== '') {
            $out[] = $item;
        }
    }
    return $out;
}

function dash(string $value): string
{
    return $value !== '' ? $value : '–';
}

function joinList(array $values): string
{
    return $values ? implode(', ', $values) : '–';
}

function numbered(string $prefix, int $count, ?string $second = null): string
{
    $lines = [];
    for ($i = 1; $i <= $count; $i++) {
        $first = post($prefix . '_' . $i);
        $extra = $second ? post($second . '_' . $i) : '';
        if ($first !== '' || $extra !== '') {
            $lines[] = $second ? '- ' . dash($first) . ' | ' . dash($extra) : '- ' . dash($first);
        }
    }
    return $lines ? implode("\n", $lines) : '–';
}

function waermeZeilen(): string
{
    $rows = [
        ['Heizkörper', 'waermeabgabeGeschoss_Heizkoerper'],
        ['Fußbodenheizung', 'waermeabgabeGeschoss_Fussboden'],
        ['Wand-/Flächenheizung', 'waermeabgabeGeschoss_Wand'],
    ];
    $selected = postList('waermeabgabe');
    $lines = [];
    foreach ($rows as [$label, $key]) {
        if (!in_array($label, $selected, true)) {
            continue;
        }
        $floors = postList($key);
        $lines[] = $floors ? $label . ' (' . implode(', ', $floors) . ')' : $label;
    }
    return $lines ? implode(', ', $lines) : '–';
}

function sanierungZeilen(): string
{
    $rows = [
        ['Dach', 'sanierungJahr_Dach', 'sanierungAngabe_Dach'],
        ['oberste Geschossdecke', 'sanierungJahr_OGD', 'sanierungAngabe_OGD'],
        ['Fenster / Haustüre', 'sanierungJahr_Fenster', 'sanierungAngabe_Fenster'],
        ['Fassade / Außenwand', 'sanierungJahr_Fassade', 'sanierungAngabe_Fassade'],
        ['Kellerdecke', 'sanierungJahr_Kellerdecke', 'sanierungAngabe_Kellerdecke'],
        ['Bodenplatte', 'sanierungJahr_Bodenplatte', 'sanierungAngabe_Bodenplatte'],
        ['Anlagentechnik (Heizung / WW)', 'sanierungJahr_Anlage', 'sanierungAngabe_Anlage'],
        ['Verteilleitungen', 'sanierungJahr_Verteil', 'sanierungAngabe_Verteil'],
        ['Pumpen / Regelung', 'sanierungJahr_Pumpen', 'sanierungAngabe_Pumpen'],
        ['Andere', 'sanierungJahr_Andere', 'sanierungAngabe_Andere'],
    ];
    $selected = postList('sanierungMassnahmen');
    $lines = [];
    foreach ($rows as [$label, $jahr, $angabe]) {
        $jahrVal = post($jahr);
        $angabeVal = post($angabe);
        if (!in_array($label, $selected, true) && $jahrVal === '' && $angabeVal === '') {
            continue;
        }
        $lines[] = '- ' . $label . ': Jahr ' . dash($jahrVal) . ', ' . dash($angabeVal);
    }
    return $lines ? implode("\n", $lines) : '–';
}

function fail(string $page = 'fehler.html'): void
{
    header('Location: ' . $page, true, 303);
    exit;
}

function isLocalRequest(): bool
{
    $host = strtolower((string) ($_SERVER['SERVER_NAME'] ?? $_SERVER['HTTP_HOST'] ?? ''));
    $host = explode(':', $host)[0];
    $addr = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    return in_array($host, ['localhost', '127.0.0.1', '::1'], true)
        || in_array($addr, ['127.0.0.1', '::1'], true);
}

function mailTo(): string
{
    return isLocalRequest() ? MAIL_TO_TEST : MAIL_TO;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    if (isset($_GET['ping'])) {
        header('Content-Type: text/plain; charset=UTF-8');
        header('Cache-Control: no-store');
        echo 'php';
        exit;
    }
    fail('index.html');
}

if (post('faxnummer') !== '') {
    header('Location: danke.html', true, 303);
    exit;
}

if (post('kostentransparenz') !== 'ja' || post('datenschutz') !== 'ja') {
    fail();
}

if (post('eigentuemerName') === '' || post('eigentuemerKontakt') === '' || post('gebaeudeStrasse') === '' || post('gebaeudePlzOrt') === '') {
    fail();
}

$gebaeudeart = post('gebaeudeart');
$nutzer = $gebaeudeart === 'Mehrfamilienhaus' ? post('anzahlNutzerMfh') : post('anzahlNutzer');

$subject = 'Erstanfrage Checkliste – ' . (post('eigentuemerName') !== '' ? post('eigentuemerName') : 'Wohngebäude');
$body = 'Checkliste Datenaufnahme Wohngebäude 2026
=====================================

GEBÄUDEEIGENTÜMER/IN
Name: ' . dash(post('eigentuemerName')) . '
Adresse: ' . dash(post('eigentuemerStrasse')) . ', ' . dash(post('eigentuemerPlzOrt')) . '
Kontakt: ' . dash(post('eigentuemerKontakt')) . '

GEBÄUDEANGABEN
Adresse: ' . dash(post('gebaeudeStrasse')) . ', ' . dash(post('gebaeudePlzOrt')) . '
Baujahr: ' . dash(post('baujahr')) . '
Wohnfläche: ' . dash(post('wohnflaeche')) . '
Selbst bewohnt / übernommen seit: ' . dash(post('selbstBewohnt')) . '
Gebäudeart: ' . dash($gebaeudeart) . '
Anzahl Nutzer: ' . dash($nutzer) . '
Anzahl Wohneinheiten: ' . dash(post('anzahlWohneinheiten')) . '
Gebäudeform: ' . dash(post('gebaeudeform')) . '
Nutzung: ' . joinList(postList('gebaeudeNutzung')) . '
Mischnutzung: ' . dash(post('mischnutzung')) . '
Wohn-/Gewerbeeinheiten: ' . dash(post('mischWohnen')) . ' / ' . dash(post('mischGewerbe')) . '
Besonderheiten: ' . dash(post('besonderheiten')) . ' – ' . dash(post('besonderheitenArt')) . '

HEIZUNG
Hersteller/Modell: ' . dash(post('heizungHersteller')) . '
Einbaujahr: ' . dash(post('heizungEinbaujahr')) . '
Typ: ' . dash(post('heizungTyp')) . '
Holz-Ofen/Kamin: ' . dash(post('ofen')) . ' – wo: ' . dash(post('ofenWo')) . '
Wärmeabgabe: ' . waermeZeilen() . '

WARMWASSER
Kombibereitung mit Heizung: ' . dash(post('wwKombi')) . '
WW Einbaujahr: ' . dash(post('wwEinbaujahr')) . '
WW Energieträger: ' . dash(post('wwEnergietraeger')) . '
WW Hersteller/Modell: ' . dash(post('wwHersteller')) . '

SOLARTHERMIE
Vorhanden: ' . dash(post('solarthermie')) . '
Einbaujahr: ' . dash(post('solarEinbaujahr')) . '
Standort: ' . dash(post('solarStandort')) . '
Typ/Fläche: ' . dash(post('solarTypFlaeche')) . '
Betriebsweise: ' . dash(post('solarBetrieb')) . '

PHOTOVOLTAIK
Vorhanden: ' . dash(post('photovoltaik')) . '
Einbaujahr: ' . dash(post('pvEinbaujahr')) . '
Standort: ' . dash(post('pvStandort')) . '
Typ/max. Leistung: ' . dash(post('pvTypLeistung')) . '
Stromspeicher: ' . dash(post('pvSpeicher')) . ' ' . dash(post('pvSpeicherKw')) . ' kW

LÜFTUNG
Vorhanden: ' . dash(post('lueftung')) . '
Einbaujahr: ' . dash(post('lueftungEinbaujahr')) . '
Typ: ' . dash(post('lueftungTyp')) . '
WRG: ' . dash(post('lueftungWrg')) . '

SANIERUNGEN DURCHGEFÜHRT
Vorhanden: ' . dash(post('sanierungDurchgefuehrt')) . '
' . sanierungZeilen() . '

GEPLANTE / NOTWENDIGE SANIERUNGEN
Vorhanden: ' . dash(post('sanierungGeplant')) . '
' . numbered('geplantMassnahme', 6, 'geplantZeitraum') . '

EINKOMMEN / KINDER
Haushalts-Jahreseinkommen: ' . dash(post('einkommen')) . '
Minderjährige Kinder: ' . dash(post('kinder')) . '

MÄNGEL
Vorhanden: ' . dash(post('maengel')) . '
' . numbered('maengelAngabe', 5, 'maengelOrt') . '

BERATUNGSZIELE
' . joinList(postList('beratungsziele')) . '

KOSTENTRANSPARENZ: Ja

DATUM / UNTERSCHRIFT (Angaben)
Datum, Ort: ' . dash(post('datumOrt')) . '
Unterschrift: ' . dash(post('unterschrift')) . '

VORLIEGENDE UNTERLAGEN
Planunterlagen: ' . joinList(postList('unterlagenPlan')) . '
Detailzeichnungen: ' . joinList(postList('unterlagenDetail')) . '
Weitere: ' . joinList(postList('unterlagenWeitere')) . '
Weitere Unterlagen:
' . numbered('unterlagenSonstiges', 4) . '

DATENSCHUTZ EINWILLIGUNG: Ja
Datum, Ort: ' . dash(post('datumOrtDsgvo')) . '
Unterschrift: ' . dash(post('unterschriftDsgvo')) . '
';

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$to = mailTo();
$from = MAIL_FROM;
$sent = false;

if (isLocalRequest()) {
    require_once __DIR__ . '/smtp.php';
    $smtp = smtpLocalConfig();
    $from = $smtp['from'] ?? 'mhuemmecke@gmx.de';
    $dir = __DIR__ . '/tmp';
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        fail();
    }
    $payload = 'To: ' . $to . "\nFrom: " . $from . "\nSubject: " . $subject . "\nDate: " . date('c') . "\n\n" . $body;
    file_put_contents($dir . '/letzte-mail.txt', $payload);
    if ($smtp === null) {
        file_put_contents($dir . '/smtp-fehler.txt', "SMTP nicht konfiguriert. Passwort in smtp-local.php eintragen.\n");
        fail();
    }
    try {
        smtpSend($smtp, $to, $encodedSubject, $body);
        $sent = true;
        if (is_file($dir . '/smtp-fehler.txt')) {
            unlink($dir . '/smtp-fehler.txt');
        }
    } catch (Throwable $e) {
        file_put_contents($dir . '/smtp-fehler.txt', $e->getMessage() . "\n");
    }
} else {
    $headers = [
        'From: ' . $from,
        'Reply-To: ' . $to,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'X-Mailer: energieweiser-checkliste',
    ];
    $sent = @mail($to, $encodedSubject, $body, implode("\r\n", $headers));
}

if (!$sent) {
    fail();
}

header('Location: danke.html', true, 303);
exit;
