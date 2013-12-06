describe('shephy', function () {
  var S = shephy;
  var any = jasmine.any;
  function addMatchers(simpleMatchers) {
    var regularMatchers = {};
    for (var name in simpleMatchers) {
      regularMatchers[name] = (function (f) {
        return function () {
          return {
            compare: function () {
              return {
                pass: f.apply(null, arguments)
              };
            }
          };
        };
      })(simpleMatchers[name]);
    }
    jasmine.addMatchers(regularMatchers);
  }

  beforeEach(function () {
    addMatchers({
      toBeEmpty:
        function (actual) {
          return actual.length == 0;
        },
      toContainCard:
        function (actualCards, expectedName) {
          return actualCards.some(function (c) {
            return c.name == expectedName;
          });
        },
      toEqualCards:
        function (actualCards, expectedNames) {
          return actualCards.length == expectedNames.length &&
            actualCards.every(function (c, i) {
              return c.name == expectedNames[i];
            });
        },
      toEqualRanks:
        function (actualSheep, expectedRanks) {
          return actualSheep.length == expectedRanks.length &&
            actualSheep.every(function (c, i) {
              return c.rank == expectedRanks[i];
            });
        }
    });
  });

  describe('clone', function () {
    it('recursively copy a given object', function () {
      var x = {a: {b: {c: ['...']}}};
      var xd = S.clone(x);

      expect(xd).toEqual(x);
      expect(xd).not.toBe(x);
      expect(xd.a).toEqual(x.a);
      expect(xd.a).not.toBe(x.a);
      expect(xd.a.b).toEqual(x.a.b);
      expect(xd.a.b).not.toBe(x.a.b);
      expect(xd.a.b.c).toEqual(x.a.b.c);
      expect(xd.a.b.c).not.toBe(x.a.b.c);
    });
  });
  describe('makeInitalWorld', function () {
    it('makes a new world', function () {
      var w = S.makeInitalWorld();

      [1, 3, 10, 30, 100, 300, 1000].forEach(function (n) {
        expect(w.sheepStock[n].length).toEqual(n == 1 ? 6 : 7);
        w.sheepStock[n].forEach(function (c) {
          expect(c.type).toEqual(S.CARD_TYPE_SHEEP);
          expect(c.rank).toEqual(n);
        });
      });

      expect(w.field.length).toEqual(1);
      expect(w.field[0].type).toEqual(S.CARD_TYPE_SHEEP);
      expect(w.field[0].rank).toEqual(1);

      expect(w.enemySheepCount).toEqual(1);

      expect(w.deck.length).toEqual(22);
      w.deck.forEach(function (c) {
        expect(c.type).toEqual(S.CARD_TYPE_EVENT);
      });

      expect(w.hand).toBeEmpty();
      expect(w.discardPile).toBeEmpty();
      expect(w.exile).toBeEmpty();
    });
    it('returns a world with the same regions except Deck', function () {
      var w0 = S.makeInitalWorld();
      var wt = S.makeInitalWorld();

      [
        'sheepStock',
        'field',
        'enemySheepCount',
        'hand',
        'discardPile',
        'exile'
      ].forEach(function (member) {
        expect(wt[member]).toEqual(w0[member]);
      });

      var ns0 = w0.deck.map(function (c) {return c.name;});
      ns0.sort();
      var nst = wt.deck.map(function (c) {return c.name;});
      nst.sort();
      expect(ns0).toEqual(nst);
    });
    it('returns a shuffled Deck with the same set of cards', function () {
      while (true) {
        var w0 = S.makeInitalWorld();
        var wt = S.makeInitalWorld();
        var ns0 = w0.deck.map(function (c) {return c.name;});
        var nst = wt.deck.map(function (c) {return c.name;});
        if (ns0 == nst)
          continue;

        expect(ns0).not.toEqual(nst);
        break;
      }
    });
  });
  describe('gainX', function () {
    it('takes a Sheep card from Sheep Stock and puts into Field', function () {
      var w = S.makeInitalWorld();
      var c = w.sheepStock[3][7 - 1];

      expect(w.field).toEqualRanks([1]);
      expect(w.sheepStock[3].length).toEqual(7);

      S.gainX(w, 3);

      expect(w.field).toEqualRanks([1, 3]);
      expect(w.field[1]).toBe(c);
      expect(w.sheepStock[3].length).toEqual(6);
    });
    it('does nothing if no Sheep with a given rank is available', function () {
      var w = S.makeInitalWorld();
      w.sheepStock[3] = [];

      expect(w.field).toEqualRanks([1]);
      expect(w.sheepStock[3]).toBeEmpty();
      expect(w.sheepStock[10].length).toEqual(7);

      S.gainX(w, 3);

      expect(w.field).toEqualRanks([1]);
      expect(w.sheepStock[3]).toBeEmpty();
      expect(w.sheepStock[10].length).toEqual(7);

      S.gainX(w, 10);

      expect(w.field).toEqualRanks([1, 10]);
      expect(w.sheepStock[3]).toBeEmpty();
      expect(w.sheepStock[10].length).toEqual(6);
    });
    it('does nothing if no space is available in Field', function () {
      var w = S.makeInitalWorld();
      expect(w.field).toEqualRanks([1]);
      expect(w.sheepStock[3].length).toEqual(7);

      S.gainX(w, 3);
      S.gainX(w, 3);
      S.gainX(w, 3);
      S.gainX(w, 3);
      S.gainX(w, 3);
      expect(w.field).toEqualRanks([1, 3, 3, 3, 3, 3]);
      expect(w.sheepStock[3].length).toEqual(2);

      S.gainX(w, 3);
      expect(w.field).toEqualRanks([1, 3, 3, 3, 3, 3, 3]);
      expect(w.sheepStock[3].length).toEqual(1);

      S.gainX(w, 3);
      expect(w.field).toEqualRanks([1, 3, 3, 3, 3, 3, 3]);
      expect(w.sheepStock[3].length).toEqual(1);
    });
  });
  describe('releaseX', function () {
    it('moves a specified Sheep card in Field to Sheep Stock', function () {
      var w = S.makeInitalWorld();
      S.gainX(w, 3);
      S.gainX(w, 10);
      var c = w.field[1];

      expect(w.field).toEqualRanks([1, 3, 10]);
      expect(w.sheepStock[1].length).toEqual(6);
      expect(w.sheepStock[3].length).toEqual(6);
      expect(w.sheepStock[10].length).toEqual(6);
      expect(w.sheepStock[3][w.sheepStock[3].length - 1]).not.toBe(c);

      S.releaseX(w, 1);

      expect(w.field).toEqualRanks([1, 10]);
      expect(w.sheepStock[1].length).toEqual(6);
      expect(w.sheepStock[3].length).toEqual(7);
      expect(w.sheepStock[10].length).toEqual(6);
      expect(w.sheepStock[3][w.sheepStock[3].length - 1]).toBe(c);
    });
  });
  describe('exileX', function () {
    it('moves a card in a region to Exile', function () {
      var w = S.makeInitalWorld();
      var c1 = w.field[0];
      var c3 = w.sheepStock[3][w.sheepStock[3].length - 1];

      expect(w.field.length).toEqual(1);
      expect(w.field[0]).toBe(c1);
      expect(w.sheepStock[3].length).toEqual(7);
      expect(w.sheepStock[3][w.sheepStock[3].length - 1]).toBe(c3);
      expect(w.exile).toBeEmpty();

      S.exileX(w, w.field, 0);

      expect(w.field).toBeEmpty();
      expect(w.sheepStock[3].length).toEqual(7);
      expect(w.sheepStock[3][w.sheepStock[3].length - 1]).toBe(c3);
      expect(w.exile.length).toEqual(1);
      expect(w.exile[0]).toBe(c1);

      S.exileX(w, w.sheepStock[3], w.sheepStock[3].length - 1);

      expect(w.field).toBeEmpty();
      expect(w.sheepStock[3].length).toEqual(6);
      expect(w.sheepStock[3][w.sheepStock[3].length - 1]).not.toBe(c3);
      expect(w.exile.length).toEqual(2);
      expect(w.exile[0]).toBe(c1);
      expect(w.exile[1]).toBe(c3);
    });
  });
  describe('drawX', function () {
    it('moves the top card in Deck to Hand', function () {
      var w = S.makeInitalWorld();
      var c = w.deck[w.deck.length - 1];

      expect(w.hand).toBeEmpty();
      expect(w.deck[w.deck.length - 1]).toBe(c);

      S.drawX(w);

      expect(w.hand.length).toEqual(1);
      expect(w.hand[0]).toBe(c);
      expect(w.deck[w.deck.length - 1]).not.toBe(c);
    });
    it('does nothing if Deck is empty', function () {
      var w = S.makeInitalWorld();
      w.deck = [];

      expect(w.hand).toBeEmpty();
      expect(w.deck).toBeEmpty();

      S.drawX(w);

      expect(w.hand).toBeEmpty();
      expect(w.deck).toBeEmpty();
    });
    it('does nothing if Hand is full', function () {
      function test(n) {
        expect(w.hand.length).toEqual(n);
        expect(w.deck.length).toEqual(22 - n);
      }
      var w = S.makeInitalWorld();

      test(0);

      for (var i = 1; i <= 5; i++) {
        S.drawX(w);
        test(i);
      }

      S.drawX(w);
      test(5);
    });
  });
  describe('remakeDeckX', function () {
    it('puts cards in Discard Pile into Deck and shuffles them', function () {
      var w = S.makeInitalWorld();
      var ns0 = w.deck.map(function (c) {return c.name;});
      w.discardPile.push(w.deck.pop());

      expect(w.hand).toBeEmpty();
      expect(w.deck.length).toEqual(21);
      expect(w.discardPile.length).toEqual(1);

      S.remakeDeckX(w);
      var nsd = w.deck.map(function (c) {return c.name;});

      expect(w.hand).toBeEmpty();
      expect(w.deck.length).toEqual(22);
      expect(w.discardPile).toBeEmpty();

      expect(nsd).not.toEqual(ns0);  // FIXME: Rarely fails.
      expect(nsd.concat().sort()).toEqual(ns0.concat().sort());
    });
  });
  describe('discardX', function () {
    it('moves a card in Hand to Discard Pile', function () {
      var w = S.makeInitalWorld();
      S.drawX(w);
      S.drawX(w);
      S.drawX(w);
      var c1 = w.hand[0];
      var c2 = w.hand[1];
      var c3 = w.hand[2];

      expect(w.hand.length).toEqual(3);
      expect(w.discardPile).toBeEmpty();

      S.discardX(w, 1);

      expect(w.hand.length).toEqual(2);
      expect(w.hand[0]).toBe(c1);
      expect(w.hand[1]).toBe(c3);
      expect(w.discardPile.length).toEqual(1);
      expect(w.discardPile[0]).toBe(c2);

      S.discardX(w, 0);

      expect(w.hand.length).toEqual(1);
      expect(w.hand[0]).toBe(c3);
      expect(w.discardPile.length).toEqual(2);
      expect(w.discardPile[0]).toBe(c2);
      expect(w.discardPile[1]).toBe(c1);
    });
  });
  describe('shouldDraw', function () {
    it('returns false if Hand is full', function () {
      expect(S.shouldDraw({hand: [1, 2, 3, 4, 5], deck: ['...']})).toBeFalsy();
    });
    it('returns false if Deck is empty', function () {
      expect(S.shouldDraw({hand: [1, 2, 3, 4], deck: []})).toBeFalsy();
    });
    it('returns true if Hand is not full and Deck is not empty', function () {
      expect(S.shouldDraw({hand: [1, 2, 3, 4], deck: ['...']})).toBeTruthy();
    });
  });
  describe('judgeGame', function () {
    it('returns "win" if there are at least one 1000 Sheep card', function () {
      var w = S.makeInitalWorld();
      S.gainX(w, 1000);
      var r = S.judgeGame(w);
      expect(r.state).toEqual('win');
      expect(r.description).toEqual(any(String));
    });
    it('returns "lose" if there are 1000 enemies', function () {
      var w = S.makeInitalWorld();
      w.enemySheepCount = 1000;
      var r = S.judgeGame(w);
      expect(r.state).toEqual('lose');
      expect(r.description).toEqual(any(String));
    });
    it('returns "lose" if there is no sheep in Field', function () {
      var w = S.makeInitalWorld();
      S.releaseX(w, 0);
      var r = S.judgeGame(w);
      expect(r.state).toEqual('lose');
      expect(r.description).toEqual(any(String));
    });
    it('fails otherwise', function () {
      var w = S.makeInitalWorld();
      expect(function () {S.judgeGame(w);}).toThrow();
    });
  });
  describe('makeGameTree', function () {
    it('makes a whole game tree from a given world', function () {
      var w = S.makeInitalWorld();
      var gt = S.makeGameTree(w);

      expect(gt.world).toBe(w);
      expect(gt.moves).toEqual(any(Array));
    });
  });
  describe('listPossibleMoves', function () {
    it('lists only one move "draw cards" from the initial world', function () {
      var w0 = S.makeInitalWorld();
      var moves = S.listPossibleMoves(w0);

      expect(moves).toEqual(any(Array));
      expect(moves.length).toEqual(1);
      expect(moves[0].description).toEqual('Draw cards');
      expect(moves[0].gameTreePromise).toEqual(any(Function));

      var wd = S.force(moves[0].gameTreePromise).world;
      expect(w0.hand).toBeEmpty();
      expect(w0.deck.length).toEqual(22);
      expect(wd.hand.length).toEqual(5);
      expect(wd.deck.length).toEqual(17);
    });
    it('lists nothing if the game is lost by 1000 enemies', function () {
      var w = S.makeInitalWorld();

      w.enemySheepCount = 1;
      expect(S.listPossibleMoves(w).length).toEqual(1);

      w.enemySheepCount = 1000;
      expect(S.listPossibleMoves(w)).toBeEmpty();
    });
    it('lists only "remake Deck" if Hand and Deck are empty', function () {
      var w = S.makeInitalWorld();
      w.discardPile = w.deck;
      w.deck = [];

      expect(w.hand).toBeEmpty();
      expect(w.deck).toBeEmpty();
      expect(w.discardPile.length).toEqual(22);
      expect(w.enemySheepCount).toEqual(1);

      var moves = S.listPossibleMoves(w);
      expect(moves.length).toEqual(1);
      expect(moves[0].description).toEqual('Remake Deck then fill Hand');
      var wd = S.force(moves[0].gameTreePromise).world;
      expect(wd.hand.length).toEqual(5);
      expect(wd.deck.length).toEqual(17);
      expect(wd.discardPile).toBeEmpty();
      expect(wd.enemySheepCount).toEqual(10);
    });
    it('lists nothing if the game is lost by no Sheep in Field', function () {
      var w = S.makeInitalWorld();
      S.releaseX(w, 0);

      expect(w.field).toBeEmpty();
      expect(w.sheepStock[1].length).toEqual(7);
      expect(S.listPossibleMoves(w)).toBeEmpty();
    });
    it('lists nothing if the game is won by 1000 Sheep in Field', function () {
      var wl = S.makeInitalWorld();
      S.releaseX(wl, 0);
      S.gainX(wl, 300);
      S.gainX(wl, 300);
      S.gainX(wl, 300);
      S.gainX(wl, 100);
      expect(S.listPossibleMoves(wl).length).not.toEqual(0);

      var ww = S.makeInitalWorld();
      S.releaseX(ww, 0);
      S.gainX(ww, 1000);
      expect(S.listPossibleMoves(ww)).toBeEmpty();
    });
    it('lists "play a card in Hand" otherwise', function () {
      var w = S.makeInitalWorld();
      for (var i = 0; i < 5; i++)
        S.drawX(w);

      var moves = S.listPossibleMoves(w);
      expect(moves.length).toEqual(5);
      for (var i = 0; i < 5; i++) {
        expect(moves[i].description).toEqual('Play ' + w.hand[i].name);
      }
    });
  });
  describe('Event', function () {
    function indexOf(xs, predicate) {
      for (var i = 0; i < xs.length; i++) {
        if (predicate(xs[i]))
          return i;
      }
      return -1;
    }
    function setUpWorld(cardName, opt_handCount) {
      var w = S.makeInitalWorld();
      var i = indexOf(w.deck, function (c) {return c.name == cardName;});
      w.hand.push(w.deck.splice(i, 1)[0]);
      var restHandCount = (opt_handCount || 1) - 1;
      for (j = 0; j < restHandCount; j++)
        S.drawX(w);
      return w;
    }
    describe('Fill the Earth', function () {
      it('shows two moves - gain or not', function () {
        var w = setUpWorld('Fill the Earth', 5);
        var gt0 = S.makeGameTree(w, {step: 'play', handIndex: 0});
        var w0 = gt0.world;
        expect(w0.deck.length).toEqual(17);
        expect(w0.discardPile).toEqualCards(['Fill the Earth']);
        expect(w0.hand.length).toEqual(4);
        expect(w0.field).toEqualRanks([1]);
        expect(gt0.moves.length).toEqual(2);

        expect(gt0.moves[0].description).toEqual('Gain a 1 Sheep card');
        var gt1g = S.force(gt0.moves[0].gameTreePromise);
        var w1g = gt1g.world;
        expect(w1g.field).toEqualRanks([1, 1]);
        expect(gt1g.moves.length).toEqual(2);
        expect(gt1g.moves[0].description).toEqual('Gain a 1 Sheep card');
        expect(gt1g.moves[1].description).toEqual('Cancel');

        expect(gt0.moves[1].description).toEqual('Cancel');
        var gt1c = S.force(gt0.moves[1].gameTreePromise);
        var w1c = gt1c.world;
        expect(w1c.field).toEqualRanks([1]);
        expect(gt1c.moves.length).toEqual(1);
        expect(gt1c.moves[0].description).toEqual('Draw a card');
      });
      it('repeats the same two moves until user cancels', function () {
        var gt0 = S.makeGameTree(
          setUpWorld('Fill the Earth'),
          {step: 'play', handIndex: 0}
        );
        var w0 = gt0.world;
        expect(w0.field).toEqualRanks([1]);
        expect(gt0.moves.length).toEqual(2);
        expect(gt0.moves[0].description).toEqual('Gain a 1 Sheep card');
        expect(gt0.moves[1].description).toEqual('Cancel');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(w1.field).toEqualRanks([1, 1]);
        expect(gt1.moves.length).toEqual(2);
        expect(gt1.moves[0].description).toEqual('Gain a 1 Sheep card');
        expect(gt1.moves[1].description).toEqual('Cancel');

        var gt2 = S.force(gt1.moves[0].gameTreePromise);
        var w2 = gt2.world;
        expect(w2.field).toEqualRanks([1, 1, 1]);
        expect(gt2.moves.length).toEqual(2);
        expect(gt2.moves[0].description).toEqual('Gain a 1 Sheep card');
        expect(gt2.moves[1].description).toEqual('Cancel');
      });
      it('shows only "cancel" if ther is no space in Field', function () {
        var w = setUpWorld('Fill the Earth');
        for (var i = 0; i < 6; i++)
          S.gainX(w, 3);
        var gt = S.makeGameTree(w, {step: 'play', handIndex: 0});

        expect(gt.moves.length).toEqual(1);
        expect(gt.moves[0].description).toEqual('Cancel');
      });
    });
    describe('Multiply', function () {
      it('puts a 3 Sheep card into Field', function () {
        var w = setUpWorld('Multiply');

        expect(w.deck.length).toEqual(21);
        expect(w.discardPile).toBeEmpty();
        expect(w.hand).toEqualCards(['Multiply']);
        expect(w.sheepStock[3].length).toEqual(7);
        expect(w.field).toEqualRanks([1]);

        var gt = S.makeGameTree(w, {step: 'play', handIndex: 0});

        expect(gt.world.deck.length).toEqual(21);
        expect(gt.world.discardPile).toEqualCards([w.hand[0].name]);
        expect(gt.world.hand).toBeEmpty();
        expect(gt.world.sheepStock[3].length).toEqual(6);
        expect(gt.world.field).toEqualRanks([1, 3]);
      });
      it('does nothing if there is no space in Field', function () {
        var w = setUpWorld('Multiply');
        for (var i = 0; i < 6; i++)
          S.gainX(w, 1);

        expect(w.deck.length).toEqual(21);
        expect(w.discardPile).toBeEmpty();
        expect(w.hand).toEqualCards(['Multiply']);
        expect(w.sheepStock[3].length).toEqual(7);
        expect(w.field).toEqualRanks([1, 1, 1, 1, 1, 1, 1]);

        var gt = S.makeGameTree(w, {step: 'play', handIndex: 0});

        expect(gt.world.deck.length).toEqual(21);
        expect(gt.world.discardPile).toEqualCards([w.hand[0].name]);
        expect(gt.world.hand).toBeEmpty();
        expect(gt.world.sheepStock[3].length).toEqual(7);
        expect(gt.world.field).toEqualRanks([1, 1, 1, 1, 1, 1, 1]);
      });
    });
    describe('Planning Sheep', function () {
      it('shows moves to exile a card', function () {
        var w = setUpWorld('Planning Sheep', 5);
        var gt0 = S.makeGameTree(w, {step: 'play', handIndex: 0});
        var w0 = gt0.world;

        expect(w0.discardPile).toEqualCards(['Planning Sheep']);
        expect(w0.exile).toEqualCards([]);
        expect(w0.hand.length).toEqual(4);
        expect(w0.hand).not.toContainCard('Planning Sheep');
        expect(gt0.moves.length).toEqual(w0.hand.length);
        for (var i = 0; i < w0.hand.length; i++)
          expect(gt0.moves[i].description).toEqual('Exile ' + w0.hand[i].name);

        var gt1 = S.force(gt0.moves[2].gameTreePromise);
        var w1 = gt1.world;
        expect(w1.discardPile).toEqualCards(['Planning Sheep']);
        expect(w1.exile).toEqualCards([w0.hand[2].name]);
        expect(w1.hand.length).toEqual(3);
        expect(w1.hand).not.toContainCard('Planning Sheep');
        expect(w1.hand).not.toContainCard(w0.hand[2].name);
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('Draw cards');
      });
      it('shows a move to do nothing if there is no card in Hand', function () {
        var w = setUpWorld('Planning Sheep');

        var gt0 = S.makeGameTree(w, {step: 'play', handIndex: 0});
        var w0 = gt0.world;
        expect(w0.discardPile).toEqualCards(['Planning Sheep']);
        expect(w0.exile).toEqualCards([]);
        expect(w0.hand).toBeEmpty();
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('Nothing happened');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(w1.discardPile).toEqualCards(['Planning Sheep']);
        expect(w1.exile).toEqualCards([]);
        expect(w1.hand).toBeEmpty();
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('Draw cards');
      });
    });
    describe('Sheep Dog', function () {
      it('shows moves to discard a card', function () {
        var w = setUpWorld('Sheep Dog', 5);
        var gt0 = S.makeGameTree(w, {step: 'play', handIndex: 0});
        var w0 = gt0.world;

        expect(w0.discardPile).toEqualCards(['Sheep Dog']);
        expect(w0.hand.length).toEqual(4);
        expect(w0.hand).not.toContainCard('Sheep Dog');
        expect(gt0.moves.length).toEqual(w0.hand.length);
        for (var i = 0; i < w0.hand.length; i++)
          expect(gt0.moves[i].description).toEqual('Discard ' + w0.hand[i].name);

        var gt1 = S.force(gt0.moves[2].gameTreePromise);
        var w1 = gt1.world;
        expect(w1.discardPile).toEqualCards(['Sheep Dog', w0.hand[2].name]);
        expect(w1.hand.length).toEqual(3);
        expect(w1.hand).not.toContainCard('Sheep Dog');
        expect(w1.hand).not.toContainCard(w0.hand[2].name);
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('Draw cards');
      });
      it('shows a move to do nothing if there is no card in Hand', function () {
        var w = setUpWorld('Sheep Dog');

        var gt0 = S.makeGameTree(w, {step: 'play', handIndex: 0});
        var w0 = gt0.world;
        expect(w0.discardPile).toEqualCards(['Sheep Dog']);
        expect(w0.hand).toBeEmpty();
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('Nothing happened');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(w1.discardPile).toEqualCards(['Sheep Dog']);
        expect(w1.hand).toBeEmpty();
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('Draw cards');
      });
    });
  });
});

// vim: expandtab softtabstop=2 shiftwidth=2
// vim: foldmethod=expr
// vim: foldexpr=getline(v\:lnum)=~#'\\v<x?(describe|it|beforeEach|afterEach)>.*<function>\\s*\\([^()]*\\)\\s*\\{'?'a1'\:(getline(v\:lnum)=~#'^\\s*});$'&&search('\\v^\\s{'.indent(v\:lnum).'}<x?(describe|it|beforeEach|afterEach)>','bnW')?'s1'\:'=')
