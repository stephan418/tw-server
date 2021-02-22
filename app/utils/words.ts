class WordList {
    private words: string[];

    constructor(words: string[]) {
        this.words = words;
    };

    random(n: number) {
        let returns = [];

        for (let i = 0; i < n; i++) {
            returns.push(this.words[Math.floor(Math.random() * this.words.length)]);
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
        const json = JSON.parse(path);
        
        this._lists = {};
        this._defaultList = json.default;
        
        Object.entries(json.lists).map(([name, list]) => {
            this._lists = {...this._lists, [name]: new WordList(list as string[])};
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
