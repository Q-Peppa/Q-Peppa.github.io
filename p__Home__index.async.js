'use strict';
(self.webpackChunk = self.webpackChunk || []).push([
  [371],
  {
    86699: function (F, u, n) {
      n.r(u),
        n.d(u, {
          default: function () {
            return m;
          },
        });
      var s = n(9116),
        t = n.n(s),
        a = { title: 'title___dGVbV' },
        r = n(32392),
        d = n(6714),
        i = n(25830),
        e = n(93251),
        c = function () {
          var h = (0, i.Z)(!1),
            l = t()(h, 2),
            f = l[0],
            o = l[1].toggle;
          return (0, e.jsxs)('div', {
            children: [
              (0, e.jsx)('h1', {
                className: a.title,
                children: '\u6D4B\u8BD5\u5C0F\u7F51\u9875',
              }),
              (0, e.jsx)(r.ZP, {
                onClick: o,
                type: 'primary',
                children: 'click me',
              }),
              (0, e.jsx)(d.Z, {
                open: f,
                onClose: o,
                title: 'Basic Drawer',
                width: '20%',
                children: (0, e.jsx)('div', {
                  children: (0, e.jsx)('p', {
                    children:
                      '\u597D\u597D\u770B\u4F60\u7684\u4E66\uFF01\uFF01\uFF01',
                  }),
                }),
              }),
            ],
          });
        },
        v = c,
        m = function () {
          return (0, e.jsx)(v, {});
        };
    },
  },
]);
