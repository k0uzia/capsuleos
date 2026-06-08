/**
 * Noyau commandes terminal Linux — partagé par toutes les familles (Debian, Red Hat, SUSE, Arch).
 * Contrat : etc/capsuleos/contracts/terminal-commands.json → layers.core
 */
(function initTerminalCommandCore(global) {
    'use strict';

    const CORE = Object.freeze([
        'help',
        'man',
        'cd',
        'ls',
        'pwd',
        'echo',
        'cat',
        'head',
        'tail',
        'grep',
        'find',
        'touch',
        'mkdir',
        'cp',
        'mv',
        'rm',
        'rmdir',
        'wc',
        'sort',
        'chmod',
        'clear',
        'history',
        'whoami',
        'uname',
        'exit',
        'ps',
        'kill',
        'ping',
        'curl',
        'sudo',
        'ssh',
        'nano',
        'vim',
        'less',
        'dd',
        'crontab',
    ]);

    global.CAPSULE_TERMINAL_CORE_COMMANDS = CORE;
}(typeof window !== 'undefined' ? window : globalThis));
