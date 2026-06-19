<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Subscription;

use CapsuleOS\Portal\Classroom\ClassroomRepository;
use CapsuleOS\Portal\Config;
use CapsuleOS\Portal\Store\PurchasedModuleRepository;
use CapsuleOS\Portal\Usage\OsUsageRepository;
use CapsuleOS\Portal\User\RoleRepository;
use CapsuleOS\Portal\User\UserRepository;

final class GradeResolver
{
    /** @var array<string, mixed>|null */
    private static ?array $gradesContract = null;

    /** @return array<string, mixed> */
    public static function forAnonymous(): array
    {
        return self::build(null, 'anonymous', []);
    }

    /** @return array<string, mixed> */
    public static function forUser(int $userId): array
    {
        $entitlement = UserRepository::entitlementLevel($userId);
        $roles = RoleRepository::rolesForUser($userId);

        if (Config::isDev()) {
            $sim = DevGradeSimulator::apply($entitlement, $roles);
            $entitlement = $sim['entitlement'];
            $roles = $sim['roles'];
            return self::build(
                $userId,
                $entitlement,
                $roles,
                !empty($sim['simActiveStudent']),
            );
        }

        return self::build($userId, $entitlement, $roles);
    }

    /**
     * @param list<string> $roles
     * @return array<string, mixed>
     */
    private static function build(
        ?int $userId,
        string $entitlement,
        array $roles,
        bool $simActiveStudent = false,
    ): array {
        $contract = self::gradesContract();
        $permissionsMap = is_array($contract['permissions'] ?? null) ? $contract['permissions'] : [];

        $grades = [];
        $isSubscriber = $entitlement === 'subscriber';
        $membership = ($userId !== null) ? ClassroomRepository::membershipForUser($userId) : null;
        $isActiveStudent = $membership !== null || $simActiveStudent;
        if ($simActiveStudent && $membership === null) {
            $membership = [
                'classroom_name' => 'Classe démo (simulation dev)',
                'allowed_os_json' => '[]',
                'allowed_modules_json' => '[]',
            ];
        }

        if ($userId === null) {
            $grades[] = 'visiteur';
        } elseif ($isSubscriber) {
            $grades[] = 'abonne';
        } else {
            $grades[] = 'utilisateur';
        }

        if (in_array('createur', $roles, true)) {
            $grades[] = 'createur';
        }
        if (in_array('professeur', $roles, true)) {
            $grades[] = 'professeur';
        }
        if ($isActiveStudent) {
            $grades[] = 'eleve';
        }

        $permKey = 'utilisateur';
        if ($isSubscriber) {
            $permKey = 'abonne';
        } elseif ($isActiveStudent) {
            $permKey = 'eleve_active';
        }

        $perms = is_array($permissionsMap[$permKey] ?? null) ? $permissionsMap[$permKey] : [];
        $limitMinutes = OsUsageRepository::dailyLimit();
        $unlimited = !empty($perms['osQuotaUnlimited']);

        $profileSections = self::profileSections($grades, $isSubscriber, $isActiveStudent);

        return [
            'grades' => $grades,
            'entitlement' => $entitlement,
            'permissionKey' => $permKey,
            'permissions' => [
                'osQuotaUnlimited' => $unlimited,
                'storeBrowse' => !empty($perms['storeBrowse']),
                'storeAppLaunch' => !empty($perms['storeAppLaunch']),
                'storeModules' => !empty($perms['storeModules']),
                'pedagogicalModules' => !empty($perms['pedagogicalModules']),
                'showGamification' => !empty($perms['showGamification']),
                'persistSkinSaves' => !empty($perms['persistSkinSaves']),
                'canPurchaseModules' => !empty($perms['canPurchaseModules']),
            ],
            'osQuota' => [
                'limitMinutes' => $limitMinutes,
                'unlimited' => $unlimited,
                'resetsAt' => OsUsageRepository::resetsAt(),
            ],
            'profileSections' => $profileSections,
            'classMembership' => $membership,
            'isTeacher' => in_array('professeur', $roles, true),
            'isCreator' => in_array('createur', $roles, true),
        ];
    }

    /**
     * @param list<string> $grades
     * @return list<string>
     */
    private static function profileSections(
        array $grades,
        bool $isSubscriber,
        bool $isActiveStudent,
    ): array {
        $sections = ['subscription', 'tickets', 'settings'];
        if (!$isSubscriber) {
            $sections[] = 'usage';
        }
        if ($isSubscriber) {
            array_push($sections, 'gamification', 'progress', 'skins', 'purchases');
        } elseif ($isActiveStudent) {
            array_push($sections, 'gamification', 'progress');
        }
        if ($isActiveStudent) {
            $sections[] = 'student';
        }
        if (in_array('professeur', $grades, true)) {
            $sections[] = 'teacher';
        }
        if (in_array('createur', $grades, true)) {
            $sections[] = 'creator';
        }
        return array_values(array_unique($sections));
    }

    public static function canAccessModule(array $resolved, string $moduleAccess, string $mountId = ''): bool
    {
        $perms = is_array($resolved['permissions'] ?? null) ? $resolved['permissions'] : [];
        if ($moduleAccess === 'subscriber') {
            if (!empty($perms['pedagogicalModules'])) {
                return true;
            }
            if (!empty($perms['storeModules'])) {
                return true;
            }
            $userId = null;
            if (!empty($resolved['userId'])) {
                $userId = (int) $resolved['userId'];
            }
            return false;
        }
        if ($moduleAccess === 'free_store') {
            return !empty($perms['storeModules']);
        }
        if ($moduleAccess === 'class') {
            return !empty($perms['pedagogicalModules']);
        }
        return Entitlements::canAccessModule((string) ($resolved['entitlement'] ?? 'anonymous'), $moduleAccess);
    }

    public static function canAccessModuleForUser(int $userId, string $moduleAccess, string $mountId = ''): bool
    {
        $resolved = self::forUser($userId);
        $resolved['userId'] = $userId;

        if ($moduleAccess === 'subscriber' || $moduleAccess === 'free_store') {
            $membership = ClassroomRepository::membershipForUser($userId);
            if ($membership !== null && $mountId !== '') {
                $allowed = ClassroomRepository::decodeJsonList((string) ($membership['allowed_modules_json'] ?? '[]'));
                if ($allowed !== [] && !in_array($mountId, $allowed, true)) {
                    return false;
                }
            }
            if (!empty($resolved['permissions']['pedagogicalModules'])) {
                return true;
            }
            if ($moduleAccess === 'free_store' && !empty($resolved['permissions']['storeModules'])) {
                return true;
            }
            if (PurchasedModuleRepository::hasModule($userId, $mountId)) {
                return true;
            }
            return false;
        }

        return Entitlements::canAccessModule((string) $resolved['entitlement'], $moduleAccess);
    }

    /** @return array<string, mixed> */
    public static function gradesContract(): array
    {
        if (self::$gradesContract !== null) {
            return self::$gradesContract;
        }
        $path = Config::contracts() . '/portal-grades.json';
        if (!is_file($path)) {
            self::$gradesContract = [];
            return self::$gradesContract;
        }
        $json = json_decode((string) file_get_contents($path), true);
        self::$gradesContract = is_array($json) ? $json : [];
        return self::$gradesContract;
    }

    /** @return array<string, mixed> */
    public static function toClientPayload(array $resolved): array
    {
        return [
            'grades' => $resolved['grades'] ?? [],
            'entitlement' => $resolved['entitlement'] ?? 'anonymous',
            'permissions' => $resolved['permissions'] ?? [],
            'osQuota' => $resolved['osQuota'] ?? [],
        ];
    }
}
