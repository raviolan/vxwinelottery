// Copied and adapted from template: removed dependency on move.js
(function () {
  var settings = {};
  var lotteryBoxEl;
  // Ensure winner names display with first letter uppercase and the rest lowercase
  function formatDisplayName(name) {
    try {
      if (!name || typeof name !== 'string') return name;
      return name
        .trim()
        .split(/\s+/)
        .map(function(part){
          return part
            .split('-')
            .map(function(seg){
              var lower = seg.toLowerCase();
              return lower ? lower.charAt(0).toUpperCase() + lower.slice(1) : seg;
            })
            .join('-');
        })
        .join(' ');
    } catch (e) {
      return name;
    }
  }

  // Winner animation variants for randomized layers (extend via window.WINNER_ANIM_VARIANTS)
  var WINNER_ANIM_VARIANTS = {
    lights: [
      '/assets/lottie/lights-purple.json',
      '/assets/lottie/lights-pink.json',
      '/assets/lottie/lights-pastel.json',
      '/assets/lottie/lights-glitter.json'
    ],
    // "Butterfly animation" pool: always choose something (no empty option)
    overlay: [
      '/assets/lottie/butterflies-magenta.json',
      '/assets/lottie/butterflies-teal.json',
      '/assets/lottie/confetti.json',
      '/assets/lottie/confetti-pink.json',
      '/assets/lottie/confetti-pastel.json',
      '/assets/lottie/confetti-glitter.json',
      '/assets/lottie/fireworks.json',
      '/assets/lottie/fireworks-pink.json',
      '/assets/lottie/fireworks-pastel.json',
      '/assets/lottie/fireworks-glitter.json',
      '/assets/lottie/burst.json',
      '/assets/lottie/burst-pink.json',
      '/assets/lottie/burst-pastel.json',
      '/assets/lottie/burst-glitter.json'
    ]
  };
  if (typeof window !== 'undefined' && window.WINNER_ANIM_VARIANTS) {
    try {
      // Shallow merge arrays if provided
      ['lights','overlay'].forEach(function(k){
        if (Array.isArray(window.WINNER_ANIM_VARIANTS[k])) {
          WINNER_ANIM_VARIANTS[k] = window.WINNER_ANIM_VARIANTS[k].slice();
        }
      });
    } catch(e) {}
  }
  function pickRandom(arr, opts){
    var a = Array.isArray(arr) ? arr : [];
    if (!a.length) return null;
    // If null is present and disallowed, filter out
    if (opts && opts.noNull) a = a.filter(function(x){ return x; });
    if (!a.length) return null;
    return a[Math.floor(Math.random()*a.length)] || null;
  }
  var defaultOptions = {
    timeout: 4,
    once: true,
    title: "name",
    subtitle: null,
    api: null,
    confetti: true,
    showbtn: true,
    el: "body",
    fitsize: true,
    speed: 350,
    data: {},
    winners: [],
    winnerList: [],
    winnerHistory: [],
    number: 1,
    _round: 0,
    $el: null
  }

  var originalNumberOfCompetitors = 0;

  var profileEls = {}
  var itemSideSize;
  var diceIconHtml = "<i class='dh-icon dh-icon-dice'>🎲<svg><use xlink:href='#dh-dice'/></svg></i>"
  var saveIconHtml = "<i class='dh-icon dh-icon-dice'>💾<svg><use xlink:href='#dh-save'/></svg></i>"
  var okayIconHtml = "<i class='dh-icon dh-icon-okay'>👌<svg><use xlink:href='#dh-okay'/></svg></i>"
  var crownIconHtml = "<i class='dh-icon dh-icon-crown'>👑<svg><use xlink:href='#dh-crown'/></svg></i>"

  $(document).keypress(function(e) {
    e.preventDefault();
    return false;
  });
  // Removed global onbeforeunload to avoid reload confirmation prompts

  var initDom = function(dom){
    var svgIcons = $("\
      <svg xmlns='http://www.w3.org/2000/svg' style='display: none;'>\
        <symbol id='dh-okay' viewBox='0 0 57 92'>\
          <path fill='currentColor' fill-rule='nonzero' d='M3.6 51c2.5-1 5.2.3 6.2 2.7 1.3 3.5 4.6 5.8 8.3 5.8 5 0 9.2-4 9.2-9s-4-9-9-9c-3.8 0-7 2.2-8.4 5.6C8.8 49.7 6 51 3.6 50c-2.4-1-3.6-3.7-2.6-6C3.8 36.4 10.5 32 18 32c3.5 0 6.7 1 9.5 2.5l-8.8-22c-1-2.5.3-5.2 2.7-6.2 2.4-1 5.2.3 6 2.7L37 32.4 33.4 6.2c-.3-2.5 1.5-5 4-5.3 2.7-.4 5 1.4 5.4 4L46 29.7l1-11c.2-2.7 2.5-4.7 5-4.4 2.7.2 4.7 2.5 4.4 5l-3.6 41-4 30.8h-29l4.8-23.3c-2 .8-4.2 1.2-6.5 1.2C10.6 69 4 64.2 1 57c-1-2.4.2-5.2 2.6-6z'/>\
        </symbol>\
        <symbol id='dh-crown' viewBox='0 0 88 81'>\
          <path fill='currentColor' fill-rule='nonzero' d='M83 23c-2.6 0-4.8 2.3-4.8 5 0 1.6.8 3 2 4L69.6 48.2l-4-27.8c2.5-.3 4.3-2.3 4.3-4.7 0-2.7-2.2-4.8-4.8-4.8-2.7 0-4.8 2-4.8 4.8 0 2 1.3 3.8 3 4.4l-8 22-9.8-32c2-.6 3.4-2.4 3.4-4.6C48.8 3 46.6.8 44 .8c-2.6 0-4.8 2.2-4.8 4.8 0 2.2 1.4 4 3.4 4.6l-9.8 32-8-22c1.8-.6 3-2.4 3-4.4 0-2.7-2-4.8-4.7-4.8-2.6 0-4.7 2-4.7 4.8 0 2.4 1.8 4.3 4 4.7l-3.8 27.8-11-16.5c1.4-.8 2.3-2.3 2.3-4C9.8 25.2 7.6 23 5 23 2.4 23 .2 25.2.2 27.8c0 2.7 2.2 4.8 4.8 4.8.4 0 .8 0 1.2-.2l9.7 41s18.6-1.6 28-1.6c9.4 0 28 1.6 28 1.6L82 32.6H83c2.6 0 4.8-2 4.8-4.7s-2.2-5-4.8-5zM26 62.7c-2 0-3.6-1.6-3.6-3.5 0-2 1.6-3.5 3.6-3.5s3.6 1.6 3.6 3.6-1.6 3.6-3.6 3.6zm18 2.2c-3.2 0-5.8-2.5-5.8-5.7 0-3 2.6-5.7 5.8-5.7 3.2 0 5.8 2.6 5.8 5.8 0 3.3-2.6 5.8-5.8 5.8zm18-2.2c-2 0-3.6-1.6-3.6-3.5 0-2 1.6-3.5 3.6-3.5s3.6 1.6 3.6 3.6-1.6 3.6-3.6 3.6z'/>\
        </symbol>\
        <symbol id='dh-dice' viewBox='0 0 90 76'>\
          <path fill='currentColor' fill-rule='nonzero' d='M83.6 34.5c-1-.4-2.2 0-2.6 1-.4 1 0 2.3 1 2.7 4.4 1.7 4 3.2 3.6 4-.5 1.8-5.8 4-12.7 5.3l8.7-15.2c1.7-3 .7-6.7-2.3-8.4L39.7 1c-3-1.8-6.7-.7-8.5 2.2L10.8 38.6c-4.4-1.4-6.6-3-6.6-4 0-2 2.6-4.3 9.8-6 1-.2 1.8-1.3 1.6-2.4-.3-1-1.4-1.8-2.4-1.5C1.8 27.3.2 32 .2 34.5c0 7 14 9.5 21.7 10.4 0-.2 0-.3-.2-.5-.8-3 1-6 4-6.7 2.8-.8 5.8 1 6.6 4 .8 2.8-1 5.8-4 6.6-2 .6-4.3-.3-5.6-2-.5.5-1 .8-1.8.7-5.4-.4-9.8-1.3-13.3-2.4-.6 2.6.5 5.4 3 6.8l38.8 22.4s2.4 1.6 4.2 1.6c1.8 0 3.4-1.6 3.4-1.6.8-.4 1.3-1 1.7-1.8l10-17.2-6.3.3c-1 0-2-.6-2-1.5-.2-.2-.2-.4-.2-.6 9-.3 27-2.8 29.3-9.5 1-2.7.6-6.5-6-9zm-48-13.7c-1-3 1-6 3.8-6.7 3-.7 6 1 6.7 4 1 3-1 6-3.8 6.7-3 .7-6-1-6.7-4zm15 40.3c-3 1-6-.8-6.7-3.7-1-3 1-6 3.8-6.7 3-.8 6 1 6.7 3.8.8 3-1 6-4 6.7zm13.7-23.6c-3 .8-6-1-6.7-4-.8-2.8 1-5.8 4-6.6 2.8-.7 5.8 1 6.6 4 .8 2.8-1 5.8-4 6.6z'/>\
        </symbol>\
        <symbol id='dh-save' viewBox='-4 -4 32 32'>\
          <path fill='currentColor' fill-rule='nonzero' d='M19 11h-14v-2h14v2zm0 2h-14v2h14v-2zm0 4h-14v2h14v-2zm3-11v16h-20v-16h20zm2-6h-24v24h24v-24z'/>\
        </symbol>\
      </svg>\
    ");

    var isAppleOs = navigator.platform && (navigator.platform.toLowerCase().indexOf('mac') >= 0 || /iPad|iPhone|iPod/.test(navigator.platform) );
    lotteryBoxEl = $("<div class='dh-lottery" + (isAppleOs ? " is-mac" : "") + "'></div>");
    var selectorbox = $("<div id='dh-lottery-selector' style='display: none'></div>");
    var container = $("\
      <div class='main-container'>\
        <canvas id='canvas'></canvas>\
        <div class='userlist columns is-multiline is-mobile'></div>\
      </div>\
    ");
    var btn = $("\
      <div class='actions'>\
        <a class='button primary' id='dh-history-show'>" + saveIconHtml + "</a>\
        <a class='button primary' id='dh-lottery-go'>" + diceIconHtml + "</a>\
      </div>\
    ");
    var modal = $("\
      <div class='dh-modal" + (isAppleOs ? ' is-mac': '') + "' id='dh-lottery-winner'>\
        <div class='dh-modal-background'></div>\
        <div class='dh-modal-content'></div>\
        <button class='dh-modal-close'></button>\
      </div>\
    ");
    var history = $("<div class='dh-modal-content'></div>");
    lotteryBoxEl.append(svgIcons);
    lotteryBoxEl.append(container);
    // place selector overlay inside main-container so positions align
    container.append(selectorbox);
    lotteryBoxEl.append(history);
    $("#list").append(history);
    if (settings.showbtn) lotteryBoxEl.append(btn);
    dom.append(lotteryBoxEl);
    dom.append(modal);

    $('#dh-lottery-go').click(function() {
      if (lotteryInterval) {
        return stopLottery();
      } else {
        return startLottery();
      }
    });
    $('#dh-lottery-winner .dh-modal-close').click(function() {
      $('#dh-lottery-winner').removeClass('is-active');
      // Disable beforeunload handler to avoid confirmation prompt before reloading
      try { window.onbeforeunload = null; } catch(e) {}
      try { window.location.reload(); } catch(e) {}
      return false;
    });
    $('#dh-lottery-history .dh-history-clean').click(function() { cleanHistory(); });

    $('#dh-lottery-history .dh-number-inc').click(function () {
      if (settings.number < 10) {
        settings.number += 1;
        localStorage.setItem('lotteryConfigNumber', settings.number);
        $('#dh-lottery-history .dh-number').text(settings.number);
      }
    });
    $('#dh-lottery-history .dh-number').click(function () {
      settings.number = 1;
      localStorage.setItem('lotteryConfigNumber', settings.number);
      $('#dh-lottery-history .dh-number').text(settings.number);
    });
    $('#dh-lottery-history .dh-number-dec').click(function () {
      if (settings.number > 1) {
        settings.number -= 1;
        localStorage.setItem('lotteryConfigNumber', settings.number);
        $('#dh-lottery-history .dh-number').text(settings.number);
      }
    });

    $('#dh-history-show').click(function() {
      showHistory();
      $('#dh-lottery-history .dh-number').text(settings.number);
    });
    document.body.onkeydown = function(e) {
      if (e.keyCode == 27) return $('.dh-modal-close').click();
      if (e.keyCode == 32) {
        if ($('#dh-lottery-winner').hasClass('is-active')) return;
        if ($('.lotterybox').hasClass('running-lottery')) return;
        return $('#dh-lottery-go').click();
      }
      // Option/Alt + R triggers Roll
      try {
        var isAltR = (e.altKey === true) && (e.key === 'r' || e.key === 'R');
        if (isAltR) {
          e.preventDefault();
          if ($('#dh-lottery-winner').hasClass('is-active')) return;
          if ($('.lotterybox').hasClass('running-lottery')) return;
          return $('#dh-lottery-go').click();
        }
      } catch(_) {}
      if (e.key == 'd') {
        if(confirm('Vill du rensa dragna platser?')) { cleanHistory(); return; }
      }
    };
    showHistory();
  }

  var initSelector = function() {
    var el = "";
    for (var i = 0; i < settings.number; i++){
      var selector = "\
        <span class='image' id='selector_"+i+"'>\
          <div class='selector-border'></div>\
        </span>\
      ";
      el = el + selector;
    }
    $("#dh-lottery-selector").html(el);
    setTimeout(function() {
      positionList = getAllPosition();
      $('#dh-lottery-selector .image').show();
      for (var i = 0; i < settings.number; i++) moveToTarget(i,0);
    }, 1000);
    if (settings.fitsize) setItemSize(itemSideSize);
  }

  var formatTemplate = function(data, tmpl) {
    var format = { name: function(x) { return x; } };
    return tmpl.replace(/\{(\w+)\}/g, function(m1, m2) {
      if (!m2) return "";
      return (format && format[m2]) ? format[m2](data[m2]) : data[m2];
    });
  }

  var newUser = function(item){
    var template = "\
      <div class='column'>\
        <div class='profile' data-profile='{json}'>\
            <div class='profile__parent'>\
                <div class='profile__wrapper'>\
                    <div class='profile__content'>\
                        <div class='avatar'><span class='image avatar-image is-128x128'><img src='{avatar}' alt='avatar'/></span></div>\
                    </div>\
                </div>\
            </div>\
        </div>\
      </div>\
    ";
    item['json'] = encodeURIComponent(JSON.stringify(item));
    var html = formatTemplate(item,template);
    return $(".userlist").append(html);
  }

  var loadApi = function(){
    $.ajax({
      type: 'GET',
      url: settings.api,
      dataType: 'json',
      success: function(data){
        settings.data = data;
        readyLottery();
      },
      error: function(xhr, type){
        alert('Lottery: Load player list error!\n'+type+'\n'+type);
      }
    })
  }

  var isInHistory = function(avatar) {
    var i = settings.winnerHistory.length;
    while(i--) {
      for(var j in settings.winnerHistory[i].winner) {
        if(settings.winnerHistory[i].winner[j].avatar===avatar) {
          return true;
        }
      }
    }
    return false;
  };

  var readyLottery = function(){
    settings.$el = $(settings.el);
    if(localStorage.getItem('lotteryHistory')) settings.winnerHistory = JSON.parse(localStorage.getItem('lotteryHistory'));
    originalNumberOfCompetitors = settings.data.length;
    if(settings.winnerHistory) {
      var i = settings.data.length;
      while(i--) {
        if(isInHistory(settings.data[i].avatar)) {
          settings.data.splice(i,1);
        }
      }
    }
    initDom(settings.$el);
    $.each(settings.data, function(index,item){
      item['id'] = index;
      newUser(item);
    })
    if(settings.fitsize) fitsize();
    if(settings.confetti) window.readyConfetti();
  }

  var fitsize = function(){
    var $container = $(".main-container");
    var $userlist = $(".userlist");
    var containerSize = $container.height() * $container.width();
    var number = settings.data.length || 1;
    // optimistic starting point so we don't leave excess space
    itemSideSize = Math.max(10, Math.round(Math.sqrt(containerSize / number) / 1.15));
    setItemSize(itemSideSize);
    var guard = 0;
    // grow until it would overflow
    while (
      $userlist.outerHeight() <= $container.height() &&
      $userlist.outerWidth() <= $container.width() &&
      guard < 400
    ) {
      var prev = itemSideSize;
      itemSideSize += 2;
      setItemSize(itemSideSize);
      guard++;
      if ($userlist.outerHeight() > $container.height() || $userlist.outerWidth() > $container.width()) {
        // step back to last good size
        itemSideSize = prev;
        setItemSize(itemSideSize);
        break;
      }
    }
    // safety shrink if still overflowing
    guard = 0;
    while ( ($userlist.outerHeight() > $container.height() || $userlist.outerWidth() > $container.width()) && guard < 200) {
      if (itemSideSize <= 10) break;
      itemSideSize -= 2;
      setItemSize(itemSideSize);
      guard++;
    }
    getAllPosition();
  }

  var setItemSize = function(itemSideSize){
    $(".dh-lottery .avatar .image").css('height',itemSideSize+'px');
    $(".dh-lottery .avatar .image").css('width',itemSideSize+'px');
    $("#dh-lottery-selector .image").css('height',itemSideSize+'px');
    $("#dh-lottery-selector .image").css('width',itemSideSize+'px');
  }

  var positionList = [];
  var currentTarget = [];
  var winnerProfile = [];
  var lotteryInterval = null;
  var lotteryTimeout = null;

  $(window).resize(function() {
    positionList = getAllPosition();
    for(var i in currentTarget) moveToTarget(i,currentTarget[i]);
    if (settings.fitsize) fitsize();
  });

  var getAllPosition = function() {
    return $.map($('.profile'), function(el, index) {
      profileEls[index] = el
      return $(el).find('.avatar-image').first().position();
    });
  };

  var arrayCount = function(o){
    var n = 0;
    for(var i in o) n++;
    return n;
  }

      var pushWinner = function(winnerProfile, opts){
        opts = opts || {};
        var noGift = !!opts.noGift;
        var stage = $("\
          <div class='winner-stage'>\
            <div class='winner-lights'></div>\
            <div class='winner-center'>\
              <div class='winner-giftbox'></div>\
              <div class='winner-butterflies'></div>\
              <img class='winner-portrait' src='' alt='winner' />\
            </div>\
            <div class='winner-text'>\
              <h2 class='profile-name'></h2>\
              <h3 class='profile-subtitle'></h3>\
              <h4 class='profile-desc'></h4>\
            </div>\
          </div>\
        ");
        var cardSubTitle, cardTitle, cardDesc;
        var displayName = '';
        var displaySubtitle = '';
        var displayDesc = '';
        if (winnerProfile) {
          stage.find('.winner-portrait').attr('src', winnerProfile['avatar']);
          if (winnerProfile['data'] && Object.keys(winnerProfile['data']).length > 0) {
            cardTitle = winnerProfile['data'][settings.title];
            cardSubTitle = winnerProfile['data'][settings.subtitle];
            cardDesc = winnerProfile['data'][settings.desc];
          }
          displayName = formatDisplayName(cardTitle || winnerProfile['name']);
          displaySubtitle = (cardSubTitle || winnerProfile['company']) || '';
          displayDesc = (cardDesc || '') || '';
        }
        // Hide text until portrait reveal completes
        stage.find('.winner-text').removeClass('is-visible');
        $("#dh-lottery-winner .dh-modal-content").append(stage);

        // Initialize Lottie animations when available
        try {
          var l = window.lottie;
          if (l) {
            // Helper: keep lights centered behind the portrait
            var positionLights = function(){
              try {
                var ctr = stage.find('.winner-center')[0];
                var lights = stage.find('.winner-lights')[0];
                var portrait = stage.find('.winner-portrait')[0];
                if (!ctr || !lights || !portrait) return;
                var cr = ctr.getBoundingClientRect();
                var pr = portrait.getBoundingClientRect();
                var cx = pr.left + pr.width/2 - cr.left;
                var cy = pr.top + pr.height/2 - cr.top;
                lights.style.left = cx + 'px';
                lights.style.top = cy + 'px';
                var sz = Math.max(pr.width * 3.0, 320);
                lights.style.width = sz + 'px';
                lights.style.height = sz + 'px';
                lights.style.transform = 'translate(-50%, -50%)';
              } catch(e) {}
            };
            var _onResizeLights = function(){ positionLights(); };
            var sanitize = function(json){
              var blocked = /(kurage|watermark|website|mobile|apps|software|lottiefiles|author|credits)/i;
              function shouldDrop(layer){
                var name = (layer && layer.nm ? String(layer.nm) : '');
                // drop all explicit text layers or anything matching blocked words
                if (layer.ty === 5) return true;
                if (blocked.test(name)) return true;
                // drop any layer that contains a text payload
                if (layer.t) return true;
                return false;
              }
              function strip(obj){
                if (obj.layers && Array.isArray(obj.layers)) {
                  obj.layers = obj.layers.filter(function(layer){
                    return !shouldDrop(layer);
                  });
                  obj.layers.forEach(strip);
                }
                if (obj.assets && Array.isArray(obj.assets)) {
                  obj.assets.forEach(strip);
                }
                return obj;
              }
              try { return strip(json); } catch(e){ return json; }
            };
            var loadSanitized = function(path, container, opts){
              return fetch(path).then(function(r){ return r.json(); }).then(function(data){
                var clean = sanitize(data);
                // Optional recolor passes for specific themed variants
                if (typeof path === 'string' && path.indexOf('butterflies-teal') !== -1) {
                  try {
                    var isMagentaish = function(r,g,b){
                      var maxRB = Math.max(r,b), minRB = Math.min(r,b);
                      return (
                        g <= 0.55 &&
                        maxRB >= 0.5 &&
                        (r - g) >= 0.15 &&
                        (b - g) >= 0.15 &&
                        Math.abs(r - b) <= 0.35
                      );
                    };
                    var toTeal = function(col){
                      if (!Array.isArray(col) || col.length < 3) return col;
                      var r = col[0], g = col[1], b = col[2], a = (col[3] != null ? col[3] : 1);
                      if (isMagentaish(r,g,b)) return [0.0, 0.82, 0.82, a];
                      return [r,g,b,a];
                    };
                    var recolorColorProp = function(prop){
                      if (!prop) return;
                      // Static color: prop = { a:0, k:[r,g,b,1] }
                      if (Array.isArray(prop.k) && typeof prop.k[0] === 'number') {
                        prop.k = toTeal(prop.k);
                        return;
                      }
                      // Keyframed color: prop = { a:1, k:[{s:[r,g,b,1], ...}, ...] }
                      if (Array.isArray(prop.k) && prop.k.length && typeof prop.k[0] === 'object') {
                        prop.k.forEach(function(kf){ if (kf && Array.isArray(kf.s)) kf.s = toTeal(kf.s); });
                        return;
                      }
                      // Nested structures seen in some exports
                      if (prop.k && Array.isArray(prop.k.k)) {
                        var kk = prop.k.k;
                        if (kk.length && typeof kk[0] === 'object') kk.forEach(function(kf){ if (kf && Array.isArray(kf.s)) kf.s = toTeal(kf.s); });
                        if (kk.length && typeof kk[0] === 'number') prop.k.k = toTeal(kk);
                      }
                    };
                    var recolorGradientProp = function(gprop){
                      if (!gprop || !gprop.k) return;
                      var arr = gprop.k.k || gprop.k;
                      if (Array.isArray(arr)) {
                        for (var i = 0; i < arr.length - 3; i += 4) {
                          var repl = toTeal([arr[i+1], arr[i+2], arr[i+3], 1]);
                          arr[i+1] = repl[0]; arr[i+2] = repl[1]; arr[i+3] = repl[2];
                        }
                        if (gprop.k.k) gprop.k.k = arr; else gprop.k = arr;
                      }
                    };
                    var walk = function(obj){
                      if (!obj || typeof obj !== 'object') return;
                      // Solid fills and strokes
                      if ((obj.ty === 'fl' || obj.ty === 'st') && obj.c) recolorColorProp(obj.c);
                      // Gradients (fill or stroke)
                      if ((obj.ty === 'gf' || obj.ty === 'gs') && obj.g) recolorGradientProp(obj.g);
                      // Recurse into shape groups and other nested structures
                      for (var key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) walk(obj[key]);
                    };
                    walk(clean);
                  } catch (e) {}
                }
                // Lights / Confetti / Fireworks / Burst themed palettes
                if (typeof path === 'string' && (/(lights-|confetti-|fireworks-|burst-)/.test(path))) {
                  try {
                    var makePalette = function(kind){
                      switch(kind){
                        case 'pink':
                          return [
                            [1.0, 0.4, 0.76, 1],   // hot pink
                            [1.0, 0.18, 0.67, 1],  // magenta pink
                            [1.0, 0.58, 0.85, 1],  // candy pink
                            [0.9, 0.62, 1.0, 1],   // lavender
                            [1.0, 0.74, 0.9, 1]    // blush
                          ];
                        case 'pastel':
                          return [
                            [1.0, 0.82, 0.91, 1],  // pastel pink
                            [0.96, 0.87, 1.0, 1],  // pastel lavender
                            [0.93, 0.95, 1.0, 1],  // powder blue
                            [1.0, 0.95, 0.98, 1],  // soft rose
                            [1.0, 0.92, 0.96, 1]   // light blush
                          ];
                        case 'glitter':
                          return [
                            [1.0, 1.0, 1.0, 1],    // white highlight
                            [1.0, 0.96, 0.99, 1],  // pearl
                            [1.0, 0.91, 0.97, 1],  // shimmer pink
                            [0.98, 0.9, 1.0, 1],   // shimmer lilac
                            [1.0, 0.86, 0.96, 1]   // sparkle rose
                          ];
                        default:
                          return null;
                      }
                    };
                    var kind = (path.indexOf('lights-pink') !== -1 || path.indexOf('confetti-pink') !== -1 || path.indexOf('fireworks-pink') !== -1 || path.indexOf('burst-pink') !== -1) ? 'pink'
                              : (path.indexOf('lights-pastel') !== -1 || path.indexOf('confetti-pastel') !== -1 || path.indexOf('fireworks-pastel') !== -1 || path.indexOf('burst-pastel') !== -1) ? 'pastel'
                              : (path.indexOf('lights-glitter') !== -1 || path.indexOf('confetti-glitter') !== -1 || path.indexOf('fireworks-glitter') !== -1 || path.indexOf('burst-glitter') !== -1) ? 'glitter'
                              : null;
                    var palette = makePalette(kind);
                    if (palette) {
                      var idx = 0;
                      var pick = function(){ var c = palette[idx % palette.length]; idx++; return c; };
                      var setColorProp = function(prop){
                        if (!prop) return;
                        if (Array.isArray(prop.k) && typeof prop.k[0] === 'number') { prop.k = pick(); return; }
                        if (Array.isArray(prop.k) && prop.k.length && typeof prop.k[0] === 'object') {
                          prop.k.forEach(function(kf){ if (kf && Array.isArray(kf.s)) kf.s = pick(); });
                          return;
                        }
                        if (prop.k && Array.isArray(prop.k.k)) {
                          var kk = prop.k.k;
                          if (kk.length && typeof kk[0] === 'object') kk.forEach(function(kf){ if (kf && Array.isArray(kf.s)) kf.s = pick(); });
                          if (kk.length && typeof kk[0] === 'number') prop.k.k = pick();
                        }
                      };
                      var setGradientProp = function(gprop){
                        if (!gprop || !gprop.k) return;
                        var arr = gprop.k.k || gprop.k;
                        if (Array.isArray(arr)) {
                          for (var i = 0; i < arr.length - 3; i += 4) {
                            var c = pick();
                            arr[i+1] = c[0]; arr[i+2] = c[1]; arr[i+3] = c[2];
                          }
                          if (gprop.k.k) gprop.k.k = arr; else gprop.k = arr;
                        }
                      };
                      var walkPal = function(obj){
                        if (!obj || typeof obj !== 'object') return;
                        if ((obj.ty === 'fl' || obj.ty === 'st') && obj.c) setColorProp(obj.c);
                        if ((obj.ty === 'gf' || obj.ty === 'gs') && obj.g) setGradientProp(obj.g);
                        for (var key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) walkPal(obj[key]);
                      };
                      walkPal(clean);
                    }
                  } catch (e) {}
                }
                return l.loadAnimation(Object.assign({ container: container, renderer: 'svg', autoplay: true }, opts || {}, { animationData: clean }));
              });
            };

            // Randomized Lottie variants per winner
            var lightsPath = pickRandom(WINNER_ANIM_VARIANTS.lights, { noNull: true });
            var overlayPath = pickRandom(WINNER_ANIM_VARIANTS.overlay, { noNull: true });
            if (!overlayPath) overlayPath = '/assets/lottie/butterflies-magenta.json';
            var centerPath = '/assets/lottie/gift-box.json';
            // Lights (loop)
            if (lightsPath) {
              loadSanitized(lightsPath, stage.find('.winner-lights')[0], { loop: true }).then(function(){
                positionLights();
                try { window.addEventListener('resize', _onResizeLights); } catch(e) {}
              });
            }
            // Centerpiece (plays once) unless disabled via noGift
            if (!noGift) {
              loadSanitized(centerPath, stage.find('.winner-giftbox')[0], { loop: false }).then(function(gift){
                // Hide the selector spotlight as soon as the gift animation is ready to start
                try { $('#dh-lottery-selector').hide(); } catch(e) {}
                try {
                  gift.addEventListener('complete', function(){
                    stage.find('.winner-portrait').addClass('is-revealed');
                    stage.find('.winner-giftbox').css('display','none');
                    positionLights();
                    // Reveal text now that portrait is revealed
                    stage.find('.profile-name').text(displayName);
                    stage.find('.profile-subtitle').text(displaySubtitle);
                    stage.find('.profile-desc').text(displayDesc);
                    stage.find('.winner-text').addClass('is-visible');
                    // Start overlay ("butterfly animation") slightly after reveal begins (~15%)
                    try {
                      setTimeout(function(){
                        if (overlayPath) loadSanitized(overlayPath, stage.find('.winner-butterflies')[0], { loop: false });
                      }, 120);
                    } catch(e) {}
                  });
                } catch(e) {}
              });
            } else {
              // No gift flow: reveal immediately and start overlay shortly after
              stage.find('.winner-portrait').addClass('is-revealed');
              stage.find('.winner-giftbox').css('display','none');
              positionLights();
              stage.find('.profile-name').text(displayName);
              stage.find('.profile-subtitle').text(displaySubtitle);
              stage.find('.profile-desc').text(displayDesc);
              stage.find('.winner-text').addClass('is-visible');
              try { setTimeout(function(){ if (overlayPath) loadSanitized(overlayPath, stage.find('.winner-butterflies')[0], { loop: false }); }, 120); } catch(e) {}
            }
          }
        } catch(e) {}

        // Fallback: if Lottie events aren't available, reveal portrait after a delay
        setTimeout(function(){
          if (!stage.find('.winner-portrait').hasClass('is-revealed')){
            stage.find('.winner-portrait').addClass('is-revealed');
            stage.find('.winner-giftbox').css('display','none');
            try { positionLights(); } catch(e) {}
            // Fallback reveal of text after portrait
            stage.find('.profile-name').text(displayName);
            stage.find('.profile-subtitle').text(displaySubtitle);
            stage.find('.profile-desc').text(displayDesc);
            stage.find('.winner-text').addClass('is-visible');
            // Start overlay ~15% into reveal if we got here via fallback
            try {
              setTimeout(function(){
                if (overlayPath) loadSanitized(overlayPath, stage.find('.winner-butterflies')[0], { loop: false });
              }, 120);
            } catch(e) {}
          }
        }, 1500);
      }

  // Replaced move.js animation with CSS transition
  var moveToTarget = function(i,target) {
    $(profileEls[target]).addClass('current');
    if (!positionList[target]) return;
    var pos = positionList[target];
    var el = $('#dh-lottery-selector #selector_'+i);
    el.css({
      transition: 'left 200ms ease-in-out, top 200ms ease-in-out',
      left: (pos.left - 4) + 'px',
      top: (pos.top - 4) + 'px'
    });
    return currentTarget;
  };

      var getEligibleIndices = function(){
        var list = [];
        $('.profile').each(function(idx, el){
          try {
            var prof = JSON.parse(decodeURIComponent($(el).data('profile')));
            var id = prof && prof.id;
            var isGrey = $(el).hasClass('is-greyed');
            if (!settings.once || !settings.winnerList[id]) {
              if (!isGrey) list.push(idx);
            }
          } catch(e){ list.push(idx); }
        });
        return list;
      };

      var lotteryOnce = function(selector = 0){
        if (positionList <=0 ) return;
        var elig = getEligibleIndices();
        if (elig.length === 0) return;
        var targetIndex = elig[Math.floor(Math.random() * elig.length)];
        if($.inArray(targetIndex,currentTarget)>=0){
          return lotteryOnce(selector);
        }
        moveToTarget(selector,targetIndex);
        currentTarget.push(targetIndex);
      }

      var tickerTimeout = null;

      var startLottery = function(){
        initSelector()
        if( settings.once && ($('.profile').length - arrayCount(settings.winnerList)) < settings.number ){
          alert('No user left to participate in lottery.');
          return false;
        }
        settings.$el.addClass('running-lottery')
        $('#dh-lottery-selector').show();
        var tick = function(){
          currentTarget = [];
          $(".dh-lottery .profile.current").removeClass('current');
          for (var i = 0; i < settings.number; i++)  lotteryOnce(i);
          var next = Math.max(60, Math.round((Math.random()*0.8 + 0.2) * settings.speed));
          tickerTimeout = setTimeout(tick, next);
        };
        tick();
        if(settings.timeout) lotteryTimeout = setTimeout(stopLottery, settings.timeout * 1000);
        $('#dh-lottery-go').removeClass('primary').addClass('success').html(okayIconHtml);
        return true;
      }

  var updateWinnersList = function() { showHistory(); };

      // Final-two coin faceoff animation. Expects two profile indices.
      var startFinalTwoFaceoff = function(indexA, indexB){
        try { $('#dh-lottery-selector').hide(); } catch(e) {}
        var profA = JSON.parse(decodeURIComponent($($('.profile')[indexA]).data('profile')));
        var profB = JSON.parse(decodeURIComponent($($('.profile')[indexB]).data('profile')));
        var container = $("#dh-lottery-winner .dh-modal-content");
        container.html("");
        // Ensure no cropping during the faceoff (allow animations to overflow nicely)
        try {
          $("#dh-lottery-winner").css({ overflow: 'visible' });
          container.css({ overflow: 'visible', maxHeight: 'none', width: '100%', padding: '0' });
        } catch(e) {}
        var shell = $("<div class='final-two-faceoff' style='position:relative;width:100%;height:calc(100vh - 40px);overflow:visible'></div>");
          var makeCoin = function(){
          var wrap = $("<div style='width:260px;height:260px;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);perspective:900px;z-index:2'></div>");
          var coin = $("<div style='position:absolute;inset:0;border-radius:50%;transform-style:preserve-3d;'></div>");
          var mkFace = function(imgUrl, ringColor){
            var f = $("<div style='position:absolute;inset:0;border-radius:50%;backface-visibility:hidden;display:flex;align-items:center;justify-content:center;box-shadow:0 0 28px rgba(255,140,210,.7) inset, 0 10px 30px rgba(0,0,0,.35);background:radial-gradient(circle at 30% 30%, #ffe3f6, #ff98d4)'></div>");
            var img = $("<img alt='face' />");
            img.attr('src', imgUrl);
            img.css({ width: '180px', height: '180px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 4px '+ringColor+', 0 10px 24px rgba(255,140,210,.7)' });
            f.append(img);
            return f;
          };
          var faceA = mkFace(profA.avatar || '', '#ff8ccc');
          var faceB = mkFace(profB.avatar || '', '#ff8ccc').css({ transform: 'rotateY(180deg)' });
          coin.append(faceA, faceB);
          wrap.append(coin);
          return { wrap: wrap, coin: coin };
        };
        var c = makeCoin();
        // No header labels (A/B or names) for the final-two faceoff
        shell.append(c.wrap);
        container.append(shell);
        $('#dh-lottery-winner').addClass('is-active');

        // Merge-in thumbnails to either side of coin, then spin
        try {
          var mergeLayer = $("<div class='final-two-merge' style='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:1;pointer-events:none;'></div>");
          var mkThumb = function(src, dx){
            var t = $("<img alt='thumb' />");
            t.attr('src', src||'');
            t.css({ width:'120px', height:'120px', borderRadius:'50%', objectFit:'cover', position:'absolute', left:'0', top:'0', transform:'translate('+dx+'px, 0) scale(.9)', opacity:0, boxShadow:'0 0 0 3px #fff, 0 6px 16px rgba(0,0,0,.35)' });
            return t;
          };
          var tA = mkThumb(profA.avatar, -240);
          var tB = mkThumb(profB.avatar, 240);
          mergeLayer.append(tA, tB);
          shell.append(mergeLayer);
          try { tA[0].animate([{transform:'translate(-240px,0) scale(.9)',opacity:0},{transform:'translate(-110px,0) scale(1)',opacity:1},{transform:'translate(-110px,0) scale(1)',opacity:0}],{duration:600,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}); } catch(e) {}
          try { tB[0].animate([{transform:'translate(240px,0) scale(.9)',opacity:0},{transform:'translate(110px,0) scale(1)',opacity:1},{transform:'translate(110px,0) scale(1)',opacity:0}],{duration:600,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}); } catch(e) {}
          setTimeout(function(){ try { mergeLayer.remove(); } catch(e) {} }, 720);
        } catch(e) {}

        // Decide winner and spin
        var winSide = Math.random() < 0.5 ? 'A' : 'B';
        var spins = 14 + Math.floor(Math.random()*6);
        var targetDeg = (winSide === 'A') ? 0 : 180;
        var total = spins*360 + targetDeg;
        var el = c.coin[0];
        var coinDuration = 5600;
        var anim = setTimeout(function(){ try { el.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY('+total+'deg)' }], { duration: coinDuration, easing: 'cubic-bezier(.1,.9,.1,1)', fill: 'forwards' }).onfinish = function(){
          var winnerIndex = (winSide === 'A') ? indexA : indexB;
          var runnerIndex = (winSide === 'A') ? indexB : indexA;
          // Winner/runner micro reveal animation: Keep coin centered, scale up, runner emerges below
          try {
            var faceWrap = c.wrap;
            var winnerProfile = JSON.parse(decodeURIComponent($($('.profile')[winnerIndex]).data('profile')));
            var runnerProfile = JSON.parse(decodeURIComponent($($('.profile')[runnerIndex]).data('profile')));
            var overlay = $("<div class='final-two-overlay' style='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;'></div>");
            var runWrap = $("<div class='final-two-runner' style='position:absolute;left:0;top:0;width:180px;height:180px;opacity:0;z-index:1'></div>");
            var runImg = $("<img alt='runner' />"); runImg.attr('src', runnerProfile.avatar || ''); runImg.css({ width:'180px', height:'180px', borderRadius:'50%', objectFit:'cover', boxShadow:'0 0 0 4px #e6e6e6, 0 10px 24px rgba(154,154,154,.5)', position:'absolute', left:'0', top:'0' });
            var silver = $("<span class='final-two-medal' style='position:absolute;right:6px;bottom:6px;font-size:78px;z-index:3;color:#fff;filter: drop-shadow(0 2px 4px rgba(0,0,0,.45)) drop-shadow(0 0 10px rgba(255,255,255,.85))'>🥈</span>");
            var sp1 = $("<span style='position:absolute;right:-6px;bottom:28px;font-size:18px;color:#fff;filter: drop-shadow(0 0 6px #fff) drop-shadow(0 0 12px #ffb3e6)'>✧</span>");
            var sp2 = $("<span style='position:absolute;right:28px;bottom:-4px;font-size:22px;color:#fff;filter: drop-shadow(0 0 6px #fff) drop-shadow(0 0 12px #ffc7ef)'>✦</span>");
            var sp3 = $("<span style='position:absolute;right:-14px;bottom:-10px;font-size:14px;color:#fff;filter: drop-shadow(0 0 5px #fff) drop-shadow(0 0 10px #ffd1f3)'>✧</span>");
            try { sp1[0].animate([{transform:'scale(.8)',opacity:.6},{transform:'scale(1.25)',opacity:1},{transform:'scale(.8)',opacity:.6}],{duration:900,iterations:Infinity}); } catch(e) {}
            try { sp2[0].animate([{transform:'scale(.9) rotate(0deg)',opacity:.7},{transform:'scale(1.3) rotate(12deg)',opacity:1},{transform:'scale(.9) rotate(0deg)',opacity:.7}],{duration:1050,iterations:Infinity}); } catch(e) {}
            try { sp3[0].animate([{transform:'scale(.7)',opacity:.5},{transform:'scale(1.2)',opacity:.95},{transform:'scale(.7)',opacity:.5}],{duration:800,iterations:Infinity}); } catch(e) {}
            runWrap.append(runImg, silver, sp1, sp2, sp3); overlay.append(runWrap); shell.append(overlay);
            faceWrap[0].animate([{ transform:'translate(-50%, -50%) scale(1.0)' },{ transform:'translate(-50%, -62%) scale(1.12)' }], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)', fill:'forwards' });
            runWrap[0].animate([{ transform:'translate(-50%, -50%) scale(0.98)', opacity:0 },{ transform:'translate(-50%, 130px) scale(0.98)', opacity:1 }], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)', fill:'forwards' });
          } catch(e) {}
          setTimeout(function(){ try {
            var winnerProfile2 = JSON.parse(decodeURIComponent($($('.profile')[(winSide === 'A')?indexA:indexB]).data('profile')));
            // Mark winner/runner in data and grid UI
            settings.winners = [winnerProfile2];
            if (settings.once) settings.winnerList[winnerProfile2['id']] = true;
            $($('.profile')[(winSide === 'A')?indexA:indexB]).addClass('is-greyed');
            try {
              var runnerProfEl = $($('.profile')[(winSide === 'A')?indexB:indexA]);
              var avatar = runnerProfEl.find('.avatar .image').first();
              if (avatar && avatar.length && avatar.find('.dh-badge-silver').length === 0) {
                var badge = $("<span class='dh-badge-silver' style='position:absolute;right:-6px;bottom:-6px;background:linear-gradient(135deg,#e6e6e6,#9e9e9e);color:#222;border-radius:16px;padding:4px 8px;font-size:12px;font-weight:800;box-shadow:0 3px 10px rgba(0,0,0,.25),0 0 0 3px rgba(255,255,255,.85);z-index:5'>2nd</span>");
                avatar.css('position','relative');
                avatar.append(badge);
              }
            } catch(e) {}
            // Show winner name (Barbie font, centered) with crown, without launching full winner stage
            try {
              var banner = $("<div class='final-two-winner-banner' style=\"position:absolute;z-index:3;text-align:center;font-size:2.2em;font-weight:900;color:#fff;text-shadow:0 2px 10px rgba(255,140,210,.9)\"></div>");
              var crownName = '👑 ' + (winnerProfile2.name || 'Winner');
              // Structure for reveal: masking wrap + text + leading sparkle
              var wrap = $("<span class='ftw-wrap' style=\"display:inline-block;position:relative;overflow:hidden;vertical-align:top\"></span>");
              var textSpan = $("<span class='ftw-text'></span>");
              textSpan.text(crownName);
              textSpan.css({ display: 'inline-block', whiteSpace: 'nowrap', padding: '0 6px' });
              var sparkle = $("<span class='ftw-sparkle' style=\"position:absolute;top:50%;left:0;transform:translate(-50%,-60%);font-size:22px;color:#fff;filter:drop-shadow(0 0 6px #fff) drop-shadow(0 0 12px #ffc7ef)\">✧</span>");
              wrap.append(textSpan, sparkle);
              banner.append(wrap);
              // enforce Barbie font
              banner.css('font-family', "'Barbie', cursive, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif");
              shell.append(banner);
              // Position banner centered just above the coin (winner)
              try {
                var cr = c.wrap[0].getBoundingClientRect();
                var sr = shell[0].getBoundingClientRect();
                var cx = cr.left + cr.width/2 - sr.left;
                var cy = cr.top - sr.top - 12;
                banner.css({ left: cx + 'px', top: cy + 'px', transform: 'translate(-50%, -100%)' });
              } catch(_) {}
              // Animate reveal from left to right
              try {
                // Measure full width then animate wrap width
                var tw = textSpan[0].getBoundingClientRect().width;
                wrap.css('width', '0px');
                wrap[0].animate([{ width: '0px' }, { width: tw + 'px' }], { duration: 1100, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
                // Move main sparkle along the text
                sparkle[0].animate([{ left: '0px', opacity: .9 }, { left: (tw + 6) + 'px', opacity: 0.0 }], { duration: 1100, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
                // Spawn trailing sparkles during reveal (denser stream)
                var tStart = performance.now();
                var glyphs = ['✦','✧','✺','❇'];
                function spawnSparkle(progress){
                  var jitterX = (Math.random() * 10) - 5;
                  var jitterY = (Math.random() * 8) - 4;
                  var sx = Math.max(0, Math.min(tw, Math.round(progress * tw + jitterX)));
                  var ch = glyphs[Math.floor(Math.random() * glyphs.length)];
                  var size = 14 + Math.round(Math.random()*8);
                  var s = $("<span style=\"position:absolute;top:50%;left:"+sx+"px;transform:translate(-50%, calc(-60% + "+jitterY+"px));font-size:"+size+"px;color:#fff;filter:drop-shadow(0 0 6px #fff) drop-shadow(0 0 12px #ffc7ef)\">"+ch+"</span>");
                  wrap.append(s);
                  try {
                    s[0].animate([
                      { opacity:.0, transform:'translate(-50%, calc(-60% + "+jitterY+"px)) scale(.6)' },
                      { opacity:1, transform:'translate(-50%, calc(-60% + "+(jitterY-2)+"px)) scale(1.05)' },
                      { opacity:0, transform:'translate(-50%, calc(-60% + "+jitterY+"px)) scale(.7)' }
                    ], { duration: 820, easing:'cubic-bezier(.2,.8,.2,1)', fill:'forwards' });
                  } catch(_) {}
                  setTimeout(function(){ try { s.remove(); } catch(e) {} }, 900);
                }
                var trail = setInterval(function(){
                  try {
                    var elapsed = performance.now() - tStart;
                    if (elapsed > 1100) { clearInterval(trail); return; }
                    var prog = Math.min(1, elapsed / 1100);
                    // spawn two sparkles per tick for density
                    spawnSparkle(prog);
                    spawnSparkle(Math.max(0, prog - 0.05));
                  } catch(e) { try { clearInterval(trail); } catch(_) {} }
                }, 60);
              } catch(e) {}
            } catch(e) {}
            if (settings.confetti) window.startConfetti();
            if (window.heartsBurst) try { window.heartsBurst(); } catch(e) {}
            setTimeout(function(){ return window.stopConfetti(); }, 2200);
            var history = {}; history.time = (new Date()).toLocaleString(); history.winner = {}; history.winner[0] = winnerProfile2;
            settings.winnerHistory.push(history);
            localStorage.setItem('lotteryHistory', JSON.stringify(settings.winnerHistory));
            updateWinnersList();
          } catch(e) {} }, 1300);
        }; } catch(e){} }, 380);
        var blastStarted = false;
        var startWinnerBlast = function(){ if (blastStarted) return; blastStarted = true;
            // Blast stream behind winner: longer, streaming, mixed types (fireworks, butterflies, confetti, burst)
            try {
              var blast = $("<div class='final-two-blast' style='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:0'></div>");
              shell.append(blast);
              var overlayList = (typeof WINNER_ANIM_VARIANTS !== 'undefined' && WINNER_ANIM_VARIANTS && WINNER_ANIM_VARIANTS.overlay) ? WINNER_ANIM_VARIANTS.overlay : [];
              var butter = overlayList.filter(function(p){ return /butterfl/i.test(p||''); });
              var firew  = overlayList.filter(function(p){ return /firework/i.test(p||''); });
              var conf   = overlayList.filter(function(p){ return /confetti/i.test(p||''); });
              var burst  = overlayList.filter(function(p){ return /burst/i.test(p||''); });
              if (!butter.length) butter = ['/assets/lottie/butterflies-magenta.json','/assets/lottie/butterflies-teal.json'];
              if (!firew.length)  firew  = ['/assets/lottie/fireworks.json','/assets/lottie/fireworks-pink.json','/assets/lottie/fireworks-pastel.json','/assets/lottie/fireworks-glitter.json'];
              if (!conf.length)   conf   = ['/assets/lottie/confetti.json','/assets/lottie/confetti-pink.json','/assets/lottie/confetti-pastel.json','/assets/lottie/confetti-glitter.json'];
              if (!burst.length)  burst  = ['/assets/lottie/burst.json','/assets/lottie/burst-pink.json','/assets/lottie/burst-pastel.json','/assets/lottie/burst-glitter.json'];
              var pickSeq = [firew, butter, conf, firew, butter, burst, conf, firew, butter, burst];
              var iSpawn = 0;
              var totalSpawns = 36;
              var tick = setInterval(function(){
                if (iSpawn >= totalSpawns) { clearInterval(tick); return; }
                var set = pickSeq[iSpawn % pickSeq.length] || firew;
                var path = set[Math.floor(Math.random()*set.length)];
                var holder = $("<div style='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);'></div>");
                var w = 220 + Math.floor(Math.random()*220);
                var h = 220 + Math.floor(Math.random()*220);
                var inner = $("<div style='width:"+w+"px;height:"+h+"px;transform-origin:center;opacity:.0'></div>");
                holder.append(inner); blast.append(holder);
                var side = (Math.random() < 0.5) ? -1 : 1;
                var dx = side * (120 + Math.random()*220);
                var dy = - (90 + Math.random()*160);
                var rot = (Math.random()*30 - 15).toFixed(1);
                var dur = 2400 + Math.floor(Math.random()*900);
                try {
                  inner[0].animate([
                    { transform: 'translate(0px, 0px) scale(0.6) rotate('+rot+'deg)', opacity: .0 },
                    { transform: 'translate('+(dx*0.45)+'px, '+(dy*0.45)+'px) scale(1.0) rotate('+rot+'deg)', opacity: .95 },
                    { transform: 'translate('+dx+'px, '+dy+'px) scale(1.2) rotate('+rot+'deg)', opacity: .0 }
                  ], { duration: dur, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
                } catch(e) {}
                // sanitize and load
                (function(container, pth){
                  var sanitize = function(json){
                    var blocked = /(kurage|watermark|website|mobile|apps|software|lottiefiles|author|credits)/i;
                    var shouldDrop = function(layer){ var n=(layer&&layer.nm?String(layer.nm):''); return layer.ty===5 || blocked.test(n) || layer.t; };
                    var strip = function(obj){ if (obj.layers && Array.isArray(obj.layers)) { obj.layers = obj.layers.filter(function(l){ return !shouldDrop(l); }); obj.layers.forEach(strip); } if (obj.assets && Array.isArray(obj.assets)) obj.assets.forEach(strip); return obj; };
                    try { return strip(json); } catch(e){ return json; }
                  };
                  try {
                    fetch(pth).then(function(r){ return r.json(); }).then(function(data){
                      var clean = sanitize(data);
                      if (window.lottie) window.lottie.loadAnimation({ container: container, renderer: 'svg', loop: false, autoplay: true, animationData: clean, rendererSettings: { preserveAspectRatio: 'xMidYMid meet', clearCanvas: false } });
                    }).catch(function(){});
                  } catch(e) {}
                })(inner[0], path);
                iSpawn++;
              }, 140);
              setTimeout(function(){ try { clearInterval(tick); blast.remove(); } catch(e) {} }, 6500);
            } catch(e) {}
        };
        // Start winner blast slightly before the coin stops
        try { setTimeout(startWinnerBlast, Math.max(0, coinDuration - 1400)); } catch(e) {}
        anim.onfinish = function(){
          if (!blastStarted) try { startWinnerBlast(); } catch(e) {}
          var winnerIndex = (winSide === 'A') ? indexA : indexB;
          var runnerIndex = (winSide === 'A') ? indexB : indexA;
          // Winner/runner micro reveal animation:
          // Keep the final coin face (winner side) and glide the coin left,
          // while runner emerges from behind to the right.
          try {
            var faceWrap = c.wrap; // outer container around coin
            var winnerProfile = JSON.parse(decodeURIComponent($($('.profile')[winnerIndex]).data('profile')));
            var runnerProfile = JSON.parse(decodeURIComponent($($('.profile')[runnerIndex]).data('profile')));
            // Blast stream behind winner: longer, streaming, mixed types (fireworks, butterflies, confetti, burst)
            try {
              var blast = $("<div class='final-two-blast' style='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:0'></div>");
              shell.append(blast);
              var overlayList = (typeof WINNER_ANIM_VARIANTS !== 'undefined' && WINNER_ANIM_VARIANTS && WINNER_ANIM_VARIANTS.overlay) ? WINNER_ANIM_VARIANTS.overlay : [];
              var butter = overlayList.filter(function(p){ return /butterfl/i.test(p||''); });
              var firew  = overlayList.filter(function(p){ return /firework/i.test(p||''); });
              var conf   = overlayList.filter(function(p){ return /confetti/i.test(p||''); });
              var burst  = overlayList.filter(function(p){ return /burst/i.test(p||''); });
              if (!butter.length) butter = ['/assets/lottie/butterflies-magenta.json','/assets/lottie/butterflies-teal.json'];
              if (!firew.length)  firew  = ['/assets/lottie/fireworks.json','/assets/lottie/fireworks-pink.json','/assets/lottie/fireworks-pastel.json','/assets/lottie/fireworks-glitter.json'];
              if (!conf.length)   conf   = ['/assets/lottie/confetti.json','/assets/lottie/confetti-pink.json','/assets/lottie/confetti-pastel.json','/assets/lottie/confetti-glitter.json'];
              if (!burst.length)  burst  = ['/assets/lottie/burst.json','/assets/lottie/burst-pink.json','/assets/lottie/burst-pastel.json','/assets/lottie/burst-glitter.json'];
              var pickSeq = [firew, butter, conf, firew, butter, burst, conf, firew, butter, burst];
              var iSpawn = 0;
              var totalSpawns = 36;
              var tick = setInterval(function(){
                if (iSpawn >= totalSpawns) { clearInterval(tick); return; }
                var set = pickSeq[iSpawn % pickSeq.length] || firew;
                var path = set[Math.floor(Math.random()*set.length)];
                var holder = $("<div style='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);'></div>");
                var w = 220 + Math.floor(Math.random()*220);
                var h = 220 + Math.floor(Math.random()*220);
                var inner = $("<div style='width:"+w+"px;height:"+h+"px;transform-origin:center;opacity:.0'></div>");
                holder.append(inner); blast.append(holder);
                var side = (Math.random() < 0.5) ? -1 : 1;
                var dx = side * (120 + Math.random()*220);
                var dy = - (90 + Math.random()*160);
                var rot = (Math.random()*30 - 15).toFixed(1);
                var dur = 2400 + Math.floor(Math.random()*900);
                try {
                  inner[0].animate([
                    { transform: 'translate(0px, 0px) scale(0.6) rotate('+rot+'deg)', opacity: .0 },
                    { transform: 'translate('+(dx*0.45)+'px, '+(dy*0.45)+'px) scale(1.0) rotate('+rot+'deg)', opacity: .95 },
                    { transform: 'translate('+dx+'px, '+dy+'px) scale(1.2) rotate('+rot+'deg)', opacity: .0 }
                  ], { duration: dur, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
                } catch(e) {}
                // sanitize and load
                (function(container, pth){
                  var sanitize = function(json){
                    var blocked = /(kurage|watermark|website|mobile|apps|software|lottiefiles|author|credits)/i;
                    var shouldDrop = function(layer){ var n=(layer&&layer.nm?String(layer.nm):''); return layer.ty===5 || blocked.test(n) || layer.t; };
                    var strip = function(obj){ if (obj.layers && Array.isArray(obj.layers)) { obj.layers = obj.layers.filter(function(l){ return !shouldDrop(l); }); obj.layers.forEach(strip); } if (obj.assets && Array.isArray(obj.assets)) obj.assets.forEach(strip); return obj; };
                    try { return strip(json); } catch(e){ return json; }
                  };
                  try {
                    fetch(pth).then(function(r){ return r.json(); }).then(function(data){
                      var clean = sanitize(data);
                      if (window.lottie) window.lottie.loadAnimation({ container: container, renderer: 'svg', loop: false, autoplay: true, animationData: clean, rendererSettings: { preserveAspectRatio: 'xMidYMid meet', clearCanvas: false } });
                    }).catch(function(){});
                  } catch(e) {}
                })(inner[0], path);
                iSpawn++;
              }, 140);
              setTimeout(function(){ try { clearInterval(tick); blast.remove(); } catch(e) {} }, 6500);
            } catch(e) {}
            // Create a runner image centered behind the coin
            var overlay = $("<div class='final-two-overlay' style='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;'></div>");
            var runWrap = $("<div class='final-two-runner' style='position:absolute;left:0;top:0;width:180px;height:180px;opacity:0;z-index:1'></div>");
            var runImg = $("<img alt='runner' />");
            runImg.attr('src', runnerProfile.avatar || '');
            runImg.css({ width:'180px', height:'180px', borderRadius:'50%', objectFit:'cover', boxShadow:'0 0 0 4px #e6e6e6, 0 10px 24px rgba(154,154,154,.5)', position:'absolute', left:'0', top:'0' });
            // Silver medal badge
            var silver = $("<span class='final-two-medal' style='position:absolute;right:6px;bottom:6px;font-size:78px;z-index:3;color:#fff;filter: drop-shadow(0 2px 4px rgba(0,0,0,.45)) drop-shadow(0 0 10px rgba(255,255,255,.85))'>🥈</span>");
            // Sparkles around the medal
            var sp1 = $("<span style='position:absolute;right:-6px;bottom:28px;font-size:18px;color:#fff;filter: drop-shadow(0 0 6px #fff) drop-shadow(0 0 12px #ffb3e6)'>✧</span>");
            var sp2 = $("<span style='position:absolute;right:28px;bottom:-4px;font-size:22px;color:#fff;filter: drop-shadow(0 0 6px #fff) drop-shadow(0 0 12px #ffc7ef)'>✦</span>");
            var sp3 = $("<span style='position:absolute;right:-14px;bottom:-10px;font-size:14px;color:#fff;filter: drop-shadow(0 0 5px #fff) drop-shadow(0 0 10px #ffd1f3)'>✧</span>");
            try { sp1[0].animate([{transform:'scale(.8)',opacity:.6},{transform:'scale(1.25)',opacity:1},{transform:'scale(.8)',opacity:.6}],{duration:900,iterations:Infinity}); } catch(e) {}
            try { sp2[0].animate([{transform:'scale(.9) rotate(0deg)',opacity:.7},{transform:'scale(1.3) rotate(12deg)',opacity:1},{transform:'scale(.9) rotate(0deg)',opacity:.7}],{duration:1050,iterations:Infinity}); } catch(e) {}
            try { sp3[0].animate([{transform:'scale(.7)',opacity:.5},{transform:'scale(1.2)',opacity:.95},{transform:'scale(.7)',opacity:.5}],{duration:800,iterations:Infinity}); } catch(e) {}
            runWrap.append(runImg, silver, sp1, sp2, sp3);
            overlay.append(runWrap);
            shell.append(overlay);
            // Animate: keep centered; winner (coin) scales slightly up; runner emerges below
            faceWrap[0].animate([
              { transform:'translate(-50%, -50%) scale(1.0)' },
              { transform:'translate(-50%, -62%) scale(1.12)' }
            ], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)', fill:'forwards' });
            runWrap[0].animate([
              { transform:'translate(-50%, -50%) scale(0.98)', opacity:0 },
              { transform:'translate(-50%, 130px) scale(0.98)', opacity:1 }
            ], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)', fill:'forwards' });
          } catch(e) {}
          // After micro reveal, proceed to standard winner stage
          setTimeout(function(){
            try {
              var winnerProfile2 = JSON.parse(decodeURIComponent($($('.profile')[winnerIndex]).data('profile')));
              settings.winners = [winnerProfile2];
              if (settings.once) settings.winnerList[winnerProfile2['id']] = true;
              $($('.profile')[winnerIndex]).addClass('is-greyed');
              $("#dh-lottery-winner .dh-modal-content").html("");
              pushWinner(winnerProfile2);
              // Crown emoji on name after reveal text appears
              setTimeout(function(){
                try {
                  var nameEl = $("#dh-lottery-winner .winner-stage .winner-text .profile-name");
                  if (nameEl && nameEl.length) {
                    var t = nameEl.text();
                    if (t && t.indexOf('👑') !== 0) nameEl.text('👑 ' + t);
                  }
                } catch(e) {}
              }, 1600);
              // Silver 2nd badge on runner-up avatar in grid
              try {
                var runnerProfEl = $($('.profile')[runnerIndex]);
                var avatar = runnerProfEl.find('.avatar .image').first();
                if (avatar && avatar.length && avatar.find('.dh-badge-silver').length === 0) {
                  var badge = $("<span class='dh-badge-silver' style='position:absolute;right:-6px;bottom:-6px;background:linear-gradient(135deg,#e6e6e6,#9e9e9e);color:#222;border-radius:16px;padding:4px 8px;font-size:12px;font-weight:800;box-shadow:0 3px 10px rgba(0,0,0,.25),0 0 0 3px rgba(255,255,255,.85);z-index:5'>2nd</span>");
                  avatar.css('position','relative');
                  avatar.append(badge);
                }
              } catch(e) {}
              if (settings.confetti) window.startConfetti();
              if (window.heartsBurst) try { window.heartsBurst(); } catch(e) {}
              setTimeout(function(){ return window.stopConfetti(); }, 2200);
              var history = {}; history.time = (new Date()).toLocaleString(); history.winner = {}; history.winner[0] = winnerProfile2;
              settings.winnerHistory.push(history);
              localStorage.setItem('lotteryHistory', JSON.stringify(settings.winnerHistory));
              updateWinnersList();
            } catch(e) {}
          }, 1300);
        };
      };

      var stopLottery = function(){
        // Keep running-lottery state until winner modal appears to avoid overlay flicker
        clearTimeout(lotteryTimeout);
        clearTimeout(tickerTimeout);
        $("#dh-lottery-winner .dh-modal-content").html("");
        settings.winners = [];
        var elig = getEligibleIndices();
        var finalTargets = [];
        // Special handling: final-two showdown with coin flip
        if (elig.length === 2 && settings.number === 1) {
          startFinalTwoFaceoff(elig[0], elig[1]);
          return;
        }
        for (var k = 0; k < settings.number; k++){
          if (elig.length === 0) break;
          var idx = Math.floor(Math.random()*elig.length);
          finalTargets.push(elig[idx]);
          elig.splice(idx,1);
        }
        var spins = 5 + Math.floor(Math.random()*5);
        for (var s = 0; s < spins; s++){
          setTimeout(function(){
            $(".dh-lottery .profile.current").removeClass('current');
            for (var i = 0; i < settings.number; i++)  lotteryOnce(i);
          }, s * (120 + Math.random()*120));
        }
        setTimeout(function(){
          $(".dh-lottery .profile.current").removeClass('current');
          // Start winner animations first to avoid early spotlight reveal
          var winnerProfiles = [];
          for (var t = 0; t < finalTargets.length; t++) {
            var prof = JSON.parse(decodeURIComponent($($('.profile')[finalTargets[t]]).data('profile')));
            var uid = prof['id'];
            settings.winners.push(prof);
            winnerProfiles.push(prof);
            if(settings.once) settings.winnerList[uid] = true;
            $($('.profile')[finalTargets[t]]).addClass('is-greyed');
          }
          // Mount winner stage and show modal immediately
          for (var wp = 0; wp < winnerProfiles.length; wp++) pushWinner(winnerProfiles[wp]);
          $('#dh-lottery-winner').addClass('is-active');
          // After a short delay, move the selector spotlight to the true winner under the modal
          setTimeout(function(){
            currentTarget = [];
            for (var i = 0; i < finalTargets.length; i++){
              moveToTarget(i, finalTargets[i]);
              currentTarget.push(finalTargets[i]);
            }
          }, 180);
          $(".lotterybox").removeClass('running-lottery');
          clearInterval(lotteryInterval);
          lotteryInterval = null;
          if(settings.confetti) window.startConfetti();
          if (window.heartsBurst) try { window.heartsBurst(); } catch(e) {}
          setTimeout(function() { return window.stopConfetti(); }, 2000);
          setTimeout(function() {
            $('#dh-lottery-go').removeClass('success').addClass('primary').html(diceIconHtml);
          }, 500);
          var history = {};
          history.time = (new Date()).toLocaleString();
          history.winner = {};
          for (var w in settings.winners) history.winner[w] = settings.winners[w];
          settings.winnerHistory.push(history);
          localStorage.setItem('lotteryHistory',JSON.stringify(settings.winnerHistory));
          updateWinnersList();
          // Winner drawn; no auto-reload here. Reload occurs on close (X) click.
          return winnerProfile;
        }, spins * 140 + 220);
      }

  var cleanHistory = function(){
    if (confirm('Delete Lottery History. Sure?')==true){
      localStorage.setItem('lotteryHistory','');
      settings.winnerHistory = [];
      $("#dh-lottery-history").html('');
      return true;
    }else{
      return false;
    }
  }

  var showHistory = function(){
    var history = settings.winnerHistory;
    var tpl_item = "\
      <div class='dh-history-item'>\
        <div class='dh-history-info'>\
          <h3 class='place'>{i}. <span class='dh-history-user'></span></h3>\
        </div>\
      </div>\
    ";
    var tpl_user = "<span>{name}</span>";
    var box = $("#dh-lottery-history");
    box.html("");
    var i = 0;
    for(var item in history){
      var _this = history[item]
      _this.number = arrayCount(_this.winner);
      _this.i = originalNumberOfCompetitors - Number(item);
      var lottery_item = $(formatTemplate(_this, tpl_item));
      for(var user in _this.winner){
        var _user = history[item]['winner'][user];
        var lottery_user = $(formatTemplate(_user, tpl_user));
        lottery_item.find(".dh-history-user").append(lottery_user);
      }
      box.prepend(lottery_item);
    }
    return settings.winnerHistory;
  }

  var controller = {
    init : function (options) {
      settings = $.extend({},defaultOptions, options);
      settings.api != null ? loadApi(settings.api) : readyLottery();
      if (!options.number && localStorage.lotteryConfigNumber) {
        settings.number = parseInt(localStorage.lotteryConfigNumber) || 1
  }

  // Dev helper to jump to final-two faceoff quickly
  try {
    window.devFinalTwo = function(nameA, nameB){
      try {
        var pickByName = function(n){
          if (!n) return null;
          var key = String(n).toUpperCase();
          var found = null;
          $('.profile').each(function(idx, el){
            try {
              var prof = JSON.parse(decodeURIComponent($(el).data('profile')));
              if (prof && String(prof.name).toUpperCase().indexOf(key) === 0) { found = idx; return false; }
            } catch(e) {}
          });
          return found;
        };
        var a = pickByName(nameA);
        var b = pickByName(nameB);
        if (a == null || b == null) {
          // fallback to first two eligible
          var elig = (typeof getEligibleIndices === 'function') ? getEligibleIndices() : [];
          a = (a==null && elig.length>0) ? elig[0] : a;
          b = (b==null && elig.length>1) ? elig[1] : b;
        }
        if (a == null || b == null || a === b) { console.warn('devFinalTwo: could not resolve two distinct contenders'); return; }
        // Open modal if needed
        if (!$('#dh-lottery-winner').length) return console.warn('devFinalTwo: winner modal not available yet');
        startFinalTwoFaceoff(a, b);
      } catch(e) { console.error('devFinalTwo failed', e); }
    };
  } catch(e) {}
    },
    start : function (){ return startLottery(); },
    stop : function (){ return stopLottery(); },
    getUsers : function(){ return settings.data; },
    winners : function(action){
      switch (action) {
        case 'get': return settings.winners;
        case 'clean': settings.winnerList = []; return true;
        default: console.error('Action ' +  action + ' does not exist.'); break;
      }
    },
    history : function(action){
      switch (action) {
        case 'show': return showHistory();
        case 'get': return settings.winnerHistory;
        case 'clean': return cleanHistory();
        default: console.error('Action ' +  action + ' does not exist.'); break;
      }
    },
  };

  $.lottery = function( method ) {
    if ( controller[method] ) {
      return controller[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return controller.init.apply( this, arguments );
    } else {
      console.error( 'Method ' +  method + ' does not exist.' );
    }
  };

})();
