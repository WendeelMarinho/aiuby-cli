#!/usr/bin/env node
/**
 * Migrate an ECC installation to Aiuby.
 *
 * Dry-run is the DEFAULT. Nothing is written without an explicit --apply.
 * Every apply takes a full backup first and can be undone with --rollback.
 *
 * Usage:
 *   node scripts/migrate-to-aiuby.js                       # dry run (default)
 *   node scripts/migrate-to-aiuby.js --apply
 *   node scripts/migrate-to-aiuby.js --list-backups
 *   node scripts/migrate-to-aiuby.js --rollback <backup-path>
 *
 * Exit codes:
 *   0  clean, nothing to do, or completed
 *   1  conflict or failure
 *   2  bad invocation
 */

const path = require('path');

const {
  planMigration,
  applyMigration,
  rollbackMigration,
  listBackups,
} = require('./lib/migrate-state');

function usage() {
  return `
Migrate an ECC installation to Aiuby.

Usage:
  node scripts/migrate-to-aiuby.js [options]

Options:
  --apply                 Perform the migration (default is a dry run)
  --rollback <path>       Restore a backup produced by a previous --apply
  --list-backups          Show available backups, newest first
  --home <path>           Override the home directory
  --project-root <path>   Override the project root
  --json                  Emit machine-readable JSON
  -h, --help              Show this help

Dry run is the default. --apply always writes a backup before the first move.
`;
}

function parseArgs(argv) {
  const options = {
    apply: false,
    rollback: null,
    listBackups: false,
    home: null,
    projectRoot: null,
    json: false,
    help: false,
  };

  const requireValue = (arg, value) => {
    if (value === undefined) {
      throw new Error(`${arg} requires a value`);
    }
    return value;
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--apply': options.apply = true; break;
      case '--rollback': options.rollback = path.resolve(requireValue(arg, argv[++i])); break;
      case '--list-backups': options.listBackups = true; break;
      case '--home': options.home = path.resolve(requireValue(arg, argv[++i])); break;
      case '--project-root': options.projectRoot = path.resolve(requireValue(arg, argv[++i])); break;
      case '--json': options.json = true; break;
      case '--dry-run': options.apply = false; break;
      case '-h':
      case '--help': options.help = true; break;
      default: throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function emit(options, payload, lines) {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    process.stdout.write(`${lines.join('\n')}\n`);
  }
}

function describePlan(plan) {
  const moves = plan.operations.filter(op => op.type === 'move');
  const rewrites = plan.operations.filter(op => op.type === 'rewrite-schema');
  const lines = ['', 'Aiuby migration — DRY RUN (nothing written)', ''];

  if (plan.conflicts.length > 0) {
    lines.push('Conflicts (migration is blocked until resolved):');
    for (const conflict of plan.conflicts) {
      lines.push(`  ✗ [${conflict.scope}] ${conflict.reason}`);
    }
    lines.push('');
  }

  if (moves.length === 0 && plan.conflicts.length === 0) {
    lines.push('Nothing to migrate — no legacy ECC state found.', '');
    return lines;
  }

  for (const move of moves) {
    lines.push(`  move    [${move.scope}] ${move.from}`);
    lines.push(`            -> ${move.to}`);
  }

  if (rewrites.length > 0) {
    lines.push('', `  rewrite ${rewrites.length} file(s) carrying an ecc.* schema id:`);
    for (const rewrite of rewrites.slice(0, 10)) {
      lines.push(`            ${rewrite.sourceFile}`);
    }
    if (rewrites.length > 10) {
      lines.push(`            … and ${rewrites.length - 10} more`);
    }
  }

  lines.push('', 'Re-run with --apply to perform the migration.', '');
  return lines;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv);
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n${usage()}`);
    process.exit(2);
  }

  if (options.help) {
    process.stdout.write(usage());
    process.exit(0);
  }

  const context = { home: options.home, projectRoot: options.projectRoot };

  try {
    if (options.listBackups) {
      const backups = listBackups({ home: options.home });
      emit(
        options,
        { backups },
        backups.length === 0
          ? ['', 'No migration backups found.', '']
          : ['', 'Migration backups (newest first):', '', ...backups.map(b => `  ${b.path}`), '']
      );
      process.exit(0);
    }

    if (options.rollback) {
      const result = rollbackMigration({ backupPath: options.rollback });
      emit(
        options,
        result,
        ['', `Rolled back ${result.restored.length} tree(s) from ${options.rollback}`, '']
      );
      process.exit(0);
    }

    if (!options.apply) {
      const plan = planMigration(context);
      emit(options, { dryRun: true, ...plan }, describePlan(plan));
      process.exit(plan.conflicts.length > 0 ? 1 : 0);
    }

    const result = applyMigration(context);

    if (result.applied.length === 0) {
      emit(options, result, ['', 'Nothing to migrate — no legacy ECC state found.', '']);
      process.exit(0);
    }

    const moves = result.applied.filter(op => op.type === 'move').length;
    const rewrites = result.applied.filter(op => op.type === 'rewrite-schema').length;

    emit(options, result, [
      '',
      'Aiuby migration complete.',
      '',
      `  moved     ${moves} directory tree(s)`,
      `  rewrote   ${rewrites} schema id(s)`,
      `  backup    ${result.backupPath}`,
      '',
      `Undo with: aiuby migrate --rollback ${result.backupPath}`,
      '',
    ]);
    process.exit(0);
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, describePlan };
