// Lib.js

//! moment.js
//! version : 2.11.2
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;

(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, function() {
  'use strict';

  var hookCallback;

  function utils_hooks__hooks() {
    return hookCallback.apply(null, arguments);
  }

  // This is done to register the method called with moment()
  // without creating circular dependencies.
  function setHookCallback(callback) {
    hookCallback = callback;
  }

  function isArray(input) {
    return Object.prototype.toString.call(input) === '[object Array]';
  }

  function isDate(input) {
    return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
  }

  function map(arr, fn) {
    var res = [],
      i;
    for (i = 0; i < arr.length; ++i) {
      res.push(fn(arr[i], i));
    }
    return res;
  }

  function hasOwnProp(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
  }

  function extend(a, b) {
    for (var i in b) {
      if (hasOwnProp(b, i)) {
        a[i] = b[i];
      }
    }

    if (hasOwnProp(b, 'toString')) {
      a.toString = b.toString;
    }

    if (hasOwnProp(b, 'valueOf')) {
      a.valueOf = b.valueOf;
    }

    return a;
  }

  function create_utc__createUTC(input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, true).utc();
  }

  function defaultParsingFlags() {
    // We need to deep clone this object.
    return {
      empty: false,
      unusedTokens: [],
      unusedInput: [],
      overflow: -2,
      charsLeftOver: 0,
      nullInput: false,
      invalidMonth: null,
      invalidFormat: false,
      userInvalidated: false,
      iso: false
    };
  }

  function getParsingFlags(m) {
    if (m._pf == null) {
      m._pf = defaultParsingFlags();
    }
    return m._pf;
  }

  function valid__isValid(m) {
    if (m._isValid == null) {
      var flags = getParsingFlags(m);
      m._isValid = !isNaN(m._d.getTime()) &&
        flags.overflow < 0 &&
        !flags.empty &&
        !flags.invalidMonth &&
        !flags.invalidWeekday &&
        !flags.nullInput &&
        !flags.invalidFormat &&
        !flags.userInvalidated;

      if (m._strict) {
        m._isValid = m._isValid &&
          flags.charsLeftOver === 0 &&
          flags.unusedTokens.length === 0 &&
          flags.bigHour === undefined;
      }
    }
    return m._isValid;
  }

  function valid__createInvalid(flags) {
    var m = create_utc__createUTC(NaN);
    if (flags != null) {
      extend(getParsingFlags(m), flags);
    } else {
      getParsingFlags(m).userInvalidated = true;
    }

    return m;
  }

  function isUndefined(input) {
    return input === void 0;
  }

  // Plugins that add properties should also add the key here (null value),
  // so we can properly clone ourselves.
  var momentProperties = utils_hooks__hooks.momentProperties = [];

  function copyConfig(to, from) {
    var i, prop, val;

    if (!isUndefined(from._isAMomentObject)) {
      to._isAMomentObject = from._isAMomentObject;
    }
    if (!isUndefined(from._i)) {
      to._i = from._i;
    }
    if (!isUndefined(from._f)) {
      to._f = from._f;
    }
    if (!isUndefined(from._l)) {
      to._l = from._l;
    }
    if (!isUndefined(from._strict)) {
      to._strict = from._strict;
    }
    if (!isUndefined(from._tzm)) {
      to._tzm = from._tzm;
    }
    if (!isUndefined(from._isUTC)) {
      to._isUTC = from._isUTC;
    }
    if (!isUndefined(from._offset)) {
      to._offset = from._offset;
    }
    if (!isUndefined(from._pf)) {
      to._pf = getParsingFlags(from);
    }
    if (!isUndefined(from._locale)) {
      to._locale = from._locale;
    }

    if (momentProperties.length > 0) {
      for (i in momentProperties) {
        prop = momentProperties[i];
        val = from[prop];
        if (!isUndefined(val)) {
          to[prop] = val;
        }
      }
    }

    return to;
  }

  var updateInProgress = false;

  // Moment prototype object
  function Moment(config) {
    copyConfig(this, config);
    this._d = new Date(config._d != null ? config._d.getTime() : NaN);
    // Prevent infinite loop in case updateOffset creates new moment
    // objects.
    if (updateInProgress === false) {
      updateInProgress = true;
      utils_hooks__hooks.updateOffset(this);
      updateInProgress = false;
    }
  }

  function isMoment(obj) {
    return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
  }

  function absFloor(number) {
    if (number < 0) {
      return Math.ceil(number);
    } else {
      return Math.floor(number);
    }
  }

  function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion,
      value = 0;

    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
      value = absFloor(coercedNumber);
    }

    return value;
  }

  // compare two arrays, return the number of differences
  function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length),
      lengthDiff = Math.abs(array1.length - array2.length),
      diffs = 0,
      i;
    for (i = 0; i < len; i++) {
      if ((dontConvert && array1[i] !== array2[i]) ||
        (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
        diffs++;
      }
    }
    return diffs + lengthDiff;
  }

  function Locale() {}

  // internal storage for locale config files
  var locales = {};
  var globalLocale;

  function normalizeLocale(key) {
    return key ? key.toLowerCase().replace('_', '-') : key;
  }

  // pick the locale from the array
  // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
  // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
  function chooseLocale(names) {
    var i = 0,
      j, next, locale, split;

    while (i < names.length) {
      split = normalizeLocale(names[i]).split('-');
      j = split.length;
      next = normalizeLocale(names[i + 1]);
      next = next ? next.split('-') : null;
      while (j > 0) {
        locale = loadLocale(split.slice(0, j).join('-'));
        if (locale) {
          return locale;
        }
        if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
          //the next array item is better than a shallower substring of this one
          break;
        }
        j--;
      }
      i++;
    }
    return null;
  }

  function loadLocale(name) {
    var oldLocale = null;
    // TODO: Find a better way to register and load all the locales in Node
    if (!locales[name] && (typeof module !== 'undefined') &&
      module && module.exports) {
      try {
        oldLocale = globalLocale._abbr;
        require('./locale/' + name);
        // because defineLocale currently also sets the global locale, we
        // want to undo that for lazy loaded locales
        locale_locales__getSetGlobalLocale(oldLocale);
      } catch (e) {}
    }
    return locales[name];
  }

  // This function will load locale and then set the global locale.  If
  // no arguments are passed in, it will simply return the current global
  // locale key.
  function locale_locales__getSetGlobalLocale(key, values) {
    var data;
    if (key) {
      if (isUndefined(values)) {
        data = locale_locales__getLocale(key);
      } else {
        data = defineLocale(key, values);
      }

      if (data) {
        // moment.duration._locale = moment._locale = data;
        globalLocale = data;
      }
    }

    return globalLocale._abbr;
  }

  function defineLocale(name, values) {
    if (values !== null) {
      values.abbr = name;
      locales[name] = locales[name] || new Locale();
      locales[name].set(values);

      // backwards compat for now: also set the locale
      locale_locales__getSetGlobalLocale(name);

      return locales[name];
    } else {
      // useful for testing
      delete locales[name];
      return null;
    }
  }

  // returns locale data
  function locale_locales__getLocale(key) {
    var locale;

    if (key && key._locale && key._locale._abbr) {
      key = key._locale._abbr;
    }

    if (!key) {
      return globalLocale;
    }

    if (!isArray(key)) {
      //short-circuit everything else
      locale = loadLocale(key);
      if (locale) {
        return locale;
      }
      key = [key];
    }

    return chooseLocale(key);
  }

  var aliases = {};

  function addUnitAlias(unit, shorthand) {
    var lowerCase = unit.toLowerCase();
    aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
  }

  function normalizeUnits(units) {
    return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
  }

  function normalizeObjectUnits(inputObject) {
    var normalizedInput = {},
      normalizedProp,
      prop;

    for (prop in inputObject) {
      if (hasOwnProp(inputObject, prop)) {
        normalizedProp = normalizeUnits(prop);
        if (normalizedProp) {
          normalizedInput[normalizedProp] = inputObject[prop];
        }
      }
    }

    return normalizedInput;
  }

  function isFunction(input) {
    return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
  }

  function makeGetSet(unit, keepTime) {
    return function(value) {
      if (value != null) {
        get_set__set(this, unit, value);
        utils_hooks__hooks.updateOffset(this, keepTime);
        return this;
      } else {
        return get_set__get(this, unit);
      }
    };
  }

  function get_set__get(mom, unit) {
    return mom.isValid() ?
      mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
  }

  function get_set__set(mom, unit, value) {
    if (mom.isValid()) {
      mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
    }
  }

  // MOMENTS

  function getSet(units, value) {
    var unit;
    if (typeof units === 'object') {
      for (unit in units) {
        this.set(unit, units[unit]);
      }
    } else {
      units = normalizeUnits(units);
      if (isFunction(this[units])) {
        return this[units](value);
      }
    }
    return this;
  }

  function zeroFill(number, targetLength, forceSign) {
    var absNumber = '' + Math.abs(number),
      zerosToFill = targetLength - absNumber.length,
      sign = number >= 0;
    return (sign ? (forceSign ? '+' : '') : '-') +
      Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
  }

  var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

  var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

  var formatFunctions = {};

  var formatTokenFunctions = {};

  // token:    'M'
  // padded:   ['MM', 2]
  // ordinal:  'Mo'
  // callback: function () { this.month() + 1 }
  function addFormatToken(token, padded, ordinal, callback) {
    var func = callback;
    if (typeof callback === 'string') {
      func = function() {
        return this[callback]();
      };
    }
    if (token) {
      formatTokenFunctions[token] = func;
    }
    if (padded) {
      formatTokenFunctions[padded[0]] = function() {
        return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
      };
    }
    if (ordinal) {
      formatTokenFunctions[ordinal] = function() {
        return this.localeData().ordinal(func.apply(this, arguments), token);
      };
    }
  }

  function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
      return input.replace(/^\[|\]$/g, '');
    }
    return input.replace(/\\/g, '');
  }

  function makeFormatFunction(format) {
    var array = format.match(formattingTokens),
      i, length;

    for (i = 0, length = array.length; i < length; i++) {
      if (formatTokenFunctions[array[i]]) {
        array[i] = formatTokenFunctions[array[i]];
      } else {
        array[i] = removeFormattingTokens(array[i]);
      }
    }

    return function(mom) {
      var output = '';
      for (i = 0; i < length; i++) {
        output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
      }
      return output;
    };
  }

  // format date using native date object
  function formatMoment(m, format) {
    if (!m.isValid()) {
      return m.localeData().invalidDate();
    }

    format = expandFormat(format, m.localeData());
    formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

    return formatFunctions[format](m);
  }

  function expandFormat(format, locale) {
    var i = 5;

    function replaceLongDateFormatTokens(input) {
      return locale.longDateFormat(input) || input;
    }

    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
      format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
      localFormattingTokens.lastIndex = 0;
      i -= 1;
    }

    return format;
  }

  var match1 = /\d/; //       0 - 9
  var match2 = /\d\d/; //      00 - 99
  var match3 = /\d{3}/; //     000 - 999
  var match4 = /\d{4}/; //    0000 - 9999
  var match6 = /[+-]?\d{6}/; // -999999 - 999999
  var match1to2 = /\d\d?/; //       0 - 99
  var match3to4 = /\d\d\d\d?/; //     999 - 9999
  var match5to6 = /\d\d\d\d\d\d?/; //   99999 - 999999
  var match1to3 = /\d{1,3}/; //       0 - 999
  var match1to4 = /\d{1,4}/; //       0 - 9999
  var match1to6 = /[+-]?\d{1,6}/; // -999999 - 999999

  var matchUnsigned = /\d+/; //       0 - inf
  var matchSigned = /[+-]?\d+/; //    -inf - inf

  var matchOffset = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
  var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

  var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

  // any word (or two) characters or numbers including two/three word month in arabic.
  // includes scottish gaelic two word and hyphenated months
  var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


  var regexes = {};

  function addRegexToken(token, regex, strictRegex) {
    regexes[token] = isFunction(regex) ? regex : function(isStrict, localeData) {
      return (isStrict && strictRegex) ? strictRegex : regex;
    };
  }

  function getParseRegexForToken(token, config) {
    if (!hasOwnProp(regexes, token)) {
      return new RegExp(unescapeFormat(token));
    }

    return regexes[token](config._strict, config._locale);
  }

  // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
  function unescapeFormat(s) {
    return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function(matched, p1, p2, p3, p4) {
      return p1 || p2 || p3 || p4;
    }));
  }

  function regexEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  var tokens = {};

  function addParseToken(token, callback) {
    var i, func = callback;
    if (typeof token === 'string') {
      token = [token];
    }
    if (typeof callback === 'number') {
      func = function(input, array) {
        array[callback] = toInt(input);
      };
    }
    for (i = 0; i < token.length; i++) {
      tokens[token[i]] = func;
    }
  }

  function addWeekParseToken(token, callback) {
    addParseToken(token, function(input, array, config, token) {
      config._w = config._w || {};
      callback(input, config._w, config, token);
    });
  }

  function addTimeToArrayFromToken(token, input, config) {
    if (input != null && hasOwnProp(tokens, token)) {
      tokens[token](input, config._a, config, token);
    }
  }

  var YEAR = 0;
  var MONTH = 1;
  var DATE = 2;
  var HOUR = 3;
  var MINUTE = 4;
  var SECOND = 5;
  var MILLISECOND = 6;
  var WEEK = 7;
  var WEEKDAY = 8;

  function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  }

  // FORMATTING

  addFormatToken('M', ['MM', 2], 'Mo', function() {
    return this.month() + 1;
  });

  addFormatToken('MMM', 0, 0, function(format) {
    return this.localeData().monthsShort(this, format);
  });

  addFormatToken('MMMM', 0, 0, function(format) {
    return this.localeData().months(this, format);
  });

  // ALIASES

  addUnitAlias('month', 'M');

  // PARSING

  addRegexToken('M', match1to2);
  addRegexToken('MM', match1to2, match2);
  addRegexToken('MMM', function(isStrict, locale) {
    return locale.monthsShortRegex(isStrict);
  });
  addRegexToken('MMMM', function(isStrict, locale) {
    return locale.monthsRegex(isStrict);
  });

  addParseToken(['M', 'MM'], function(input, array) {
    array[MONTH] = toInt(input) - 1;
  });

  addParseToken(['MMM', 'MMMM'], function(input, array, config, token) {
    var month = config._locale.monthsParse(input, token, config._strict);
    // if we didn't find a month name, mark the date as invalid.
    if (month != null) {
      array[MONTH] = month;
    } else {
      getParsingFlags(config).invalidMonth = input;
    }
  });

  // LOCALES

  var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/;
  var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');

  function localeMonths(m, format) {
    return isArray(this._months) ? this._months[m.month()] :
      this._months[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
  }

  var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');

  function localeMonthsShort(m, format) {
    return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
      this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
  }

  function localeMonthsParse(monthName, format, strict) {
    var i, mom, regex;

    if (!this._monthsParse) {
      this._monthsParse = [];
      this._longMonthsParse = [];
      this._shortMonthsParse = [];
    }

    for (i = 0; i < 12; i++) {
      // make the regex if we don't have it already
      mom = create_utc__createUTC([2000, i]);
      if (strict && !this._longMonthsParse[i]) {
        this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
        this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
      }
      if (!strict && !this._monthsParse[i]) {
        regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
        this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
      }
      // test the regex
      if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
        return i;
      } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
        return i;
      } else if (!strict && this._monthsParse[i].test(monthName)) {
        return i;
      }
    }
  }

  // MOMENTS

  function setMonth(mom, value) {
    var dayOfMonth;

    if (!mom.isValid()) {
      // No op
      return mom;
    }

    // TODO: Move this out of here!
    if (typeof value === 'string') {
      value = mom.localeData().monthsParse(value);
      // TODO: Another silent failure?
      if (typeof value !== 'number') {
        return mom;
      }
    }

    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
    mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
    return mom;
  }

  function getSetMonth(value) {
    if (value != null) {
      setMonth(this, value);
      utils_hooks__hooks.updateOffset(this, true);
      return this;
    } else {
      return get_set__get(this, 'Month');
    }
  }

  function getDaysInMonth() {
    return daysInMonth(this.year(), this.month());
  }

  var defaultMonthsShortRegex = matchWord;

  function monthsShortRegex(isStrict) {
    if (this._monthsParseExact) {
      if (!hasOwnProp(this, '_monthsRegex')) {
        computeMonthsParse.call(this);
      }
      if (isStrict) {
        return this._monthsShortStrictRegex;
      } else {
        return this._monthsShortRegex;
      }
    } else {
      return this._monthsShortStrictRegex && isStrict ?
        this._monthsShortStrictRegex : this._monthsShortRegex;
    }
  }

  var defaultMonthsRegex = matchWord;

  function monthsRegex(isStrict) {
    if (this._monthsParseExact) {
      if (!hasOwnProp(this, '_monthsRegex')) {
        computeMonthsParse.call(this);
      }
      if (isStrict) {
        return this._monthsStrictRegex;
      } else {
        return this._monthsRegex;
      }
    } else {
      return this._monthsStrictRegex && isStrict ?
        this._monthsStrictRegex : this._monthsRegex;
    }
  }

  function computeMonthsParse() {
    function cmpLenRev(a, b) {
      return b.length - a.length;
    }

    var shortPieces = [],
      longPieces = [],
      mixedPieces = [],
      i, mom;
    for (i = 0; i < 12; i++) {
      // make the regex if we don't have it already
      mom = create_utc__createUTC([2000, i]);
      shortPieces.push(this.monthsShort(mom, ''));
      longPieces.push(this.months(mom, ''));
      mixedPieces.push(this.months(mom, ''));
      mixedPieces.push(this.monthsShort(mom, ''));
    }
    // Sorting makes sure if one month (or abbr) is a prefix of another it
    // will match the longer piece.
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 12; i++) {
      shortPieces[i] = regexEscape(shortPieces[i]);
      longPieces[i] = regexEscape(longPieces[i]);
      mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._monthsShortRegex = this._monthsRegex;
    this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')$', 'i');
    this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')$', 'i');
  }

  function checkOverflow(m) {
    var overflow;
    var a = m._a;

    if (a && getParsingFlags(m).overflow === -2) {
      overflow =
        a[MONTH] < 0 || a[MONTH] > 11 ? MONTH :
        a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
        a[HOUR] < 0 || a[HOUR] > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
        a[MINUTE] < 0 || a[MINUTE] > 59 ? MINUTE :
        a[SECOND] < 0 || a[SECOND] > 59 ? SECOND :
        a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
        -1;

      if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
        overflow = DATE;
      }
      if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
        overflow = WEEK;
      }
      if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
        overflow = WEEKDAY;
      }

      getParsingFlags(m).overflow = overflow;
    }

    return m;
  }

  function warn(msg) {
    if (utils_hooks__hooks.suppressDeprecationWarnings === false &&
      (typeof console !== 'undefined') && console.warn) {
      console.warn('Deprecation warning: ' + msg);
    }
  }

  function deprecate(msg, fn) {
    var firstTime = true;

    return extend(function() {
      if (firstTime) {
        warn(msg + '\nArguments: ' + Array.prototype.slice.call(arguments).join(', ') + '\n' + (new Error()).stack);
        firstTime = false;
      }
      return fn.apply(this, arguments);
    }, fn);
  }

  var deprecations = {};

  function deprecateSimple(name, msg) {
    if (!deprecations[name]) {
      warn(msg);
      deprecations[name] = true;
    }
  }

  utils_hooks__hooks.suppressDeprecationWarnings = false;

  // iso 8601 regex
  // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
  var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;
  var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;

  var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

  var isoDates = [
    ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
    ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
    ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
    ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
    ['YYYY-DDD', /\d{4}-\d{3}/],
    ['YYYY-MM', /\d{4}-\d\d/, false],
    ['YYYYYYMMDD', /[+-]\d{10}/],
    ['YYYYMMDD', /\d{8}/],
    // YYYYMM is NOT allowed by the standard
    ['GGGG[W]WWE', /\d{4}W\d{3}/],
    ['GGGG[W]WW', /\d{4}W\d{2}/, false],
    ['YYYYDDD', /\d{7}/]
  ];

  // iso time formats and regexes
  var isoTimes = [
    ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
    ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
    ['HH:mm:ss', /\d\d:\d\d:\d\d/],
    ['HH:mm', /\d\d:\d\d/],
    ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
    ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
    ['HHmmss', /\d\d\d\d\d\d/],
    ['HHmm', /\d\d\d\d/],
    ['HH', /\d\d/]
  ];

  var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

  // date from iso format
  function configFromISO(config) {
    var i, l,
      string = config._i,
      match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
      allowTime, dateFormat, timeFormat, tzFormat;

    if (match) {
      getParsingFlags(config).iso = true;

      for (i = 0, l = isoDates.length; i < l; i++) {
        if (isoDates[i][1].exec(match[1])) {
          dateFormat = isoDates[i][0];
          allowTime = isoDates[i][2] !== false;
          break;
        }
      }
      if (dateFormat == null) {
        config._isValid = false;
        return;
      }
      if (match[3]) {
        for (i = 0, l = isoTimes.length; i < l; i++) {
          if (isoTimes[i][1].exec(match[3])) {
            // match[2] should be 'T' or space
            timeFormat = (match[2] || ' ') + isoTimes[i][0];
            break;
          }
        }
        if (timeFormat == null) {
          config._isValid = false;
          return;
        }
      }
      if (!allowTime && timeFormat != null) {
        config._isValid = false;
        return;
      }
      if (match[4]) {
        if (tzRegex.exec(match[4])) {
          tzFormat = 'Z';
        } else {
          config._isValid = false;
          return;
        }
      }
      config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
      configFromStringAndFormat(config);
    } else {
      config._isValid = false;
    }
  }

  // date from iso format or fallback
  function configFromString(config) {
    var matched = aspNetJsonRegex.exec(config._i);

    if (matched !== null) {
      config._d = new Date(+matched[1]);
      return;
    }

    configFromISO(config);
    if (config._isValid === false) {
      delete config._isValid;
      utils_hooks__hooks.createFromInputFallback(config);
    }
  }

  utils_hooks__hooks.createFromInputFallback = deprecate(
    'moment construction falls back to js Date. This is ' +
    'discouraged and will be removed in upcoming major ' +
    'release. Please refer to ' +
    'https://github.com/moment/moment/issues/1407 for more info.',
    function(config) {
      config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
    }
  );

  function createDate(y, m, d, h, M, s, ms) {
    //can't just apply() to create a date:
    //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
    var date = new Date(y, m, d, h, M, s, ms);

    //the date constructor remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
      date.setFullYear(y);
    }
    return date;
  }

  function createUTCDate(y) {
    var date = new Date(Date.UTC.apply(null, arguments));

    //the Date.UTC function remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
      date.setUTCFullYear(y);
    }
    return date;
  }

  // FORMATTING

  addFormatToken('Y', 0, 0, function() {
    var y = this.year();
    return y <= 9999 ? '' + y : '+' + y;
  });

  addFormatToken(0, ['YY', 2], 0, function() {
    return this.year() % 100;
  });

  addFormatToken(0, ['YYYY', 4], 0, 'year');
  addFormatToken(0, ['YYYYY', 5], 0, 'year');
  addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

  // ALIASES

  addUnitAlias('year', 'y');

  // PARSING

  addRegexToken('Y', matchSigned);
  addRegexToken('YY', match1to2, match2);
  addRegexToken('YYYY', match1to4, match4);
  addRegexToken('YYYYY', match1to6, match6);
  addRegexToken('YYYYYY', match1to6, match6);

  addParseToken(['YYYYY', 'YYYYYY'], YEAR);
  addParseToken('YYYY', function(input, array) {
    array[YEAR] = input.length === 2 ? utils_hooks__hooks.parseTwoDigitYear(input) : toInt(input);
  });
  addParseToken('YY', function(input, array) {
    array[YEAR] = utils_hooks__hooks.parseTwoDigitYear(input);
  });
  addParseToken('Y', function(input, array) {
    array[YEAR] = parseInt(input, 10);
  });

  // HELPERS

  function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  // HOOKS

  utils_hooks__hooks.parseTwoDigitYear = function(input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
  };

  // MOMENTS

  var getSetYear = makeGetSet('FullYear', false);

  function getIsLeapYear() {
    return isLeapYear(this.year());
  }

  // start-of-first-week - start-of-year
  function firstWeekOffset(year, dow, doy) {
    var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
      fwd = 7 + dow - doy,
      // first-week day local weekday -- which local weekday is fwd
      fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

    return -fwdlw + fwd - 1;
  }

  //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
  function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
    var localWeekday = (7 + weekday - dow) % 7,
      weekOffset = firstWeekOffset(year, dow, doy),
      dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
      resYear, resDayOfYear;

    if (dayOfYear <= 0) {
      resYear = year - 1;
      resDayOfYear = daysInYear(resYear) + dayOfYear;
    } else if (dayOfYear > daysInYear(year)) {
      resYear = year + 1;
      resDayOfYear = dayOfYear - daysInYear(year);
    } else {
      resYear = year;
      resDayOfYear = dayOfYear;
    }

    return {
      year: resYear,
      dayOfYear: resDayOfYear
    };
  }

  function weekOfYear(mom, dow, doy) {
    var weekOffset = firstWeekOffset(mom.year(), dow, doy),
      week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
      resWeek, resYear;

    if (week < 1) {
      resYear = mom.year() - 1;
      resWeek = week + weeksInYear(resYear, dow, doy);
    } else if (week > weeksInYear(mom.year(), dow, doy)) {
      resWeek = week - weeksInYear(mom.year(), dow, doy);
      resYear = mom.year() + 1;
    } else {
      resYear = mom.year();
      resWeek = week;
    }

    return {
      week: resWeek,
      year: resYear
    };
  }

  function weeksInYear(year, dow, doy) {
    var weekOffset = firstWeekOffset(year, dow, doy),
      weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
    return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
  }

  // Pick the first defined of two or three arguments.
  function defaults(a, b, c) {
    if (a != null) {
      return a;
    }
    if (b != null) {
      return b;
    }
    return c;
  }

  function currentDateArray(config) {
    // hooks is actually the exported moment object
    var nowValue = new Date(utils_hooks__hooks.now());
    if (config._useUTC) {
      return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
    }
    return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
  }

  // convert an array to a date.
  // the array should mirror the parameters below
  // note: all values past the year are optional and will default to the lowest possible value.
  // [year, month, day , hour, minute, second, millisecond]
  function configFromArray(config) {
    var i, date, input = [],
      currentDate, yearToUse;

    if (config._d) {
      return;
    }

    currentDate = currentDateArray(config);

    //compute day of the year from weeks and weekdays
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
      dayOfYearFromWeekInfo(config);
    }

    //if the day of the year is set, figure out what it is
    if (config._dayOfYear) {
      yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

      if (config._dayOfYear > daysInYear(yearToUse)) {
        getParsingFlags(config)._overflowDayOfYear = true;
      }

      date = createUTCDate(yearToUse, 0, config._dayOfYear);
      config._a[MONTH] = date.getUTCMonth();
      config._a[DATE] = date.getUTCDate();
    }

    // Default to current date.
    // * if no year, month, day of month are given, default to today
    // * if day of month is given, default month and year
    // * if month is given, default only year
    // * if year is given, don't default anything
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
      config._a[i] = input[i] = currentDate[i];
    }

    // Zero out whatever was not defaulted, including time
    for (; i < 7; i++) {
      config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
    }

    // Check for 24:00:00.000
    if (config._a[HOUR] === 24 &&
      config._a[MINUTE] === 0 &&
      config._a[SECOND] === 0 &&
      config._a[MILLISECOND] === 0) {
      config._nextDay = true;
      config._a[HOUR] = 0;
    }

    config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
    // Apply timezone offset from input. The actual utcOffset can be changed
    // with parseZone.
    if (config._tzm != null) {
      config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    }

    if (config._nextDay) {
      config._a[HOUR] = 24;
    }
  }

  function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

    w = config._w;
    if (w.GG != null || w.W != null || w.E != null) {
      dow = 1;
      doy = 4;

      // TODO: We need to take the current isoWeekYear, but that depends on
      // how we interpret now (local, utc, fixed offset). So create
      // a now version of current config (take local/utc/offset flags, and
      // create now).
      weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(local__createLocal(), 1, 4).year);
      week = defaults(w.W, 1);
      weekday = defaults(w.E, 1);
      if (weekday < 1 || weekday > 7) {
        weekdayOverflow = true;
      }
    } else {
      dow = config._locale._week.dow;
      doy = config._locale._week.doy;

      weekYear = defaults(w.gg, config._a[YEAR], weekOfYear(local__createLocal(), dow, doy).year);
      week = defaults(w.w, 1);

      if (w.d != null) {
        // weekday -- low day numbers are considered next week
        weekday = w.d;
        if (weekday < 0 || weekday > 6) {
          weekdayOverflow = true;
        }
      } else if (w.e != null) {
        // local weekday -- counting starts from begining of week
        weekday = w.e + dow;
        if (w.e < 0 || w.e > 6) {
          weekdayOverflow = true;
        }
      } else {
        // default to begining of week
        weekday = dow;
      }
    }
    if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
      getParsingFlags(config)._overflowWeeks = true;
    } else if (weekdayOverflow != null) {
      getParsingFlags(config)._overflowWeekday = true;
    } else {
      temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
      config._a[YEAR] = temp.year;
      config._dayOfYear = temp.dayOfYear;
    }
  }

  // constant that refers to the ISO standard
  utils_hooks__hooks.ISO_8601 = function() {};

  // date from string and format string
  function configFromStringAndFormat(config) {
    // TODO: Move this to another part of the creation flow to prevent circular deps
    if (config._f === utils_hooks__hooks.ISO_8601) {
      configFromISO(config);
      return;
    }

    config._a = [];
    getParsingFlags(config).empty = true;

    // This array is used to make a Date, either with `new Date` or `Date.UTC`
    var string = '' + config._i,
      i, parsedInput, tokens, token, skipped,
      stringLength = string.length,
      totalParsedInputLength = 0;

    tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];
      parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
      // console.log('token', token, 'parsedInput', parsedInput,
      //         'regex', getParseRegexForToken(token, config));
      if (parsedInput) {
        skipped = string.substr(0, string.indexOf(parsedInput));
        if (skipped.length > 0) {
          getParsingFlags(config).unusedInput.push(skipped);
        }
        string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
        totalParsedInputLength += parsedInput.length;
      }
      // don't parse if it's not a known token
      if (formatTokenFunctions[token]) {
        if (parsedInput) {
          getParsingFlags(config).empty = false;
        } else {
          getParsingFlags(config).unusedTokens.push(token);
        }
        addTimeToArrayFromToken(token, parsedInput, config);
      } else if (config._strict && !parsedInput) {
        getParsingFlags(config).unusedTokens.push(token);
      }
    }

    // add remaining unparsed input length to the string
    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
      getParsingFlags(config).unusedInput.push(string);
    }

    // clear _12h flag if hour is <= 12
    if (getParsingFlags(config).bigHour === true &&
      config._a[HOUR] <= 12 &&
      config._a[HOUR] > 0) {
      getParsingFlags(config).bigHour = undefined;
    }
    // handle meridiem
    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

    configFromArray(config);
    checkOverflow(config);
  }


  function meridiemFixWrap(locale, hour, meridiem) {
    var isPm;

    if (meridiem == null) {
      // nothing to do
      return hour;
    }
    if (locale.meridiemHour != null) {
      return locale.meridiemHour(hour, meridiem);
    } else if (locale.isPM != null) {
      // Fallback
      isPm = locale.isPM(meridiem);
      if (isPm && hour < 12) {
        hour += 12;
      }
      if (!isPm && hour === 12) {
        hour = 0;
      }
      return hour;
    } else {
      // this is not supposed to happen
      return hour;
    }
  }

  // date from string and array of format strings
  function configFromStringAndArray(config) {
    var tempConfig,
      bestMoment,

      scoreToBeat,
      i,
      currentScore;

    if (config._f.length === 0) {
      getParsingFlags(config).invalidFormat = true;
      config._d = new Date(NaN);
      return;
    }

    for (i = 0; i < config._f.length; i++) {
      currentScore = 0;
      tempConfig = copyConfig({}, config);
      if (config._useUTC != null) {
        tempConfig._useUTC = config._useUTC;
      }
      tempConfig._f = config._f[i];
      configFromStringAndFormat(tempConfig);

      if (!valid__isValid(tempConfig)) {
        continue;
      }

      // if there is any input that was not parsed add a penalty for that format
      currentScore += getParsingFlags(tempConfig).charsLeftOver;

      //or tokens
      currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

      getParsingFlags(tempConfig).score = currentScore;

      if (scoreToBeat == null || currentScore < scoreToBeat) {
        scoreToBeat = currentScore;
        bestMoment = tempConfig;
      }
    }

    extend(config, bestMoment || tempConfig);
  }

  function configFromObject(config) {
    if (config._d) {
      return;
    }

    var i = normalizeObjectUnits(config._i);
    config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function(obj) {
      return obj && parseInt(obj, 10);
    });

    configFromArray(config);
  }

  function createFromConfig(config) {
    var res = new Moment(checkOverflow(prepareConfig(config)));
    if (res._nextDay) {
      // Adding is smart enough around DST
      res.add(1, 'd');
      res._nextDay = undefined;
    }

    return res;
  }

  function prepareConfig(config) {
    var input = config._i,
      format = config._f;

    config._locale = config._locale || locale_locales__getLocale(config._l);

    if (input === null || (format === undefined && input === '')) {
      return valid__createInvalid({
        nullInput: true
      });
    }

    if (typeof input === 'string') {
      config._i = input = config._locale.preparse(input);
    }

    if (isMoment(input)) {
      return new Moment(checkOverflow(input));
    } else if (isArray(format)) {
      configFromStringAndArray(config);
    } else if (format) {
      configFromStringAndFormat(config);
    } else if (isDate(input)) {
      config._d = input;
    } else {
      configFromInput(config);
    }

    if (!valid__isValid(config)) {
      config._d = null;
    }

    return config;
  }

  function configFromInput(config) {
    var input = config._i;
    if (input === undefined) {
      config._d = new Date(utils_hooks__hooks.now());
    } else if (isDate(input)) {
      config._d = new Date(+input);
    } else if (typeof input === 'string') {
      configFromString(config);
    } else if (isArray(input)) {
      config._a = map(input.slice(0), function(obj) {
        return parseInt(obj, 10);
      });
      configFromArray(config);
    } else if (typeof(input) === 'object') {
      configFromObject(config);
    } else if (typeof(input) === 'number') {
      // from milliseconds
      config._d = new Date(input);
    } else {
      utils_hooks__hooks.createFromInputFallback(config);
    }
  }

  function createLocalOrUTC(input, format, locale, strict, isUTC) {
    var c = {};

    if (typeof(locale) === 'boolean') {
      strict = locale;
      locale = undefined;
    }
    // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423
    c._isAMomentObject = true;
    c._useUTC = c._isUTC = isUTC;
    c._l = locale;
    c._i = input;
    c._f = format;
    c._strict = strict;

    return createFromConfig(c);
  }

  function local__createLocal(input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, false);
  }

  var prototypeMin = deprecate(
    'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
    function() {
      var other = local__createLocal.apply(null, arguments);
      if (this.isValid() && other.isValid()) {
        return other < this ? this : other;
      } else {
        return valid__createInvalid();
      }
    }
  );

  var prototypeMax = deprecate(
    'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
    function() {
      var other = local__createLocal.apply(null, arguments);
      if (this.isValid() && other.isValid()) {
        return other > this ? this : other;
      } else {
        return valid__createInvalid();
      }
    }
  );

  // Pick a moment m from moments so that m[fn](other) is true for all
  // other. This relies on the function fn to be transitive.
  //
  // moments should either be an array of moment objects or an array, whose
  // first element is an array of moment objects.
  function pickBy(fn, moments) {
    var res, i;
    if (moments.length === 1 && isArray(moments[0])) {
      moments = moments[0];
    }
    if (!moments.length) {
      return local__createLocal();
    }
    res = moments[0];
    for (i = 1; i < moments.length; ++i) {
      if (!moments[i].isValid() || moments[i][fn](res)) {
        res = moments[i];
      }
    }
    return res;
  }

  // TODO: Use [].sort instead?
  function min() {
    var args = [].slice.call(arguments, 0);

    return pickBy('isBefore', args);
  }

  function max() {
    var args = [].slice.call(arguments, 0);

    return pickBy('isAfter', args);
  }

  var now = function() {
    return Date.now ? Date.now() : +(new Date());
  };

  function Duration(duration) {
    var normalizedInput = normalizeObjectUnits(duration),
      years = normalizedInput.year || 0,
      quarters = normalizedInput.quarter || 0,
      months = normalizedInput.month || 0,
      weeks = normalizedInput.week || 0,
      days = normalizedInput.day || 0,
      hours = normalizedInput.hour || 0,
      minutes = normalizedInput.minute || 0,
      seconds = normalizedInput.second || 0,
      milliseconds = normalizedInput.millisecond || 0;

    // representation for dateAddRemove
    this._milliseconds = +milliseconds +
      seconds * 1e3 + // 1000
      minutes * 6e4 + // 1000 * 60
      hours * 36e5; // 1000 * 60 * 60
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately
    this._days = +days +
      weeks * 7;
    // It is impossible translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.
    this._months = +months +
      quarters * 3 +
      years * 12;

    this._data = {};

    this._locale = locale_locales__getLocale();

    this._bubble();
  }

  function isDuration(obj) {
    return obj instanceof Duration;
  }

  // FORMATTING

  function offset(token, separator) {
    addFormatToken(token, 0, 0, function() {
      var offset = this.utcOffset();
      var sign = '+';
      if (offset < 0) {
        offset = -offset;
        sign = '-';
      }
      return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
    });
  }

  offset('Z', ':');
  offset('ZZ', '');

  // PARSING

  addRegexToken('Z', matchShortOffset);
  addRegexToken('ZZ', matchShortOffset);
  addParseToken(['Z', 'ZZ'], function(input, array, config) {
    config._useUTC = true;
    config._tzm = offsetFromString(matchShortOffset, input);
  });

  // HELPERS

  // timezone chunker
  // '+10:00' > ['10',  '00']
  // '-1530'  > ['-15', '30']
  var chunkOffset = /([\+\-]|\d\d)/gi;

  function offsetFromString(matcher, string) {
    var matches = ((string || '').match(matcher) || []);
    var chunk = matches[matches.length - 1] || [];
    var parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
    var minutes = +(parts[1] * 60) + toInt(parts[2]);

    return parts[0] === '+' ? minutes : -minutes;
  }

  // Return a moment from input, that is local/utc/zone equivalent to model.
  function cloneWithOffset(input, model) {
    var res, diff;
    if (model._isUTC) {
      res = model.clone();
      diff = (isMoment(input) || isDate(input) ? +input : +local__createLocal(input)) - (+res);
      // Use low-level api, because this fn is low-level api.
      res._d.setTime(+res._d + diff);
      utils_hooks__hooks.updateOffset(res, false);
      return res;
    } else {
      return local__createLocal(input).local();
    }
  }

  function getDateOffset(m) {
    // On Firefox.24 Date#getTimezoneOffset returns a floating point.
    // https://github.com/moment/moment/pull/1871
    return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
  }

  // HOOKS

  // This function will be called whenever a moment is mutated.
  // It is intended to keep the offset in sync with the timezone.
  utils_hooks__hooks.updateOffset = function() {};

  // MOMENTS

  // keepLocalTime = true means only change the timezone, without
  // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
  // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
  // +0200, so we adjust the time as needed, to be valid.
  //
  // Keeping the time actually adds/subtracts (one hour)
  // from the actual represented time. That is why we call updateOffset
  // a second time. In case it wants us to change the offset again
  // _changeInProgress == true case, then we have to adjust, because
  // there is no such time in the given timezone.
  function getSetOffset(input, keepLocalTime) {
    var offset = this._offset || 0,
      localAdjust;
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    if (input != null) {
      if (typeof input === 'string') {
        input = offsetFromString(matchShortOffset, input);
      } else if (Math.abs(input) < 16) {
        input = input * 60;
      }
      if (!this._isUTC && keepLocalTime) {
        localAdjust = getDateOffset(this);
      }
      this._offset = input;
      this._isUTC = true;
      if (localAdjust != null) {
        this.add(localAdjust, 'm');
      }
      if (offset !== input) {
        if (!keepLocalTime || this._changeInProgress) {
          add_subtract__addSubtract(this, create__createDuration(input - offset, 'm'), 1, false);
        } else if (!this._changeInProgress) {
          this._changeInProgress = true;
          utils_hooks__hooks.updateOffset(this, true);
          this._changeInProgress = null;
        }
      }
      return this;
    } else {
      return this._isUTC ? offset : getDateOffset(this);
    }
  }

  function getSetZone(input, keepLocalTime) {
    if (input != null) {
      if (typeof input !== 'string') {
        input = -input;
      }

      this.utcOffset(input, keepLocalTime);

      return this;
    } else {
      return -this.utcOffset();
    }
  }

  function setOffsetToUTC(keepLocalTime) {
    return this.utcOffset(0, keepLocalTime);
  }

  function setOffsetToLocal(keepLocalTime) {
    if (this._isUTC) {
      this.utcOffset(0, keepLocalTime);
      this._isUTC = false;

      if (keepLocalTime) {
        this.subtract(getDateOffset(this), 'm');
      }
    }
    return this;
  }

  function setOffsetToParsedOffset() {
    if (this._tzm) {
      this.utcOffset(this._tzm);
    } else if (typeof this._i === 'string') {
      this.utcOffset(offsetFromString(matchOffset, this._i));
    }
    return this;
  }

  function hasAlignedHourOffset(input) {
    if (!this.isValid()) {
      return false;
    }
    input = input ? local__createLocal(input).utcOffset() : 0;

    return (this.utcOffset() - input) % 60 === 0;
  }

  function isDaylightSavingTime() {
    return (
      this.utcOffset() > this.clone().month(0).utcOffset() ||
      this.utcOffset() > this.clone().month(5).utcOffset()
    );
  }

  function isDaylightSavingTimeShifted() {
    if (!isUndefined(this._isDSTShifted)) {
      return this._isDSTShifted;
    }

    var c = {};

    copyConfig(c, this);
    c = prepareConfig(c);

    if (c._a) {
      var other = c._isUTC ? create_utc__createUTC(c._a) : local__createLocal(c._a);
      this._isDSTShifted = this.isValid() &&
        compareArrays(c._a, other.toArray()) > 0;
    } else {
      this._isDSTShifted = false;
    }

    return this._isDSTShifted;
  }

  function isLocal() {
    return this.isValid() ? !this._isUTC : false;
  }

  function isUtcOffset() {
    return this.isValid() ? this._isUTC : false;
  }

  function isUtc() {
    return this.isValid() ? this._isUTC && this._offset === 0 : false;
  }

  // ASP.NET json date format regex
  var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?\d*)?$/;

  // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
  // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
  var isoRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/;

  function create__createDuration(input, key) {
    var duration = input,
      // matching against regexp is expensive, do it on demand
      match = null,
      sign,
      ret,
      diffRes;

    if (isDuration(input)) {
      duration = {
        ms: input._milliseconds,
        d: input._days,
        M: input._months
      };
    } else if (typeof input === 'number') {
      duration = {};
      if (key) {
        duration[key] = input;
      } else {
        duration.milliseconds = input;
      }
    } else if (!!(match = aspNetRegex.exec(input))) {
      sign = (match[1] === '-') ? -1 : 1;
      duration = {
        y: 0,
        d: toInt(match[DATE]) * sign,
        h: toInt(match[HOUR]) * sign,
        m: toInt(match[MINUTE]) * sign,
        s: toInt(match[SECOND]) * sign,
        ms: toInt(match[MILLISECOND]) * sign
      };
    } else if (!!(match = isoRegex.exec(input))) {
      sign = (match[1] === '-') ? -1 : 1;
      duration = {
        y: parseIso(match[2], sign),
        M: parseIso(match[3], sign),
        d: parseIso(match[4], sign),
        h: parseIso(match[5], sign),
        m: parseIso(match[6], sign),
        s: parseIso(match[7], sign),
        w: parseIso(match[8], sign)
      };
    } else if (duration == null) { // checks for null or undefined
      duration = {};
    } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
      diffRes = momentsDifference(local__createLocal(duration.from), local__createLocal(duration.to));

      duration = {};
      duration.ms = diffRes.milliseconds;
      duration.M = diffRes.months;
    }

    ret = new Duration(duration);

    if (isDuration(input) && hasOwnProp(input, '_locale')) {
      ret._locale = input._locale;
    }

    return ret;
  }

  create__createDuration.fn = Duration.prototype;

  function parseIso(inp, sign) {
    // We'd normally use ~~inp for this, but unfortunately it also
    // converts floats to ints.
    // inp may be undefined, so careful calling replace on it.
    var res = inp && parseFloat(inp.replace(',', '.'));
    // apply sign while we're at it
    return (isNaN(res) ? 0 : res) * sign;
  }

  function positiveMomentsDifference(base, other) {
    var res = {
      milliseconds: 0,
      months: 0
    };

    res.months = other.month() - base.month() +
      (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, 'M').isAfter(other)) {
      --res.months;
    }

    res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

    return res;
  }

  function momentsDifference(base, other) {
    var res;
    if (!(base.isValid() && other.isValid())) {
      return {
        milliseconds: 0,
        months: 0
      };
    }

    other = cloneWithOffset(other, base);
    if (base.isBefore(other)) {
      res = positiveMomentsDifference(base, other);
    } else {
      res = positiveMomentsDifference(other, base);
      res.milliseconds = -res.milliseconds;
      res.months = -res.months;
    }

    return res;
  }

  // TODO: remove 'name' arg after deprecation is removed
  function createAdder(direction, name) {
    return function(val, period) {
      var dur, tmp;
      //invert the arguments, but complain about it
      if (period !== null && !isNaN(+period)) {
        deprecateSimple(name, 'moment().' + name + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
        tmp = val;
        val = period;
        period = tmp;
      }

      val = typeof val === 'string' ? +val : val;
      dur = create__createDuration(val, period);
      add_subtract__addSubtract(this, dur, direction);
      return this;
    };
  }

  function add_subtract__addSubtract(mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds,
      days = duration._days,
      months = duration._months;

    if (!mom.isValid()) {
      // No op
      return;
    }

    updateOffset = updateOffset == null ? true : updateOffset;

    if (milliseconds) {
      mom._d.setTime(+mom._d + milliseconds * isAdding);
    }
    if (days) {
      get_set__set(mom, 'Date', get_set__get(mom, 'Date') + days * isAdding);
    }
    if (months) {
      setMonth(mom, get_set__get(mom, 'Month') + months * isAdding);
    }
    if (updateOffset) {
      utils_hooks__hooks.updateOffset(mom, days || months);
    }
  }

  var add_subtract__add = createAdder(1, 'add');
  var add_subtract__subtract = createAdder(-1, 'subtract');

  function moment_calendar__calendar(time, formats) {
    // We want to compare the start of today, vs this.
    // Getting start-of-today depends on whether we're local/utc/offset or not.
    var now = time || local__createLocal(),
      sod = cloneWithOffset(now, this).startOf('day'),
      diff = this.diff(sod, 'days', true),
      format = diff < -6 ? 'sameElse' :
      diff < -1 ? 'lastWeek' :
      diff < 0 ? 'lastDay' :
      diff < 1 ? 'sameDay' :
      diff < 2 ? 'nextDay' :
      diff < 7 ? 'nextWeek' : 'sameElse';

    var output = formats && (isFunction(formats[format]) ? formats[format]() : formats[format]);

    return this.format(output || this.localeData().calendar(format, this, local__createLocal(now)));
  }

  function clone() {
    return new Moment(this);
  }

  function isAfter(input, units) {
    var localInput = isMoment(input) ? input : local__createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
      return +this > +localInput;
    } else {
      return +localInput < +this.clone().startOf(units);
    }
  }

  function isBefore(input, units) {
    var localInput = isMoment(input) ? input : local__createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
      return +this < +localInput;
    } else {
      return +this.clone().endOf(units) < +localInput;
    }
  }

  function isBetween(from, to, units) {
    return this.isAfter(from, units) && this.isBefore(to, units);
  }

  function isSame(input, units) {
    var localInput = isMoment(input) ? input : local__createLocal(input),
      inputMs;
    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }
    units = normalizeUnits(units || 'millisecond');
    if (units === 'millisecond') {
      return +this === +localInput;
    } else {
      inputMs = +localInput;
      return +(this.clone().startOf(units)) <= inputMs && inputMs <= +(this.clone().endOf(units));
    }
  }

  function isSameOrAfter(input, units) {
    return this.isSame(input, units) || this.isAfter(input, units);
  }

  function isSameOrBefore(input, units) {
    return this.isSame(input, units) || this.isBefore(input, units);
  }

  function diff(input, units, asFloat) {
    var that,
      zoneDelta,
      delta, output;

    if (!this.isValid()) {
      return NaN;
    }

    that = cloneWithOffset(input, this);

    if (!that.isValid()) {
      return NaN;
    }

    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

    units = normalizeUnits(units);

    if (units === 'year' || units === 'month' || units === 'quarter') {
      output = monthDiff(this, that);
      if (units === 'quarter') {
        output = output / 3;
      } else if (units === 'year') {
        output = output / 12;
      }
    } else {
      delta = this - that;
      output = units === 'second' ? delta / 1e3 : // 1000
        units === 'minute' ? delta / 6e4 : // 1000 * 60
        units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
        units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
        units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
        delta;
    }
    return asFloat ? output : absFloor(output);
  }

  function monthDiff(a, b) {
    // difference in months
    var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
      // b is in (anchor - 1 month, anchor + 1 month)
      anchor = a.clone().add(wholeMonthDiff, 'months'),
      anchor2, adjust;

    if (b - anchor < 0) {
      anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
      // linear across the month
      adjust = (b - anchor) / (anchor - anchor2);
    } else {
      anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
      // linear across the month
      adjust = (b - anchor) / (anchor2 - anchor);
    }

    return -(wholeMonthDiff + adjust);
  }

  utils_hooks__hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';

  function toString() {
    return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
  }

  function moment_format__toISOString() {
    var m = this.clone().utc();
    if (0 < m.year() && m.year() <= 9999) {
      if (isFunction(Date.prototype.toISOString)) {
        // native implementation is ~50x faster, use it when we can
        return this.toDate().toISOString();
      } else {
        return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
      }
    } else {
      return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
    }
  }

  function format(inputString) {
    var output = formatMoment(this, inputString || utils_hooks__hooks.defaultFormat);
    return this.localeData().postformat(output);
  }

  function from(time, withoutSuffix) {
    if (this.isValid() &&
      ((isMoment(time) && time.isValid()) ||
        local__createLocal(time).isValid())) {
      return create__createDuration({
        to: this,
        from: time
      }).locale(this.locale()).humanize(!withoutSuffix);
    } else {
      return this.localeData().invalidDate();
    }
  }

  function fromNow(withoutSuffix) {
    return this.from(local__createLocal(), withoutSuffix);
  }

  function to(time, withoutSuffix) {
    if (this.isValid() &&
      ((isMoment(time) && time.isValid()) ||
        local__createLocal(time).isValid())) {
      return create__createDuration({
        from: this,
        to: time
      }).locale(this.locale()).humanize(!withoutSuffix);
    } else {
      return this.localeData().invalidDate();
    }
  }

  function toNow(withoutSuffix) {
    return this.to(local__createLocal(), withoutSuffix);
  }

  // If passed a locale key, it will set the locale for this
  // instance.  Otherwise, it will return the locale configuration
  // variables for this instance.
  function locale(key) {
    var newLocaleData;

    if (key === undefined) {
      return this._locale._abbr;
    } else {
      newLocaleData = locale_locales__getLocale(key);
      if (newLocaleData != null) {
        this._locale = newLocaleData;
      }
      return this;
    }
  }

  var lang = deprecate(
    'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
    function(key) {
      if (key === undefined) {
        return this.localeData();
      } else {
        return this.locale(key);
      }
    }
  );

  function localeData() {
    return this._locale;
  }

  function startOf(units) {
    units = normalizeUnits(units);
    // the following switch intentionally omits break keywords
    // to utilize falling through the cases.
    switch (units) {
      case 'year':
        this.month(0);
        /* falls through */
      case 'quarter':
      case 'month':
        this.date(1);
        /* falls through */
      case 'week':
      case 'isoWeek':
      case 'day':
        this.hours(0);
        /* falls through */
      case 'hour':
        this.minutes(0);
        /* falls through */
      case 'minute':
        this.seconds(0);
        /* falls through */
      case 'second':
        this.milliseconds(0);
    }

    // weeks are a special case
    if (units === 'week') {
      this.weekday(0);
    }
    if (units === 'isoWeek') {
      this.isoWeekday(1);
    }

    // quarters are also special
    if (units === 'quarter') {
      this.month(Math.floor(this.month() / 3) * 3);
    }

    return this;
  }

  function endOf(units) {
    units = normalizeUnits(units);
    if (units === undefined || units === 'millisecond') {
      return this;
    }
    return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
  }

  function to_type__valueOf() {
    return +this._d - ((this._offset || 0) * 60000);
  }

  function unix() {
    return Math.floor(+this / 1000);
  }

  function toDate() {
    return this._offset ? new Date(+this) : this._d;
  }

  function toArray() {
    var m = this;
    return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
  }

  function toObject() {
    var m = this;
    return {
      years: m.year(),
      months: m.month(),
      date: m.date(),
      hours: m.hours(),
      minutes: m.minutes(),
      seconds: m.seconds(),
      milliseconds: m.milliseconds()
    };
  }

  function toJSON() {
    // JSON.stringify(new Date(NaN)) === 'null'
    return this.isValid() ? this.toISOString() : 'null';
  }

  function moment_valid__isValid() {
    return valid__isValid(this);
  }

  function parsingFlags() {
    return extend({}, getParsingFlags(this));
  }

  function invalidAt() {
    return getParsingFlags(this).overflow;
  }

  function creationData() {
    return {
      input: this._i,
      format: this._f,
      locale: this._locale,
      isUTC: this._isUTC,
      strict: this._strict
    };
  }

  // FORMATTING

  addFormatToken(0, ['gg', 2], 0, function() {
    return this.weekYear() % 100;
  });

  addFormatToken(0, ['GG', 2], 0, function() {
    return this.isoWeekYear() % 100;
  });

  function addWeekYearFormatToken(token, getter) {
    addFormatToken(0, [token, token.length], 0, getter);
  }

  addWeekYearFormatToken('gggg', 'weekYear');
  addWeekYearFormatToken('ggggg', 'weekYear');
  addWeekYearFormatToken('GGGG', 'isoWeekYear');
  addWeekYearFormatToken('GGGGG', 'isoWeekYear');

  // ALIASES

  addUnitAlias('weekYear', 'gg');
  addUnitAlias('isoWeekYear', 'GG');

  // PARSING

  addRegexToken('G', matchSigned);
  addRegexToken('g', matchSigned);
  addRegexToken('GG', match1to2, match2);
  addRegexToken('gg', match1to2, match2);
  addRegexToken('GGGG', match1to4, match4);
  addRegexToken('gggg', match1to4, match4);
  addRegexToken('GGGGG', match1to6, match6);
  addRegexToken('ggggg', match1to6, match6);

  addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function(input, week, config, token) {
    week[token.substr(0, 2)] = toInt(input);
  });

  addWeekParseToken(['gg', 'GG'], function(input, week, config, token) {
    week[token] = utils_hooks__hooks.parseTwoDigitYear(input);
  });

  // MOMENTS

  function getSetWeekYear(input) {
    return getSetWeekYearHelper.call(this,
      input,
      this.week(),
      this.weekday(),
      this.localeData()._week.dow,
      this.localeData()._week.doy);
  }

  function getSetISOWeekYear(input) {
    return getSetWeekYearHelper.call(this,
      input, this.isoWeek(), this.isoWeekday(), 1, 4);
  }

  function getISOWeeksInYear() {
    return weeksInYear(this.year(), 1, 4);
  }

  function getWeeksInYear() {
    var weekInfo = this.localeData()._week;
    return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
  }

  function getSetWeekYearHelper(input, week, weekday, dow, doy) {
    var weeksTarget;
    if (input == null) {
      return weekOfYear(this, dow, doy).year;
    } else {
      weeksTarget = weeksInYear(input, dow, doy);
      if (week > weeksTarget) {
        week = weeksTarget;
      }
      return setWeekAll.call(this, input, week, weekday, dow, doy);
    }
  }

  function setWeekAll(weekYear, week, weekday, dow, doy) {
    var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
      date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

    // console.log("got", weekYear, week, weekday, "set", date.toISOString());
    this.year(date.getUTCFullYear());
    this.month(date.getUTCMonth());
    this.date(date.getUTCDate());
    return this;
  }

  // FORMATTING

  addFormatToken('Q', 0, 'Qo', 'quarter');

  // ALIASES

  addUnitAlias('quarter', 'Q');

  // PARSING

  addRegexToken('Q', match1);
  addParseToken('Q', function(input, array) {
    array[MONTH] = (toInt(input) - 1) * 3;
  });

  // MOMENTS

  function getSetQuarter(input) {
    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
  }

  // FORMATTING

  addFormatToken('w', ['ww', 2], 'wo', 'week');
  addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

  // ALIASES

  addUnitAlias('week', 'w');
  addUnitAlias('isoWeek', 'W');

  // PARSING

  addRegexToken('w', match1to2);
  addRegexToken('ww', match1to2, match2);
  addRegexToken('W', match1to2);
  addRegexToken('WW', match1to2, match2);

  addWeekParseToken(['w', 'ww', 'W', 'WW'], function(input, week, config, token) {
    week[token.substr(0, 1)] = toInt(input);
  });

  // HELPERS

  // LOCALES

  function localeWeek(mom) {
    return weekOfYear(mom, this._week.dow, this._week.doy).week;
  }

  var defaultLocaleWeek = {
    dow: 0, // Sunday is the first day of the week.
    doy: 6 // The week that contains Jan 1st is the first week of the year.
  };

  function localeFirstDayOfWeek() {
    return this._week.dow;
  }

  function localeFirstDayOfYear() {
    return this._week.doy;
  }

  // MOMENTS

  function getSetWeek(input) {
    var week = this.localeData().week(this);
    return input == null ? week : this.add((input - week) * 7, 'd');
  }

  function getSetISOWeek(input) {
    var week = weekOfYear(this, 1, 4).week;
    return input == null ? week : this.add((input - week) * 7, 'd');
  }

  // FORMATTING

  addFormatToken('D', ['DD', 2], 'Do', 'date');

  // ALIASES

  addUnitAlias('date', 'D');

  // PARSING

  addRegexToken('D', match1to2);
  addRegexToken('DD', match1to2, match2);
  addRegexToken('Do', function(isStrict, locale) {
    return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
  });

  addParseToken(['D', 'DD'], DATE);
  addParseToken('Do', function(input, array) {
    array[DATE] = toInt(input.match(match1to2)[0], 10);
  });

  // MOMENTS

  var getSetDayOfMonth = makeGetSet('Date', true);

  // FORMATTING

  addFormatToken('d', 0, 'do', 'day');

  addFormatToken('dd', 0, 0, function(format) {
    return this.localeData().weekdaysMin(this, format);
  });

  addFormatToken('ddd', 0, 0, function(format) {
    return this.localeData().weekdaysShort(this, format);
  });

  addFormatToken('dddd', 0, 0, function(format) {
    return this.localeData().weekdays(this, format);
  });

  addFormatToken('e', 0, 0, 'weekday');
  addFormatToken('E', 0, 0, 'isoWeekday');

  // ALIASES

  addUnitAlias('day', 'd');
  addUnitAlias('weekday', 'e');
  addUnitAlias('isoWeekday', 'E');

  // PARSING

  addRegexToken('d', match1to2);
  addRegexToken('e', match1to2);
  addRegexToken('E', match1to2);
  addRegexToken('dd', matchWord);
  addRegexToken('ddd', matchWord);
  addRegexToken('dddd', matchWord);

  addWeekParseToken(['dd', 'ddd', 'dddd'], function(input, week, config, token) {
    var weekday = config._locale.weekdaysParse(input, token, config._strict);
    // if we didn't get a weekday name, mark the date as invalid
    if (weekday != null) {
      week.d = weekday;
    } else {
      getParsingFlags(config).invalidWeekday = input;
    }
  });

  addWeekParseToken(['d', 'e', 'E'], function(input, week, config, token) {
    week[token] = toInt(input);
  });

  // HELPERS

  function parseWeekday(input, locale) {
    if (typeof input !== 'string') {
      return input;
    }

    if (!isNaN(input)) {
      return parseInt(input, 10);
    }

    input = locale.weekdaysParse(input);
    if (typeof input === 'number') {
      return input;
    }

    return null;
  }

  // LOCALES

  var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');

  function localeWeekdays(m, format) {
    return isArray(this._weekdays) ? this._weekdays[m.day()] :
      this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
  }

  var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');

  function localeWeekdaysShort(m) {
    return this._weekdaysShort[m.day()];
  }

  var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');

  function localeWeekdaysMin(m) {
    return this._weekdaysMin[m.day()];
  }

  function localeWeekdaysParse(weekdayName, format, strict) {
    var i, mom, regex;

    if (!this._weekdaysParse) {
      this._weekdaysParse = [];
      this._minWeekdaysParse = [];
      this._shortWeekdaysParse = [];
      this._fullWeekdaysParse = [];
    }

    for (i = 0; i < 7; i++) {
      // make the regex if we don't have it already

      mom = local__createLocal([2000, 1]).day(i);
      if (strict && !this._fullWeekdaysParse[i]) {
        this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
        this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
        this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
      }
      if (!this._weekdaysParse[i]) {
        regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
        this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
      }
      // test the regex
      if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
        return i;
      }
    }
  }

  // MOMENTS

  function getSetDayOfWeek(input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
    if (input != null) {
      input = parseWeekday(input, this.localeData());
      return this.add(input - day, 'd');
    } else {
      return day;
    }
  }

  function getSetLocaleDayOfWeek(input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    return input == null ? weekday : this.add(input - weekday, 'd');
  }

  function getSetISODayOfWeek(input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    // behaves the same as moment#day except
    // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
    // as a setter, sunday should belong to the previous week.
    return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
  }

  // FORMATTING

  addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

  // ALIASES

  addUnitAlias('dayOfYear', 'DDD');

  // PARSING

  addRegexToken('DDD', match1to3);
  addRegexToken('DDDD', match3);
  addParseToken(['DDD', 'DDDD'], function(input, array, config) {
    config._dayOfYear = toInt(input);
  });

  // HELPERS

  // MOMENTS

  function getSetDayOfYear(input) {
    var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
    return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
  }

  // FORMATTING

  function hFormat() {
    return this.hours() % 12 || 12;
  }

  addFormatToken('H', ['HH', 2], 0, 'hour');
  addFormatToken('h', ['hh', 2], 0, hFormat);

  addFormatToken('hmm', 0, 0, function() {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
  });

  addFormatToken('hmmss', 0, 0, function() {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
      zeroFill(this.seconds(), 2);
  });

  addFormatToken('Hmm', 0, 0, function() {
    return '' + this.hours() + zeroFill(this.minutes(), 2);
  });

  addFormatToken('Hmmss', 0, 0, function() {
    return '' + this.hours() + zeroFill(this.minutes(), 2) +
      zeroFill(this.seconds(), 2);
  });

  function meridiem(token, lowercase) {
    addFormatToken(token, 0, 0, function() {
      return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
    });
  }

  meridiem('a', true);
  meridiem('A', false);

  // ALIASES

  addUnitAlias('hour', 'h');

  // PARSING

  function matchMeridiem(isStrict, locale) {
    return locale._meridiemParse;
  }

  addRegexToken('a', matchMeridiem);
  addRegexToken('A', matchMeridiem);
  addRegexToken('H', match1to2);
  addRegexToken('h', match1to2);
  addRegexToken('HH', match1to2, match2);
  addRegexToken('hh', match1to2, match2);

  addRegexToken('hmm', match3to4);
  addRegexToken('hmmss', match5to6);
  addRegexToken('Hmm', match3to4);
  addRegexToken('Hmmss', match5to6);

  addParseToken(['H', 'HH'], HOUR);
  addParseToken(['a', 'A'], function(input, array, config) {
    config._isPm = config._locale.isPM(input);
    config._meridiem = input;
  });
  addParseToken(['h', 'hh'], function(input, array, config) {
    array[HOUR] = toInt(input);
    getParsingFlags(config).bigHour = true;
  });
  addParseToken('hmm', function(input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
    getParsingFlags(config).bigHour = true;
  });
  addParseToken('hmmss', function(input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
    getParsingFlags(config).bigHour = true;
  });
  addParseToken('Hmm', function(input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
  });
  addParseToken('Hmmss', function(input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
  });

  // LOCALES

  function localeIsPM(input) {
    // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
    // Using charAt should be more compatible.
    return ((input + '').toLowerCase().charAt(0) === 'p');
  }

  var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;

  function localeMeridiem(hours, minutes, isLower) {
    if (hours > 11) {
      return isLower ? 'pm' : 'PM';
    } else {
      return isLower ? 'am' : 'AM';
    }
  }


  // MOMENTS

  // Setting the hour should keep the time, because the user explicitly
  // specified which hour he wants. So trying to maintain the same hour (in
  // a new timezone) makes sense. Adding/subtracting hours does not follow
  // this rule.
  var getSetHour = makeGetSet('Hours', true);

  // FORMATTING

  addFormatToken('m', ['mm', 2], 0, 'minute');

  // ALIASES

  addUnitAlias('minute', 'm');

  // PARSING

  addRegexToken('m', match1to2);
  addRegexToken('mm', match1to2, match2);
  addParseToken(['m', 'mm'], MINUTE);

  // MOMENTS

  var getSetMinute = makeGetSet('Minutes', false);

  // FORMATTING

  addFormatToken('s', ['ss', 2], 0, 'second');

  // ALIASES

  addUnitAlias('second', 's');

  // PARSING

  addRegexToken('s', match1to2);
  addRegexToken('ss', match1to2, match2);
  addParseToken(['s', 'ss'], SECOND);

  // MOMENTS

  var getSetSecond = makeGetSet('Seconds', false);

  // FORMATTING

  addFormatToken('S', 0, 0, function() {
    return ~~(this.millisecond() / 100);
  });

  addFormatToken(0, ['SS', 2], 0, function() {
    return ~~(this.millisecond() / 10);
  });

  addFormatToken(0, ['SSS', 3], 0, 'millisecond');
  addFormatToken(0, ['SSSS', 4], 0, function() {
    return this.millisecond() * 10;
  });
  addFormatToken(0, ['SSSSS', 5], 0, function() {
    return this.millisecond() * 100;
  });
  addFormatToken(0, ['SSSSSS', 6], 0, function() {
    return this.millisecond() * 1000;
  });
  addFormatToken(0, ['SSSSSSS', 7], 0, function() {
    return this.millisecond() * 10000;
  });
  addFormatToken(0, ['SSSSSSSS', 8], 0, function() {
    return this.millisecond() * 100000;
  });
  addFormatToken(0, ['SSSSSSSSS', 9], 0, function() {
    return this.millisecond() * 1000000;
  });


  // ALIASES

  addUnitAlias('millisecond', 'ms');

  // PARSING

  addRegexToken('S', match1to3, match1);
  addRegexToken('SS', match1to3, match2);
  addRegexToken('SSS', match1to3, match3);

  var token;
  for (token = 'SSSS'; token.length <= 9; token += 'S') {
    addRegexToken(token, matchUnsigned);
  }

  function parseMs(input, array) {
    array[MILLISECOND] = toInt(('0.' + input) * 1000);
  }

  for (token = 'S'; token.length <= 9; token += 'S') {
    addParseToken(token, parseMs);
  }
  // MOMENTS

  var getSetMillisecond = makeGetSet('Milliseconds', false);

  // FORMATTING

  addFormatToken('z', 0, 0, 'zoneAbbr');
  addFormatToken('zz', 0, 0, 'zoneName');

  // MOMENTS

  function getZoneAbbr() {
    return this._isUTC ? 'UTC' : '';
  }

  function getZoneName() {
    return this._isUTC ? 'Coordinated Universal Time' : '';
  }

  var momentPrototype__proto = Moment.prototype;

  momentPrototype__proto.add = add_subtract__add;
  momentPrototype__proto.calendar = moment_calendar__calendar;
  momentPrototype__proto.clone = clone;
  momentPrototype__proto.diff = diff;
  momentPrototype__proto.endOf = endOf;
  momentPrototype__proto.format = format;
  momentPrototype__proto.from = from;
  momentPrototype__proto.fromNow = fromNow;
  momentPrototype__proto.to = to;
  momentPrototype__proto.toNow = toNow;
  momentPrototype__proto.get = getSet;
  momentPrototype__proto.invalidAt = invalidAt;
  momentPrototype__proto.isAfter = isAfter;
  momentPrototype__proto.isBefore = isBefore;
  momentPrototype__proto.isBetween = isBetween;
  momentPrototype__proto.isSame = isSame;
  momentPrototype__proto.isSameOrAfter = isSameOrAfter;
  momentPrototype__proto.isSameOrBefore = isSameOrBefore;
  momentPrototype__proto.isValid = moment_valid__isValid;
  momentPrototype__proto.lang = lang;
  momentPrototype__proto.locale = locale;
  momentPrototype__proto.localeData = localeData;
  momentPrototype__proto.max = prototypeMax;
  momentPrototype__proto.min = prototypeMin;
  momentPrototype__proto.parsingFlags = parsingFlags;
  momentPrototype__proto.set = getSet;
  momentPrototype__proto.startOf = startOf;
  momentPrototype__proto.subtract = add_subtract__subtract;
  momentPrototype__proto.toArray = toArray;
  momentPrototype__proto.toObject = toObject;
  momentPrototype__proto.toDate = toDate;
  momentPrototype__proto.toISOString = moment_format__toISOString;
  momentPrototype__proto.toJSON = toJSON;
  momentPrototype__proto.toString = toString;
  momentPrototype__proto.unix = unix;
  momentPrototype__proto.valueOf = to_type__valueOf;
  momentPrototype__proto.creationData = creationData;

  // Year
  momentPrototype__proto.year = getSetYear;
  momentPrototype__proto.isLeapYear = getIsLeapYear;

  // Week Year
  momentPrototype__proto.weekYear = getSetWeekYear;
  momentPrototype__proto.isoWeekYear = getSetISOWeekYear;

  // Quarter
  momentPrototype__proto.quarter = momentPrototype__proto.quarters = getSetQuarter;

  // Month
  momentPrototype__proto.month = getSetMonth;
  momentPrototype__proto.daysInMonth = getDaysInMonth;

  // Week
  momentPrototype__proto.week = momentPrototype__proto.weeks = getSetWeek;
  momentPrototype__proto.isoWeek = momentPrototype__proto.isoWeeks = getSetISOWeek;
  momentPrototype__proto.weeksInYear = getWeeksInYear;
  momentPrototype__proto.isoWeeksInYear = getISOWeeksInYear;

  // Day
  momentPrototype__proto.date = getSetDayOfMonth;
  momentPrototype__proto.day = momentPrototype__proto.days = getSetDayOfWeek;
  momentPrototype__proto.weekday = getSetLocaleDayOfWeek;
  momentPrototype__proto.isoWeekday = getSetISODayOfWeek;
  momentPrototype__proto.dayOfYear = getSetDayOfYear;

  // Hour
  momentPrototype__proto.hour = momentPrototype__proto.hours = getSetHour;

  // Minute
  momentPrototype__proto.minute = momentPrototype__proto.minutes = getSetMinute;

  // Second
  momentPrototype__proto.second = momentPrototype__proto.seconds = getSetSecond;

  // Millisecond
  momentPrototype__proto.millisecond = momentPrototype__proto.milliseconds = getSetMillisecond;

  // Offset
  momentPrototype__proto.utcOffset = getSetOffset;
  momentPrototype__proto.utc = setOffsetToUTC;
  momentPrototype__proto.local = setOffsetToLocal;
  momentPrototype__proto.parseZone = setOffsetToParsedOffset;
  momentPrototype__proto.hasAlignedHourOffset = hasAlignedHourOffset;
  momentPrototype__proto.isDST = isDaylightSavingTime;
  momentPrototype__proto.isDSTShifted = isDaylightSavingTimeShifted;
  momentPrototype__proto.isLocal = isLocal;
  momentPrototype__proto.isUtcOffset = isUtcOffset;
  momentPrototype__proto.isUtc = isUtc;
  momentPrototype__proto.isUTC = isUtc;

  // Timezone
  momentPrototype__proto.zoneAbbr = getZoneAbbr;
  momentPrototype__proto.zoneName = getZoneName;

  // Deprecations
  momentPrototype__proto.dates = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
  momentPrototype__proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
  momentPrototype__proto.years = deprecate('years accessor is deprecated. Use year instead', getSetYear);
  momentPrototype__proto.zone = deprecate('moment().zone is deprecated, use moment().utcOffset instead. https://github.com/moment/moment/issues/1779', getSetZone);

  var momentPrototype = momentPrototype__proto;

  function moment__createUnix(input) {
    return local__createLocal(input * 1000);
  }

  function moment__createInZone() {
    return local__createLocal.apply(null, arguments).parseZone();
  }

  var defaultCalendar = {
    sameDay: '[Today at] LT',
    nextDay: '[Tomorrow at] LT',
    nextWeek: 'dddd [at] LT',
    lastDay: '[Yesterday at] LT',
    lastWeek: '[Last] dddd [at] LT',
    sameElse: 'L'
  };

  function locale_calendar__calendar(key, mom, now) {
    var output = this._calendar[key];
    return isFunction(output) ? output.call(mom, now) : output;
  }

  var defaultLongDateFormat = {
    LTS: 'h:mm:ss A',
    LT: 'h:mm A',
    L: 'MM/DD/YYYY',
    LL: 'MMMM D, YYYY',
    LLL: 'MMMM D, YYYY h:mm A',
    LLLL: 'dddd, MMMM D, YYYY h:mm A'
  };

  function longDateFormat(key) {
    var format = this._longDateFormat[key],
      formatUpper = this._longDateFormat[key.toUpperCase()];

    if (format || !formatUpper) {
      return format;
    }

    this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function(val) {
      return val.slice(1);
    });

    return this._longDateFormat[key];
  }

  var defaultInvalidDate = 'Invalid date';

  function invalidDate() {
    return this._invalidDate;
  }

  var defaultOrdinal = '%d';
  var defaultOrdinalParse = /\d{1,2}/;

  function ordinal(number) {
    return this._ordinal.replace('%d', number);
  }

  function preParsePostFormat(string) {
    return string;
  }

  var defaultRelativeTime = {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years'
  };

  function relative__relativeTime(number, withoutSuffix, string, isFuture) {
    var output = this._relativeTime[string];
    return (isFunction(output)) ?
      output(number, withoutSuffix, string, isFuture) :
      output.replace(/%d/i, number);
  }

  function pastFuture(diff, output) {
    var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
    return isFunction(format) ? format(output) : format.replace(/%s/i, output);
  }

  function locale_set__set(config) {
    var prop, i;
    for (i in config) {
      prop = config[i];
      if (isFunction(prop)) {
        this[i] = prop;
      } else {
        this['_' + i] = prop;
      }
    }
    // Lenient ordinal parsing accepts just a number in addition to
    // number + (possibly) stuff coming from _ordinalParseLenient.
    this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
  }

  var prototype__proto = Locale.prototype;

  prototype__proto._calendar = defaultCalendar;
  prototype__proto.calendar = locale_calendar__calendar;
  prototype__proto._longDateFormat = defaultLongDateFormat;
  prototype__proto.longDateFormat = longDateFormat;
  prototype__proto._invalidDate = defaultInvalidDate;
  prototype__proto.invalidDate = invalidDate;
  prototype__proto._ordinal = defaultOrdinal;
  prototype__proto.ordinal = ordinal;
  prototype__proto._ordinalParse = defaultOrdinalParse;
  prototype__proto.preparse = preParsePostFormat;
  prototype__proto.postformat = preParsePostFormat;
  prototype__proto._relativeTime = defaultRelativeTime;
  prototype__proto.relativeTime = relative__relativeTime;
  prototype__proto.pastFuture = pastFuture;
  prototype__proto.set = locale_set__set;

  // Month
  prototype__proto.months = localeMonths;
  prototype__proto._months = defaultLocaleMonths;
  prototype__proto.monthsShort = localeMonthsShort;
  prototype__proto._monthsShort = defaultLocaleMonthsShort;
  prototype__proto.monthsParse = localeMonthsParse;
  prototype__proto._monthsRegex = defaultMonthsRegex;
  prototype__proto.monthsRegex = monthsRegex;
  prototype__proto._monthsShortRegex = defaultMonthsShortRegex;
  prototype__proto.monthsShortRegex = monthsShortRegex;

  // Week
  prototype__proto.week = localeWeek;
  prototype__proto._week = defaultLocaleWeek;
  prototype__proto.firstDayOfYear = localeFirstDayOfYear;
  prototype__proto.firstDayOfWeek = localeFirstDayOfWeek;

  // Day of Week
  prototype__proto.weekdays = localeWeekdays;
  prototype__proto._weekdays = defaultLocaleWeekdays;
  prototype__proto.weekdaysMin = localeWeekdaysMin;
  prototype__proto._weekdaysMin = defaultLocaleWeekdaysMin;
  prototype__proto.weekdaysShort = localeWeekdaysShort;
  prototype__proto._weekdaysShort = defaultLocaleWeekdaysShort;
  prototype__proto.weekdaysParse = localeWeekdaysParse;

  // Hours
  prototype__proto.isPM = localeIsPM;
  prototype__proto._meridiemParse = defaultLocaleMeridiemParse;
  prototype__proto.meridiem = localeMeridiem;

  function lists__get(format, index, field, setter) {
    var locale = locale_locales__getLocale();
    var utc = create_utc__createUTC().set(setter, index);
    return locale[field](utc, format);
  }

  function list(format, index, field, count, setter) {
    if (typeof format === 'number') {
      index = format;
      format = undefined;
    }

    format = format || '';

    if (index != null) {
      return lists__get(format, index, field, setter);
    }

    var i;
    var out = [];
    for (i = 0; i < count; i++) {
      out[i] = lists__get(format, i, field, setter);
    }
    return out;
  }

  function lists__listMonths(format, index) {
    return list(format, index, 'months', 12, 'month');
  }

  function lists__listMonthsShort(format, index) {
    return list(format, index, 'monthsShort', 12, 'month');
  }

  function lists__listWeekdays(format, index) {
    return list(format, index, 'weekdays', 7, 'day');
  }

  function lists__listWeekdaysShort(format, index) {
    return list(format, index, 'weekdaysShort', 7, 'day');
  }

  function lists__listWeekdaysMin(format, index) {
    return list(format, index, 'weekdaysMin', 7, 'day');
  }

  locale_locales__getSetGlobalLocale('en', {
    ordinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal: function(number) {
      var b = number % 10,
        output = (toInt(number % 100 / 10) === 1) ? 'th' :
        (b === 1) ? 'st' :
        (b === 2) ? 'nd' :
        (b === 3) ? 'rd' : 'th';
      return number + output;
    }
  });

  // Side effect imports
  utils_hooks__hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', locale_locales__getSetGlobalLocale);
  utils_hooks__hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', locale_locales__getLocale);

  var mathAbs = Math.abs;

  function duration_abs__abs() {
    var data = this._data;

    this._milliseconds = mathAbs(this._milliseconds);
    this._days = mathAbs(this._days);
    this._months = mathAbs(this._months);

    data.milliseconds = mathAbs(data.milliseconds);
    data.seconds = mathAbs(data.seconds);
    data.minutes = mathAbs(data.minutes);
    data.hours = mathAbs(data.hours);
    data.months = mathAbs(data.months);
    data.years = mathAbs(data.years);

    return this;
  }

  function duration_add_subtract__addSubtract(duration, input, value, direction) {
    var other = create__createDuration(input, value);

    duration._milliseconds += direction * other._milliseconds;
    duration._days += direction * other._days;
    duration._months += direction * other._months;

    return duration._bubble();
  }

  // supports only 2.0-style add(1, 's') or add(duration)
  function duration_add_subtract__add(input, value) {
    return duration_add_subtract__addSubtract(this, input, value, 1);
  }

  // supports only 2.0-style subtract(1, 's') or subtract(duration)
  function duration_add_subtract__subtract(input, value) {
    return duration_add_subtract__addSubtract(this, input, value, -1);
  }

  function absCeil(number) {
    if (number < 0) {
      return Math.floor(number);
    } else {
      return Math.ceil(number);
    }
  }

  function bubble() {
    var milliseconds = this._milliseconds;
    var days = this._days;
    var months = this._months;
    var data = this._data;
    var seconds, minutes, hours, years, monthsFromDays;

    // if we have a mix of positive and negative values, bubble down first
    // check: https://github.com/moment/moment/issues/2166
    if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
        (milliseconds <= 0 && days <= 0 && months <= 0))) {
      milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
      days = 0;
      months = 0;
    }

    // The following code bubbles up values, see the tests for
    // examples of what that means.
    data.milliseconds = milliseconds % 1000;

    seconds = absFloor(milliseconds / 1000);
    data.seconds = seconds % 60;

    minutes = absFloor(seconds / 60);
    data.minutes = minutes % 60;

    hours = absFloor(minutes / 60);
    data.hours = hours % 24;

    days += absFloor(hours / 24);

    // convert days to months
    monthsFromDays = absFloor(daysToMonths(days));
    months += monthsFromDays;
    days -= absCeil(monthsToDays(monthsFromDays));

    // 12 months -> 1 year
    years = absFloor(months / 12);
    months %= 12;

    data.days = days;
    data.months = months;
    data.years = years;

    return this;
  }

  function daysToMonths(days) {
    // 400 years have 146097 days (taking into account leap year rules)
    // 400 years have 12 months === 4800
    return days * 4800 / 146097;
  }

  function monthsToDays(months) {
    // the reverse of daysToMonths
    return months * 146097 / 4800;
  }

  function as(units) {
    var days;
    var months;
    var milliseconds = this._milliseconds;

    units = normalizeUnits(units);

    if (units === 'month' || units === 'year') {
      days = this._days + milliseconds / 864e5;
      months = this._months + daysToMonths(days);
      return units === 'month' ? months : months / 12;
    } else {
      // handle milliseconds separately because of floating point math errors (issue #1867)
      days = this._days + Math.round(monthsToDays(this._months));
      switch (units) {
        case 'week':
          return days / 7 + milliseconds / 6048e5;
        case 'day':
          return days + milliseconds / 864e5;
        case 'hour':
          return days * 24 + milliseconds / 36e5;
        case 'minute':
          return days * 1440 + milliseconds / 6e4;
        case 'second':
          return days * 86400 + milliseconds / 1000;
          // Math.floor prevents floating point math errors here
        case 'millisecond':
          return Math.floor(days * 864e5) + milliseconds;
        default:
          throw new Error('Unknown unit ' + units);
      }
    }
  }

  // TODO: Use this.as('ms')?
  function duration_as__valueOf() {
    return (
      this._milliseconds +
      this._days * 864e5 +
      (this._months % 12) * 2592e6 +
      toInt(this._months / 12) * 31536e6
    );
  }

  function makeAs(alias) {
    return function() {
      return this.as(alias);
    };
  }

  var asMilliseconds = makeAs('ms');
  var asSeconds = makeAs('s');
  var asMinutes = makeAs('m');
  var asHours = makeAs('h');
  var asDays = makeAs('d');
  var asWeeks = makeAs('w');
  var asMonths = makeAs('M');
  var asYears = makeAs('y');

  function duration_get__get(units) {
    units = normalizeUnits(units);
    return this[units + 's']();
  }

  function makeGetter(name) {
    return function() {
      return this._data[name];
    };
  }

  var milliseconds = makeGetter('milliseconds');
  var seconds = makeGetter('seconds');
  var minutes = makeGetter('minutes');
  var hours = makeGetter('hours');
  var days = makeGetter('days');
  var months = makeGetter('months');
  var years = makeGetter('years');

  function weeks() {
    return absFloor(this.days() / 7);
  }

  var round = Math.round;
  var thresholds = {
    s: 45, // seconds to minute
    m: 45, // minutes to hour
    h: 22, // hours to day
    d: 26, // days to month
    M: 11 // months to year
  };

  // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
  function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
  }

  function duration_humanize__relativeTime(posNegDuration, withoutSuffix, locale) {
    var duration = create__createDuration(posNegDuration).abs();
    var seconds = round(duration.as('s'));
    var minutes = round(duration.as('m'));
    var hours = round(duration.as('h'));
    var days = round(duration.as('d'));
    var months = round(duration.as('M'));
    var years = round(duration.as('y'));

    var a = seconds < thresholds.s && ['s', seconds] ||
      minutes <= 1 && ['m'] ||
      minutes < thresholds.m && ['mm', minutes] ||
      hours <= 1 && ['h'] ||
      hours < thresholds.h && ['hh', hours] ||
      days <= 1 && ['d'] ||
      days < thresholds.d && ['dd', days] ||
      months <= 1 && ['M'] ||
      months < thresholds.M && ['MM', months] ||
      years <= 1 && ['y'] || ['yy', years];

    a[2] = withoutSuffix;
    a[3] = +posNegDuration > 0;
    a[4] = locale;
    return substituteTimeAgo.apply(null, a);
  }

  // This function allows you to set a threshold for relative time strings
  function duration_humanize__getSetRelativeTimeThreshold(threshold, limit) {
    if (thresholds[threshold] === undefined) {
      return false;
    }
    if (limit === undefined) {
      return thresholds[threshold];
    }
    thresholds[threshold] = limit;
    return true;
  }

  function humanize(withSuffix) {
    var locale = this.localeData();
    var output = duration_humanize__relativeTime(this, !withSuffix, locale);

    if (withSuffix) {
      output = locale.pastFuture(+this, output);
    }

    return locale.postformat(output);
  }

  var iso_string__abs = Math.abs;

  function iso_string__toISOString() {
    // for ISO strings we do not use the normal bubbling rules:
    //  * milliseconds bubble up until they become hours
    //  * days do not bubble at all
    //  * months bubble up until they become years
    // This is because there is no context-free conversion between hours and days
    // (think of clock changes)
    // and also not between days and months (28-31 days per month)
    var seconds = iso_string__abs(this._milliseconds) / 1000;
    var days = iso_string__abs(this._days);
    var months = iso_string__abs(this._months);
    var minutes, hours, years;

    // 3600 seconds -> 60 minutes -> 1 hour
    minutes = absFloor(seconds / 60);
    hours = absFloor(minutes / 60);
    seconds %= 60;
    minutes %= 60;

    // 12 months -> 1 year
    years = absFloor(months / 12);
    months %= 12;


    // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
    var Y = years;
    var M = months;
    var D = days;
    var h = hours;
    var m = minutes;
    var s = seconds;
    var total = this.asSeconds();

    if (!total) {
      // this is the same as C#'s (Noda) and python (isodate)...
      // but not other JS (goog.date)
      return 'P0D';
    }

    return (total < 0 ? '-' : '') +
      'P' +
      (Y ? Y + 'Y' : '') +
      (M ? M + 'M' : '') +
      (D ? D + 'D' : '') +
      ((h || m || s) ? 'T' : '') +
      (h ? h + 'H' : '') +
      (m ? m + 'M' : '') +
      (s ? s + 'S' : '');
  }

  var duration_prototype__proto = Duration.prototype;

  duration_prototype__proto.abs = duration_abs__abs;
  duration_prototype__proto.add = duration_add_subtract__add;
  duration_prototype__proto.subtract = duration_add_subtract__subtract;
  duration_prototype__proto.as = as;
  duration_prototype__proto.asMilliseconds = asMilliseconds;
  duration_prototype__proto.asSeconds = asSeconds;
  duration_prototype__proto.asMinutes = asMinutes;
  duration_prototype__proto.asHours = asHours;
  duration_prototype__proto.asDays = asDays;
  duration_prototype__proto.asWeeks = asWeeks;
  duration_prototype__proto.asMonths = asMonths;
  duration_prototype__proto.asYears = asYears;
  duration_prototype__proto.valueOf = duration_as__valueOf;
  duration_prototype__proto._bubble = bubble;
  duration_prototype__proto.get = duration_get__get;
  duration_prototype__proto.milliseconds = milliseconds;
  duration_prototype__proto.seconds = seconds;
  duration_prototype__proto.minutes = minutes;
  duration_prototype__proto.hours = hours;
  duration_prototype__proto.days = days;
  duration_prototype__proto.weeks = weeks;
  duration_prototype__proto.months = months;
  duration_prototype__proto.years = years;
  duration_prototype__proto.humanize = humanize;
  duration_prototype__proto.toISOString = iso_string__toISOString;
  duration_prototype__proto.toString = iso_string__toISOString;
  duration_prototype__proto.toJSON = iso_string__toISOString;
  duration_prototype__proto.locale = locale;
  duration_prototype__proto.localeData = localeData;

  // Deprecations
  duration_prototype__proto.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', iso_string__toISOString);
  duration_prototype__proto.lang = lang;

  // Side effect imports

  // FORMATTING

  addFormatToken('X', 0, 0, 'unix');
  addFormatToken('x', 0, 0, 'valueOf');

  // PARSING

  addRegexToken('x', matchSigned);
  addRegexToken('X', matchTimestamp);
  addParseToken('X', function(input, array, config) {
    config._d = new Date(parseFloat(input, 10) * 1000);
  });
  addParseToken('x', function(input, array, config) {
    config._d = new Date(toInt(input));
  });

  // Side effect imports


  utils_hooks__hooks.version = '2.11.2';

  setHookCallback(local__createLocal);

  utils_hooks__hooks.fn = momentPrototype;
  utils_hooks__hooks.min = min;
  utils_hooks__hooks.max = max;
  utils_hooks__hooks.now = now;
  utils_hooks__hooks.utc = create_utc__createUTC;
  utils_hooks__hooks.unix = moment__createUnix;
  utils_hooks__hooks.months = lists__listMonths;
  utils_hooks__hooks.isDate = isDate;
  utils_hooks__hooks.locale = locale_locales__getSetGlobalLocale;
  utils_hooks__hooks.invalid = valid__createInvalid;
  utils_hooks__hooks.duration = create__createDuration;
  utils_hooks__hooks.isMoment = isMoment;
  utils_hooks__hooks.weekdays = lists__listWeekdays;
  utils_hooks__hooks.parseZone = moment__createInZone;
  utils_hooks__hooks.localeData = locale_locales__getLocale;
  utils_hooks__hooks.isDuration = isDuration;
  utils_hooks__hooks.monthsShort = lists__listMonthsShort;
  utils_hooks__hooks.weekdaysMin = lists__listWeekdaysMin;
  utils_hooks__hooks.defineLocale = defineLocale;
  utils_hooks__hooks.weekdaysShort = lists__listWeekdaysShort;
  utils_hooks__hooks.normalizeUnits = normalizeUnits;
  utils_hooks__hooks.relativeTimeThreshold = duration_humanize__getSetRelativeTimeThreshold;
  utils_hooks__hooks.prototype = momentPrototype;

  var _moment = utils_hooks__hooks;

  return _moment;

}));

if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    'use strict';
    if (this == null) {
      throw new TypeError('can\'t convert ' + this + ' to object');
    }
    var str = '' + this;
    count = +count;
    if (count != count) {
      count = 0;
    }
    if (count < 0) {
      throw new RangeError('repeat count must be non-negative');
    }
    if (count == Infinity) {
      throw new RangeError('repeat count must be less than infinity');
    }
    count = Math.floor(count);
    if (str.length == 0 || count == 0) {
      return '';
    }
    // Ensuring count is a 31-bit integer allows us to heavily optimize the
    // main part. But anyway, most current (August 2014) browsers can't handle
    // strings 1 << 28 chars or longer, so:
    if (str.length * count >= 1 << 28) {
      throw new RangeError('repeat count must not overflow maximum string size');
    }
    var rpt = '';
    for (;;) {
      if ((count & 1) == 1) {
        rpt += str;
      }
      count >>>= 1;
      if (count == 0) {
        break;
      }
      str += str;
    }
    // Could we try:
    // return Array(count + 1).join(this);
    return rpt;
  }
}

if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}



;(function($){
/*
 
jSignature v2 "2013-12-09T05:51" "commit ID ebe94c351d7267e21b4fc741c79a8191391cb579"
Copyright (c) 2012 Willow Systems Corp http://willow-systems.com
Copyright (c) 2010 Brinley Ang http://www.unbolt.net
MIT License <http://www.opensource.org/licenses/mit-license.php> 


base64 encoder
MIT, GPL
http://phpjs.org/functions/base64_encode
+   original by: Tyler Akins (http://rumkin.com)
+   improved by: Bayron Guevara
+   improved by: Thunder.m
+   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
+   bugfixed by: Pellentesque Malesuada
+   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
+   improved by: Rafal Kukawski (http://kukawski.pl)


jSignature v2 jSignature's Undo Button and undo functionality plugin


jSignature v2 jSignature's custom "base30" format export and import plugins.


jSignature v2 SVG export plugin.


Simplify.js BSD 
(c) 2012, Vladimir Agafonkin
mourner.github.com/simplify-js

*/
(function(){function r(c){var a,b=c.css("color"),d;c=c[0];for(var l=!1;c&&!d&&!l;){try{a=$(c).css("background-color")}catch(E){a="transparent"}"transparent"!==a&&"rgba(0, 0, 0, 0)"!==a&&(d=a);l=c.body;c=c.parentNode}c=/rgb[a]*\((\d+),\s*(\d+),\s*(\d+)/;var l=/#([AaBbCcDdEeFf\d]{2})([AaBbCcDdEeFf\d]{2})([AaBbCcDdEeFf\d]{2})/,h;a=void 0;(a=b.match(c))?h={r:parseInt(a[1],10),g:parseInt(a[2],10),b:parseInt(a[3],10)}:(a=b.match(l))&&(h={r:parseInt(a[1],16),g:parseInt(a[2],16),b:parseInt(a[3],16)});var e;
d?(a=void 0,(a=d.match(c))?e={r:parseInt(a[1],10),g:parseInt(a[2],10),b:parseInt(a[3],10)}:(a=d.match(l))&&(e={r:parseInt(a[1],16),g:parseInt(a[2],16),b:parseInt(a[3],16)})):e=h?127<Math.max.apply(null,[h.r,h.g,h.b])?{r:0,g:0,b:0}:{r:255,g:255,b:255}:{r:255,g:255,b:255};a=function(a){return"rgb("+[a.r,a.g,a.b].join(", ")+")"};h&&e?(c=Math.max.apply(null,[h.r,h.g,h.b]),h=Math.max.apply(null,[e.r,e.g,e.b]),h=Math.round(h+-0.75*(h-c)),h={r:h,g:h,b:h}):h?(h=Math.max.apply(null,[h.r,h.g,h.b]),c=1,127<
h&&(c=-1),h=Math.round(h+96*c),h={r:h,g:h,b:h}):h={r:191,g:191,b:191};return{color:b,"background-color":e?a(e):d,"decor-color":a(h)}}function k(c,a){this.x=c;this.y=a;this.reverse=function(){return new this.constructor(-1*this.x,-1*this.y)};this._length=null;this.getLength=function(){this._length||(this._length=Math.sqrt(Math.pow(this.x,2)+Math.pow(this.y,2)));return this._length};var b=function(a){return Math.round(a/Math.abs(a))};this.resizeTo=function(a){if(0===this.x&&0===this.y)this._length=
0;else if(0===this.x)this._length=a,this.y=a*b(this.y);else if(0===this.y)this._length=a,this.x=a*b(this.x);else{var c=Math.abs(this.y/this.x),e=Math.sqrt(Math.pow(a,2)/(1+Math.pow(c,2))),c=c*e;this._length=a;this.x=e*b(this.x);this.y=c*b(this.y)}return this};this.angleTo=function(a){var b=this.getLength()*a.getLength();return 0===b?0:Math.acos(Math.min(Math.max((this.x*a.x+this.y*a.y)/b,-1),1))/Math.PI}}function g(c,a){this.x=c;this.y=a;this.getVectorToCoordinates=function(a,c){return new k(a-this.x,
c-this.y)};this.getVectorFromCoordinates=function(a,c){return this.getVectorToCoordinates(a,c).reverse()};this.getVectorToPoint=function(a){return new k(a.x-this.x,a.y-this.y)};this.getVectorFromPoint=function(a){return this.getVectorToPoint(a).reverse()}}function n(c,a,b,d,l){this.data=c;this.context=a;if(c.length)for(var e=c.length,h,m,A=0;A<e;A++){h=c[A];m=h.x.length;b.call(a,h);for(var f=1;f<m;f++)d.call(a,h,f);l.call(a,h)}this.changed=function(){};this.startStrokeFn=b;this.addToStrokeFn=d;this.endStrokeFn=
l;this.inStroke=!1;this._stroke=this._lastPoint=null;this.startStroke=function(a){if(a&&"number"==typeof a.x&&"number"==typeof a.y){this._stroke={x:[a.x],y:[a.y]};this.data.push(this._stroke);this._lastPoint=a;this.inStroke=!0;var b=this._stroke,c=this.startStrokeFn,d=this.context;setTimeout(function(){c.call(d,b)},3);return a}return null};this.addToStroke=function(a){if(this.inStroke&&"number"===typeof a.x&&"number"===typeof a.y&&4<Math.abs(a.x-this._lastPoint.x)+Math.abs(a.y-this._lastPoint.y)){var b=
this._stroke.x.length;this._stroke.x.push(a.x);this._stroke.y.push(a.y);this._lastPoint=a;var c=this._stroke,d=this.addToStrokeFn,l=this.context;setTimeout(function(){d.call(l,c,b)},3);return a}return null};this.endStroke=function(){var a=this.inStroke;this.inStroke=!1;this._lastPoint=null;if(a){var b=this._stroke,c=this.endStrokeFn,d=this.context,l=this.changed;setTimeout(function(){c.call(d,b);l.call(d)},3);return!0}return null}}function s(c,a,b,d){if("ratio"===a||"%"===a.split("")[a.length-1])this.eventTokens[b+
".parentresized"]=d.subscribe(b+".parentresized",function(a,e,h,m){return function(){var m=e.width();if(m!==h){for(var f in a)a.hasOwnProperty(f)&&(d.unsubscribe(a[f]),delete a[f]);var p=c.settings;c.$parent.children().remove();for(f in c)c.hasOwnProperty(f)&&delete c[f];f=p.data;var m=1*m/h,x=[],D,q,g,k,s,n;q=0;for(g=f.length;q<g;q++){n=f[q];D={x:[],y:[]};k=0;for(s=n.x.length;k<s;k++)D.x.push(n.x[k]*m),D.y.push(n.y[k]*m);x.push(D)}p.data=x;e[b](p)}}}(this.eventTokens,this.$parent,this.$parent.width(),
1*this.canvas.width/this.canvas.height))}function v(c,a,b){var d=this.$parent=$(c);c=this.eventTokens={};this.events=new t(this);var l=$.fn[f]("globalEvents"),e={width:"ratio",height:"ratio",sizeRatio:4,color:"#000","background-color":"#fff","decor-color":"#eee",lineWidth:0,minFatFingerCompensation:-10,showUndoButton:!1,readOnly:!1,data:[]};$.extend(e,r(d));a&&$.extend(e,a);this.settings=e;for(var h in b)b.hasOwnProperty(h)&&b[h].call(this,h);this.events.publish(f+".initializing");this.$controlbarUpper=
$('<div style="padding:0 !important; margin:0 !important;width: 100% !important; height: 0 !important; -ms-touch-action: none;margin-top:-1em !important; margin-bottom:1em !important;"></div>').appendTo(d);this.isCanvasEmulator=!1;a=this.canvas=this.initializeCanvas(e);b=$(a);this.$controlbarLower=$('<div style="padding:0 !important; margin:0 !important;width: 100% !important; height: 0 !important; -ms-touch-action: none;margin-top:-1.5em !important; margin-bottom:1.5em !important; position: relative;"></div>').appendTo(d);
this.canvasContext=a.getContext("2d");b.data(f+".this",this);e.lineWidth=function(a,b){return a?a:Math.max(Math.round(b/400),2)}(e.lineWidth,a.width);this.lineCurveThreshold=3*e.lineWidth;e.cssclass&&""!=$.trim(e.cssclass)&&b.addClass(e.cssclass);this.fatFingerCompensation=0;d=function(a){var b,c,d=function(d){d=d.changedTouches&&0<d.changedTouches.length?d.changedTouches[0]:d;return new g(Math.round(d.pageX+b),Math.round(d.pageY+c)+a.fatFingerCompensation)},e=new u(750,function(){a.dataEngine.endStroke()});
this.drawEndHandler=function(b){if(!a.settings.readOnly){try{b.preventDefault()}catch(c){}e.clear();a.dataEngine.endStroke()}};this.drawStartHandler=function(l){if(!a.settings.readOnly){l.preventDefault();var h=$(a.canvas).offset();b=-1*h.left;c=-1*h.top;a.dataEngine.startStroke(d(l));e.kick()}};this.drawMoveHandler=function(b){a.settings.readOnly||(b.preventDefault(),a.dataEngine.inStroke&&(a.dataEngine.addToStroke(d(b)),e.kick()))};return this}.call({},this);(function(a,b,c){var d=this.canvas,l=
$(d);this.isCanvasEmulator?(l.bind("mousemove."+f,c),l.bind("mouseup."+f,a),l.bind("mousedown."+f,b)):(d.ontouchstart=function(l){d.onmousedown=d.onmouseup=d.onmousemove=void 0;this.fatFingerCompensation=e.minFatFingerCompensation&&-3*e.lineWidth>e.minFatFingerCompensation?-3*e.lineWidth:e.minFatFingerCompensation;b(l);d.ontouchend=a;d.ontouchstart=b;d.ontouchmove=c},d.onmousedown=function(e){d.ontouchstart=d.ontouchend=d.ontouchmove=void 0;b(e);d.onmousedown=b;d.onmouseup=a;d.onmousemove=c},window.navigator.msPointerEnabled&&
(d.onmspointerdown=b,d.onmspointerup=a,d.onmspointermove=c))}).call(this,d.drawEndHandler,d.drawStartHandler,d.drawMoveHandler);c[f+".windowmouseup"]=l.subscribe(f+".windowmouseup",d.drawEndHandler);this.events.publish(f+".attachingEventHandlers");s.call(this,this,e.width.toString(10),f,l);this.resetCanvas(e.data);this.events.publish(f+".initialized");return this}function w(c){if(c.getContext)return!1;var a=c.ownerDocument.parentWindow,b=a.FlashCanvas?c.ownerDocument.parentWindow.FlashCanvas:"undefined"===
typeof FlashCanvas?void 0:FlashCanvas;if(b){c=b.initElement(c);b=1;a&&a.screen&&a.screen.deviceXDPI&&a.screen.logicalXDPI&&(b=1*a.screen.deviceXDPI/a.screen.logicalXDPI);if(1!==b)try{$(c).children("object").get(0).resize(Math.ceil(c.width*b),Math.ceil(c.height*b)),c.getContext("2d").scale(b,b)}catch(d){}return!0}throw Error("Canvas element does not support 2d context. jSignature cannot proceed.");}var f="jSignature",u=function(c,a){var b;this.kick=function(){clearTimeout(b);b=setTimeout(a,c)};this.clear=
function(){clearTimeout(b)};return this},t=function(c){this.topics={};this.context=c?c:this;this.publish=function(a,b,c,e){if(this.topics[a]){var f=this.topics[a],h=Array.prototype.slice.call(arguments,1),m=[],q,g,p,x;g=0;for(p=f.length;g<p;g++)x=f[g],q=x[0],x[1]&&(x[0]=function(){},m.push(g)),q.apply(this.context,h);g=0;for(p=m.length;g<p;g++)f.splice(m[g],1)}};this.subscribe=function(a,b,c){this.topics[a]?this.topics[a].push([b,c]):this.topics[a]=[[b,c]];return{topic:a,callback:b}};this.unsubscribe=
function(a){if(this.topics[a.topic])for(var b=this.topics[a.topic],c=0,e=b.length;c<e;c++)b[c]&&b[c][0]===a.callback&&b.splice(c,1)}},y=function(c,a,b,d,e){c.beginPath();c.moveTo(a,b);c.lineTo(d,e);c.closePath();c.stroke()},C=function(c){var a=this.canvasContext,b=c.x[0];c=c.y[0];var d=this.settings.lineWidth,e=a.fillStyle;a.fillStyle=a.strokeStyle;a.fillRect(b+d/-2,c+d/-2,d,d);a.fillStyle=e},q=function(c,a){var b=new g(c.x[a-1],c.y[a-1]),d=new g(c.x[a],c.y[a]),e=b.getVectorToPoint(d);if(1<a){var f=
new g(c.x[a-2],c.y[a-2]),h=f.getVectorToPoint(b),m;if(h.getLength()>this.lineCurveThreshold){m=2<a?(new g(c.x[a-3],c.y[a-3])).getVectorToPoint(f):new k(0,0);var q=0.35*h.getLength(),n=h.angleTo(m.reverse()),p=e.angleTo(h.reverse());m=(new k(m.x+h.x,m.y+h.y)).resizeTo(Math.max(0.05,n)*q);var x=(new k(h.x+e.x,h.y+e.y)).reverse().resizeTo(Math.max(0.05,p)*q),h=this.canvasContext,q=f.x,p=f.y,n=b.x,D=b.y,s=f.x+m.x,f=f.y+m.y;m=b.x+x.x;x=b.y+x.y;h.beginPath();h.moveTo(q,p);h.bezierCurveTo(s,f,m,x,n,D);h.closePath();
h.stroke()}}e.getLength()<=this.lineCurveThreshold&&y(this.canvasContext,b.x,b.y,d.x,d.y)},e=function(c){var a=c.x.length-1;if(0<a){var b=new g(c.x[a],c.y[a]),d=new g(c.x[a-1],c.y[a-1]),e=d.getVectorToPoint(b);if(e.getLength()>this.lineCurveThreshold)if(1<a){c=(new g(c.x[a-2],c.y[a-2])).getVectorToPoint(d);var f=(new k(c.x+e.x,c.y+e.y)).resizeTo(e.getLength()/2),e=this.canvasContext;c=d.x;var a=d.y,h=b.x,m=b.y,q=d.x+f.x,d=d.y+f.y,f=b.x,b=b.y;e.beginPath();e.moveTo(c,a);e.bezierCurveTo(q,d,f,b,h,m);
e.closePath();e.stroke()}else y(this.canvasContext,d.x,d.y,b.x,b.y)}};v.prototype.resetCanvas=function(c,a){var b=this.canvas,d=this.settings,l=this.canvasContext,g=this.isCanvasEmulator,h=b.width,m=b.height;a||l.clearRect(0,0,h+30,m+30);l.shadowColor=l.fillStyle=d["background-color"];g&&l.fillRect(0,0,h+30,m+30);l.lineWidth=Math.ceil(parseInt(d.lineWidth,10));l.lineCap=l.lineJoin="round";if(null!=d["decor-color"]){l.strokeStyle=d["decor-color"];l.shadowOffsetX=0;l.shadowOffsetY=0;var A=Math.round(m/
5);y(l,1.5*A,m-A,h-1.5*A,m-A)}l.strokeStyle=d.color;g||(l.shadowColor=l.strokeStyle,l.shadowOffsetX=0.5*l.lineWidth,l.shadowOffsetY=-0.6*l.lineWidth,l.shadowBlur=0);c||(c=[]);l=this.dataEngine=new n(c,this,C,q,e);d.data=c;$(b).data(f+".data",c).data(f+".settings",d);l.changed=function(a,b,c){return function(){b.publish(c+".change");a.trigger("change")}}(this.$parent,this.events,f);l.changed();return!0};v.prototype.initializeCanvas=function(c){var a=document.createElement("canvas"),b=$(a);c.width===
c.height&&"ratio"===c.height&&(c.width="100%");b.css("margin",0).css("padding",0).css("border","none").css("height","ratio"!==c.height&&c.height?c.height.toString(10):1).css("width","ratio"!==c.width&&c.width?c.width.toString(10):1).css("-ms-touch-action","none");b.appendTo(this.$parent);"ratio"===c.height?b.css("height",Math.round(b.width()/c.sizeRatio)):"ratio"===c.width&&b.css("width",Math.round(b.height()*c.sizeRatio));b.addClass(f);a.width=b.width();a.height=b.height();this.isCanvasEmulator=
w(a);a.onselectstart=function(a){a&&a.preventDefault&&a.preventDefault();a&&a.stopPropagation&&a.stopPropagation();return!1};return a};(function(c){function a(a,b,c){var d=new Image,e=this;d.onload=function(){e.getContext("2d").drawImage(d,0,0,d.width<e.width?d.width:e.width,d.height<e.height?d.height:e.height)};d.src="data:"+b+","+a}function b(a,b){this.find("canvas."+f).add(this.filter("canvas."+f)).data(f+".this").resetCanvas(a,b);return this}function d(a,b){if(void 0===b&&"string"===typeof a&&
"data:"===a.substr(0,5)&&(b=a.slice(5).split(",")[0],a=a.slice(6+b.length),b===a))return;var c=this.find("canvas."+f).add(this.filter("canvas."+f));if(m.hasOwnProperty(b))0!==c.length&&m[b].call(c[0],a,b,function(a){return function(){return a.resetCanvas.apply(a,arguments)}}(c.data(f+".this")));else throw Error(f+" is unable to find import plugin with for format '"+String(b)+"'");return this}var e=new t;(function(a,b,c,d){var e,h=function(){a.publish(b+".parentresized")};c(d).bind("resize."+b,function(){e&&
clearTimeout(e);e=setTimeout(h,500)}).bind("mouseup."+b,function(c){a.publish(b+".windowmouseup")})})(e,f,$,c);var q={},h={"default":function(a){return this.toDataURL()},"native":function(a){return a},image:function(a){a=this.toDataURL();if("string"===typeof a&&4<a.length&&"data:"===a.slice(0,5)&&-1!==a.indexOf(",")){var b=a.indexOf(",");return[a.slice(5,b),a.substr(b+1)]}return[]}},m={"native":function(a,b,c){c(a)},image:a,"image/png;base64":a,"image/jpeg;base64":a,"image/jpg;base64":a},g={"export":h,
"import":m,instance:q},k={init:function(a){return this.each(function(){var b,c=!1;for(b=this.parentNode;b&&!c;)c=b.body,b=b.parentNode;c&&new v(this,a,q)})},getSettings:function(){return this.find("canvas."+f).add(this.filter("canvas."+f)).data(f+".this").settings},isModified:function(){return null!==this.find("canvas."+f).add(this.filter("canvas."+f)).data(f+".this").dataEngine._stroke},updateSetting:function(a,b,c){var d=this.find("canvas."+f).add(this.filter("canvas."+f)).data(f+".this");d.settings[a]=
b;d.resetCanvas(c?null:d.settings.data,!0);return d.settings[a]},clear:b,reset:b,addPlugin:function(a,b,c){g.hasOwnProperty(a)&&(g[a][b]=c);return this},listPlugins:function(a){var b=[];if(g.hasOwnProperty(a)){a=g[a];for(var c in a)a.hasOwnProperty(c)&&b.push(c)}return b},getData:function(a){var b=this.find("canvas."+f).add(this.filter("canvas."+f));void 0===a&&(a="default");if(0!==b.length&&h.hasOwnProperty(a))return h[a].call(b.get(0),b.data(f+".data"),b.data(f+".settings"))},importData:d,setData:d,
globalEvents:function(){return e},disable:function(){this.find("input").attr("disabled",1);this.find("canvas."+f).addClass("disabled").data(f+".this").settings.readOnly=!0},enable:function(){this.find("input").removeAttr("disabled");this.find("canvas."+f).removeClass("disabled").data(f+".this").settings.readOnly=!1},events:function(){return this.find("canvas."+f).add(this.filter("canvas."+f)).data(f+".this").events}};$.fn[f]=function(a){if(a&&"object"!==typeof a){if("string"===typeof a&&k[a])return k[a].apply(this,
Array.prototype.slice.call(arguments,1));$.error("Method "+String(a)+" does not exist on jQuery."+f)}else return k.init.apply(this,arguments)}})(window)})();
(function(){function r(k,g,n){k=k.call(this);(function(g,k,n){g.events.subscribe(n+".change",function(){g.dataEngine.data.length?k.show():k.hide()})})(this,k,g);(function(g,k,n){var f=n+".undo";k.bind("click",function(){g.events.publish(f)});g.events.subscribe(f,function(){var f=g.dataEngine.data;f.length&&(f.pop(),g.resetCanvas(f))})})(this,k,this.events.topics.hasOwnProperty(g+".undo")?n:g)}$.fn.jSignature("addPlugin","instance","UndoButton",function(k){this.events.subscribe("jSignature.attachingEventHandlers",
function(){if(this.settings[k]){var g=this.settings[k];"function"!==typeof g&&(g=function(){var g=$('<input type="button" value="Undo last stroke" style="position:absolute;display:none;margin:0 !important;top:auto" />').appendTo(this.$controlbarLower),k=g.width();g.css("left",Math.round((this.canvas.width-k)/2));k!==g.width()&&g.width(k);return g});r.call(this,g,"jSignature",k)}})})})();
(function(){for(var r={},k={},g="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX".split(""),n=g.length/2,s=n-1;-1<s;s--)r[g[s]]=g[s+n],k[g[s+n]]=g[s];var v=function(f){f=f.split("");for(var e=f.length,c=1;c<e;c++)f[c]=r[f[c]];return f.join("")},w=function(f){for(var e=[],c=0,a=1,b=f.length,d,l,g=0;g<b;g++)d=Math.round(f[g]),l=d-c,c=d,0>l&&0<a?(a=-1,e.push("Z")):0<l&&0>a&&(a=1,e.push("Y")),d=Math.abs(l),d>=n?e.push(v(d.toString(n))):e.push(d.toString(n));return e.join("")},f=function(f){var e=
[];f=f.split("");for(var c=f.length,a,b=1,d=[],l=0,g=0;g<c;g++)a=f[g],a in r||"Z"===a||"Y"===a?(0!==d.length&&(d=parseInt(d.join(""),n)*b+l,e.push(d),l=d),"Z"===a?(b=-1,d=[]):"Y"===a?(b=1,d=[]):d=[a]):d.push(k[a]);e.push(parseInt(d.join(""),n)*b+l);return e},u=function(f){for(var e=[],c=f.length,a,b=0;b<c;b++)a=f[b],e.push(w(a.x)),e.push(w(a.y));return e.join("_")},t=function(g){var e=[];g=g.split("_");for(var c=g.length/2,a=0;a<c;a++)e.push({x:f(g[2*a]),y:f(g[2*a+1])});return e},y=function(f){return["image/jsignature;base30",
u(f)]},C=function(f,e,c){"string"===typeof f&&("image/jsignature;base30"===f.substring(0,23).toLowerCase()&&(f=f.substring(24)),c(t(f)))};if(null==this.jQuery)throw Error("We need jQuery for some of the functionality. jQuery is not detected. Failing to initialize...");(function(f){f=f.fn.jSignature;f("addPlugin","export","base30",y);f("addPlugin","export","image/jsignature;base30",y);f("addPlugin","import","base30",C);f("addPlugin","import","image/jsignature;base30",C)})(this.jQuery);this.jSignatureDebug&&
(this.jSignatureDebug.base30={remapTailChars:v,compressstrokeleg:w,uncompressstrokeleg:f,compressstrokes:u,uncompressstrokes:t,charmap:r})}).call("undefined"!==typeof window?window:this);
(function(){function r(e,c){this.x=e;this.y=c;this.reverse=function(){return new this.constructor(-1*this.x,-1*this.y)};this._length=null;this.getLength=function(){this._length||(this._length=Math.sqrt(Math.pow(this.x,2)+Math.pow(this.y,2)));return this._length};var a=function(a){return Math.round(a/Math.abs(a))};this.resizeTo=function(b){if(0===this.x&&0===this.y)this._length=0;else if(0===this.x)this._length=b,this.y=b*a(this.y);else if(0===this.y)this._length=b,this.x=b*a(this.x);else{var c=Math.abs(this.y/
this.x),e=Math.sqrt(Math.pow(b,2)/(1+Math.pow(c,2))),c=c*e;this._length=b;this.x=e*a(this.x);this.y=c*a(this.y)}return this};this.angleTo=function(a){var c=this.getLength()*a.getLength();return 0===c?0:Math.acos(Math.min(Math.max((this.x*a.x+this.y*a.y)/c,-1),1))/Math.PI}}function k(e,c){this.x=e;this.y=c;this.getVectorToCoordinates=function(a,b){return new r(a-this.x,b-this.y)};this.getVectorFromCoordinates=function(a,b){return this.getVectorToCoordinates(a,b).reverse()};this.getVectorToPoint=function(a){return new r(a.x-
this.x,a.y-this.y)};this.getVectorFromPoint=function(a){return this.getVectorToPoint(a).reverse()}}function g(e,c){var a=Math.pow(10,c);return Math.round(e*a)/a}function n(e,c,a){c+=1;var b=new k(e.x[c-1],e.y[c-1]),d=new k(e.x[c],e.y[c]),d=b.getVectorToPoint(d),f=new k(e.x[c-2],e.y[c-2]),b=f.getVectorToPoint(b);return b.getLength()>a?(a=2<c?(new k(e.x[c-3],e.y[c-3])).getVectorToPoint(f):new r(0,0),e=0.35*b.getLength(),f=b.angleTo(a.reverse()),c=d.angleTo(b.reverse()),a=(new r(a.x+b.x,a.y+b.y)).resizeTo(Math.max(0.05,
f)*e),d=(new r(b.x+d.x,b.y+d.y)).reverse().resizeTo(Math.max(0.05,c)*e),d=new r(b.x+d.x,b.y+d.y),["c",g(a.x,2),g(a.y,2),g(d.x,2),g(d.y,2),g(b.x,2),g(b.y,2)]):["l",g(b.x,2),g(b.y,2)]}function s(e,c){var a=e.x.length-1,b=new k(e.x[a],e.y[a]),d=new k(e.x[a-1],e.y[a-1]),b=d.getVectorToPoint(b);if(1<a&&b.getLength()>c){var a=(new k(e.x[a-2],e.y[a-2])).getVectorToPoint(d),d=b.angleTo(a.reverse()),f=0.35*b.getLength(),a=(new r(a.x+b.x,a.y+b.y)).resizeTo(Math.max(0.05,d)*f);return["c",g(a.x,2),g(a.y,2),g(b.x,
2),g(b.y,2),g(b.x,2),g(b.y,2)]}return["l",g(b.x,2),g(b.y,2)]}function v(e,c,a){c=["M",g(e.x[0]-c,2),g(e.y[0]-a,2)];a=1;for(var b=e.x.length-1;a<b;a++)c.push.apply(c,n(e,a,1));0<b?c.push.apply(c,s(e,a,1)):0===b&&c.push.apply(c,["l",1,1]);return c.join(" ")}function w(e){for(var c=[],a=[["fill",void 0,"none"],["stroke","color","#000000"],["stroke-width","lineWidth",2],["stroke-linecap",void 0,"round"],["stroke-linejoin",void 0,"round"]],b=a.length-1;0<=b;b--){var d=a[b][1],f=a[b][2];c.push(a[b][0]+
'="'+(d in e&&e[d]?e[d]:f)+'"')}return c.join(" ")}function f(e,c){var a=['<?xml version="1.0" encoding="UTF-8" standalone="no"?>','<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'],b,d=e.length,f,g=[],h=[],m=f=b=0,k=0,n=[];if(0!==d){for(b=0;b<d;b++){m=e[b];k=[];f={x:[],y:[]};for(var p=void 0,q=void 0,p=0,q=m.x.length;p<q;p++)k.push({x:m.x[p],y:m.y[p]});k=simplify(k,0.7,!0);p=0;for(q=k.length;p<q;p++)f.x.push(k[p].x),f.y.push(k[p].y);n.push(f);g=
g.concat(f.x);h=h.concat(f.y)}d=Math.min.apply(null,g)-1;b=Math.max.apply(null,g)+1;g=Math.min.apply(null,h)-1;h=Math.max.apply(null,h)+1;m=0>d?0:d;k=0>g?0:g;b-=d;f=h-g}a.push('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="'+b.toString()+'" height="'+f.toString()+'">');b=0;for(d=n.length;b<d;b++)f=n[b],a.push("<path "+w(c)+' d="'+v(f,m,k)+'"/>');a.push("</svg>");return a.join("")}function u(e,c){return[C,f(e,c)]}function t(e,c){return[q,y(f(e,c))]}(function(e,c){"use strict";(typeof exports!=
c+""?exports:e).simplify=function(a,b,d){b=b!==c?b*b:1;if(!d){var e=a.length,f,g=a[0],m=[g];for(d=1;d<e;d++){f=a[d];var k=f.x-g.x,n=f.y-g.y;k*k+n*n>b&&(m.push(f),g=f)}a=(g!==f&&m.push(f),m)}f=a;d=f.length;var e=new (typeof Uint8Array!=c+""?Uint8Array:Array)(d),g=0,m=d-1,p,q,r=[],s=[],y=[];for(e[g]=e[m]=1;m;){n=0;for(k=g+1;k<m;k++){p=f[k];var z=f[g],v=f[m],t=z.x,u=z.y,z=v.x-t,B=v.y-u,w=void 0;if(0!==z||0!==B)w=((p.x-t)*z+(p.y-u)*B)/(z*z+B*B),1<w?(t=v.x,u=v.y):0<w&&(t+=z*w,u+=B*w);p=(z=p.x-t,B=p.y-
u,z*z+B*B);p>n&&(q=k,n=p)}n>b&&(e[q]=1,r.push(g),s.push(q),r.push(q),s.push(m));g=r.pop();m=s.pop()}for(k=0;k<d;k++)e[k]&&y.push(f[k]);return a=y,a}})(window);if("function"!==typeof y)var y=function(e){var c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".split(""),a,b,d,f,g=0,h=0,k="",k=[];do a=e.charCodeAt(g++),b=e.charCodeAt(g++),d=e.charCodeAt(g++),f=a<<16|b<<8|d,a=f>>18&63,b=f>>12&63,d=f>>6&63,f&=63,k[h++]=c[a]+c[b]+c[d]+c[f];while(g<e.length);k=k.join("");e=e.length%3;return(e?
k.slice(0,e-3):k)+"===".slice(e||3)};var C="image/svg+xml",q="image/svg+xml;base64";if("undefined"===typeof $)throw Error("We need jQuery for some of the functionality. jQuery is not detected. Failing to initialize...");(function(e){e=e.fn.jSignature;e("addPlugin","export","svg",u);e("addPlugin","export",C,u);e("addPlugin","export","svgbase64",t);e("addPlugin","export",q,t)})($)})();
})(window.jQuery);