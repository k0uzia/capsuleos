<?php

declare(strict_types=1);

require __DIR__ . '/../../srv/capsuleos/portal/bootstrap.php';

use CapsuleOS\Portal\Http\ApiJson;
use CapsuleOS\Portal\Subscription\GradeResolver;
use CapsuleOS\Portal\Support\TicketRepository;

header('Content-Type: application/json; charset=utf-8');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$userId = ApiJson::requireAuth();

if ($method === 'GET') {
    $tickets = [];
    foreach (TicketRepository::listForUser($userId) as $row) {
        if (!is_array($row)) {
            continue;
        }
        $tickets[] = [
            'id' => (int) ($row['id'] ?? 0),
            'type' => (string) ($row['type'] ?? ''),
            'subject' => (string) ($row['subject'] ?? ''),
            'status' => (string) ($row['status'] ?? ''),
            'createdAt' => (string) ($row['created_at'] ?? ''),
        ];
    }
    $contract = GradeResolver::gradesContract();
    ApiJson::ok([
        'tickets' => $tickets,
        'types' => $contract['ticketTypes'] ?? [],
    ]);
}

$payload = ApiJson::readJsonBody();
ApiJson::requireCsrf($payload);

$type = (string) ($payload['type'] ?? 'support');
$subject = trim((string) ($payload['subject'] ?? ''));
$body = trim((string) ($payload['body'] ?? ''));

if ($subject === '') {
    ApiJson::error('Sujet requis');
}
if ($body === '') {
    ApiJson::error('Message requis');
}

$allowedTypes = array_map(
    static fn ($t) => is_array($t) ? (string) ($t['id'] ?? '') : '',
    GradeResolver::gradesContract()['ticketTypes'] ?? [],
);
if (!in_array($type, $allowedTypes, true)) {
    ApiJson::error('Type de ticket invalide');
}

$id = TicketRepository::create($userId, $type, $subject, $body);
$createdAt = gmdate('Y-m-d H:i:s');
ApiJson::ok([
    'ok' => true,
    'ticket' => [
        'id' => $id,
        'type' => $type,
        'subject' => $subject,
        'body' => $body,
        'status' => 'ouvert',
        'createdAt' => $createdAt,
    ],
], 201);
