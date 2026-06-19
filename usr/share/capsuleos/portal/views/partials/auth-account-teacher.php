<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$classroom = is_array($ctx->extra['teacherClassroom'] ?? null) ? $ctx->extra['teacherClassroom'] : null;
$members = is_array($ctx->extra['teacherMembers'] ?? null) ? $ctx->extra['teacherMembers'] : [];
$contract = is_array($ctx->extra['gradeContract'] ?? null) ? $ctx->extra['gradeContract'] : [];
$minSlots = (int) ($contract['classMinSlots'] ?? 2);
$maxSlots = (int) ($contract['classMaxSlots'] ?? 32);
$memberCount = count($members);
$classMaxSlots = $classroom !== null ? (int) ($classroom['max_slots'] ?? 0) : 0;
?>
<section class="portal-account-panel portal-account-teacher" aria-labelledby="portal-account-teacher-title" data-teacher-panel>
    <h2 class="portal-account-panel-title" id="portal-account-teacher-title">Mes classes</h2>
    <p class="portal-account-panel-lead">Créez votre classe, invitez vos élèves par lien (de <?= (int) $minSlots ?> à <?= (int) $maxSlots ?> places, invitation valide 7 jours).</p>

    <div class="portal-account-class-grid">
        <?php if ($classroom === null) : ?>
        <button type="button" class="portal-account-class-card portal-account-class-card--add" data-portal-account-modal-open="classroom-create" aria-label="Créer une classe">
            <span class="portal-account-class-card-plus" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
            </span>
            <span class="portal-account-class-card-add-label">Nouvelle classe</span>
        </button>
        <?php else : ?>
        <button type="button" class="portal-account-class-card portal-account-class-card--active" data-portal-account-modal-open="classroom-detail" aria-label="Ouvrir <?= $ctx->e((string) ($classroom['name'] ?? 'la classe')) ?>">
            <h3 class="portal-account-class-card-title"><?= $ctx->e((string) ($classroom['name'] ?? '')) ?></h3>
            <p class="portal-account-class-card-seats"><span class="portal-account-class-card-seats-count" data-classroom-seats-count><?= (int) $memberCount ?>/<?= (int) $classMaxSlots ?></span> places</p>
        </button>
        <?php endif; ?>
    </div>
</section>
