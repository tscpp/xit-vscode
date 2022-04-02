import * as vscode from 'vscode';

function range(min: number, max: number) {
	return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

function eliminateDuplicates<T extends unknown[]>(array: T): T {
	return Array.from(new Set(array)) as T;
}

function getSelectedLines(editor: vscode.TextEditor) {
	return eliminateDuplicates(
		editor.selections
			.flatMap(selection => range(selection.start.line, selection.end.line))
			.sort()
	);
}

function editSelectedCheckboxes(editor: vscode.TextEditor, replacer: (value: string) => string) {
	const lines = getSelectedLines(editor);

	editor.edit(builder => {
		for (const line of lines) {
			const text = editor.document.lineAt(line).text;
			const match = /^\[([^\]])*\]/.exec(text);
			if (!match) continue;
			const [checkbox, value] = match;
			const edit = `[${replacer(value)}]`;
			const range = new vscode.Range(line, 0, line, checkbox.length);
			builder.replace(range, edit);
		}
	})
}

function selectionHasCheckboxes(editor: vscode.TextEditor) {
	const lines = getSelectedLines(editor);

	for (const line of lines) {
		const text = editor.document.lineAt(line).text;
		if (/^\[([^\]])*\]/.test(text)) return true;
	}

	return false;
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('xit.toggle', () => {
		const editor = vscode.window.activeTextEditor!;

		editSelectedCheckboxes(editor, (value) => {
			return /^\s*$/.test(value) ? 'x' : ' ';
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('xit.shuffle', () => {
		const editor = vscode.window.activeTextEditor!;

		editSelectedCheckboxes(editor, (value) => {
			const edit =
				/* 1. " " -> "@" */ /^\s*$/.test(value) ? '@' :
				/* 2. "@" -> "~" */ value === '@' ? '~' :
				/* 3. "~" -> "x" */ value === '~' ? 'x' :
				/* 4. "x" -> " " */ value === 'x' ? ' '
				/* fallback */ : ' ';
				
			return edit;
		});
	}));

	context.subscriptions.push(
		vscode.commands.registerCommand('xit.suggest', () => {
			const editor = vscode.window.activeTextEditor!;

			if (selectionHasCheckboxes(editor))
				vscode.commands.executeCommand('xit.toggle');
			else
				vscode.commands.executeCommand('editor.action.triggerSuggest');
		})
	);
}

export function deactivate() { }
