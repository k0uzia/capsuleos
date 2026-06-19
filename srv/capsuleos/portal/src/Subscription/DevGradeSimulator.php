<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Subscription;

/**
 * Simulation de grade en mode dev (session PHP ou prévisualisation profil).
 */
final class DevGradeSimulator
{
    public const SESSION_KEY = 'portal_dev_sim_grade';

    /** @return list<string> */
    public static function allowedGrades(): array
    {
        return [
            'auto',
            'utilisateur',
            'abonne',
            'professeur',
            'createur',
            'eleve',
        ];
    }

    public static function currentSimGrade(): string
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return 'auto';
        }
        $grade = (string) ($_SESSION[self::SESSION_KEY] ?? 'auto');
        if ($grade === 'eleve_sticky') {
            return 'utilisateur';
        }
        return in_array($grade, self::allowedGrades(), true) ? $grade : 'auto';
    }

    public static function setSimGrade(string $grade): void
    {
        if (!in_array($grade, self::allowedGrades(), true)) {
            return;
        }
        $_SESSION[self::SESSION_KEY] = $grade;
    }

    /**
     * @param list<string> $roles
     * @return array{
     *   entitlement: string,
     *   roles: list<string>,
     *   simActiveStudent: bool
     * }
     */
    public static function apply(string $entitlement, array $roles): array
    {
        $sim = self::currentSimGrade();
        if ($sim === 'auto') {
            return [
                'entitlement' => $entitlement,
                'roles' => $roles,
                'simActiveStudent' => false,
            ];
        }

        if ($sim === 'utilisateur') {
            return [
                'entitlement' => 'registered',
                'roles' => [],
                'simActiveStudent' => false,
            ];
        }

        if ($sim === 'abonne') {
            return [
                'entitlement' => 'subscriber',
                'roles' => [],
                'simActiveStudent' => false,
            ];
        }

        if ($sim === 'professeur') {
            return [
                'entitlement' => 'subscriber',
                'roles' => ['professeur'],
                'simActiveStudent' => false,
            ];
        }

        if ($sim === 'createur') {
            return [
                'entitlement' => 'subscriber',
                'roles' => ['createur'],
                'simActiveStudent' => false,
            ];
        }

        return [
            'entitlement' => 'registered',
            'roles' => [],
            'simActiveStudent' => true,
        ];
    }
}
