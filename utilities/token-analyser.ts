interface TAStage0<TToken extends string, TGroup extends string> {
  setClassifier: (classifier: (character: string) => TGroup) => TAStage1<TToken, TGroup>;
}

interface TAStage1<TToken extends string, TGroup extends string> {
  whenTokenIs: (token: TToken) => TAStage2<TToken, TGroup>;
}

interface TAStage2<TToken extends string, TGroup extends string>  {
  fromAnyOf: (group: TGroup, ...args : TGroup[]) => TAStage3<TToken, TGroup>;
}

interface TAStage3<TToken extends string, TGroup extends string> {
  toAnyOf: (group: TGroup, ...args : TGroup[]) => TAStage4<TToken, TGroup>;
}

interface TAStage4<TToken extends string, TGroup extends string> {
  setsToken: (token: TToken) => TAStage5<TToken, TGroup>;
}

interface TAStage5<TToken extends string, TGroup extends string> {
  whenTokenIs: (token: TToken) => TAStage2<TToken, TGroup>;
  fromAnyOf: (group: TGroup, ...args : TGroup[]) => TAStage3<TToken, TGroup>;
  analyse: (value: string, startingToken: TToken) => ParsedToken<TToken>[];
}

type Transition<TToken extends string, TGroup extends string> = {
  currentToken: TToken;
  from: TGroup[]; 
  to: TGroup[];
  newToken?: TToken;
}

export type ParsedToken<TToken extends string> = {
  type: TToken;
  value: string;
}

export default function TokenAnalyser<TToken extends string, TGroup extends string>() {

  /** A class which can be configured to break a string into tokens by configuring state-machine rules */
  class TokenAnalyser implements 
    TAStage1<TToken, TGroup>, TAStage2<TToken, TGroup> , TAStage3<TToken, TGroup> , TAStage4<TToken, TGroup> , TAStage5<TToken, TGroup>  {

    static start() : TAStage0<TToken, TGroup> {
      return new TokenAnalyser();
    }

    // For maintaining internal state
    private currentKey : TToken | undefined;
    private currentTransition : Transition<TToken, TGroup> | undefined;

    // For performing character classification
    private getGroup: ((character: string) => TGroup) | undefined;

    // An accumulated object of potential transitions which define tokens
    private validTransitions: { [key in TToken]?: Transition<TToken, TGroup>[] } = {};

    // The resulting array of tokens which are processed into a ContentTypeHeaderInfo object
    private parsedTokens : ParsedToken<TToken>[] = [];

    private startNewTransition() {
      if (!this.currentKey) throw Error('builder error');
      this.validTransitions[this.currentKey]?.push({
        currentToken: this.currentKey,
        from: [],
        to: []
      });
      this.currentTransition = (a =>  a[a.length - 1])(this.validTransitions[this.currentKey]!);
      return this.currentTransition;
    }

    setClassifier(classifier: (character: string) => TGroup) {
      this.getGroup = classifier;
      return this;
    }

    whenTokenIs(token: TToken) {
      this.currentKey = token;
      if (!this.validTransitions[token]) this.validTransitions[this.currentKey] = [];
      return this;
    }

    fromAnyOf(group: TGroup, ...args : TGroup[]) {
      if (!this.currentKey) {
        throw Error('builder error');
      }

      this.startNewTransition().from = [group, ...args];
      return this;
    }

    toAnyOf(group: TGroup, ...args : TGroup[]) {
      if (!this.currentKey || !this.currentTransition || this.currentTransition.from === []) {
        throw Error('builder error');
      }
      this.currentTransition.to = [group, ...args];
      return this;
    }

    setsToken(token: TToken) {
      if (!this.currentKey || !this.currentTransition || this.currentTransition.from === [] || this.currentTransition.to === []) {
        throw Error('builder error');
      }
      this.currentTransition.newToken = token;
      return this;
    }

    analyse(value: string, startingToken: TToken) : ParsedToken<TToken>[] {
      let currentToken =  startingToken;
      let currentGroup = this.getGroup!(value.charAt(0));
      let runningValue = value.charAt(0);

      for (let nextCharacter of value.trim().slice(1) + '\0') {  
        const transition : [TGroup, TGroup] = [currentGroup, this.getGroup!(nextCharacter)];
        const candidates : Transition<TToken, TGroup>[] = this.validTransitions[currentToken] ?? []; // TODO: Deal with undefined
        const result = candidates?.filter(c => c.from.includes(transition[0]) && c.to.includes(transition[1]))[0];
        if (!result) {
          throw Error('Illegal transition ' + JSON.stringify(transition) + ' when parsing ' + currentToken);
        }
        if (currentToken !== result.newToken) {
          this.parsedTokens.push({
            type: currentToken,
            value: runningValue
          });
          runningValue = '';
        }
        runningValue += nextCharacter;
        currentToken = result.newToken!;
        currentGroup = transition[1];
      }

      return this.parsedTokens;
    }

  }

  return TokenAnalyser.start();

}
