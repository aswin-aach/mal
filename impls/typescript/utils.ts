function applyEscapeCharacters(input: string) {
	if (/([^\\]\\(\\{2})*$)|(^\\(\\{2})*$)/.test(input))
		throw new SyntaxError('unbalanced');
	return input.replace(/\\n/g, '\n').replace(/\\"/g, '\"').replace(/\\\\/g, '\\');
}

function unApplyEscapeCharacters(input: string) {
	return input.replace(/\\/g, '\\\\').replace(/\"/g, '\\"').replace(/\n/g, '\\n');
}

export { applyEscapeCharacters, unApplyEscapeCharacters };
