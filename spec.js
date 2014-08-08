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

  function cardToName(card) {
    return card.name;
  }

  function cardToRank(card) {
    return card.rank;
  }

  function changedRegionsBetween(w0, w1) {
    var changes = {};

    S.RANKS.forEach(function (rank) {
      if (w0.sheepStock[rank].length != w1.sheepStock[rank].length)
        changes['sheepStock' + rank] = w1.sheepStock[rank].length;
    });

    if (w0.enemySheepCount != w1.enemySheepCount)
      changes.enemySheepCount = w1.enemySheepCount;

    if (w0.deck.length != w1.deck.length)
      changes.deck = w1.deck.length;

    ['hand', 'discardPile', 'exile'].forEach(function (regionName) {
      var cns0 = w0[regionName].map(cardToName);
      var cns1 = w1[regionName].map(cardToName);
      if (cns0.toString() != cns1.toString())
        changes[regionName] = cns1;
    });

    var crs0 = w0.field.map(cardToRank);
    var crs1 = w1.field.map(cardToRank);
    if (crs0.toString() != crs1.toString())
      changes.field = crs1;

    return changes;
  }

  beforeEach(function () {
    addMatchers({
      toBeEmpty:
        function (actual) {
          return actual.length == 0;
        },
      toBeEventCard:
        function (actual) {
          return actual.name !== undefined && actual.rank === undefined;
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
  describe('dropRank', function () {
    it('returns a lower rank', function () {
      expect(S.dropRank(1000)).toEqual(300);
      expect(S.dropRank(300)).toEqual(100);
      expect(S.dropRank(100)).toEqual(30);
      expect(S.dropRank(30)).toEqual(10);
      expect(S.dropRank(10)).toEqual(3);
      expect(S.dropRank(3)).toEqual(1);
    });
    it('returns undefined if the lowest rank is given', function () {
      expect(S.dropRank(1)).toBeUndefined();
    });
  });
  describe('raiseRank', function () {
    it('returns a higher rank', function () {
      expect(S.raiseRank(1)).toEqual(3);
      expect(S.raiseRank(3)).toEqual(10);
      expect(S.raiseRank(10)).toEqual(30);
      expect(S.raiseRank(30)).toEqual(100);
      expect(S.raiseRank(100)).toEqual(300);
      expect(S.raiseRank(300)).toEqual(1000);
    });
    it('returns undefined if the highest rank is given', function () {
      expect(S.raiseRank(1000)).toBeUndefined();
    });
  });
  describe('compositeRanks', function () {
    it('returns the greatest rank not greater than sum of given ranks', function () {
      expect(S.compositeRanks([1])).toEqual(1);
      expect(S.compositeRanks([1, 1])).toEqual(1);
      expect(S.compositeRanks([1, 1, 1])).toEqual(3);
      expect(S.compositeRanks([1, 1, 1, 1])).toEqual(3);
      expect(S.compositeRanks([300, 30, 30, 100, 10])).toEqual(300);
      expect(S.compositeRanks([1000, 1000, 1000])).toEqual(1000);
    });
  });
  describe('makeInitalWorld', function () {
    it('makes a new world', function () {
      var w = S.makeInitalWorld();

      S.RANKS.forEach(function (rank) {
        expect(w.sheepStock[rank].length).toEqual(rank == 1 ? 6 : 7);
        w.sheepStock[rank].forEach(function (c) {
          expect(c.rank).toEqual(rank);
        });
      });

      expect(w.field.length).toEqual(1);
      expect(w.field[0].rank).toEqual(1);

      expect(w.enemySheepCount).toEqual(1);

      expect(w.deck.length).toEqual(22);
      w.deck.forEach(function (c) {
        expect(c).toBeEventCard();
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
      expect(r.result).toEqual('win');
      expect(r.description).toEqual(any(String));
    });
    it('returns "lose" if there are 1000 enemies', function () {
      var w = S.makeInitalWorld();
      w.enemySheepCount = 1000;
      var r = S.judgeGame(w);
      expect(r.result).toEqual('lose');
      expect(r.description).toEqual(any(String));
    });
    it('returns "lose" if there is no sheep in Field', function () {
      var w = S.makeInitalWorld();
      S.releaseX(w, 0);
      var r = S.judgeGame(w);
      expect(r.result).toEqual('lose');
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
    function makeGameTreeAfterPlaying(cardName, opt_options) {
      var options = opt_options || {};
      var w = S.makeInitalWorld();
      var i = indexOf(w.deck, function (c) {return c.name == cardName;});
      w.hand.push(w.deck.splice(i, 1)[0]);
      var restHandCount = (options.handCount || 5) - 1;
      for (j = 0; j < restHandCount; j++)
        S.drawX(w);
      if (!options.keepDeck) {
        w.discardPile = w.deck;
        w.deck = [];
      }
      if (options.customize)
        options.customize(w);
      return S.force(S.makeGameTree(w).moves[0].gameTreePromise);
    }
    describe('All-purpose Sheep', function () {
      it('asks which card in hand to copy', function () {
        var gt0 = makeGameTreeAfterPlaying('All-purpose Sheep');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(w0.hand.length);
        for (var i = 0; i < w0.hand.length; i++)
          expect(gt0.moves[i].description).toEqual('Copy ' + w0.hand[i].name);

        var gt1 = S.force(gt0.moves[2].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).not.toBeLessThan(1);
      });
      it('shows a move to do nothing if there is no card in Hand', function () {
        var gt0 = makeGameTreeAfterPlaying('All-purpose Sheep', {handCount: 1});
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('No card in hand - nothing happened');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('Remake Deck then fill Hand');
      });
    });
    describe('Be Fruitful', function () {
      it('shows a move for each sheep in Field', function () {
        var gt0 = makeGameTreeAfterPlaying('Be Fruitful', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 30);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(5);
        expect(gt0.moves[0].description).toEqual('Copy 1 Sheep card');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('Gain a 1 Sheep card');

        var gt1d = S.force(gt1.moves[0].gameTreePromise);
        var w1d = gt1d.world;
        expect(changedRegionsBetween(w1, w1d)).toEqual({
          sheepStock1: 5,
          field: [1, 3, 30, 30, 100, 1]
        });
        expect(gt1d.moves.length).toEqual(4);
        expect(gt1d.moves[0].description).toMatch(/Play /);
        expect(gt0.moves[2].description).toEqual('Copy 30 Sheep card');

        var gt3 = S.force(gt0.moves[2].gameTreePromise);
        var w3 = gt3.world;
        expect(changedRegionsBetween(w0, w3)).toEqual({});
        expect(gt3.moves.length).toEqual(1);
        expect(gt3.moves[0].description).toEqual('Gain a 30 Sheep card');

        var gt3d = S.force(gt3.moves[0].gameTreePromise);
        var w3d = gt3d.world;
        expect(changedRegionsBetween(w3, w3d)).toEqual({
          sheepStock30: 4,
          field: [1, 3, 30, 30, 100, 30]
        });
        expect(gt3d.moves.length).toEqual(4);
        expect(gt3d.moves[0].description).toMatch(/Play /);
      });
      it('shows a move for nothing if Field is full', function () {
        var gt0 = makeGameTreeAfterPlaying('Be Fruitful', {
          customize: function (w) {
            for (var i = 1; i <= 6; i++)
              S.gainX(w, 1);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('Nothing happened');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/Play /);
      });
    });
    describe('Crowding', function () {
      it('repeats asking which Sheep card to release', function () {
        var gt0 = makeGameTreeAfterPlaying('Crowding', {
          customize: function (w) {
            S.gainX(w, 1);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(5);
        expect(gt0.moves[0].description).toEqual('Release 1 Sheep card');
        expect(gt0.moves[1].description).toEqual('Release 1 Sheep card');
        expect(gt0.moves[2].description).toEqual('Release 30 Sheep card');
        expect(gt0.moves[3].description).toEqual('Release 100 Sheep card');
        expect(gt0.moves[4].description).toEqual('Release 100 Sheep card');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 6,
          field: [1, 30, 100, 100]
        });
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toEqual('Release 1 Sheep card');
        expect(gt1.moves[1].description).toEqual('Release 30 Sheep card');
        expect(gt1.moves[2].description).toEqual('Release 100 Sheep card');
        expect(gt1.moves[3].description).toEqual('Release 100 Sheep card');

        var gt2 = S.force(gt1.moves[0].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({
          sheepStock1: 7,
          field: [30, 100, 100]
        });
        expect(gt2.moves.length).toEqual(3);
        expect(gt2.moves[0].description).toEqual('Release 30 Sheep card');
        expect(gt2.moves[1].description).toEqual('Release 100 Sheep card');
        expect(gt2.moves[2].description).toEqual('Release 100 Sheep card');

        var gt3 = S.force(gt2.moves[0].gameTreePromise);
        var w3 = gt3.world;
        expect(changedRegionsBetween(w2, w3)).toEqual({
          sheepStock30: 7,
          field: [100, 100]
        });
        expect(gt3.moves.length).toEqual(4);
        expect(gt3.moves[0].description).toMatch(/^Play /);
      });
      it('does nothing if not so many Sheep cards are in the Field', function () {
        var gt0 = makeGameTreeAfterPlaying('Crowding', {
          customize: function (w) {
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('Too few sheep - nothing happened');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/^Play /);
      });
    });
    describe('Dominion', function () {
      it('repeats asking choice of sheep then composite them', function () {
        var gt0 = makeGameTreeAfterPlaying('Dominion', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 3);
            S.gainX(w, 3);
            S.gainX(w, 3);
            S.gainX(w, 30);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(7);
        expect(gt0.moves[0].description).toEqual('Choose 1 Sheep card');
        expect(gt0.moves[1].description).toEqual('Choose 3 Sheep card');
        expect(gt0.moves[2].description).toEqual('Choose 3 Sheep card');
        expect(gt0.moves[3].description).toEqual('Choose 3 Sheep card');
        expect(gt0.moves[4].description).toEqual('Choose 3 Sheep card');
        expect(gt0.moves[5].description).toEqual('Choose 30 Sheep card');
        expect(gt0.moves[6].description).toEqual('Cancel');

        var gt1 = S.force(gt0.moves[1].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(6);
        expect(gt1.moves[0].description).toEqual('Choose 1 Sheep card');
        expect(gt1.moves[1].description).toEqual('Choose 3 Sheep card');
        expect(gt1.moves[2].description).toEqual('Choose 3 Sheep card');
        expect(gt1.moves[3].description).toEqual('Choose 3 Sheep card');
        expect(gt1.moves[4].description).toEqual('Choose 30 Sheep card');
        expect(gt1.moves[5].description).toEqual('Combine chosen Sheep cards');

        var gt2 = S.force(gt1.moves[1].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({});
        expect(gt2.moves.length).toEqual(5);
        expect(gt2.moves[0].description).toEqual('Choose 1 Sheep card');
        expect(gt2.moves[1].description).toEqual('Choose 3 Sheep card');
        expect(gt2.moves[2].description).toEqual('Choose 3 Sheep card');
        expect(gt2.moves[3].description).toEqual('Choose 30 Sheep card');
        expect(gt2.moves[4].description).toEqual('Combine chosen Sheep cards');

        var gt3 = S.force(gt2.moves[1].gameTreePromise);
        var w3 = gt3.world;
        expect(changedRegionsBetween(w2, w3)).toEqual({});
        expect(gt3.moves.length).toEqual(4);
        expect(gt3.moves[0].description).toEqual('Choose 1 Sheep card');
        expect(gt3.moves[1].description).toEqual('Choose 3 Sheep card');
        expect(gt3.moves[2].description).toEqual('Choose 30 Sheep card');
        expect(gt3.moves[3].description).toEqual('Combine chosen Sheep cards');

        var gt4 = S.force(gt3.moves[1].gameTreePromise);
        var w4 = gt4.world;
        expect(changedRegionsBetween(w3, w4)).toEqual({});
        expect(gt4.moves.length).toEqual(3);
        expect(gt4.moves[0].description).toEqual('Choose 1 Sheep card');
        expect(gt4.moves[1].description).toEqual('Choose 30 Sheep card');
        expect(gt4.moves[2].description).toEqual('Combine chosen Sheep cards');

        var gt5 = S.force(gt4.moves[2].gameTreePromise);
        var w5 = gt5.world;
        expect(changedRegionsBetween(w4, w5)).toEqual({
          sheepStock3: 7,
          sheepStock10: 6,
          field: [1, 30, 10]
        });
        expect(gt5.moves.length).toEqual(4);
        expect(gt5.moves[0].description).toMatch(/^Play /);
      });
    });
    describe('Falling Rock', function () {
      it('asks which Sheep card to release', function () {
        var gt0 = makeGameTreeAfterPlaying('Falling Rock', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(4);
        expect(gt0.moves[0].description).toEqual('Release 1 Sheep card');
        expect(gt0.moves[1].description).toEqual('Release 3 Sheep card');
        expect(gt0.moves[2].description).toEqual('Release 30 Sheep card');
        expect(gt0.moves[3].description).toEqual('Release 100 Sheep card');

        var gt1a = S.force(gt0.moves[0].gameTreePromise);
        var w1a = gt1a.world;
        expect(changedRegionsBetween(w0, w1a)).toEqual({
          sheepStock1: 7,
          field: [3, 30, 100]
        });
        expect(gt1a.moves.length).toEqual(4);
        expect(gt1a.moves[0].description).toMatch(/^Play /);

        var gt1b = S.force(gt0.moves[2].gameTreePromise);
        var w1b = gt1b.world;
        expect(changedRegionsBetween(w0, w1b)).toEqual({
          sheepStock30: 7,
          field: [1, 3, 100]
        });
        expect(gt1b.moves.length).toEqual(4);
        expect(gt1b.moves[0].description).toMatch(/^Play /);
      });
    });
    describe('Fill the Earth', function () {
      it('shows two moves - gain or not', function () {
        var gt0 = makeGameTreeAfterPlaying('Fill the Earth');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(2);
        expect(gt0.moves[0].description).toEqual('Gain a 1 Sheep card');
        expect(gt0.moves[1].description).toEqual('Cancel');

        var gt1g = S.force(gt0.moves[0].gameTreePromise);
        var w1g = gt1g.world;
        expect(changedRegionsBetween(w0, w1g)).toEqual({
          sheepStock1: 5,
          field: [1, 1]
        });
        expect(gt1g.moves.length).toEqual(2);
        expect(gt1g.moves[0].description).toEqual('Gain a 1 Sheep card');
        expect(gt1g.moves[1].description).toEqual('Cancel');

        var gt1c = S.force(gt0.moves[1].gameTreePromise);
        var w1c = gt1c.world;
        expect(changedRegionsBetween(w0, w1c)).toEqual({});
        expect(gt1c.moves.length).toEqual(4);
        expect(gt1c.moves[0].description).toMatch(/Play /);
      });
      it('repeats the same two moves until user cancels', function () {
        var gt0 = makeGameTreeAfterPlaying('Fill the Earth');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(2);
        expect(gt0.moves[0].description).toEqual('Gain a 1 Sheep card');
        expect(gt0.moves[1].description).toEqual('Cancel');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 5,
          field: [1, 1]
        });
        expect(gt1.moves.length).toEqual(2);
        expect(gt1.moves[0].description).toEqual('Gain a 1 Sheep card');
        expect(gt1.moves[1].description).toEqual('Cancel');

        var gt2 = S.force(gt1.moves[0].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({
          sheepStock1: 4,
          field: [1, 1, 1]
        });
        expect(gt2.moves.length).toEqual(2);
        expect(gt2.moves[0].description).toEqual('Gain a 1 Sheep card');
        expect(gt2.moves[1].description).toEqual('Cancel');
      });
      it('shows only "cancel" if there is no space in Field', function () {
        var gt = makeGameTreeAfterPlaying('Fill the Earth', {
          customize: function (w) {
            for (var i = 0; i < 6; i++)
              S.gainX(w, 3);
          }
        });
        expect(gt.moves.length).toEqual(1);
        expect(gt.moves[0].description).toEqual('Cancel');
      });
    });
    describe('Flourish', function () {
      it('shows a move for each sheep in Field to gain 3 cards', function () {
        var gt0 = makeGameTreeAfterPlaying('Flourish', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(4);
        expect(gt0.moves[1].description).toEqual('Choose 3 Sheep card');

        var gt2 = S.force(gt0.moves[1].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w0, w2)).toEqual({});
        expect(gt2.moves.length).toEqual(1);
        expect(gt2.moves[0].description).toEqual('Gain 3 cards of 1 Sheep');

        var gt2d = S.force(gt2.moves[0].gameTreePromise);
        var w2d = gt2d.world;
        expect(changedRegionsBetween(w2, w2d)).toEqual({
          sheepStock1: 3,
          field: [1, 3, 30, 100, 1, 1, 1]
        });
        expect(gt2d.moves.length).toEqual(4);
        expect(gt2d.moves[0].description).toMatch(/Play /);
      });
      it('shows a move to gain 2 cards if Field is nearly full', function () {
        var gt0 = makeGameTreeAfterPlaying('Flourish', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(5);
        expect(gt0.moves[1].description).toEqual('Choose 3 Sheep card');

        var gt2 = S.force(gt0.moves[1].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w0, w2)).toEqual({});
        expect(gt2.moves.length).toEqual(1);
        expect(gt2.moves[0].description).toEqual('Gain 2 cards of 1 Sheep');

        var gt2d = S.force(gt2.moves[0].gameTreePromise);
        var w2d = gt2d.world;
        expect(changedRegionsBetween(w2, w2d)).toEqual({
          sheepStock1: 4,
          field: [1, 3, 30, 100, 100, 1, 1]
        });
        expect(gt2d.moves.length).toEqual(4);
        expect(gt2d.moves[0].description).toMatch(/Play /);
      });
      it('shows a move to gain 1 cards if Field is nearly full', function () {
        var gt0 = makeGameTreeAfterPlaying('Flourish', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(6);
        expect(gt0.moves[1].description).toEqual('Choose 3 Sheep card');

        var gt2 = S.force(gt0.moves[1].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w0, w2)).toEqual({});
        expect(gt2.moves.length).toEqual(1);
        expect(gt2.moves[0].description).toEqual('Gain a 1 Sheep card');

        var gt2d = S.force(gt2.moves[0].gameTreePromise);
        var w2d = gt2d.world;
        expect(changedRegionsBetween(w2, w2d)).toEqual({
          sheepStock1: 5,
          field: [1, 3, 30, 100, 100, 100, 1]
        });
        expect(gt2d.moves.length).toEqual(4);
        expect(gt2d.moves[0].description).toMatch(/Play /);
      });
      it('shows a move for nothing if Field is full', function () {
        var gt0 = makeGameTreeAfterPlaying('Flourish', {
          customize: function (w) {
            for (var i = 1; i <= 6; i++)
              S.gainX(w, 1);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('Nothing happened');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/Play /);
      });
      it('shows a move for nothing if 1 Sheep is chosen', function () {
        var gt0 = makeGameTreeAfterPlaying('Flourish', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(4);
        expect(gt0.moves[0].description).toEqual('Choose 1 Sheep card');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('Gain nothing');

        var gt1d = S.force(gt1.moves[0].gameTreePromise);
        var w1d = gt1d.world;
        expect(changedRegionsBetween(w1, w1d)).toEqual({});
        expect(gt1d.moves.length).toEqual(4);
        expect(gt1d.moves[0].description).toMatch(/Play /);
      });
    });
    describe('Golden Hooves', function () {
      it('repeats asking choice of sheep', function () {
        var gt0 = makeGameTreeAfterPlaying('Golden Hooves', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(4);
        expect(gt0.moves[0].description).toEqual('Choose 1 Sheep card');
        expect(gt0.moves[1].description).toEqual('Choose 3 Sheep card');
        expect(gt0.moves[2].description).toEqual('Choose 30 Sheep card');
        expect(gt0.moves[3].description).toEqual('Cancel');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(3);
        expect(gt1.moves[0].description).toEqual('Choose 3 Sheep card');
        expect(gt1.moves[1].description).toEqual('Choose 30 Sheep card');
        expect(gt1.moves[2].description).toEqual('Raise ranks of chosen Sheep cards');

        var gt2 = S.force(gt1.moves[0].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({});
        expect(gt2.moves.length).toEqual(2);
        expect(gt2.moves[0].description).toEqual('Choose 30 Sheep card');
        expect(gt2.moves[1].description).toEqual('Raise ranks of chosen Sheep cards');

        var gt3 = S.force(gt2.moves[0].gameTreePromise);
        var w3 = gt3.world;
        expect(changedRegionsBetween(w2, w3)).toEqual({});
        expect(gt3.moves.length).toEqual(1);
        expect(gt3.moves[0].description).toEqual('Raise ranks of chosen Sheep cards');

        var gt2d = S.force(gt2.moves[1].gameTreePromise);
        var w2d = gt2d.world;
        expect(changedRegionsBetween(w2, w2d)).toEqual({
          sheepStock1: 7,
          sheepStock10: 6,
          field: [30, 100, 10, 3]
        });
        expect(gt2d.moves.length).toEqual(4);
        expect(gt2d.moves[0].description).toMatch(/Play /);
      });
      it('does nothing if Field if full', function () {
        var gt0 = makeGameTreeAfterPlaying('Golden Hooves', {
          customize: function (w) {
            for (var i = 1; i <= 6; i++)
              S.gainX(w, 1);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('Cancel');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/Play /);
      });
    });
    describe('Lightning', function () {
      it('asks Sheep cards with the highest rank to release', function () {
        var gt0 = makeGameTreeAfterPlaying('Lightning', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(2);
        expect(gt0.moves[0].description).toEqual('Release 100 Sheep card');
        expect(gt0.moves[1].description).toEqual('Release 100 Sheep card');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock100: 6,
          field: [1, 3, 30, 100]
        });
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/^Play /);
      });
    });
    describe('Meteor', function () {
      it('asks three Sheep cards to release', function () {
        var gt0 = makeGameTreeAfterPlaying('Meteor', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
          },
          keepDeck: true
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(4);
        expect(gt0.moves[0].description).toEqual('Release 1 Sheep card');
        expect(gt0.moves[1].description).toEqual('Release 3 Sheep card');
        expect(gt0.moves[2].description).toEqual('Release 30 Sheep card');
        expect(gt0.moves[3].description).toEqual('Release 100 Sheep card');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 7,
          field: [3, 30, 100],
          discardPile: [],
          exile: ['Meteor']
        });
        expect(gt1.moves.length).toEqual(3);
        expect(gt1.moves[0].description).toEqual('Release 3 Sheep card');
        expect(gt1.moves[1].description).toEqual('Release 30 Sheep card');
        expect(gt1.moves[2].description).toEqual('Release 100 Sheep card');

        var gt2 = S.force(gt1.moves[2].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({
          sheepStock100: 7,
          field: [3, 30]
        });
        expect(gt2.moves.length).toEqual(2);
        expect(gt2.moves[0].description).toEqual('Release 3 Sheep card');
        expect(gt2.moves[1].description).toEqual('Release 30 Sheep card');

        var gt3 = S.force(gt2.moves[0].gameTreePromise);
        var w3 = gt3.world;
        expect(changedRegionsBetween(w2, w3)).toEqual({
          sheepStock3: 7,
          field: [30]
        });
        expect(gt3.moves.length).toEqual(1);
        expect(gt3.moves[0].description).toEqual('Draw a card');
      });
      it('stops asking if no Sheep card is in the Field', function () {
        var gt0 = makeGameTreeAfterPlaying('Meteor', {keepDeck: true});
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('Release 1 Sheep card');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 7,
          field: [],
          discardPile: [],
          exile: ['Meteor']
        });
        expect(gt1.moves.length).toEqual(0);
      });
    });
    describe('Multiply', function () {
      it('puts a 3 Sheep card into Field', function () {
        var gt0 = makeGameTreeAfterPlaying('Multiply');
        var w0 = gt0.world;
        expect(gt0.moves[0].description).toEqual('Gain a 3 Sheep card');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock3: 6,
          field: [1, 3]
        });
      });
      it('does nothing if there is no space in Field', function () {
        var gt0 = makeGameTreeAfterPlaying('Multiply', {
          customize: function (w) {
            for (var i = 0; i < 6; i++)
              S.gainX(w, 1);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves[0].description).toEqual('Nothing happened');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
      });
    });
    describe('Plague', function () {
      it('asks a rank of Sheep cards to release', function () {
        var gt0 = makeGameTreeAfterPlaying('Plague', {
          customize: function (w) {
            S.gainX(w, 1);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(3);
        expect(gt0.moves[0].description).toEqual('Release all 1 Sheep cards');
        expect(gt0.moves[1].description).toEqual('Release all 30 Sheep cards');
        expect(gt0.moves[2].description).toEqual('Release all 100 Sheep cards');

        var gt1a = S.force(gt0.moves[0].gameTreePromise);
        var w1a = gt1a.world;
        expect(changedRegionsBetween(w0, w1a)).toEqual({
          sheepStock1: 7,
          field: [30, 100, 100]
        });
        expect(gt1a.moves.length).toEqual(4);
        expect(gt1a.moves[0].description).toMatch(/^Play /);

        var gt1b = S.force(gt0.moves[1].gameTreePromise);
        var w1b = gt1b.world;
        expect(changedRegionsBetween(w0, w1b)).toEqual({
          sheepStock30: 7,
          field: [1, 1, 100, 100]
        });
        expect(gt1b.moves.length).toEqual(4);
        expect(gt1b.moves[0].description).toMatch(/^Play /);

        var gt1c = S.force(gt0.moves[2].gameTreePromise);
        var w1c = gt1c.world;
        expect(changedRegionsBetween(w0, w1c)).toEqual({
          sheepStock100: 7,
          field: [1, 1, 30]
        });
        expect(gt1c.moves.length).toEqual(4);
        expect(gt1c.moves[0].description).toMatch(/^Play /);
      });
    });
    describe('Planning Sheep', function () {
      it('shows moves to exile a card', function () {
        var gt0 = makeGameTreeAfterPlaying('Planning Sheep');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(w0.hand.length);
        for (var i = 0; i < w0.hand.length; i++)
          expect(gt0.moves[i].description).toEqual('Exile ' + w0.hand[i].name);

        var gt1 = S.force(gt0.moves[2].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          exile: [w0.hand[2].name],
          hand: [w0.hand[0].name, w0.hand[1].name, w0.hand[3].name]
        });
        expect(gt1.moves.length).toEqual(3);  // 5 - (Planning Sheep + exiled)
        expect(gt1.moves[0].description).toMatch(/Play /);
      });
      it('shows a move to do nothing if there is no card in Hand', function () {
        var gt0 = makeGameTreeAfterPlaying('Planning Sheep', {handCount: 1});
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('No card to exile - nothing happened');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('Remake Deck then fill Hand');
      });
    });
    describe('Sheep Dog', function () {
      it('shows moves to discard a card', function () {
        var gt0 = makeGameTreeAfterPlaying('Sheep Dog');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(w0.hand.length);
        for (var i = 0; i < w0.hand.length; i++)
          expect(gt0.moves[i].description).toEqual('Discard ' + w0.hand[i].name);

        var gt1 = S.force(gt0.moves[2].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          discardPile: w0.discardPile.map(function (c) {return c.name;})
                       .concat(w0.hand[2].name),
          hand: [w0.hand[0].name, w0.hand[1].name, w0.hand[3].name]
        });
        expect(gt1.moves.length).toEqual(3);  // 5 - (Sheep Dog + discarded)
        expect(gt1.moves[0].description).toMatch(/Play /);
      });
      it('shows a move to do nothing if there is no card in Hand', function () {
        var gt0 = makeGameTreeAfterPlaying('Sheep Dog', {handCount: 1});
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('No card to discard - nothing happened');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('Remake Deck then fill Hand');
      });
    });
    describe('Shephion', function () {
      it('shows a move to release all Sheep cards', function () {
        var gt0 = makeGameTreeAfterPlaying('Shephion', {
          customize: function (w) {
            S.gainX(w, 1);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('Release all Sheep cards');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 7,
          sheepStock30: 7,
          sheepStock100: 7,
          field: []
        });
        expect(gt1.moves.length).toEqual(0);
      });
    });
    describe('Slump', function () {
      it('repeats asking which Sheep card to release', function () {
        var gt0 = makeGameTreeAfterPlaying('Slump', {
          customize: function (w) {
            S.gainX(w, 1);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(5);
        expect(gt0.moves[0].description).toEqual('Release 1 Sheep card');
        expect(gt0.moves[1].description).toEqual('Release 1 Sheep card');
        expect(gt0.moves[2].description).toEqual('Release 30 Sheep card');
        expect(gt0.moves[3].description).toEqual('Release 100 Sheep card');
        expect(gt0.moves[4].description).toEqual('Release 100 Sheep card');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 6,
          field: [1, 30, 100, 100]
        });
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toEqual('Release 1 Sheep card');
        expect(gt1.moves[1].description).toEqual('Release 30 Sheep card');
        expect(gt1.moves[2].description).toEqual('Release 100 Sheep card');
        expect(gt1.moves[3].description).toEqual('Release 100 Sheep card');

        var gt2 = S.force(gt1.moves[0].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({
          sheepStock1: 7,
          field: [30, 100, 100]
        });
        expect(gt2.moves.length).toEqual(4);
        expect(gt2.moves[0].description).toMatch(/^Play /);
      });
      it('does nothing if there is only one Sheep card in the Field', function () {
        var gt0 = makeGameTreeAfterPlaying('Slump');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('No sheep to release - nothing happened');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/^Play /);
      });
    });
    describe('Storm', function () {
      it('asks two Sheep cards to release', function () {
        var gt0 = makeGameTreeAfterPlaying('Storm', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(4);
        expect(gt0.moves[0].description).toEqual('Release 1 Sheep card');
        expect(gt0.moves[1].description).toEqual('Release 3 Sheep card');
        expect(gt0.moves[2].description).toEqual('Release 30 Sheep card');
        expect(gt0.moves[3].description).toEqual('Release 100 Sheep card');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 7,
          field: [3, 30, 100]
        });
        expect(gt1.moves.length).toEqual(3);
        expect(gt1.moves[0].description).toEqual('Release 3 Sheep card');
        expect(gt1.moves[1].description).toEqual('Release 30 Sheep card');
        expect(gt1.moves[2].description).toEqual('Release 100 Sheep card');

        var gt2 = S.force(gt1.moves[2].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({
          sheepStock100: 7,
          field: [3, 30]
        });
        expect(gt2.moves.length).toEqual(4);
        expect(gt2.moves[0].description).toMatch(/^Play /);
      });
      it('asks one Sheep card to release if it is only one in the Field', function () {
        var gt0 = makeGameTreeAfterPlaying('Storm');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('Release 1 Sheep card');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 7,
          field: []
        });
        expect(gt1.moves.length).toEqual(0);
      });
    });
    describe('Wolves', function () {
      it('asks Sheep cards with the highest rank to reduce', function () {
        var gt0 = makeGameTreeAfterPlaying('Wolves', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(2);
        expect(gt0.moves[0].description).toEqual('Reduce the rank of 100 Sheep card');
        expect(gt0.moves[1].description).toEqual('Reduce the rank of 100 Sheep card');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock30: 5,
          sheepStock100: 6,
          field: [1, 3, 30, 100, 30]
        });
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/^Play /);
      });
      it('shows moves to release a Sheep if the highest rank is 1', function () {
        var gt0 = makeGameTreeAfterPlaying('Wolves', {
          customize: function (w) {
            S.gainX(w, 1);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(2);
        expect(gt0.moves[0].description).toEqual('Release 1 Sheep card');
        expect(gt0.moves[1].description).toEqual('Release 1 Sheep card');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 6,
          field: [1]
        });
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/^Play /);
      });
    });
  });
});

// vim: expandtab softtabstop=2 shiftwidth=2
// vim: foldmethod=expr
// vim: foldexpr=getline(v\:lnum)=~#'\\v<x?(describe|it|beforeEach|afterEach)>.*<function>\\s*\\([^()]*\\)\\s*\\{'?'a1'\:(getline(v\:lnum)=~#'^\\s*});$'&&search('\\v^\\s{'.indent(v\:lnum).'}<x?(describe|it|beforeEach|afterEach)>','bnW')?'s1'\:'=')
