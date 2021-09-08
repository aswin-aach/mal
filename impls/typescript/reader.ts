import {Reader, Mal, TType, TListType, Types, HashMap} from './types';
import {applyEscapeCharacters} from './utils';

function tokenize(input: string): string[] {
	const regexp = /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)/g;
	return Array.from(input.matchAll(regexp), m => m[1]).filter(token => token.slice(0, 1) !== ';');
}

function createReader(tokens: string[]): Reader {
	return {
		tokens,
		index: 0,
		next: function() {
			return this.tokens[this.index++];
		},
		peek: function() {
			return this.tokens[this.index];
		}
	};
}

function read_list(reader: Reader, listType: TListType): Mal {
	const isListEnd = (currentSymbol: string) => {
		switch(listType) {
			case Types.LIST:
				return currentSymbol === ')';
			case Types.VECTOR:
				return currentSymbol === ']';
			default:
				return currentSymbol === '}';
		}
	};
	const tempList: Mal[] = [];
	let symundercursor = reader.peek();
	while (symundercursor && !isListEnd(symundercursor)) {
		tempList.push(read_form(reader));
		symundercursor = reader.peek();
	}
	if (!isListEnd(symundercursor))
		throw new SyntaxError('unbalanced');
	reader.next();
	if (listType !== Types.HASHMAP)
		return {
			value: tempList,
			tipo: listType
		};
	return {
		value: createHashMapFromList(tempList),
		tipo: listType
	};
}

function createHashMapFromList(malList: Mal[]): HashMap {
	if (malList.length % 2)
		throw new SyntaxError('unbalanced');
	const map: HashMap = {};
	for (let index = 0; index < malList.length; index += 2) {
		if (malList[index].tipo !== Types.STRING || typeof malList[index].value !== 'string')
			throw new SyntaxError('hashmap key wrong');
		map[malList[index].value as string] = malList[index + 1];
	}
	return map;
}
	

function read_atom(token: string): Mal {
	const value = Number(token);
	if (Number.isNaN(value)) {
		let tipo: TType = Types.SYMBOL;

		switch(token) {
			case 'nil':
				tipo = Types.NIL;
				break;
			case 'false':
				tipo = Types.FALSE;
				break;
			case 'true':
				tipo = Types.TRUE;
				break;
			default:
				if (token.slice(0, 1) === ':') {
					if (token.length === 1)
						throw new SyntaxError('keyword not found');
					token = `\u{29E}${token.slice(1)}`;
					tipo = Types.STRING;
					break;
				}
				if (token.slice(0, 1) === '"') {
					if (token.length === 1 || token.slice(-1) !== '"')
						throw new SyntaxError('unbalanced');
					token = applyEscapeCharacters(token.slice(1, -1));
					tipo = Types.STRING;
					break;
				}
				break;
		}

		return {
			value: token,
			tipo
		};
	}
	return {
		value,
		tipo: Types.NUMBER
	};
}

function read_form(reader: Reader): Mal {
	const topSymbol = reader.peek();
	if (!topSymbol)
		throw new SyntaxError();
	if (topSymbol === '@') {
		reader.next();
		return {
			value: [
				{
					value: 'deref',
					tipo: Types.SYMBOL
				},
				read_form(reader)
			],
			tipo: Types.LIST
		};
	}
	if (topSymbol  === '(' || topSymbol === '[' || topSymbol === '{') {
		reader.next();
		return read_list(reader, topSymbol === '(' ? Types.LIST : topSymbol === '[' ? Types.VECTOR : Types.HASHMAP);
	}
	return read_atom(reader.next());
}

function read_str(input: string): Mal {
	const reader = createReader(tokenize(input));
	return read_form(reader);
}

export { read_str };
