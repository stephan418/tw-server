import fs from 'fs';

class WordList {
    private _words: string[];
    readonly _commonName: string;

    constructor(words: string[], commonName: string) {
        this._words = words;
        this._commonName = commonName;
    };

    random(n: number) {
        let returns = [];

        for (let i = 0; i < n; i++) {
            returns.push(this._words[Math.floor(Math.random() * this._words.length)]);
        }

        return returns;
    }
}

interface Lists {
    [i: string]: WordList,
}

export class WordLists {
    private _lists: Lists;
    private _defaultList: string

    constructor(path: string) {
        const json = JSON.parse(fs.readFileSync(path, 'utf8'));
        
        this._lists = {};
        this._defaultList = json.default;
        
        Object.entries(json.lists).map(([name, list]: [name: string, list: any]) => {
            this._lists = {...this._lists, [name]: new WordList(list.words as string[], list['common-name'])};
        });
    }

    get(name: string): WordList | undefined {
        if (!(name in this._lists)) return undefined;

        return this._lists[name];
    }

    get default(): WordList | undefined {
        return this.get(this._defaultList);
    }

    get listNames(): string[] {
        return Object.keys(this._lists);
    }

    get defaultName(): string {
        return this._defaultList;
    }
}
