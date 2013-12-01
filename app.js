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
      'Inspirationi',
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

  S.makeGameTree = function (world) {
    return {
      world: world,
      moves: S.listPossibleMoves(world)
    };
  };

  S.listPossibleMoves = function (world) {
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
        gameTreePromise: S.delay(function () {
          var wn = S.clone(world);
          S.discardX(wn, i);
          return S.makeGameTree(wn, c);
        })
      };
    });
  };
})(shephy, jQuery);

// vim: expandtab softtabstop=2 shiftwidth=2 foldmethod=marker
