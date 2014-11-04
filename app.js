// Design:
//
// * There are several regions in the game;
//   Sheep Stock,
//   Field,
//   Hand,
//   Deck,
//   Discard pile,
//   Exile.
// * A region contains a pile of cards.
// * A pile of cards is expressed as an array.
// * The first card in an array is corresponding to
//   the bottom card in a pile or the first card put into the pile.
// * The last card in an array is corresponding to
//   the top card in a pile or the last card put into the pile.

var shephy = {};

(function (S, $) {
  // Utilities  {{{1
  S.RANKS = [1, 3, 10, 30, 100, 300, 1000];

  function max(xs) {
    return Math.max.apply(Math, xs);
  }

  function random(n) {
    return Math.floor(Math.random() * n);
  }

  function shuffle(xs) {
    for (var i = 0; i < xs.length; i++) {
      var j = random(xs.length - i);
      var tmp = xs[i];
      xs[i] = xs[j];
      xs[j] = tmp;
    }
  }

  S.delay = function(expressionAsFunction) {
    var result;
    var isEvaluated = false;

    return function () {
      if (!isEvaluated) {
        result = expressionAsFunction();
        isEvaluated = true;
      }
      return result;
    };
  };

  S.force = function (promise) {
    return promise();
  };

  S.clone = function (x) {
    return JSON.parse(JSON.stringify(x));
  };

  S.dropRank = function (rank) {
    if (rank == 1)
      return undefined;
    var r = rank % 3;
    if (r == 0)
      return rank / 3;
    else
      return rank * 3 / 10;
  };

  S.raiseRank = function (rank) {
    if (rank == 1000)
      return undefined;
    var r = rank % 3;
    if (r == 0)
      return rank * 10 / 3;
    else
      return rank * 3;
  };

  S.compositeRanks = function (ranks) {
    var rankSum = ranks.reduce(function (ra, r) {return ra + r;});
    var candidateRanks = S.RANKS.filter(function (r) {return r <= rankSum;});
    return max(candidateRanks);
  };

  function makeSheepCard(rank) {
    return {
      name: rank + '',
      rank: rank
    };
  }

  function makeSheepStockPile(rank) {
    var cards = [];
    for (var i = 0; i < 7; i++)
      cards.push(makeSheepCard(rank));
    return cards;
  }

  function makeEventCard(name) {
    return {
      name: name
    };
  }

  function cardType(card) {
    return card.type || (card.rank === undefined ? 'event' : 'sheep');
  }

  function makeInitalDeck() {
  /*
    var names = [
      'All-purpose Sheep',
      'Be Fruitful',
      'Be Fruitful',
      'Be Fruitful',
      'Crowding',
      'Dominion',
      'Dominion',
      'Falling Rock',
      'Fill the Earth',
      'Flourish',
      'Golden Hooves',
      'Inspiration',
      'Lightning',
      'Meteor',
      'Multiply',
      'Plague',
      'Planning Sheep',
      'Sheep Dog',
      'Shephion',
      'Slump',
      'Storm',
      'Wolves'
    ];
    */
    
    var names = [
      '万能ひつじ',
      '産めよ',
      '産めよ',
      '産めよ',
      '過密',
      '統率',
      '統率',
      '落石',
      '地に満ちよ',
      '繁栄',
      '黄金の蹄',
      '霊感',
      '落雷',
      'メテオ',
      '増やせよ',
      '疫病',
      '対策ひつじ',
      '牧羊犬',
      'シェフィオン',
      '暴落',
      '嵐',
      '狼'
    ];
    
    var cards = names.map(makeEventCard);
    shuffle(cards);
    return cards;
  }

  S.makeInitalWorld = function () {
    var sheepStock = {};
    S.RANKS.forEach(function (rank) {
      sheepStock[rank] = makeSheepStockPile(rank);
    });

    var initialSheepCard = sheepStock[1].pop();

    return {
      sheepStock: sheepStock,
      field: [initialSheepCard],
      enemySheepCount: 1,
      deck: makeInitalDeck(),
      hand: [],
      discardPile: [],
      exile: []
    };
  };

  S.gainX = function (world, rank) {
    if (world.sheepStock[rank].length == 0)
      return;
    if (7 - world.field.length <= 0)
      return;

    world.field.push(world.sheepStock[rank].pop());
  };

  S.releaseX = function (world, fieldIndex) {
    var c = world.field.splice(fieldIndex, 1)[0];
    world.sheepStock[c.rank].push(c);
  };

  S.discardX = function (world, handIndex) {
    var c = world.hand.splice(handIndex, 1)[0];
    world.discardPile.push(c);
  };

  S.exileX = function (world, region, index) {
    var c = region.splice(index, 1)[0];
    world.exile.push(c);
  };

  S.drawX = function (world) {
    if (world.deck.length == 0)
      return;
    if (5 - world.hand.length <= 0)
      return;

    world.hand.push(world.deck.pop());
  };

  S.remakeDeckX = function (world) {
    world.deck.push.apply(world.deck, world.discardPile);
    world.discardPile = [];
    shuffle(world.deck);
  };

  S.shouldDraw = function (world) {
    return world.hand.length < 5 && 0 < world.deck.length;
  };

  S.judgeGame = function (world) {
    if (world.field.some(function (c) {return c.rank == 1000;})) {
      return {
        result: 'win',
        description: 'あなたの勝ちです！'
      };
    }
    if (world.enemySheepCount == 1000) {
      return {
        result: 'lose',
        description: '敵ひつじが1000匹に達しました。あなたの負けです。'
      };
    }
    if (world.field.length == 0) {
      return {
        result: 'lose',
        description: 'あなたの牧場からは羊がいなくなってしまいました……。あなたの負けです。'
      };
    }

    throw 'Invalid operation';
  };

  // Move sets  {{{2
  // NB: These functions are to make code declarative, but they're destructive.

  function automated(moves) {
    moves.automated = true;
    return moves;
  }

  function described(description, moves) {
    moves.description = description;
    return moves;
  }

  function mapOn(world, regionName, moveMaker) {
    return world[regionName].map(function (c, i) {
      var move = moveMaker(c, i);
      move.cardRegion = regionName;
      move.cardIndex = i;
      return move;
    });
  }

  // Core  {{{1
  S.makeGameTree = function (world, opt_state) {  //{{{2
    return {
      world: world,
      moves: S.listPossibleMoves(world, opt_state)
    };
  };

  S.listPossibleMoves = function (world, opt_state) {  //{{{2
    if (opt_state === undefined)
      return S.listPossibleMovesForBasicRules(world);
    else
      return S.listPossibleMovesForPlayingCard(world, opt_state);
  }

  S.listPossibleMovesForBasicRules = function (world) {  //{{{2
    // TODO: Add an option to continue the current game to compete high score.
    if (world.field.some(function (c) {return c.rank == 1000;}))
      return [];

    if (1000 <= world.enemySheepCount)
      return [];

    if (world.field.length == 0)
      return [];

    if (world.hand.length == 0 && world.deck.length == 0) {
      return automated([
        {
          description: '山札を再作成し、手札を補充します。',
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            S.remakeDeckX(wn);
            while (S.shouldDraw(wn))
              S.drawX(wn);
            wn.enemySheepCount *= 10;
            return S.makeGameTree(wn);
          })
        }
      ]);
    }

    if (S.shouldDraw(world)) {
      return automated([
        {
          description:
            '手札を' + (5 - world.hand.length) + '枚補充しました。',
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            while (S.shouldDraw(wn))
              S.drawX(wn);
            return S.makeGameTree(wn);
          })
        }
      ]);
    }

    return described('使用するカードを手札から選んでください。',
      mapOn(world, 'hand', function (c, i) {
        return {
          description: c.name + 'を使用しました。',
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            S.discardX(wn, i);
            return S.makeGameTree(wn, {step: c.name});
          })
        };
      })
    );
  };

  S.listPossibleMovesForPlayingCard = function (world, state) {  //{{{2
    var h = cardHandlerTable[state.step] || unimplementedCardHandler;
    return h(world, state);
  };

  var cardHandlerTable = {};  //{{{2

  cardHandlerTable['万能ひつじ'] = function (world, state) {  //{{{2
    if (world.hand.length == 0) {
      return automated([{
        description: '手札にコピー出来るカードが残っていません。何も起こりませんでした。',
        gameTreePromise: S.delay(function () {
          return S.makeGameTree(world);
        })
      }]);
    } else {
      return described('コピーするカードを選んでください。',
        mapOn(world, 'hand', function (c, i) {
          return {
            description: c.name + 'をコピーします。',
            gameTreePromise: S.delay(function () {
              return S.makeGameTree(world, {step: c.name});
            })
          };
        })
      );
    }
  };

  cardHandlerTable['産めよ'] = function (world, state) {  //{{{2
    if (state.rank === undefined) {
      if (world.field.length < 7) {
        return described('コピーするひつじを選んでください。',
          mapOn(world, 'field', function (c) {
            return {
              description: c.rank + ' ひつじカードをコピーしました。',
              gameTreePromise: S.delay(function () {
                return S.makeGameTree(world, {step: state.step, rank: c.rank});
              })
            };
          })
        );
      } else {
        return automated([{
          description: '何も起きませんでした。',
          gameTreePromise: S.delay(function () {
            return S.makeGameTree(world);
          })
        }]);
      }
    } else {
      return automated([{
        description: state.rank + ' ひつじカードを得ました。',
        gameTreePromise: S.delay(function () {
          var wn = S.clone(world);
          S.gainX(wn, state.rank);
          return S.makeGameTree(wn);
        })
      }]);
    }
  };

  cardHandlerTable['過密'] = function (world, state) {  //{{{2
    if (world.field.length <= 2) {
      return automated([{
        description: 'ひつじカードがすでに2枚以下のため、何も起きませんでした。',
        gameTreePromise: S.delay(function () {
          return S.makeGameTree(world);
        })
      }]);
    } else {
      return described('手放すひつじカードを選んでください。',
        mapOn(world, 'field', function (c, i) {
          return {
            description: c.rank + ' ひつじカードを手放しました。',
            gameTreePromise: S.delay(function () {
              var wn = S.clone(world);
              S.releaseX(wn, i);
              var sn = wn.field.length <= 2 ? undefined : state;
              return S.makeGameTree(wn, sn);
            })
          };
        })
      );;
    }
  };

  cardHandlerTable['統率'] = function (world, state) {  //{{{2
    var chosenIndice = state.chosenIndice || [];
    var moves =
      mapOn(world, 'field', function (c, i) {
        return {
          description: c.rank + ' ひつじカードを選びました。',
          gameTreePromise: S.delay(function () {
            return S.makeGameTree(world, {
              step: state.step,
              chosenIndice: (chosenIndice || []).concat([i]).sort()
            });
          })
        };
      })
      .filter(function (m) {return chosenIndice.indexOf(m.cardIndex) == -1;});
    if (chosenIndice.length != 0) {
      moves.push({
        description: '選ばれたひつじカードを統率します。',
        gameTreePromise: S.delay(function () {
          var wn = S.clone(world);
          for (var i = chosenIndice.length - 1; 0 <= i; i--)
            S.releaseX(wn, chosenIndice[i]);
          S.gainX(wn, S.compositeRanks(
            chosenIndice.map(function (i) {return world.field[i].rank;})
          ));
          return S.makeGameTree(wn);
        })
      });
    }

    // 最初の1回だけでもいいんじゃないかなあ
    if (chosenIndice.length == 0)
      moves.description = '統率するひつじカードを選んでください。';
    else if (chosenIndice.length != world.field.length)
      moves.description = '統率するひつじカードを選んでください。';
    else
      moves.automated = true;

    return moves;
  };

  cardHandlerTable['落石'] = function (world, state) {  //{{{2
    return described('手放すひつじカード1枚を選んでください。',
      mapOn(world, 'field', function (c, i) {
        return {
          description: c.rank + ' ひつじカードを手放しました。',
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            S.releaseX(wn, i);
            return S.makeGameTree(wn);
          })
        };
      })
    );
  };

  cardHandlerTable['地に満ちよ'] = function (world, state) {  //{{{2
    var moves = [];
    if (world.field.length < 7) {
      moves.description = '1 ひつじカードを得ました。';
      moves.push({
        description: '1 ひつじカードを得ました。',
        cardRegion: 'sheepStock1',
        cardIndex: world.sheepStock[1].length - 1,
        gameTreePromise: S.delay(function () {
          var wn = S.clone(world);
          S.gainX(wn, 1);
          return S.makeGameTree(wn, state);
        })
      });
    } else {
      moves.description = 'もう牧場に空きがありません。';
      moves.automated = true;
    }
    moves.push({
      description: 'キャンセルしました。',
      gameTreePromise: S.delay(function () {
        return S.makeGameTree(world);
      })
    });
    return moves;
  };

  cardHandlerTable['繁栄'] = function (world, state) {  //{{{2
    if (state.rank === undefined) {
      if (world.field.length < 7) {
        return described('繁栄させるひつじカードを選んでください。',
          mapOn(world, 'field', function (c) {
            return {
              description: c.rank + ' ひつじカードを選びました。',
              gameTreePromise: S.delay(function () {
                return S.makeGameTree(world, {step: state.step, rank: c.rank});
              })
            };
          })
        );
      } else {
        return automated([{
          description: '何も起きませんでした。', // 牧場に空きがないため。
          gameTreePromise: S.delay(function () {
            return S.makeGameTree(world);
          })
        }]);
      }
    } else {
      var lowerRank = S.dropRank(state.rank);
      if (lowerRank === undefined) {
        return automated([{
          description: '何も得られませんでした。', // 1ランクより下はないため。
          gameTreePromise: S.delay(function () {
            return S.makeGameTree(world);
          })
        }]);
      } else {
        var n = Math.min(3, 7 - world.field.length);
        return automated([{
          description:
            n == 1
            ? lowerRank + ' ひつじカードを得ました。'
            : lowerRank + ' ひつじカードを' + n + '枚得ました。',
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            for (var i = 1; i <= n; i++)
              S.gainX(wn, lowerRank);
            return S.makeGameTree(wn);
          })
        }]);
      }
    }
  };

  cardHandlerTable['黄金の蹄'] = function (world, state) {  //{{{2
    var highestRank = max(world.field.map(function (c) {return c.rank;}));
    var chosenIndice = state.chosenIndice || [];
    var moves = [];

    world.field.forEach(function (c, i) {
      if (c.rank < highestRank && chosenIndice.indexOf(i) == -1) {
        moves.push({
          description: c.rank + ' ひつじカードを選びました。',
          cardRegion: 'field',
          cardIndex: i,
          gameTreePromise: S.delay(function () {
            return S.makeGameTree(world, {
              step: state.step,
              chosenIndice: (chosenIndice || []).concat([i]).sort()
            });
          })
        });
      }
    });
    if (moves.length != 0)
      moves.description = 'ひつじカードを選んでください。'

    moves.push({
      description:
        chosenIndice.length == 0
        ? 'キャンセルしました。'
        : '選ばれたひつじカードが1ランクアップしました。',
      gameTreePromise: S.delay(function () {
        var wn = S.clone(world);
        for (var i = chosenIndice.length - 1; 0 <= i; i--) {
          var c = world.field[chosenIndice[i]];
          S.releaseX(wn, chosenIndice[i]);
          S.gainX(wn, S.raiseRank(c.rank));
        }
        return S.makeGameTree(wn);
      })
    });
    if (moves.length == 1)
      moves.automated = true;

    return moves;
  };

  cardHandlerTable['霊感'] = function (world, state) {  //{{{2
    if (world.deck.length == 0) {
      return automated([{
        description: '山札には何もありませんでした。',
        gameTreePromise: S.delay(function () {
          return S.makeGameTree(world);
        })
      }]);
    } else if (state.searched === undefined) {
      return described('山札からカードを選んでください。',
        mapOn(world, 'deck', function (c, i) {
          return {
            description: c.name + ' カードを手札に得ました。',
            gameTreePromise: S.delay(function () {
              var wn = S.clone(world);
              wn.hand.push(wn.deck.splice(i, 1)[0]);
              return S.makeGameTree(wn, {step: state.step, searched: true});
            })
          };
        })
      );
    } else {
      return automated([{
        description: '山札をシャッフルしました。',
        gameTreePromise: S.delay(function () {
          var wn = S.clone(world);
          shuffle(wn.deck);
          return S.makeGameTree(wn);
        })
      }]);
    }
  };

  cardHandlerTable['落雷'] = function (world, state) {  //{{{2
    var highestRank = max(world.field.map(function (c) {return c.rank;}));
    return described('手放すひつじカードを選んでください。',
      world.field
      .map(function (c, i) {return [c, i];})
      .filter(function (x) {return x[0].rank == highestRank;})
      .map(function (x) {
        return {
          description: x[0].rank + ' ひつじカードを手放しました。',
          cardRegion: 'field',
          cardIndex: x[1],
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            S.releaseX(wn, x[1]);
            return S.makeGameTree(wn);
          })
        };
      })
    );
  };

  cardHandlerTable['メテオ'] = function (world, state) {  //{{{2
    var n = Math.min(state.rest || 3, world.field.length);
    return described('手放すひつじカードを3枚選んでください。',
      mapOn(world, 'field', function (c, i) {
        return {
          description: c.rank + ' ひつじカードを手放しました。',
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            if (state.rest === undefined)
              S.exileX(wn, wn.discardPile, wn.discardPile.length - 1);
            S.releaseX(wn, i);
            var sn = n == 1 ? undefined : {step: state.step, rest: n - 1};
            return S.makeGameTree(wn, sn);
          })
        };
      })
    );
  };

  cardHandlerTable['増やせよ'] = function (world, state) {  //{{{2
    if (world.field.length < 7 && 0 < world.sheepStock[3].length) {
      return automated([{
        description: '3 ひつじカードを得ました。',
        gameTreePromise: S.delay(function () {
          var wn = S.clone(world);
          S.gainX(wn, 3);
          return S.makeGameTree(wn);
        })
      }]);
    } else {
      return automated([{
        description: '何も起きませんでした。',
        gameTreePromise: S.delay(function () {
          return S.makeGameTree(world);
        })
      }]);
    }
  };

  cardHandlerTable['疫病'] = function (world, state) {  //{{{2
    return described('手放すひつじカードを選んでください。',
      mapOn(world, 'field', function (c) {
        var r = c.rank;
        return {
          description: r + ' ひつじカードすべてを手放しました。',
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            for (var i = wn.field.length - 1; 0 <= i; i--) {
              if (wn.field[i].rank == r)
                S.releaseX(wn, i);
            }
            return S.makeGameTree(wn);
          })
        };
      })
    );
  };

  function uniq(xs) {
    var us = [];
    var found = {};
    for (var i = 0; i < xs.length; i++) {
      var x = xs[i];
      if (!found[x]) {
        us.push(x);
        found[x] = true;
      }
    }
    return us;
  }

  cardHandlerTable['対策ひつじ'] = function (world, state) {  //{{{2
    if (world.hand.length == 0) {
      return automated([{
        description: '追放するカードがありません。何も起きませんでした。',
        gameTreePromise: S.delay(function () {
          return S.makeGameTree(world);
        })
      }]);
    } else {
      return described('追放するカードを選んでください。',
        mapOn(world, 'hand', function (c, i) {
          return {
            description: c.name + ' カードを追放しました。',
            gameTreePromise: S.delay(function () {
              var wn = S.clone(world);
              S.exileX(wn, wn.hand, i);
              return S.makeGameTree(wn);
            })
          };
        })
      );
    }
  };

  cardHandlerTable['牧羊犬'] = function (world, state) {  //{{{2
    if (world.hand.length == 0) {
      return automated([{
        description: '捨てるカードがありません。何も起きませんでした。',
        gameTreePromise: S.delay(function () {
          return S.makeGameTree(world);
        })
      }]);
    } else {
      return described('捨てるカードを選んでください。',
        mapOn(world, 'hand', function (c, i) {
          return {
            description: c.name + ' カードを捨てました。',
            gameTreePromise: S.delay(function () {
              var wn = S.clone(world);
              S.discardX(wn, i);
              return S.makeGameTree(wn);
            })
          };
        })
      );
    }
  };

  cardHandlerTable['シェフィオン'] = function (world, state) {  //{{{2
    return automated([{
      description: 'すべてのひつじカードを手放しました。',
      gameTreePromise: S.delay(function () {
        var wn = S.clone(world);
        while (1 <= wn.field.length)
          S.releaseX(wn, 0);
        return S.makeGameTree(wn);
      })
    }]);
  };

  cardHandlerTable['暴落'] = function (world, state) {  //{{{2
    if (world.field.length == 1) {
      return automated([{
        description: '手放すひつじカードがありません。何も起きませんでした。',
        gameTreePromise: S.delay(function () {
          return S.makeGameTree(world);
        })
      }]);
    } else {
      var n = state.initialCount || world.field.length;
      var countToKeep = Math.ceil(n / 2);
      return described('手放すひつじカードを選んでください。',
        mapOn(world, 'field', function (c, i) {
          return {
            description: c.rank + ' ひつじカードを手放しました。',
            gameTreePromise: S.delay(function () {
              var wn = S.clone(world);
              S.releaseX(wn, i);
              var sn = wn.field.length == countToKeep
                ? undefined
                : {step: state.step, initialCount: n};
              return S.makeGameTree(wn, sn);
            })
          };
        })
      );
    }
  };

  cardHandlerTable['嵐'] = function (world, state) {  //{{{2
    var n = Math.min(state.rest || 2, world.field.length);
    return described('手放すひつじカードを選んでください。',
      mapOn(world, 'field', function (c, i) {
        return {
          description: c.rank + ' ひつじカードを手放しました。',
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            S.releaseX(wn, i);
            var sn = n == 1 ? undefined : {step: state.step, rest: n - 1};
            return S.makeGameTree(wn, sn);
          })
        };
      })
    );
  };

  cardHandlerTable['狼'] = function (world, state) {  //{{{2
    var highestRank = max(world.field.map(function (c) {return c.rank;}));
    if (highestRank == 1)
      return cardHandlerTable['落雷'](world, state);
    return described('ランクダウンさせるひつじカードを選んでください。',
      world.field
      .map(function (c, i) {return [c, i];})
      .filter(function (x) {return x[0].rank == highestRank;})
      .map(function (x) {
        return {
          description: x[0].rank + ' ひつじカードがランクダウンしました。',
          cardRegion: 'field',
          cardIndex: x[1],
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            S.releaseX(wn, x[1]);
            S.gainX(wn, S.dropRank(highestRank));
            return S.makeGameTree(wn);
          })
        };
      })
    );
  };

  function unimplementedCardHandler(world, state) {  //{{{2
    // TODO: Throw an error after all event cards are implemented.
    return [{
      description: '何も起きませんでした。（まだ実装されていません。）',
      gameTreePromise: S.delay(function () {
        return S.makeGameTree(world);
      })
    }];
  };

  // UI  {{{1
  // TODO: Add UI to start a new game after finishing a game.
  // TODO: Add UI to quit the current game.
  // TODO: Choose a move automatically if it doesn't express a user's choice.
  //       Examples: "Draw cards" and "Remake Deck and fill Hand".
  // TODO: Render cards as a stack of card-like shapes, not text.
  // TODO: Make #world elements clickable to choose a move.
  //       For example:
  //       - Click a card in Hand to play the card.
  //       - Click a card in Field to duplicate by playing Be Fruitful.
  // TODO: Show a card text if the cursor is hovered on the card.

  function textizeCards(cs) {
    if (cs.length == 0)
      return '-';
    else
      return cs.map(function (c) {return c.name;}).join(', ');
  }

  /*
  var ruleTextFromCardNameTable = {
    'All-purpose Sheep': 'Choose a card in your hand.\nPlay this card in place of the card you chose.',
    'Be Fruitful': 'Duplicate one of your Sheep cards.',
    'Crowding': 'Release all but two Sheep cards.',
    'Dominion': 'Choose any number of Sheep cards in the Field.\nAdd their values and then replace them with\none Sheep card of equal of lesser value.',
    'Falling Rock': 'Relase one Sheep card.',
    'Fill the Earth': 'Place as many 1 Sheep cards as you like in the Field.',
    'Flourish': 'Choose one of your Sheep cards\nand receive three Sheep cards of one rank lower.',
    'Golden Hooves': 'Raise the rank of as many Sheep cards as you like,\nexcept for your highest-ranking Sheep card.',
    'Inspiration': 'Look through the deck\nand add one card of your choice to your hand,\nand then re-shuffle the deck.',
    'Lightning': 'Release your highest-ranking Sheep card.',
    'Meteor': 'Release three Sheep cards,\nand then remove this card from the game.',
    'Multiply': 'Place one 3 Sheep card in the Field.',
    'Plague': 'Release all Sheep cards of one rank.',
    'Planning Sheep': 'Remove one card in your hand from the game.',
    'Sheep Dog': 'Discard one card from your hand.',
    'Shephion': 'Release seven Sheep cards.',
    'Slump': 'Relase half of your Sheep cards (Round down.)',
    'Storm': 'Release two Sheep cards.',
    'Wolves': 'Reduce the rank of your highest-ranking sheep card by one.\nIf your highest ranaking Sheep card is 1, release it.'
  };
  */

  var ruleTextFromCardNameTable = {
    '万能ひつじ': '手札1枚を選び、それと同じ効果を持つカードとして使う。',
    '産めよ': 'ひつじカード1枚をコピーする。',
    '過密': '2枚以下になるまで、ひつじカードを手放す。',
    '統率': 'ひつじカードを何枚か選び、数を足して1枚にする（合計値以内のひつじカード1枚に置き換える）。',
    '落石': 'ひつじカード1枚を手放す。',
    '地に満ちよ': '[1]を好きなだけ得る。',
    '繁栄': 'ひつじカード1枚を選ぶ。その1ランク下のカードを3枚得る。',
    '黄金の蹄': '最大でないひつじカードを好きなだけ選び、それぞれ1ランクアップする。',
    '霊感': '山札を見て好きなカード1枚を手札にし、残りをよく切る。',
    '落雷': '最大のひつじカード1枚を手放す。',
    'メテオ': 'このカードを追放する。ひつじカード3枚を手放す。',
    '増やせよ': '[3]を得る。',
    '疫病': 'ひつじカード1種類すべてを手放す。',
    '対策ひつじ': '手札1枚を追放する。',
    '牧羊犬': '手札1枚を捨てる。',
    'シェフィオン': 'ひつじカード7枚を手放す。',
    '暴落': '枚数が半分になるまで、ひつじカードを手放す（奇数なら残り枚数は切り上げ）。',
    '嵐': '羊カード2枚を手放す。',
    '狼': '最大のひつじカード1枚を選び、1ランクダウンする（[1]なら手放す）。'
  };

  function helpTextFromCard(card) {
    return card.name + '\n\n' + ruleTextFromCardNameTable[card.name];
  }

  function makeFaceDownCards(n) {
    var cards = [];
    for (var i = 0; i < n; i++)
      cards.push({name: '', type: 'face-down'});
    return cards;
  }

  function visualizeCard(card) {
    var $body = $('<span>');
    $body.addClass('body');
    $body.text(card.name);

    var $border = $('<span>');
    $border.addClass('border');
    $border.append($body);

    var $card = $('<span>');
    $card.addClass('card');
    $card.addClass(cardType(card));
    $card.addClass('rank' + card.rank);
    if (cardType(card) === 'event')
      $card.attr('title', helpTextFromCard(card));
    $card.append($border);
    return $card;
  }

  function visualizeCards(cards) {
    return cards.map(visualizeCard);
  }

  function mayBeAutomated(gameTree) {
    return gameTree.moves.automated;
  }

  function descriptionOfMoves(moves) {
    if (moves.description)
      return moves.description;

    if (moves.length == 1)
      return moves[0].description;

    return 'Choose a move';
  }

  var AUTOMATED_MOVE_DELAY = 500;

  function processMove(m) {
    var gt = S.force(m.gameTreePromise);
    drawGameTree(gt);
    if (mayBeAutomated(gt)) {
      setTimeout(
        function () {processMove(gt.moves[0]);},
        AUTOMATED_MOVE_DELAY
      );
    }
  }

  function nodizeMove(m) {
    var $m = $('<input>');
    $m.attr({
      type: 'button',
      value: m.description
    });
    $m.click(function () {
      processMove(m);
    });
    return $m;
  }

  function drawGameTree(gameTree) {
    var w = gameTree.world;
    var deckRevealed = gameTree.moves.some(function (m) {
      return m.cardRegion === 'deck';
    });
    $('#enemySheepCount > .count').text(w.enemySheepCount);
    var v = {
      deck: visualizeCards(deckRevealed ? w.deck : makeFaceDownCards(w.deck.length)),
      field: visualizeCards(w.field),
      hand: visualizeCards(w.hand)
    };
    S.RANKS.forEach(function (rank) {
      var vcs = visualizeCards(w.sheepStock[rank]);
      v['sheepStock' + rank] = vcs;
      $('#sheepStock' + rank).html(vcs);
    });
    $('#field > .cards').html(v.field);
    $('#hand > .cards').html(v.hand);
    $('#deck > .cards').html(v.deck).toggleClass('lined', !deckRevealed);
    $('#discardPile > .cards').html(visualizeCards(w.discardPile));
    $('#exile > .cards').html(visualizeCards(w.exile));

    if (mayBeAutomated(gameTree)) {
      $('#message').prepend("<p class=\"log\">" + descriptionOfMoves(gameTree.moves) + "</p>");
      $('#moves').empty();
    } else {
      var msg = 
        gameTree.moves.length == 0
        ? S.judgeGame(gameTree.world).description
        : descriptionOfMoves(gameTree.moves);
      $('#message').prepend("<p class=\"log\">" + msg + "</p>")
      
      gameTree.moves
        .filter(function (m) {return m.cardRegion !== undefined;})
        .forEach(function (m) {
          v[m.cardRegion][m.cardIndex]
            .addClass('clickable')
            .click(function () {
              processMove(m);
            });
        });
      $('#moves')
        .empty()
        .append(
          gameTree.moves
          .filter(function (m) {return m.cardRegion === undefined;})
          .map(nodizeMove)
        );
    }
  }




  // Bootstrap  {{{1
  // TODO: Revise UI to start the first game after page load.
  //       (Show "Start a game" instead of "Draw cards)

  $(function () {
    processMove(S.makeGameTree(S.makeInitalWorld()).moves[0]);
  });

  //}}}1
})(shephy, jQuery);

// vim: expandtab softtabstop=2 shiftwidth=2 foldmethod=marker
