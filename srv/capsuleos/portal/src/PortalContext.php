<?php

declare(strict_types=1);

namespace CapsuleOS\Portal;

use CapsuleOS\Portal\Auth\AuthService;
use CapsuleOS\Portal\Catalog\ModuleCatalogReader;
use CapsuleOS\Portal\Catalog\OffersCatalog;
use CapsuleOS\Portal\Http\Csrf;
use CapsuleOS\Portal\Subscription\GradeResolver;
use CapsuleOS\Portal\User\UserRepository;

final class PortalContext
{
    /** @param array<string, mixed> $extra */
    public function __construct(
        public readonly string $mode,
        public readonly ?array $user,
        public readonly string $entitlementLevel,
        public readonly string $planLabel,
        public readonly array $offers,
        public readonly array $modulesCatalog,
        public readonly string $csrfToken,
        public readonly string $pageTitle,
        public readonly array $extra = [],
        public readonly array $gradeContext = [],
    ) {
    }

    public static function fromRequest(string $pageTitle = 'CapsuleOS'): self
    {
        $user = AuthService::currentUser();
        $gradeContext = $user !== null
            ? GradeResolver::forUser((int) $user['id'])
            : GradeResolver::forAnonymous();

        $entitlement = (string) ($gradeContext['entitlement'] ?? 'anonymous');
        $planLabel = 'Gratuit';
        if ($entitlement === 'subscriber') {
            $planLabel = 'Abonné';
        }

        return new self(
            Config::mode(),
            $user,
            $entitlement,
            $planLabel,
            OffersCatalog::load(),
            ModuleCatalogReader::catalogFor($entitlement),
            Csrf::token(),
            $pageTitle,
            [],
            $gradeContext,
        );
    }

    public static function withExtra(self $ctx, array $extra): self
    {
        return new self(
            $ctx->mode,
            $ctx->user,
            $ctx->entitlementLevel,
            $ctx->planLabel,
            $ctx->offers,
            $ctx->modulesCatalog,
            $ctx->csrfToken,
            $extra['pageTitle'] ?? $ctx->pageTitle,
            array_merge($ctx->extra, $extra),
            $ctx->gradeContext,
        );
    }

    public function isLoggedIn(): bool
    {
        return $this->user !== null;
    }

    public function isSubscriber(): bool
    {
        return $this->entitlementLevel === 'subscriber';
    }

    public function hasGrade(string $grade): bool
    {
        $grades = is_array($this->gradeContext['grades'] ?? null) ? $this->gradeContext['grades'] : [];
        return in_array($grade, $grades, true);
    }

    /** @return array<string, mixed> */
    public function permissions(): array
    {
        return is_array($this->gradeContext['permissions'] ?? null) ? $this->gradeContext['permissions'] : [];
    }

    public function showSection(string $section): bool
    {
        $sections = is_array($this->gradeContext['profileSections'] ?? null)
            ? $this->gradeContext['profileSections']
            : [];
        return in_array($section, $sections, true);
    }

    public function e(?string $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }

    public function displayName(): string
    {
        if (!is_array($this->user)) {
            return '';
        }
        $name = trim((string) ($this->user['display_name'] ?? ''));
        if ($name !== '') {
            return $name;
        }
        return (string) ($this->user['email'] ?? '');
    }
}
