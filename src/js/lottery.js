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

      var pushWinner = function(winnerProfile){
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
                return l.loadAnimation(Object.assign({ container: container, renderer: 'svg', autoplay: true }, opts || {}, { animationData: clean }));
              });
            };

            // Lights (loop)
            loadSanitized('/assets/lottie/lights-purple.json', stage.find('.winner-lights')[0], { loop: true });
            // Gift box (plays once)
            loadSanitized('/assets/lottie/gift-box.json', stage.find('.winner-giftbox')[0], { loop: false }).then(function(gift){
              // Hide the selector spotlight as soon as the gift animation is ready to start
              try { $('#dh-lottery-selector').hide(); } catch(e) {}
              try {
                gift.addEventListener('complete', function(){
                  stage.find('.winner-portrait').addClass('is-revealed');
                  stage.find('.winner-giftbox').css('display','none');
                  // Reveal text now that portrait is revealed
                  stage.find('.profile-name').text(displayName);
                  stage.find('.profile-subtitle').text(displaySubtitle);
                  stage.find('.profile-desc').text(displayDesc);
                  stage.find('.winner-text').addClass('is-visible');
                });
              } catch(e) {}
            });
            // Butterflies slightly after start
            setTimeout(function(){
              loadSanitized('/assets/lottie/butterflies-magenta.json', stage.find('.winner-butterflies')[0], { loop: false });
            }, 400);
          }
        } catch(e) {}

        // Fallback: if Lottie events aren't available, reveal portrait after a delay
        setTimeout(function(){
          if (!stage.find('.winner-portrait').hasClass('is-revealed')){
            stage.find('.winner-portrait').addClass('is-revealed');
            stage.find('.winner-giftbox').css('display','none');
            // Fallback reveal of text after portrait
            stage.find('.profile-name').text(displayName);
            stage.find('.profile-subtitle').text(displaySubtitle);
            stage.find('.profile-desc').text(displayDesc);
            stage.find('.winner-text').addClass('is-visible');
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

      var stopLottery = function(){
        // Keep running-lottery state until winner modal appears to avoid overlay flicker
        clearTimeout(lotteryTimeout);
        clearTimeout(tickerTimeout);
        $("#dh-lottery-winner .dh-modal-content").html("");
        settings.winners = [];
        var elig = getEligibleIndices();
        var finalTargets = [];
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
