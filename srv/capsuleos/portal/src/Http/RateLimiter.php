<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Http;

use CapsuleOS\Portal\Config;

final class RateLimiter
{
    public static function check(string $bucket, string $key): bool
    {
        $contracts = Config::contracts();
        $securityPath = $contracts . '/portal-security.json';
        $security = is_file($securityPath)
            ? json_decode((string) file_get_contents($securityPath), true)
            : [];
        $limits = $security['rateLimit'][$bucket] ?? ['maxAttempts' => 5, 'windowSeconds' => 900];
        $max = (int) ($limits['maxAttempts'] ?? 5);
        $window = (int) ($limits['windowSeconds'] ?? 900);

        $file = (string) Config::get('rateLimitFile', '');
        $dir = dirname($file);
        if (!is_dir($dir)) {
            mkdir($dir, 0750, true);
        }

        $now = time();
        $store = [];
        if (is_file($file)) {
            $decoded = json_decode((string) file_get_contents($file), true);
            if (is_array($decoded)) {
                $store = $decoded;
            }
        }

        $id = $bucket . ':' . hash('sha256', $key);
        $entry = $store[$id] ?? ['count' => 0, 'reset' => $now + $window];
        if ($now > ($entry['reset'] ?? 0)) {
            $entry = ['count' => 0, 'reset' => $now + $window];
        }
        if ($entry['count'] >= $max) {
            return false;
        }
        $entry['count']++;
        $store[$id] = $entry;

        foreach ($store as $k => $v) {
            if (($v['reset'] ?? 0) < $now) {
                unset($store[$k]);
            }
        }

        file_put_contents($file, json_encode($store), LOCK_EX);
        return true;
    }
}
