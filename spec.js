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

    ['hand', 'discardPile', 'exile', 'deck'].forEach(function (regionName) {
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
      expect(moves[0].description).toEqual('手札を5枚補充しました。');
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
      expect(moves[0].description).toEqual('山札を再作成し、手札を補充します。');
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
        expect(moves[i].description).toEqual(w.hand[i].name + 'を使用しました。');
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
        var gt0 = makeGameTreeAfterPlaying('万能ひつじ');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(w0.hand.length);
        for (var i = 0; i < w0.hand.length; i++)
          expect(gt0.moves[i].description).toEqual(w0.hand[i].name + 'をコピーします。');

        var gt1 = S.force(gt0.moves[2].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).not.toBeLessThan(1);
      });
      it('shows a move to do nothing if there is no card in Hand', function () {
        var gt0 = makeGameTreeAfterPlaying('万能ひつじ', {handCount: 1});
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('手札にコピー出来るカードが残っていません。何も起こりませんでした。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('山札を再作成し、手札を補充します。');
      });
    });
    describe('Be Fruitful', function () {
      it('shows a move for each sheep in Field', function () {
        var gt0 = makeGameTreeAfterPlaying('産めよ', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 30);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(5);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードをコピーしました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('1 ひつじカードを得ました。');

        var gt1d = S.force(gt1.moves[0].gameTreePromise);
        var w1d = gt1d.world;
        expect(changedRegionsBetween(w1, w1d)).toEqual({
          sheepStock1: 5,
          field: [1, 3, 30, 30, 100, 1]
        });
        expect(gt1d.moves.length).toEqual(4);
        expect(gt1d.moves[0].description).toMatch(/を使用しました。$/);
        expect(gt0.moves[2].description).toEqual('30 ひつじカードをコピーしました。');

        var gt3 = S.force(gt0.moves[2].gameTreePromise);
        var w3 = gt3.world;
        expect(changedRegionsBetween(w0, w3)).toEqual({});
        expect(gt3.moves.length).toEqual(1);
        expect(gt3.moves[0].description).toEqual('30 ひつじカードを得ました。');

        var gt3d = S.force(gt3.moves[0].gameTreePromise);
        var w3d = gt3d.world;
        expect(changedRegionsBetween(w3, w3d)).toEqual({
          sheepStock30: 4,
          field: [1, 3, 30, 30, 100, 30]
        });
        expect(gt3d.moves.length).toEqual(4);
        expect(gt3d.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('shows a move for nothing if Field is full', function () {
        var gt0 = makeGameTreeAfterPlaying('増やせよ', {
          customize: function (w) {
            for (var i = 1; i <= 6; i++)
              S.gainX(w, 1);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('何も起きませんでした。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/を使用しました。$/);
      });
    });
    describe('Crowding', function () {
      it('repeats asking which Sheep card to release', function () {
        var gt0 = makeGameTreeAfterPlaying('過密', {
          customize: function (w) {
            S.gainX(w, 1);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(5);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを手放しました。');
        expect(gt0.moves[1].description).toEqual('1 ひつじカードを手放しました。');
        expect(gt0.moves[2].description).toEqual('30 ひつじカードを手放しました。');
        expect(gt0.moves[3].description).toEqual('100 ひつじカードを手放しました。');
        expect(gt0.moves[4].description).toEqual('100 ひつじカードを手放しました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 6,
          field: [1, 30, 100, 100]
        });
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toEqual('1 ひつじカードを手放しました。');
        expect(gt1.moves[1].description).toEqual('30 ひつじカードを手放しました。');
        expect(gt1.moves[2].description).toEqual('100 ひつじカードを手放しました。');
        expect(gt1.moves[3].description).toEqual('100 ひつじカードを手放しました。');

        var gt2 = S.force(gt1.moves[0].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({
          sheepStock1: 7,
          field: [30, 100, 100]
        });
        expect(gt2.moves.length).toEqual(3);
        expect(gt2.moves[0].description).toEqual('30 ひつじカードを手放しました。');
        expect(gt2.moves[1].description).toEqual('100 ひつじカードを手放しました。');
        expect(gt2.moves[2].description).toEqual('100 ひつじカードを手放しました。');

        var gt3 = S.force(gt2.moves[0].gameTreePromise);
        var w3 = gt3.world;
        expect(changedRegionsBetween(w2, w3)).toEqual({
          sheepStock30: 7,
          field: [100, 100]
        });
        expect(gt3.moves.length).toEqual(4);
        expect(gt3.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('does nothing if not so many Sheep cards are in the Field', function () {
        var gt0 = makeGameTreeAfterPlaying('過密', {
          customize: function (w) {
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('ひつじカードがすでに2枚以下のため、何も起きませんでした。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/を使用しました。$/);
      });
    });
    describe('Dominion', function () {
      it('repeats asking choice of sheep then composite them', function () {
        var gt0 = makeGameTreeAfterPlaying('統率', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 3);
            S.gainX(w, 3);
            S.gainX(w, 3);
            S.gainX(w, 30);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(6);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを選びました。');
        expect(gt0.moves[1].description).toEqual('3 ひつじカードを選びました。');
        expect(gt0.moves[2].description).toEqual('3 ひつじカードを選びました。');
        expect(gt0.moves[3].description).toEqual('3 ひつじカードを選びました。');
        expect(gt0.moves[4].description).toEqual('3 ひつじカードを選びました。');
        expect(gt0.moves[5].description).toEqual('30 ひつじカードを選びました。');

        var gt1 = S.force(gt0.moves[1].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(6);
        expect(gt1.moves[0].description).toEqual('1 ひつじカードを選びました。');
        expect(gt1.moves[1].description).toEqual('3 ひつじカードを選びました。');
        expect(gt1.moves[2].description).toEqual('3 ひつじカードを選びました。');
        expect(gt1.moves[3].description).toEqual('3 ひつじカードを選びました。');
        expect(gt1.moves[4].description).toEqual('30 ひつじカードを選びました。');
        expect(gt1.moves[5].description).toEqual('選ばれたひつじカードを統率します。');

        var gt2 = S.force(gt1.moves[1].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({});
        expect(gt2.moves.length).toEqual(5);
        expect(gt2.moves[0].description).toEqual('1 ひつじカードを選びました。');
        expect(gt2.moves[1].description).toEqual('3 ひつじカードを選びました。');
        expect(gt2.moves[2].description).toEqual('3 ひつじカードを選びました。');
        expect(gt2.moves[3].description).toEqual('30 ひつじカードを選びました。');
        expect(gt2.moves[4].description).toEqual('選ばれたひつじカードを統率します。');

        var gt3 = S.force(gt2.moves[1].gameTreePromise);
        var w3 = gt3.world;
        expect(changedRegionsBetween(w2, w3)).toEqual({});
        expect(gt3.moves.length).toEqual(4);
        expect(gt3.moves[0].description).toEqual('1 ひつじカードを選びました。');
        expect(gt3.moves[1].description).toEqual('3 ひつじカードを選びました。');
        expect(gt3.moves[2].description).toEqual('30 ひつじカードを選びました。');
        expect(gt3.moves[3].description).toEqual('選ばれたひつじカードを統率します。');

        var gt4 = S.force(gt3.moves[1].gameTreePromise);
        var w4 = gt4.world;
        expect(changedRegionsBetween(w3, w4)).toEqual({});
        expect(gt4.moves.length).toEqual(3);
        expect(gt4.moves[0].description).toEqual('1 ひつじカードを選びました。');
        expect(gt4.moves[1].description).toEqual('30 ひつじカードを選びました。');
        expect(gt4.moves[2].description).toEqual('選ばれたひつじカードを統率します。');

        var gt5 = S.force(gt4.moves[2].gameTreePromise);
        var w5 = gt5.world;
        expect(changedRegionsBetween(w4, w5)).toEqual({
          sheepStock3: 7,
          sheepStock10: 6,
          field: [1, 30, 10]
        });
        expect(gt5.moves.length).toEqual(4);
        expect(gt5.moves[0].description).toMatch(/を使用しました。$/);
      });
    });
    describe('Falling Rock', function () {
      it('asks which Sheep card to release', function () {
        var gt0 = makeGameTreeAfterPlaying('落石', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(4);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを手放しました。');
        expect(gt0.moves[1].description).toEqual('3 ひつじカードを手放しました。');
        expect(gt0.moves[2].description).toEqual('30 ひつじカードを手放しました。');
        expect(gt0.moves[3].description).toEqual('100 ひつじカードを手放しました。');

        var gt1a = S.force(gt0.moves[0].gameTreePromise);
        var w1a = gt1a.world;
        expect(changedRegionsBetween(w0, w1a)).toEqual({
          sheepStock1: 7,
          field: [3, 30, 100]
        });
        expect(gt1a.moves.length).toEqual(4);
        expect(gt1a.moves[0].description).toMatch(/を使用しました。$/);

        var gt1b = S.force(gt0.moves[2].gameTreePromise);
        var w1b = gt1b.world;
        expect(changedRegionsBetween(w0, w1b)).toEqual({
          sheepStock30: 7,
          field: [1, 3, 100]
        });
        expect(gt1b.moves.length).toEqual(4);
        expect(gt1b.moves[0].description).toMatch(/を使用しました。$/);
      });
    });
    describe('Fill the Earth', function () {
      it('shows two moves - gain or not', function () {
        var gt0 = makeGameTreeAfterPlaying('地に満ちよ');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(2);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを得ました。');
        expect(gt0.moves[1].description).toEqual('キャンセルしました。');

        var gt1g = S.force(gt0.moves[0].gameTreePromise);
        var w1g = gt1g.world;
        expect(changedRegionsBetween(w0, w1g)).toEqual({
          sheepStock1: 5,
          field: [1, 1]
        });
        expect(gt1g.moves.length).toEqual(2);
        expect(gt1g.moves[0].description).toEqual('1 ひつじカードを得ました。');
        expect(gt1g.moves[1].description).toEqual('キャンセルしました。');

        var gt1c = S.force(gt0.moves[1].gameTreePromise);
        var w1c = gt1c.world;
        expect(changedRegionsBetween(w0, w1c)).toEqual({});
        expect(gt1c.moves.length).toEqual(4);
        expect(gt1c.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('repeats the same two moves until user cancels', function () {
        var gt0 = makeGameTreeAfterPlaying('地に満ちよ');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(2);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを得ました。');
        expect(gt0.moves[1].description).toEqual('キャンセルしました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 5,
          field: [1, 1]
        });
        expect(gt1.moves.length).toEqual(2);
        expect(gt1.moves[0].description).toEqual('1 ひつじカードを得ました。');
        expect(gt1.moves[1].description).toEqual('キャンセルしました。');

        var gt2 = S.force(gt1.moves[0].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({
          sheepStock1: 4,
          field: [1, 1, 1]
        });
        expect(gt2.moves.length).toEqual(2);
        expect(gt2.moves[0].description).toEqual('1 ひつじカードを得ました。');
        expect(gt2.moves[1].description).toEqual('キャンセルしました。');
      });
      it('shows only "cancel" if there is no space in Field', function () {
        var gt = makeGameTreeAfterPlaying('地に満ちよ', {
          customize: function (w) {
            for (var i = 0; i < 6; i++)
              S.gainX(w, 3);
          }
        });
        expect(gt.moves.length).toEqual(1);
        expect(gt.moves[0].description).toEqual('キャンセルしました。');
      });
    });
    describe('Flourish', function () {
      it('shows a move for each sheep in Field to gain 3 cards', function () {
        var gt0 = makeGameTreeAfterPlaying('繁栄', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(4);
        expect(gt0.moves[1].description).toEqual('3 ひつじカードを選びました。');

        var gt2 = S.force(gt0.moves[1].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w0, w2)).toEqual({});
        expect(gt2.moves.length).toEqual(1);
        expect(gt2.moves[0].description).toEqual('1 ひつじカードを3枚得ました。');

        var gt2d = S.force(gt2.moves[0].gameTreePromise);
        var w2d = gt2d.world;
        expect(changedRegionsBetween(w2, w2d)).toEqual({
          sheepStock1: 3,
          field: [1, 3, 30, 100, 1, 1, 1]
        });
        expect(gt2d.moves.length).toEqual(4);
        expect(gt2d.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('shows a move to gain 2 cards if Field is nearly full', function () {
        var gt0 = makeGameTreeAfterPlaying('繁栄', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(5);
        expect(gt0.moves[1].description).toEqual('3 ひつじカードを選びました。');

        var gt2 = S.force(gt0.moves[1].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w0, w2)).toEqual({});
        expect(gt2.moves.length).toEqual(1);
        expect(gt2.moves[0].description).toEqual('1 ひつじカードを2枚得ました。');

        var gt2d = S.force(gt2.moves[0].gameTreePromise);
        var w2d = gt2d.world;
        expect(changedRegionsBetween(w2, w2d)).toEqual({
          sheepStock1: 4,
          field: [1, 3, 30, 100, 100, 1, 1]
        });
        expect(gt2d.moves.length).toEqual(4);
        expect(gt2d.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('shows a move to gain 1 cards if Field is nearly full', function () {
        var gt0 = makeGameTreeAfterPlaying('繁栄', {
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
        expect(gt0.moves[1].description).toEqual('3 ひつじカードを選びました。');

        var gt2 = S.force(gt0.moves[1].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w0, w2)).toEqual({});
        expect(gt2.moves.length).toEqual(1);
        expect(gt2.moves[0].description).toEqual('1 ひつじカードを得ました。');

        var gt2d = S.force(gt2.moves[0].gameTreePromise);
        var w2d = gt2d.world;
        expect(changedRegionsBetween(w2, w2d)).toEqual({
          sheepStock1: 5,
          field: [1, 3, 30, 100, 100, 100, 1]
        });
        expect(gt2d.moves.length).toEqual(4);
        expect(gt2d.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('shows a move for nothing if Field is full', function () {
        var gt0 = makeGameTreeAfterPlaying('繁栄', {
          customize: function (w) {
            for (var i = 1; i <= 6; i++)
              S.gainX(w, 1);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('何も起きませんでした。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('shows a move for nothing if 1 Sheep is chosen', function () {
        var gt0 = makeGameTreeAfterPlaying('繁栄', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(4);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを選びました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('何も得られませんでした。');

        var gt1d = S.force(gt1.moves[0].gameTreePromise);
        var w1d = gt1d.world;
        expect(changedRegionsBetween(w1, w1d)).toEqual({});
        expect(gt1d.moves.length).toEqual(4);
        expect(gt1d.moves[0].description).toMatch(/を使用しました。$/);
      });
    });
    describe('Golden Hooves', function () {
      it('repeats asking choice of sheep', function () {
        var gt0 = makeGameTreeAfterPlaying('黄金の蹄', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(4);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを選びました。');
        expect(gt0.moves[1].description).toEqual('3 ひつじカードを選びました。');
        expect(gt0.moves[2].description).toEqual('30 ひつじカードを選びました。');
        expect(gt0.moves[3].description).toEqual('キャンセルしました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(3);
        expect(gt1.moves[0].description).toEqual('3 ひつじカードを選びました。');
        expect(gt1.moves[1].description).toEqual('30 ひつじカードを選びました。');
        expect(gt1.moves[2].description).toEqual('選ばれたひつじカードが1ランクアップしました。');

        var gt2 = S.force(gt1.moves[0].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({});
        expect(gt2.moves.length).toEqual(2);
        expect(gt2.moves[0].description).toEqual('30 ひつじカードを選びました。');
        expect(gt2.moves[1].description).toEqual('選ばれたひつじカードが1ランクアップしました。');

        var gt3 = S.force(gt2.moves[0].gameTreePromise);
        var w3 = gt3.world;
        expect(changedRegionsBetween(w2, w3)).toEqual({});
        expect(gt3.moves.length).toEqual(1);
        expect(gt3.moves[0].description).toEqual('選ばれたひつじカードが1ランクアップしました。');

        var gt2d = S.force(gt2.moves[1].gameTreePromise);
        var w2d = gt2d.world;
        expect(changedRegionsBetween(w2, w2d)).toEqual({
          sheepStock1: 7,
          sheepStock10: 6,
          field: [30, 100, 10, 3]
        });
        expect(gt2d.moves.length).toEqual(4);
        expect(gt2d.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('does nothing if Field if full', function () {
        var gt0 = makeGameTreeAfterPlaying('黄金の蹄', {
          customize: function (w) {
            for (var i = 1; i <= 6; i++)
              S.gainX(w, 1);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('キャンセルしました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/を使用しました。$/);
      });
    });
    describe('Inspiration', function () {
      it('asks which card in deck to put it into hand', function () {
        var gt0 = makeGameTreeAfterPlaying('霊感', {keepDeck: true});
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(w0.deck.length);
        for (var i = 0; i < w0.deck.length; i++)
          expect(gt0.moves[i].description).toEqual(w0.deck[i].name + ' カードを手札に得ました。');

        function cardToName(c) {
          return c.name;
        }

        var gt1 = S.force(gt0.moves[3].gameTreePromise);
        var w1 = gt1.world;
        var w1deck = w0.deck.map(cardToName);
        w1deck.splice(3, 1);
        expect(changedRegionsBetween(w0, w1)).toEqual({
          hand: w0.hand.map(cardToName).concat([w0.deck[3].name]),
          deck: w1deck
        });
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('山札をシャッフルしました。');

        var gt2 = S.force(gt1.moves[0].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({
          deck: w2.deck.map(cardToName)
        });
        expect(w2.deck.map(cardToName).sort()).toEqual(w1.deck.map(cardToName).sort())
        expect(gt2.moves.length).toEqual(5);
        expect(gt2.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('does nothing if deck is empty', function () {
        var gt0 = makeGameTreeAfterPlaying('霊感');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('山札には何もありませんでした。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/を使用しました。$/);
      });
    });
    describe('Lightning', function () {
      it('asks Sheep cards with the highest rank to release', function () {
        var gt0 = makeGameTreeAfterPlaying('落雷', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(2);
        expect(gt0.moves[0].description).toEqual('100 ひつじカードを手放しました。');
        expect(gt0.moves[1].description).toEqual('100 ひつじカードを手放しました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock100: 6,
          field: [1, 3, 30, 100]
        });
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/を使用しました。$/);
      });
    });
    describe('Meteor', function () {
      it('asks three Sheep cards to release', function () {
        var gt0 = makeGameTreeAfterPlaying('メテオ', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
          },
          keepDeck: true
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(4);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを手放しました。');
        expect(gt0.moves[1].description).toEqual('3 ひつじカードを手放しました。');
        expect(gt0.moves[2].description).toEqual('30 ひつじカードを手放しました。');
        expect(gt0.moves[3].description).toEqual('100 ひつじカードを手放しました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 7,
          field: [3, 30, 100],
          discardPile: [],
          exile: ['メテオ']
        });
        expect(gt1.moves.length).toEqual(3);
        expect(gt1.moves[0].description).toEqual('3 ひつじカードを手放しました。');
        expect(gt1.moves[1].description).toEqual('30 ひつじカードを手放しました。');
        expect(gt1.moves[2].description).toEqual('100 ひつじカードを手放しました。');

        var gt2 = S.force(gt1.moves[2].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({
          sheepStock100: 7,
          field: [3, 30]
        });
        expect(gt2.moves.length).toEqual(2);
        expect(gt2.moves[0].description).toEqual('3 ひつじカードを手放しました。');
        expect(gt2.moves[1].description).toEqual('30 ひつじカードを手放しました。');

        var gt3 = S.force(gt2.moves[0].gameTreePromise);
        var w3 = gt3.world;
        expect(changedRegionsBetween(w2, w3)).toEqual({
          sheepStock3: 7,
          field: [30]
        });
        expect(gt3.moves.length).toEqual(1);
        expect(gt3.moves[0].description).toEqual('手札を1枚補充しました。');
      });
      it('stops asking if no Sheep card is in the Field', function () {
        var gt0 = makeGameTreeAfterPlaying('メテオ', {keepDeck: true});
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを手放しました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 7,
          field: [],
          discardPile: [],
          exile: ['メテオ']
        });
        expect(gt1.moves.length).toEqual(0);
      });
    });
    describe('Multiply', function () {
      it('puts a 3 Sheep card into Field', function () {
        var gt0 = makeGameTreeAfterPlaying('増やせよ');
        var w0 = gt0.world;
        expect(gt0.moves[0].description).toEqual('3 ひつじカードを得ました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock3: 6,
          field: [1, 3]
        });
      });
      it('does nothing if there is no space in Field', function () {
        var gt0 = makeGameTreeAfterPlaying('産めよ', {
          customize: function (w) {
            for (var i = 0; i < 6; i++)
              S.gainX(w, 1);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves[0].description).toEqual('何も起きませんでした。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
      });
    });
    describe('Plague', function () {
      it('asks a representative Sheep card release', function () {
        var gt0 = makeGameTreeAfterPlaying('疫病', {
          customize: function (w) {
            S.gainX(w, 1);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(5);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードすべてを手放しました。');
        expect(gt0.moves[1].description).toEqual('1 ひつじカードすべてを手放しました。');
        expect(gt0.moves[2].description).toEqual('30 ひつじカードすべてを手放しました。');
        expect(gt0.moves[3].description).toEqual('100 ひつじカードすべてを手放しました。');
        expect(gt0.moves[4].description).toEqual('100 ひつじカードすべてを手放しました。');

        var gt1a = S.force(gt0.moves[0].gameTreePromise);
        var w1a = gt1a.world;
        expect(changedRegionsBetween(w0, w1a)).toEqual({
          sheepStock1: 7,
          field: [30, 100, 100]
        });
        expect(gt1a.moves.length).toEqual(4);
        expect(gt1a.moves[0].description).toMatch(/を使用しました。$/);

        var gt1b = S.force(gt0.moves[1].gameTreePromise);
        var w1b = gt1b.world;
        expect(changedRegionsBetween(w0, w1b)).toEqual({
          sheepStock1: 7,
          field: [30, 100, 100]
        });
        expect(gt1b.moves.length).toEqual(4);
        expect(gt1b.moves[0].description).toMatch(/を使用しました。$/);

        var gt1c = S.force(gt0.moves[2].gameTreePromise);
        var w1c = gt1c.world;
        expect(changedRegionsBetween(w0, w1c)).toEqual({
          sheepStock30: 7,
          field: [1, 1, 100, 100]
        });
        expect(gt1c.moves.length).toEqual(4);
        expect(gt1c.moves[0].description).toMatch(/を使用しました。$/);

        var gt1d = S.force(gt0.moves[3].gameTreePromise);
        var w1d = gt1d.world;
        expect(changedRegionsBetween(w0, w1d)).toEqual({
          sheepStock100: 7,
          field: [1, 1, 30]
        });
        expect(gt1d.moves.length).toEqual(4);
        expect(gt1d.moves[0].description).toMatch(/を使用しました。$/);

        var gt1e = S.force(gt0.moves[4].gameTreePromise);
        var w1e = gt1e.world;
        expect(changedRegionsBetween(w0, w1e)).toEqual({
          sheepStock100: 7,
          field: [1, 1, 30]
        });
        expect(gt1e.moves.length).toEqual(4);
        expect(gt1e.moves[0].description).toMatch(/を使用しました。$/);
      });
    });
    describe('Planning Sheep', function () {
      it('shows moves to exile a card', function () {
        var gt0 = makeGameTreeAfterPlaying('対策ひつじ');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(w0.hand.length);
        for (var i = 0; i < w0.hand.length; i++)
          expect(gt0.moves[i].description).toEqual(w0.hand[i].name + ' カードを追放しました。');

        var gt1 = S.force(gt0.moves[2].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          exile: [w0.hand[2].name],
          hand: [w0.hand[0].name, w0.hand[1].name, w0.hand[3].name]
        });
        expect(gt1.moves.length).toEqual(3);  // 5 - (Planning Sheep + exiled)
        expect(gt1.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('shows a move to do nothing if there is no card in Hand', function () {
        var gt0 = makeGameTreeAfterPlaying('対策ひつじ', {handCount: 1});
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('追放するカードがありません。何も起きませんでした。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('山札を再作成し、手札を補充します。');
      });
    });
    describe('Sheep Dog', function () {
      it('shows moves to discard a card', function () {
        var gt0 = makeGameTreeAfterPlaying('牧羊犬');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(w0.hand.length);
        for (var i = 0; i < w0.hand.length; i++)
          expect(gt0.moves[i].description).toEqual(w0.hand[i].name + ' カードを捨てました。');

        var gt1 = S.force(gt0.moves[2].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          discardPile: w0.discardPile.map(function (c) {return c.name;})
                       .concat(w0.hand[2].name),
          hand: [w0.hand[0].name, w0.hand[1].name, w0.hand[3].name]
        });
        expect(gt1.moves.length).toEqual(3);  // 5 - (Sheep Dog + discarded)
        expect(gt1.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('shows a move to do nothing if there is no card in Hand', function () {
        var gt0 = makeGameTreeAfterPlaying('牧羊犬', {handCount: 1});
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('捨てるカードがありません。何も起きませんでした。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(1);
        expect(gt1.moves[0].description).toEqual('山札を再作成し、手札を補充します。');
      });
    });
    describe('Shephion', function () {
      it('shows a move to release all Sheep cards', function () {
        var gt0 = makeGameTreeAfterPlaying('シェフィオン', {
          customize: function (w) {
            S.gainX(w, 1);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('すべてのひつじカードを手放しました。');

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
        var gt0 = makeGameTreeAfterPlaying('暴落', {
          customize: function (w) {
            S.gainX(w, 1);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(5);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを手放しました。');
        expect(gt0.moves[1].description).toEqual('1 ひつじカードを手放しました。');
        expect(gt0.moves[2].description).toEqual('30 ひつじカードを手放しました。');
        expect(gt0.moves[3].description).toEqual('100 ひつじカードを手放しました。');
        expect(gt0.moves[4].description).toEqual('100 ひつじカードを手放しました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 6,
          field: [1, 30, 100, 100]
        });
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toEqual('1 ひつじカードを手放しました。');
        expect(gt1.moves[1].description).toEqual('30 ひつじカードを手放しました。');
        expect(gt1.moves[2].description).toEqual('100 ひつじカードを手放しました。');
        expect(gt1.moves[3].description).toEqual('100 ひつじカードを手放しました。');

        var gt2 = S.force(gt1.moves[0].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({
          sheepStock1: 7,
          field: [30, 100, 100]
        });
        expect(gt2.moves.length).toEqual(4);
        expect(gt2.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('does nothing if there is only one Sheep card in the Field', function () {
        var gt0 = makeGameTreeAfterPlaying('暴落');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('手放すひつじカードがありません。何も起きませんでした。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({});
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/を使用しました。$/);
      });
    });
    describe('Storm', function () {
      it('asks two Sheep cards to release', function () {
        var gt0 = makeGameTreeAfterPlaying('嵐', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(4);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを手放しました。');
        expect(gt0.moves[1].description).toEqual('3 ひつじカードを手放しました。');
        expect(gt0.moves[2].description).toEqual('30 ひつじカードを手放しました。');
        expect(gt0.moves[3].description).toEqual('100 ひつじカードを手放しました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 7,
          field: [3, 30, 100]
        });
        expect(gt1.moves.length).toEqual(3);
        expect(gt1.moves[0].description).toEqual('3 ひつじカードを手放しました。');
        expect(gt1.moves[1].description).toEqual('30 ひつじカードを手放しました。');
        expect(gt1.moves[2].description).toEqual('100 ひつじカードを手放しました。');

        var gt2 = S.force(gt1.moves[2].gameTreePromise);
        var w2 = gt2.world;
        expect(changedRegionsBetween(w1, w2)).toEqual({
          sheepStock100: 7,
          field: [3, 30]
        });
        expect(gt2.moves.length).toEqual(4);
        expect(gt2.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('asks one Sheep card to release if it is only one in the Field', function () {
        var gt0 = makeGameTreeAfterPlaying('嵐');
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(1);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを手放しました。');

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
        var gt0 = makeGameTreeAfterPlaying('狼', {
          customize: function (w) {
            S.gainX(w, 3);
            S.gainX(w, 30);
            S.gainX(w, 100);
            S.gainX(w, 100);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(2);
        expect(gt0.moves[0].description).toEqual('100 ひつじカードがランクダウンしました。');
        expect(gt0.moves[1].description).toEqual('100 ひつじカードがランクダウンしました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock30: 5,
          sheepStock100: 6,
          field: [1, 3, 30, 100, 30]
        });
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/を使用しました。$/);
      });
      it('shows moves to release a Sheep if the highest rank is 1', function () {
        var gt0 = makeGameTreeAfterPlaying('狼', {
          customize: function (w) {
            S.gainX(w, 1);
          }
        });
        var w0 = gt0.world;
        expect(gt0.moves.length).toEqual(2);
        expect(gt0.moves[0].description).toEqual('1 ひつじカードを手放しました。');
        expect(gt0.moves[1].description).toEqual('1 ひつじカードを手放しました。');

        var gt1 = S.force(gt0.moves[0].gameTreePromise);
        var w1 = gt1.world;
        expect(changedRegionsBetween(w0, w1)).toEqual({
          sheepStock1: 6,
          field: [1]
        });
        expect(gt1.moves.length).toEqual(4);
        expect(gt1.moves[0].description).toMatch(/を使用しました。$/);
      });
    });
  });
});

// vim: expandtab softtabstop=2 shiftwidth=2
// vim: foldmethod=expr
// vim: foldexpr=getline(v\:lnum)=~#'\\v<x?(describe|it|beforeEach|afterEach)>.*<function>\\s*\\([^()]*\\)\\s*\\{'?'a1'\:(getline(v\:lnum)=~#'^\\s*});$'&&search('\\v^\\s{'.indent(v\:lnum).'}<x?(describe|it|beforeEach|afterEach)>','bnW')?'s1'\:'=')
