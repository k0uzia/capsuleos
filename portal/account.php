<?php

declare(strict_types=1);

require __DIR__ . '/../srv/capsuleos/portal/bootstrap.php';

use CapsuleOS\Portal\Auth\AuthService;
use CapsuleOS\Portal\Catalog\ModuleCatalogReader;
use CapsuleOS\Portal\Catalog\OsRegistryReader;
use CapsuleOS\Portal\PortalContext;
use CapsuleOS\Portal\Progress\ProgressRepository;

if (AuthService::currentUserId() === null) {
    portal_redirect('./login.php');
}

$ctx = PortalContext::fromRequest('Mon compte — CapsuleOS');
$userId = (int) ($ctx->user['id'] ?? 0);
$progressItems = [];
foreach (ProgressRepository::listForUser($userId) as $row) {
    if (!is_array($row)) {
        continue;
    }
    $mountId = (string) ($row['mount_id'] ?? '');
    $module = ModuleCatalogReader::moduleByMountId($mountId, $ctx->entitlementLevel);
    $registryId = (string) ($row['registry_id'] ?? '');
    $facade = $registryId !== '' ? OsRegistryReader::facadeFor($registryId) : null;
    if ($facade === null && is_array($module) && !empty($module['compatibleOs'][0]['facade'])) {
        $facade = (string) $module['compatibleOs'][0]['facade'];
        $registryId = (string) ($module['compatibleOs'][0]['id'] ?? $registryId);
    }
    $resumeHref = null;
    if ($facade !== null && $mountId !== '') {
        $sep = str_contains($facade, '?') ? '&' : '?';
        $resumeHref = portal_asset($facade) . $sep . 'mnt=' . rawurlencode($mountId);
    }
    $done = (int) ($row['done_count'] ?? 0);
    $total = (int) ($row['total_count'] ?? 0);
    $progressItems[] = [
        'mountId' => $mountId,
        'title' => is_array($module) ? (string) ($module['title'] ?? $mountId) : $mountId,
        'levelLabel' => is_array($module) ? (string) ($module['levelLabel'] ?? $module['level'] ?? '') : '',
        'doneCount' => $done,
        'totalCount' => $total,
        'percent' => $total > 0 ? (int) round(($done / $total) * 100) : 0,
        'updatedAt' => portal_format_date_fr((string) ($row['updated_at'] ?? '')),
        'resumeHref' => $resumeHref,
        'registryLabel' => $registryId,
    ];
}

portal_render('layout-auth.php', $ctx, [
    'heading' => 'Mon compte',
    'authPartial' => 'auth-account.php',
    'bodyClass' => 'portal-account-page',
    'layoutWide' => true,
    'progressItems' => $progressItems,
]);
