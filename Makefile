# CapsuleOS — commandes locales portail + bureaux simulés
# dev  → index.html statique (routeur Node — redirige /portal/*.php)
# prod → index.php + portail PHP (php -S + router.php)

HOST ?= 127.0.0.1
PORT ?= 8080
MODE ?= dev
PROFILE ?=

.PHONY: help dev prod prod-sub prod-prof prod-creator site-home site-home-dev site-home-prod

help:
	@echo "CapsuleOS — cibles disponibles"
	@echo ""
	@echo "  make dev              Portail statique (index.html) — PORT=$(PORT)"
	@echo "  make prod             Portail PHP (index.php)      — PORT=$(PORT)"
	@echo "  make prod-sub         PHP prod, profil Abonné"
	@echo "  make prod-prof        PHP prod, profil Professeur"
	@echo "  make prod-creator     PHP prod, profil Créateur"
	@echo "  make site-home        Régénère portal-site-home.js (MODE=$(MODE))"
	@echo "  make site-home-dev    Mode dev  → ../../../index.html"
	@echo "  make site-home-prod   Mode prod → ../../../index.php"
	@echo ""
	@echo "Variables : HOST=$(HOST)  PORT=$(PORT)  MODE=dev|prod  PROFILE=sub|prof|creator"

site-home:
	node usr/lib/capsuleos/tools/build-portal-site-home.mjs $(MODE)

site-home-dev:
	$(MAKE) site-home MODE=dev

site-home-prod:
	$(MAKE) site-home MODE=prod

dev:
	node usr/lib/capsuleos/tools/serve-capsuleos.mjs dev --host $(HOST) --port $(PORT)

prod:
	node usr/lib/capsuleos/tools/serve-capsuleos.mjs prod --host $(HOST) --port $(PORT) $(if $(PROFILE),--profile $(PROFILE),)

prod-sub:
	$(MAKE) prod PROFILE=sub

prod-prof:
	$(MAKE) prod PROFILE=prof

prod-creator:
	$(MAKE) prod PROFILE=creator
