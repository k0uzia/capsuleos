<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Catalog;

use CapsuleOS\Portal\Config;

final class OsRegistryReader
{
    /** @var array<string, mixed>|null */
    private static ?array $registry = null;

    /** @return array<string, mixed> */
    public static function load(): array
    {
        if (self::$registry !== null) {
            return self::$registry;
        }
        $path = Config::root() . '/etc/capsuleos/os-registry.json';
        if (!is_file($path)) {
            self::$registry = ['entries' => []];
            return self::$registry;
        }
        $json = json_decode((string) file_get_contents($path), true);
        self::$registry = is_array($json) ? $json : ['entries' => []];
        return self::$registry;
    }

    /**
     * @param list<string> $registryIds
     * @return list<array{id: string, displayName: string, facade: string}>
     */
    public static function activeFacadesFor(array $registryIds): array
    {
        $registry = self::load();
        $entries = is_array($registry['entries'] ?? null) ? $registry['entries'] : [];
        $wanted = array_flip($registryIds);
        $out = [];
        foreach ($entries as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $id = (string) ($entry['id'] ?? '');
            if ($id === '' || !isset($wanted[$id])) {
                continue;
            }
            if ((string) ($entry['status'] ?? '') !== 'active') {
                continue;
            }
            $facade = (string) ($entry['referencePaths']['facade'] ?? $entry['facade'] ?? '');
            if ($facade === '') {
                continue;
            }
            $out[] = [
                'id' => $id,
                'displayName' => (string) ($entry['displayName'] ?? $id),
                'facade' => $facade,
            ];
        }
        usort($out, static fn (array $a, array $b): int => strcmp($a['displayName'], $b['displayName']));
        return $out;
    }

    public static function facadeFor(string $registryId): ?string
    {
        foreach (self::activeFacadesFor([$registryId]) as $entry) {
            return $entry['facade'];
        }
        return null;
    }

    /**
     * @return list<array{id: string, displayName: string, facade: string}>
     */
    public static function listForPortal(): array
    {
        $registry = self::load();
        $entries = is_array($registry['entries'] ?? null) ? $registry['entries'] : [];
        $ids = [];
        foreach ($entries as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            if ((string) ($entry['status'] ?? '') !== 'active') {
                continue;
            }
            $id = (string) ($entry['id'] ?? '');
            if ($id !== '') {
                $ids[] = $id;
            }
        }
        return self::activeFacadesFor($ids);
    }
}
