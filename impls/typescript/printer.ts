import {Mal, Types} from './types';
import {unApplyEscapeCharacters} from './utils';

function pr_str(ast: Mal, print_readably = false): string {
	switch(ast.tipo) {
		case Types.SYMBOL:
		case Types.TRUE:
		case Types.FALSE:
		case Types.NIL:
			return ast.value as string;
		case Types.STRING:
			if ((ast.value as string).slice(0,1) === '\u{29E}')
				return `:${(ast.value as string).slice(1)}`;
			return print_readably ? `"${unApplyEscapeCharacters(ast.value as string)}"` : `"${ast.value}"`;
		case Types.NUMBER:
			return `${ast.value}`;
		case Types.LIST:
		case Types.VECTOR: {
			const str_val = (ast.value as Mal[]).reduce((acc_string, new_mal) => {
				let part = pr_str(new_mal, print_readably);
				// if (new_mal.tipo === Types.STRING)
				// 	part = part.slice(1, -1);
				return `${acc_string}${part} `;
			}, '');
			if ( ast.tipo === Types.VECTOR)
				return `[${str_val.slice(0, -1)}]`;
			return `(${str_val.slice(0, -1)})`;
		}
		case Types.HASHMAP:
			const str_val = Object.entries(ast.value).reduce((acc, [key, value]) => {
				acc += ' ';
				if (key.slice(0, 1) === '\u{29E}')
					acc += `:${key.slice(1)} `;
				else
					acc += `"${key}" `;
				acc += pr_str(value);
				return acc;
			}, '');
			return `{${str_val.slice(1)}}`;
		case Types.FUNCTION:
			return '#<function>';
		default:
			return ''; // exception instead?
	}
}

export {pr_str};
