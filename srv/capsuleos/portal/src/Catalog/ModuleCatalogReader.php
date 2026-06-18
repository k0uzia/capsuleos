<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Catalog;

use CapsuleOS\Portal\Config;
use CapsuleOS\Portal\Subscription\Entitlements;

final class ModuleCatalogReader
{
    /** @var array<string, string> */
    private static array $levelLabels = [];

    /** @return array{sectionTitle: string, sectionLead: string, levels: list<array<string, mixed>>} */
    public static function catalogFor(string $entitlementLevel): array
    {
        $path = Config::root() . '/mnt/catalog.json';
        if (!is_file($path)) {
            return self::emptyCatalog();
        }
        $catalog = json_decode((string) file_get_contents($path), true);
        if (!is_array($catalog)) {
            return self::emptyCatalog();
        }
        self::loadLevelLabels();
        $levels = [];
        foreach ($catalog['levels'] ?? [] as $levelEntry) {
            if (!is_array($levelEntry)) {
                continue;
            }
            $levelId = (string) ($levelEntry['id'] ?? '');
            $levelPath = (string) ($levelEntry['path'] ?? $levelId);
            $modules = [];
            foreach ($levelEntry['modules'] ?? [] as $moduleId) {
                $module = self::readModule($levelPath, (string) $moduleId, $entitlementLevel);
                if ($module !== null) {
                    $modules[] = $module;
                }
            }
            if ($modules === []) {
                continue;
            }
            $levels[] = [
                'id' => $levelId,
                'label' => self::$levelLabels[$levelId] ?? ucfirst($levelId),
                'modules' => $modules,
            ];
        }
        return [
            'sectionTitle' => 'Parcours pédagogiques',
            'sectionLead' => 'Quêtes et tutoriels cross-OS montés dans les bureaux simulés. Choisissez un parcours, puis un système compatible.',
            'levels' => $levels,
        ];
    }

    /** @return array<string, mixed>|null */
    public static function moduleByMountId(string $mountId, string $entitlementLevel = 'anonymous'): ?array
    {
        $parts = explode('/', trim($mountId, '/'), 2);
        if (count($parts) !== 2) {
            return null;
        }
        return self::readModule($parts[0], $parts[1], $entitlementLevel);
    }

    /** @return array{sectionTitle: string, sectionLead: string, levels: list<array<string, mixed>>} */
    private static function emptyCatalog(): array
    {
        return [
            'sectionTitle' => 'Parcours pédagogiques',
            'sectionLead' => '',
            'levels' => [],
        ];
    }

    private static function loadLevelLabels(): void
    {
        if (self::$levelLabels !== []) {
            return;
        }
        $path = Config::contracts() . '/pedagogical-modules.json';
        if (!is_file($path)) {
            return;
        }
        $contract = json_decode((string) file_get_contents($path), true);
        if (!is_array($contract)) {
            return;
        }
        foreach ($contract['levels'] ?? [] as $level) {
            if (!is_array($level)) {
                continue;
            }
            $id = (string) ($level['id'] ?? '');
            if ($id !== '') {
                self::$levelLabels[$id] = (string) ($level['label'] ?? $id);
            }
        }
    }

    /** @return array<string, mixed>|null */
    private static function readModule(string $levelPath, string $moduleId, string $entitlementLevel): ?array
    {
        $manifestPath = Config::root() . '/mnt/' . $levelPath . '/' . $moduleId . '/module.json';
        if (!is_file($manifestPath)) {
            return null;
        }
        $manifest = json_decode((string) file_get_contents($manifestPath), true);
        if (!is_array($manifest)) {
            return null;
        }
        $mountId = $levelPath . '/' . $moduleId;
        $access = (string) ($manifest['access'] ?? 'free');
        $scenarios = is_array($manifest['scenarios'] ?? null) ? $manifest['scenarios'] : [];
        $registryIds = is_array($manifest['registryIds'] ?? null) ? $manifest['registryIds'] : [];
        $compatibleOs = OsRegistryReader::activeFacadesFor($registryIds);
        $locked = !Entitlements::canAccessModule($entitlementLevel, $access);
        return [
            'mountId' => $mountId,
            'id' => (string) ($manifest['id'] ?? $moduleId),
            'level' => (string) ($manifest['level'] ?? $levelPath),
            'levelLabel' => self::$levelLabels[(string) ($manifest['level'] ?? $levelPath)] ?? (string) ($manifest['level'] ?? $levelPath),
            'title' => (string) ($manifest['title'] ?? $moduleId),
            'description' => (string) ($manifest['description'] ?? ''),
            'scenarioCount' => count($scenarios),
            'access' => $access,
            'accessLabel' => Entitlements::accessLabel($access),
            'locked' => $locked,
            'compatibleOs' => $compatibleOs,
        ];
    }
}
