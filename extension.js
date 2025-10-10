const vscode = require('vscode');

// Mapping between configuration keys and TextMate scopes
const COLOR_RULES = [
  { configKey: 'keywordControlLoop', scope: 'keyword.control.loop.filemaker' },
  { configKey: 'keywordCommandExecute', scope: 'keyword.command.execute.filemaker' },
  { configKey: 'keywordCommandSetVariable', scope: 'keyword.command.set-variable.filemaker' },
  { configKey: 'stringQuotedDouble', scope: 'string.quoted.double.script' },
  { configKey: 'variableOther', scope: 'variable.other.filemaker' }
];

async function applyTokenColors() {
  const colorConfig = vscode.workspace.getConfiguration('my-fm-syntax.colors');
  const desiredRules = COLOR_RULES.map(({ configKey, scope }) => ({
    scope,
    settings: { foreground: colorConfig.get(configKey) }
  }));

  const editorConfig = vscode.workspace.getConfiguration('editor');
  const existingCustomizations = editorConfig.get('tokenColorCustomizations') || {};
  const existingRules = Array.isArray(existingCustomizations.textMateRules)
    ? existingCustomizations.textMateRules
    : [];

  const managedScopes = new Set(COLOR_RULES.map(({ scope }) => scope));
  const filteredRules = existingRules.filter((rule) => {
    const scope = rule.scope;
    if (typeof scope === 'string') {
      return !managedScopes.has(scope);
    }
    if (Array.isArray(scope)) {
      return !scope.some((item) => managedScopes.has(item));
    }
    return true;
  });

  const nextRules = [...filteredRules, ...desiredRules];

  if (JSON.stringify(existingRules) === JSON.stringify(nextRules)) {
    return;
  }

  const nextCustomizations = { ...existingCustomizations, textMateRules: nextRules };
  await editorConfig.update(
    'tokenColorCustomizations',
    nextCustomizations,
    vscode.ConfigurationTarget.Workspace
  );
}

function activate(context) {
  applyTokenColors().catch((error) => console.error('Failed to apply FileMaker colors:', error));

  const watcher = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('my-fm-syntax.colors')) {
      applyTokenColors().catch((error) =>
        console.error('Failed to reapply FileMaker colors:', error)
      );
    }
  });

  context.subscriptions.push(watcher);
}

function deactivate() {
  // Nothing to clean up
}

module.exports = {
  activate,
  deactivate
};
