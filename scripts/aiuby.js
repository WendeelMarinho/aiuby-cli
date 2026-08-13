#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const { listAvailableLanguages } = require('./lib/install-executor');
const { getComputeSponsorCopy } = require('./lib/compute-sponsor');
const { createSafeItoInvocationEnvironment, getInvocationCommand } = require('./lib/ito-environment');
const { applyEnv, bootstrapEnv } = require('./lib/legacy-compat');

// Bridge any ECC_* the operator still exports before anything reads AIUBY_*. aiuby:compat
bootstrapEnv();

const COMMANDS = {
  install: {
    script: 'install-apply.js',
    description: 'Install Aiuby content into a supported target',
  },
  plan: {
    script: 'install-plan.js',
    description: 'Inspect selective-install manifests and resolved plans',
  },
  catalog: {
    script: 'catalog.js',
    description: 'Discover install profiles and component IDs',
  },
  consult: {
    script: 'consult.js',
    description: 'Recommend Aiuby components and profiles from a natural language query',
  },
  'control-pane': {
    script: 'control-pane.js',
    description: 'Run the local Aiuby operator control pane',
  },
  ito: {
    script: 'ito.js',
    description: 'Invoke the separately installed canonical Itô compute CLI',
  },
  memory: {
    script: 'memory.js',
    description: 'Share durable context across Claude, Codex, Hermes, and other harnesses',
  },
  migrate: {
    script: 'migrate-to-aiuby.js',
    description: 'Migrate a legacy ECC installation to Aiuby (dry run by default)',
  },
  'install-plan': {
    script: 'install-plan.js',
    description: 'Alias for plan',
  },
  'list-installed': {
    script: 'list-installed.js',
    description: 'Inspect install-state files for the current context',
  },
  doctor: {
    script: 'doctor.js',
    description: 'Diagnose missing or drifted Aiuby-managed files',
  },
  feedback: {
    script: 'feedback.js',
    description: 'Open the shortest path to report a problem, feedback, or an idea',
  },
  repair: {
    script: 'repair.js',
    description: 'Restore drifted or missing Aiuby-managed files',
  },
  'auto-update': {
    script: 'auto-update.js',
    description: 'Pull latest Aiuby changes and reinstall the current managed targets',
  },
  status: {
    script: 'status.js',
    description: 'Query the Aiuby SQLite state store status summary',
  },
  'platform-audit': {
    script: 'platform-audit.js',
    description: 'Audit GitHub queues, discussions, roadmap, release, and security evidence',
  },
  'security-ioc-scan': {
    script: 'ci/scan-supply-chain-iocs.js',
    description: 'Scan dependency and AI-tool persistence surfaces for active supply-chain IOCs',
  },
  sessions: {
    script: 'sessions-cli.js',
    description: 'List or inspect Aiuby sessions from the SQLite state store',
  },
  'work-items': {
    script: 'work-items.js',
    description: 'Track linked Linear, GitHub, handoff, and manual work items',
  },
  'session-inspect': {
    script: 'session-inspect.js',
    description: 'Emit canonical Aiuby session snapshots from dmux or Claude history targets',
  },
  'loop-status': {
    script: 'loop-status.js',
    description: 'Inspect Claude transcripts for stale loop wakeups and pending tool results',
  },
  uninstall: {
    script: 'uninstall.js',
    description: 'Remove Aiuby-managed files recorded in install-state',
  },
};

const PRIMARY_COMMANDS = [
  'install',
  'plan',
  'catalog',
  'consult',
  'control-pane',
  'ito',
  'memory',
  'migrate',
  'list-installed',
  'doctor',
  'feedback',
  'repair',
  'auto-update',
  'status',
  'platform-audit',
  'security-ioc-scan',
  'sessions',
  'work-items',
  'session-inspect',
  'loop-status',
  'uninstall',
];

function showHelp(exitCode = 0) {
  process.stdout.write(`
Aiuby selective-install CLI

Usage:
  aiuby <command> [args...]
  aiuby [install args...]
  aiuby --dry-run <command> [args...]

Commands:
${PRIMARY_COMMANDS.map(command => `  ${command.padEnd(15)} ${COMMANDS[command].description}`).join('\n')}

  aiuby [args...]    Without a command, args are routed to "install"
  aiuby help <cmd>   Show help for a specific command
  aiuby --version    Print the installed version

Compatibility (removed in 1.0.0):
  ecc <command>      Deprecated alias for "aiuby <command>"
  aiuby-install      Direct install entrypoint retained for existing flows
  ECC_* variables    Deprecated aliases for AIUBY_*; run "aiuby migrate"

Global Flags:
  --dry-run          Preview actions without executing (sets ECC_DRY_RUN=1)

Compute:
  ${getComputeSponsorCopy()}

Examples:
  aiuby typescript
  aiuby install --profile developer --target claude
  aiuby plan --profile core --target cursor
  aiuby catalog profiles
  aiuby catalog components --family language
  aiuby catalog show framework:nextjs
  aiuby consult "security reviews"
  aiuby control-pane --port 8765
  aiuby ito login [--no-browser]
  aiuby ito auth
  aiuby ito find --gpu h200 --count 8 --nodes 1 --gpus-per-node 8 --days 30 --storage-tb 1 --start-window 2099-08-15 --max-rate 3.00 --form-factor bare_metal --contract-type reservation --fabric infiniband --region us-east-1
  aiuby ito status --json
  aiuby ito evals --cluster clu_prod_example --live-sixtytwo --nodes gpu-01,gpu-02 --config-dir /absolute/path/to/qualification-config
  aiuby memory init
  aiuby memory handoff --from codex --target claude --title "Continue migration" --stdin
  aiuby memory search "migration blockers" --target-harness hermes
  aiuby migrate
  aiuby migrate --apply
  aiuby migrate --list-backups
  aiuby list-installed --json
  aiuby doctor --target cursor
  aiuby feedback
  aiuby repair --dry-run
  aiuby auto-update --dry-run
  aiuby status --json
  aiuby status --exit-code
  aiuby status --markdown --write status.md
  aiuby platform-audit --json --allow-untracked docs/drafts/
  aiuby security-ioc-scan --home
  aiuby sessions
  aiuby sessions session-active --json
  aiuby work-items upsert linear-aiuby-20 --source linear --source-id AIUBY-20 --title "Review control-plane contract" --status blocked
  aiuby work-items sync-github --repo WendeelMarinho/aiuby-cli
  aiuby session-inspect claude:latest
  aiuby loop-status --json
  aiuby uninstall --target antigravity --dry-run
`);

  process.exit(exitCode);
}

function resolveCommand(argv) {
  const args = argv.slice(2);

  if (args.length === 0) {
    return { mode: 'help' };
  }

  if (args.includes('--dry-run')) {
    // Writes ECC_DRY_RUN and ECC_DRY_RUN so un-migrated subcommands still see it. aiuby:compat
    applyEnv('AIUBY_DRY_RUN', '1');
  }

  let cmdStart = 0;
  while (cmdStart < args.length && args[cmdStart] === '--dry-run') {
    cmdStart++;
  }

  if (cmdStart >= args.length) {
    return { mode: 'help' };
  }

  const firstArg = args[cmdStart];
  const restArgs = args.slice(cmdStart + 1);

  if (firstArg === '--help' || firstArg === '-h') {
    return { mode: 'help' };
  }

  // `--version` is the first thing anyone types after installing a CLI, and it
  // errored out on the published 0.1.0 with "Unknown argument".
  if (firstArg === '--version' || firstArg === '-v') {
    return { mode: 'version' };
  }

  if (firstArg === 'help') {
    return {
      mode: 'help-command',
      command: restArgs[0] || null,
    };
  }

  if (COMMANDS[firstArg]) {
    return {
      mode: 'command',
      command: firstArg,
      args: restArgs,
    };
  }

  const knownLegacyLanguages = listAvailableLanguages();
  const shouldTreatAsImplicitInstall = (
    firstArg.startsWith('-')
    || knownLegacyLanguages.includes(firstArg)
  );

  if (!shouldTreatAsImplicitInstall) {
    throw new Error(`Unknown command: ${firstArg}`);
  }

  return {
    mode: 'command',
    command: 'install',
    args,
  };
}

function runCommand(commandName, args) {
  const command = COMMANDS[commandName];
  if (!command) {
    throw new Error(`Unknown command: ${commandName}`);
  }
  const isItoLogin = commandName === 'ito' && getInvocationCommand(args) === 'login';
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, command.script), ...args],
    {
      cwd: process.cwd(),
      env: commandName === 'ito'
        ? {
          ...createSafeItoInvocationEnvironment(process.env, args, {
            includeControls: true,
          }),
        }
        : process.env,
      stdio: isItoLogin
        ? 'inherit'
        : commandName === 'memory'
        ? ['inherit', 'pipe', 'pipe']
        : ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (typeof result.status === 'number') {
    return result.status;
  }

  if (result.signal) {
    throw new Error(`Command "${commandName}" terminated by signal ${result.signal}`);
  }

  return 1;
}

function main() {
  try {
    const resolution = resolveCommand(process.argv);

    if (resolution.mode === 'version') {
      console.log(require('../package.json').version);
      process.exit(0);
    }

    if (resolution.mode === 'help') {
      showHelp(0);
    }

    if (resolution.mode === 'help-command') {
      if (!resolution.command) {
        showHelp(0);
      }

      if (!COMMANDS[resolution.command]) {
        throw new Error(`Unknown command: ${resolution.command}`);
      }

      process.exitCode = runCommand(resolution.command, ['--help']);
      return;
    }

    process.exitCode = runCommand(resolution.command, resolution.args);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
