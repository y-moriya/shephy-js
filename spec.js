describe('shephy', function () {
  var S = shephy;

  describe('makeInitalWorld', function () {
    it('makes a new world', function () {
      var w = S.makeInitalWorld();

      [1, 3, 10, 30, 100, 300, 1000].forEach(function (n) {
        expect(w.sheepStock[n].length).toEqual(n == 1 ? 6 : 7);
        w.sheepStock[n].forEach(function (c) {
          expect(c.type).toEqual(S.CARD_TYPE_SHEEP);
          expect(c.count).toEqual(n);
        });
      });

      expect(w.field.length).toEqual(1);
      expect(w.field[0].type).toEqual(S.CARD_TYPE_SHEEP);
      expect(w.field[0].count).toEqual(1);

      expect(w.enemySheepCount).toEqual(1);

      expect(w.deck.length).toEqual(22);
      w.deck.forEach(function (c) {
        expect(c.type).toEqual(S.CARD_TYPE_EVENT);
      });

      expect(w.discardPile.length).toEqual(0);
      expect(w.exile.length).toEqual(0);
    });
  });
});

// vim: expandtab softtabstop=2 shiftwidth=2 foldmethod=marker
// vim: foldmethod=expr
// vim: foldexpr=getline(v\:lnum)=~#'\\v<x?(describe|it|beforeEach|afterEach)>.*<function>\\s*\\([^()]*\\)\\s*\\{'?'a1'\:(getline(v\:lnum)=~#'^\\s*});$'?'s1'\:'=')
