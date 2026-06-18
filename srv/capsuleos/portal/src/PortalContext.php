<?php

declare(strict_types=1);

namespace CapsuleOS\Portal;

use CapsuleOS\Portal\Auth\AuthService;
use CapsuleOS\Portal\Catalog\ModuleCatalogReader;
use CapsuleOS\Portal\Catalog\OffersCatalog;
use CapsuleOS\Portal\Http\Csrf;
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
    ) {
    }

    public static function fromRequest(string $pageTitle = 'CapsuleOS'): self
    {
        $user = AuthService::currentUser();
        $entitlement = 'anonymous';
        $planLabel = 'Gratuit';
        if (Config::mode() === 'dev') {
            $entitlement = 'subscriber';
            $planLabel = 'Capsule+';
        } elseif ($user !== null) {
            $entitlement = UserRepository::entitlementLevel((int) $user['id']);
            $planLabel = $entitlement === 'subscriber' ? 'Capsule+' : 'Gratuit';
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
            $ctx->pageTitle,
            array_merge($ctx->extra, $extra),
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

    public function e(?string $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }
}
