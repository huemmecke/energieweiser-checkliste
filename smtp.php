<?php
declare(strict_types=1);

function smtpLocalConfig(): ?array
{
    $file = __DIR__ . '/smtp-local.php';
    if (!is_file($file)) {
        return null;
    }
    $cfg = require $file;
    if (!is_array($cfg)) {
        return null;
    }
    $host = trim((string) ($cfg['host'] ?? ''));
    $user = trim((string) ($cfg['user'] ?? ''));
    $pass = (string) ($cfg['pass'] ?? '');
    $from = trim((string) ($cfg['from'] ?? $user));
    $port = (int) ($cfg['port'] ?? 587);
    if ($host === '' || $user === '' || $pass === '') {
        return null;
    }
    return [
        'host' => $host,
        'port' => $port > 0 ? $port : 587,
        'user' => $user,
        'pass' => $pass,
        'from' => $from !== '' ? $from : $user,
    ];
}

function smtpAddress(string $value): string
{
    if (preg_match('/<([^>]+)>/', $value, $m) === 1) {
        return trim($m[1]);
    }
    return trim($value);
}

function smtpRead($fp): string
{
    $data = '';
    while (($line = fgets($fp, 1024)) !== false) {
        $data .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }
    return $data;
}

function smtpCmd($fp, string $cmd, string $expect): string
{
    if ($cmd !== '') {
        fwrite($fp, $cmd . "\r\n");
    }
    $resp = smtpRead($fp);
    if ($resp === '' || !str_starts_with($resp, $expect)) {
        throw new RuntimeException($resp !== '' ? trim($resp) : 'Keine Antwort vom SMTP-Server');
    }
    return $resp;
}

function smtpAddresses(string $value): array
{
    $parts = preg_split('/\s*,\s*/', $value) ?: [];
    $out = [];
    foreach ($parts as $part) {
        $addr = smtpAddress($part);
        if ($addr !== '') {
            $out[] = $addr;
        }
    }
    return $out;
}

function smtpSend(array $cfg, string $to, string $subject, string $body): void
{
    $fromAddr = smtpAddress($cfg['from']);
    $recipients = smtpAddresses($to);
    if (!$recipients) {
        throw new RuntimeException('Kein Empfänger');
    }
    $fp = @stream_socket_client(
        'tcp://' . $cfg['host'] . ':' . $cfg['port'],
        $errno,
        $errstr,
        20,
        STREAM_CLIENT_CONNECT
    );
    if (!is_resource($fp)) {
        throw new RuntimeException('SMTP-Verbindung fehlgeschlagen: ' . $errstr);
    }
    stream_set_timeout($fp, 20);
    try {
        smtpCmd($fp, '', '220');
        smtpCmd($fp, 'EHLO localhost', '250');
        smtpCmd($fp, 'STARTTLS', '220');
        $crypto = stream_socket_enable_crypto(
            $fp,
            true,
            STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT
        );
        if ($crypto !== true) {
            throw new RuntimeException('STARTTLS fehlgeschlagen');
        }
        smtpCmd($fp, 'EHLO localhost', '250');
        smtpCmd($fp, 'AUTH LOGIN', '334');
        smtpCmd($fp, base64_encode($cfg['user']), '334');
        smtpCmd($fp, base64_encode($cfg['pass']), '235');
        smtpCmd($fp, 'MAIL FROM:<' . $fromAddr . '>', '250');
        foreach ($recipients as $addr) {
            smtpCmd($fp, 'RCPT TO:<' . $addr . '>', '250');
        }
        smtpCmd($fp, 'DATA', '354');

        $payload = implode("\r\n", [
            'From: ' . $cfg['from'],
            'To: ' . implode(', ', $recipients),
            'Subject: ' . $subject,
            'Date: ' . date('r'),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            'X-Mailer: energieweiser-checkliste-local',
        ]) . "\r\n\r\n" . str_replace("\n", "\r\n", str_replace("\r\n", "\n", $body));
        $payload = preg_replace('/^\./m', '..', $payload) ?? $payload;
        fwrite($fp, $payload . "\r\n.\r\n");
        smtpCmd($fp, '', '250');
        fwrite($fp, "QUIT\r\n");
    } finally {
        fclose($fp);
    }
}
