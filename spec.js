describe('shephy', function () {
  var S = shephy;
});

// vim: expandtab softtabstop=2 shiftwidth=2 foldmethod=marker
// vim: foldmethod=expr
// vim: foldexpr=getline(v\:lnum)=~#'\\v<x?(describe|it|beforeEach|afterEach)>.*<function>\\s*\\([^()]*\\)\\s*\\{'?'a1'\:(getline(v\:lnum)=~#'^\\s*});$'?'s1'\:'=')
