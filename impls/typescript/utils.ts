function applyEscapeCharacters(input: string) {
	if (/([^\\]\\(\\{2})*$)|(^\\(\\{2})*$)/.test(input))
		throw new SyntaxError('unbalanced');
	//return input.replace(/\\n/g, '\n').replace(/\\"/g, '\"').replace(/\\\\/g, '\\');
	let new_string = '';
	for (let i = 0; i < input.length; i += 1) {
		if (input[i] === '\\') {
			if (input[i+1] === 'n')
				new_string += '\n';
			else if (input[i+1] === '"')
				new_string += '\"';
			else if (input[i+1] === '\\')
				new_string += '\\';
			else new_string += '\\';
			i += 1;
			continue;
		}
		new_string += input[i];
	}
	return new_string;
}

function unApplyEscapeCharacters(input: string) {
	return input.replace(/\\/g, '\\\\').replace(/\"/g, '\\"').replace(/\n/g, '\\n');
}

export { applyEscapeCharacters, unApplyEscapeCharacters };
