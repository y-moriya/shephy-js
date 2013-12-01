describe('shephy', function () {
  var S = shephy;

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

      expect(w.discardPile.length).toEqual(0);
      expect(w.exile.length).toEqual(0);
    });
    it('returns a world with the same regions except Deck', function () {
      var w0 = S.makeInitalWorld();
      var wt = S.makeInitalWorld();

      [
        'sheepStock',
        'field',
        'enemySheepCount',
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

      expect(w.field.length).toEqual(1);
      expect(w.field[0].rank).toEqual(1);
      expect(w.sheepStock[3].length).toEqual(7);

      S.gainX(w, 3);

      expect(w.field.length).toEqual(2);
      expect(w.field[0].rank).toEqual(1);
      expect(w.field[1]).toBe(c);
      expect(w.sheepStock[3].length).toEqual(6);
    });
    it('does nothing if no Sheep with a given rank is available', function () {
      var w = S.makeInitalWorld();
      w.sheepStock[3] = [];

      expect(w.field.length).toEqual(1);
      expect(w.field[0].rank).toEqual(1);
      expect(w.sheepStock[3].length).toEqual(0);
      expect(w.sheepStock[10].length).toEqual(7);

      S.gainX(w, 3);

      expect(w.field.length).toEqual(1);
      expect(w.field[0].rank).toEqual(1);
      expect(w.sheepStock[3].length).toEqual(0);
      expect(w.sheepStock[10].length).toEqual(7);

      S.gainX(w, 10);

      expect(w.field.length).toEqual(2);
      expect(w.field[0].rank).toEqual(1);
      expect(w.field[1].rank).toEqual(10);
      expect(w.sheepStock[3].length).toEqual(0);
      expect(w.sheepStock[10].length).toEqual(6);
    });
    it('does nothing if no space is available in Field', function () {
      function test(n) {
        expect(w.field.length).toEqual(1 + n);
        expect(w.field[0].rank).toEqual(1);
        for (var i = 1; i < n; i++)
          expect(w.field[i].rank).toEqual(3);
        expect(w.sheepStock[3].length).toEqual(7 - n);
      }

      var w = S.makeInitalWorld();
      expect(w.field.length).toEqual(1);
      expect(w.field[0].rank).toEqual(1);
      expect(w.sheepStock[3].length).toEqual(7);

      S.gainX(w, 3);
      S.gainX(w, 3);
      S.gainX(w, 3);
      S.gainX(w, 3);
      S.gainX(w, 3);
      test(5);

      S.gainX(w, 3);
      test(6);

      S.gainX(w, 3);
      test(6);
    });
  });
});

// vim: expandtab softtabstop=2 shiftwidth=2
// vim: foldmethod=expr
// vim: foldexpr=getline(v\:lnum)=~#'\\v<x?(describe|it|beforeEach|afterEach)>.*<function>\\s*\\([^()]*\\)\\s*\\{'?'a1'\:(getline(v\:lnum)=~#'^\\s*});$'&&search('\\v^\\s{'.indent(v\:lnum).'}<x?(describe|it|beforeEach|afterEach)>','bnW')?'s1'\:'=')
