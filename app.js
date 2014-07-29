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
    // TODO: Implement effects when a card is played.
    return {
      name: name
    };
  }

  function makeInitalDeck() {
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
        description: 'You win!'
      };
    }
    if (world.enemySheepCount == 1000) {
      return {
        result: 'lose',
        description: 'Enemies reached 1000 sheep - you lose.'
      };
    }
    if (world.field.length == 0) {
      return {
        result: 'lose',
        description: 'You lost all your sheep - you lose.'
      };
    }

    throw 'Invalid operation';
  };

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
      return [
        {
          description: 'Remake Deck then fill Hand',
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            S.remakeDeckX(wn);
            while (S.shouldDraw(wn))
              S.drawX(wn);
            wn.enemySheepCount *= 10;
            return S.makeGameTree(wn);
          })
        }
      ];
    }

    if (S.shouldDraw(world)) {
      return [
        {
          description:
            5 - world.hand.length == 1
            ? 'Draw a card'
            : 'Draw cards',
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            while (S.shouldDraw(wn))
              S.drawX(wn);
            return S.makeGameTree(wn);
          })
        }
      ];
    }

    return world.hand.map(function (c, i) {
      return {
        description: 'Play ' + c.name,
        gameTreePromise: S.delay(function () {
          var wn = S.clone(world);
          S.discardX(wn, i);
          return S.makeGameTree(wn, {step: c.name});
        })
      };
    });
  };

  S.listPossibleMovesForPlayingCard = function (world, state) {  //{{{2
    var h = cardHandlerTable[state.step] || unimplementedCardHandler;
    return h(world, state);
  };

  var cardHandlerTable = {};  //{{{2

  cardHandlerTable['Be Fruitful'] = function (world, state) {  //{{{2
    if (state.rank === undefined) {
      if (world.field.length < 7) {
        return world.field.map(function (c) {
          return {
            description: 'Copy ' + c.rank + ' Sheep card',
            gameTreePromise: S.delay(function () {
              return S.makeGameTree(world, {step: state.step, rank: c.rank});
            })
          };
        });
      } else {
        return [{
          description: 'Nothing happened',
          gameTreePromise: S.delay(function () {
            return S.makeGameTree(world);
          })
        }];
      }
    } else {
      return [{
        description: 'Gain a ' + state.rank + ' Sheep card',
        gameTreePromise: S.delay(function () {
          var wn = S.clone(world);
          S.gainX(wn, state.rank);
          return S.makeGameTree(wn);
        })
      }];
    }
  };

  cardHandlerTable['Dominion'] = function (world, state) {  //{{{2
    var chosenIndice = state.chosenIndice || [];
    var moves = [];
    world.field.forEach(function (c, i) {
      if (chosenIndice.indexOf(i) == -1) {
        moves.push({
          description: 'Choose ' + c.rank + ' Sheep card',
          gameTreePromise: S.delay(function () {
            return S.makeGameTree(world, {
              step: state.step,
              chosenIndice: (chosenIndice || []).concat([i]).sort()
            });
          })
        });
      }
    });
    moves.push({
      description:
        chosenIndice.length == 0
        ? 'Cancel'
        : 'Combine chosen Sheep cards',
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
    return moves;
  };

  cardHandlerTable['Fill the Earth'] = function (world, state) {  //{{{2
    var moves = [];
    if (world.field.length < 7) {
      moves.push({
        description: 'Gain a 1 Sheep card',
        gameTreePromise: S.delay(function () {
          var wn = S.clone(world);
          S.gainX(wn, 1);
          return S.makeGameTree(wn, state);
        })
      });
    }
    moves.push({
      description: 'Cancel',
      gameTreePromise: S.delay(function () {
        return S.makeGameTree(world);
      })
    });
    return moves;
  };

  cardHandlerTable['Flourish'] = function (world, state) {  //{{{2
    if (state.rank === undefined) {
      if (world.field.length < 7) {
        return world.field.map(function (c) {
          return {
            description: 'Choose ' + c.rank + ' Sheep card',
            gameTreePromise: S.delay(function () {
              return S.makeGameTree(world, {step: state.step, rank: c.rank});
            })
          };
        });
      } else {
        return [{
          description: 'Nothing happened',
          gameTreePromise: S.delay(function () {
            return S.makeGameTree(world);
          })
        }];
      }
    } else {
      var lowerRank = S.dropRank(state.rank);
      if (lowerRank === undefined) {
        return [{
          description: 'Gain nothing',
          gameTreePromise: S.delay(function () {
            return S.makeGameTree(world);
          })
        }];
      } else {
        var n = Math.min(3, 7 - world.field.length);
        return [{
          description:
            n == 1
            ? 'Gain a ' + lowerRank + ' Sheep card'
            : 'Gain ' + n + ' cards of ' + lowerRank + ' Sheep',
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            for (var i = 1; i <= n; i++)
              S.gainX(wn, lowerRank);
            return S.makeGameTree(wn);
          })
        }];
      }
    }
  };

  cardHandlerTable['Falling Rock'] = function (world, state) {  //{{{2
    return world.field.map(function (c, i) {
      return {
        description: 'Release ' + c.rank + ' Sheep card',
        gameTreePromise: S.delay(function () {
          var wn = S.clone(world);
          S.releaseX(wn, i);
          return S.makeGameTree(wn);
        })
      };
    });
  };

  cardHandlerTable['Golden Hooves'] = function (world, state) {  //{{{2
    var highestRank = max(world.field.map(function (c) {return c.rank;}));
    var chosenIndice = state.chosenIndice || [];
    var moves = [];
    world.field.forEach(function (c, i) {
      if (c.rank < highestRank && chosenIndice.indexOf(i) == -1) {
        moves.push({
          description: 'Choose ' + c.rank + ' Sheep card',
          gameTreePromise: S.delay(function () {
            return S.makeGameTree(world, {
              step: state.step,
              chosenIndice: (chosenIndice || []).concat([i]).sort()
            });
          })
        });
      }
    });
    moves.push({
      description:
        chosenIndice.length == 0
        ? 'Cancel'
        : 'Raise ranks of chosen Sheep cards',
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
    return moves;
  };

  cardHandlerTable['Multiply'] = function (world, state) {  //{{{2
    if (world.field.length < 7 && 0 < world.sheepStock[3].length) {
      return [{
        description: 'Gain a 3 Sheep card',
        gameTreePromise: S.delay(function () {
          var wn = S.clone(world);
          S.gainX(wn, 3);
          return S.makeGameTree(wn);
        })
      }];
    } else {
      return [{
        description: 'Nothing happened',
        gameTreePromise: S.delay(function () {
          return S.makeGameTree(world);
        })
      }];
    }
  };

  cardHandlerTable['Planning Sheep'] = function (world, state) {  //{{{2
    if (world.hand.length == 0) {
      return [{
        description: 'Nothing happened',
        gameTreePromise: S.delay(function () {
          return S.makeGameTree(world);
        })
      }];
    } else {
      return world.hand.map(function (c, i) {
        return {
          description: 'Exile ' + c.name,
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            S.exileX(wn, wn.hand, i);
            return S.makeGameTree(wn);
          })
        };
      });
    }
  };

  cardHandlerTable['Sheep Dog'] = function (world, state) {  //{{{2
    if (world.hand.length == 0) {
      return [{
        description: 'Nothing happened',
        gameTreePromise: S.delay(function () {
          return S.makeGameTree(world);
        })
      }];
    } else {
      return world.hand.map(function (c, i) {
        return {
          description: 'Discard ' + c.name,
          gameTreePromise: S.delay(function () {
            var wn = S.clone(world);
            S.discardX(wn, i);
            return S.makeGameTree(wn);
          })
        };
      });
    }
  };

  cardHandlerTable['Storm'] = function (world, state) {  //{{{2
    var n = Math.min(state.rest || 2, world.field.length);
    return world.field.map(function (c, i) {
      return {
        description: 'Release ' + c.rank + ' Sheep card',
        gameTreePromise: S.delay(function () {
          var wn = S.clone(world);
          S.releaseX(wn, i);
          var sn = n == 1 ? undefined : {step: state.step, rest: n - 1};
          return S.makeGameTree(wn, sn);
        })
      };
    });
  };

  function unimplementedCardHandler(world, state) {  //{{{2
    // TODO: Throw an error after all event cards are implemented.
    return [{
      description: 'Nothing happened (not implemented yet)',
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

  function nodizeMove(m) {
    var $m = $('<input>');
    $m.attr({
      type: 'button',
      value: m.description
    });
    $m.click(function () {
      drawGameTree(S.force(m.gameTreePromise));
    });
    return $m;
  }

  function drawGameTree(gameTree) {
    var w = gameTree.world;
    S.RANKS.forEach(function (rank) {
      $('#sheepStock' + rank + ' > .count').text(w.sheepStock[rank].length);
    });
    $('#enemySheepCount > .count').text(w.enemySheepCount);
    $('#field > .cards').text(
      w.field
      .map(function (c) {return c.rank;})
      .join(', ')
    );
    $('#hand > .cards').text(textizeCards(w.hand));
    $('#deck > .count').text(w.deck.length);
    $('#discardPile > .cards').text(textizeCards(w.discardPile));
    $('#exile > .cards').text(textizeCards(w.exile));

    $('#message').text(
      gameTree.moves.length == 0
      ? S.judgeGame(gameTree.world).description
      : 'Choose a move:'
    );
    $('#moves').empty().append(gameTree.moves.map(nodizeMove));
  }




  // Bootstrap  {{{1
  // TODO: Revise UI to start the first game after page load.
  //       (Show "Start a game" instead of "Draw cards)

  $(function () {
    drawGameTree(S.makeGameTree(S.makeInitalWorld()));
  });

  //}}}1
})(shephy, jQuery);

// vim: expandtab softtabstop=2 shiftwidth=2 foldmethod=marker
