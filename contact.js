// https://github.com/umdjs/umd/blob/master/templates/returnExports.js
; (function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    factory(exports);
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], factory);
  } else {
    global = typeof globalThis !== 'undefined' ? globalThis : global || self;
    factory((global.Wxh16144 = {}));
  }
})(this, function (exports) {
  exports.github = 'https://github.com/wxh16144';
  exports.twitter = 'https://twitter.com/wxh16144';
  exports.x = 'https://x.com/wxh16144';
  exports.weibo = 'https://weibo.com/wxh16144';
  exports.zhihu = 'https://zhihu.com/people/wxh16144';
  exports.telegram = 'https://t.me/wxh16144';
  exports.blog = 'https://wxh16144.github.io';
  exports.email = 'mailto:wxh16144@qq.com';
  exports.dev = 'https://dev.to/wxh16144';
  exports.npm = 'https://npmjs.com/~wxh16144';
  exports.docker = 'https://hub.docker.com/u/wxh16144';
  exports.v2ex = 'https://v2ex.com/member/wxh16144';
  exports.wakatime = 'https://wakatime.com/@wxh16144';
});