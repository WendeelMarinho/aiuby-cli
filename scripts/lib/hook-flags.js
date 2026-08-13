#!/usr/bin/env node
/**
 * Shared hook enable/disable controls.
 *
 * Controls:
 * - ECC_HOOK_PROFILE=minimal|standard|strict (default: standard)
 * - ECC_DISABLED_HOOKS=comma,separated,hook,ids
 */

'use strict';

const { getEnv } = require('./legacy-compat');

const VALID_PROFILES = new Set(['minimal', 'standard', 'strict']);

function normalizeId(value) {
  return String(value || '').trim().toLowerCase();
}

function getHookProfile() {
  const raw = String(getEnv('AIUBY_HOOK_PROFILE', { quiet: true }) || 'standard').trim().toLowerCase(); // aiuby:compat
  return VALID_PROFILES.has(raw) ? raw : 'standard';
}

function getDisabledHookIds() {
  // Was a bare process.env read while lines 21 and 57 already went through the
  // bridge, so AIUBY_DISABLED_HOOKS was silently discarded — a §4 precedence
  // violation that fails silently, exactly the class §6 warns about. aiuby:compat
  const raw = String(getEnv('AIUBY_DISABLED_HOOKS', { quiet: true }) || '');
  if (!raw.trim()) return new Set();

  return new Set(
    raw
      .split(',')
      .map(v => normalizeId(v))
      .filter(Boolean)
  );
}

function parseProfiles(rawProfiles, fallback = ['standard', 'strict']) {
  if (!rawProfiles) return [...fallback];

  if (Array.isArray(rawProfiles)) {
    const parsed = rawProfiles
      .map(v => String(v || '').trim().toLowerCase())
      .filter(v => VALID_PROFILES.has(v));
    return parsed.length > 0 ? parsed : [...fallback];
  }

  const parsed = String(rawProfiles)
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(v => VALID_PROFILES.has(v));

  return parsed.length > 0 ? parsed : [...fallback];
}

function isDryRun() {
  // Reads ECC_DRY_RUN, falling back to ECC_DRY_RUN during 0.x. aiuby:compat
  return getEnv('AIUBY_DRY_RUN', { quiet: true }) === '1';
}

function isHookEnabled(hookId, options = {}) {
  const id = normalizeId(hookId);
  if (!id) return true;

  const disabled = getDisabledHookIds();
  if (disabled.has(id)) {
    return false;
  }

  const profile = getHookProfile();
  const allowedProfiles = parseProfiles(options.profiles);
  return allowedProfiles.includes(profile);
}

module.exports = {
  VALID_PROFILES,
  normalizeId,
  getHookProfile,
  getDisabledHookIds,
  parseProfiles,
  isHookEnabled,
  isDryRun,
};
