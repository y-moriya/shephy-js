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
  S.CARD_TYPE_SHEEP = 'Sheep';
  S.CARD_TYPE_EVENT = 'Event';

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

  function makeSheepStockPile(n) {
    var cards = [];
    for (var i = 0; i < 7; i++) {
      cards.push({
        name: n + '',
        type: S.CARD_TYPE_SHEEP,
        rank: n
      });
    }
    return cards;
  }

  function makeEventCard(name) {
    // TODO: Implement effects when a card is played.
    return {
      name: name,
      type: S.CARD_TYPE_EVENT
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
    [1, 3, 10, 30, 100, 300, 1000].forEach(function (n) {
      sheepStock[n] = makeSheepStockPile(n);
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
        state: 'win',
        description: 'You win!'
      };
    }
    if (world.enemySheepCount == 1000) {
      return {
        state: 'lose',
        description: 'Enemies reached 1000 sheep - you lose.'
      };
    }
    if (world.field.length == 0) {
      return {
        state: 'lose',
        description: 'You lost all your sheep - you lose.'
      };
    }

    throw 'Invalid operation';
  };

  S.makeGameTree = function (world, opt_state) {
    var x = S.makeWorld(world, opt_state);
    return {
      world: x[0],
      moves: S.listPossibleMoves(x[0], x[1])
    };
  };

  S.makeWorld = function (world, opt_state) {
    if (opt_state === undefined)
      return [world, opt_state];

    var state = opt_state;
    if (state.step == 'play') {
      var wn = S.clone(world);
      var sn;
      S.discardX(wn, state.handIndex);
      var eventName = world.hand[state.handIndex].name;
      switch (eventName) {
        case 'Multiply':
          S.gainX(wn, 3);
          break;
        default:
          throw 'Not implemented card - ' + eventName;
      }
      return [wn, sn];
    } else {
      return [world, opt_state];
    }
  };

  S.listPossibleMoves = function (world, opt_state) {
    if (opt_state === undefined)
      return S.listPossibleMovesForBasicRules(world);
    else
      return S.listPossibleMovesForPlayingCard(world, opt_state);
  }

  S.listPossibleMovesForBasicRules = function (world) {
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
          return S.makeGameTree(world, {step: 'play', handIndex: i});
        })
      };
    });
  };

  S.listPossibleMovesForPlayingCard = function (world, state) {
    // TODO: Implement more cards.
    throw 'Invalid operation: state = ' + JSON.stringify(state);
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
      drawState(S.force(m.gameTreePromise));
    });
    return $m;
  }

  function drawState(gameTree) {
    var w = gameTree.world;
    [1, 3, 10, 30, 100, 300, 1000].forEach(function (rank) {
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
    drawState(S.makeGameTree(S.makeInitalWorld()));
  });

  //}}}1
})(shephy, jQuery);

// vim: expandtab softtabstop=2 shiftwidth=2 foldmethod=marker
