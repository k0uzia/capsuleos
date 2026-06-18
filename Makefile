# CapsuleOS — commandes locales portail + bureaux simulés
# dev  → index.html statique (routeur Node — redirige /portal/*.php)
# prod → index.php + portail PHP (php -S + router.php)

HOST ?= 127.0.0.1
PORT ?= 8080
MODE ?= dev

.PHONY: help dev prod site-home site-home-dev site-home-prod

help:
	@echo "CapsuleOS — cibles disponibles"
	@echo ""
	@echo "  make dev              Portail statique (index.html) — PORT=$(PORT)"
	@echo "  make prod             Portail PHP (index.php)      — PORT=$(PORT)"
	@echo "  make site-home        Régénère portal-site-home.js (MODE=$(MODE))"
	@echo "  make site-home-dev    Mode dev  → ../../../index.html"
	@echo "  make site-home-prod   Mode prod → ../../../index.php"
	@echo ""
	@echo "Variables : HOST=$(HOST)  PORT=$(PORT)  MODE=dev|prod"

site-home:
	node usr/lib/capsuleos/tools/build-portal-site-home.mjs $(MODE)

site-home-dev:
	$(MAKE) site-home MODE=dev

site-home-prod:
	$(MAKE) site-home MODE=prod

dev:
	node usr/lib/capsuleos/tools/serve-capsuleos.mjs dev --host $(HOST) --port $(PORT)

prod:
	node usr/lib/capsuleos/tools/serve-capsuleos.mjs prod --host $(HOST) --port $(PORT)
