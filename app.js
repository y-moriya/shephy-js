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

  function makeInitalDeck(n) {
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
      discardPile: [],
      exile: []
    };
  };
})(shephy, jQuery);

// vim: expandtab softtabstop=2 shiftwidth=2 foldmethod=marker
