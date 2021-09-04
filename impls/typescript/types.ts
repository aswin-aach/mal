interface Reader {
	tokens: string[];
	index: number;
	next: () => string;
	peek: () => string;
}

enum Types {
	LIST = 'list',
	NUMBER = 'number',
	SYMBOL = 'symbol',
	STRING = 'string',
	NIL = 'nil',
	TRUE = 'true',
	FALSE = 'false',
	VECTOR = 'vector',
	HASHMAP = 'hashmap',
	FUNCTION = 'function'
}

type TType = Types.LIST | Types.NUMBER | Types.SYMBOL | Types.STRING | Types.NIL | Types.TRUE | Types.FALSE | Types.VECTOR | Types.HASHMAP | Types.FUNCTION;
type TListType = Types.LIST | Types.VECTOR | Types.HASHMAP;


interface HashMap {
	[key: string]: Mal;
}

interface LookupTable {
	[key: string]: Mal;
}

interface Env {
	data: LookupTable;
	outer: Env | null;
	set_data: (key: string, value: Mal) => void;
	find: (key: string) => Mal | undefined;
	get_data: (key: string) => Mal;
}

interface Mal {
	value: Mal[] | number | string | HashMap | Function ;
	tipo: TType
}

export { Reader, Mal, TType, HashMap, TListType, Types, LookupTable, Env };
