/* Session with Jade: puts the right free tool at the end of an article.
   Edit MAP to change which tool goes with which page. First match wins.
   An article can choose its own tool with <body data-tool="slug">. */
(function () {
  'use strict';
  var TOOLS = {
    'communication-confidence-assessment': ['Communication Confidence Assessment', 'Sixteen short statements about meetings, presentations and speaking to senior people. Your scores across eight areas straight away.'],
    'presentation-performance-audit': ['Presentation Performance Audit', 'Think about your last big presentation and see where it went well and where it slipped.'],
    'performance-under-pressure': ['Performance Under Pressure check', 'What happens to you when the stakes go up, and how quickly you get back on track.'],
    'difficult-conversation-planner': ['Difficult Conversation Planner', 'Plan a conversation you have been putting off and get a written plan for it.']
  };
  var MAP = [
    [/freeze|pressure|nerves|anxiety|panic/i, 'performance-under-pressure'],
    [/present|keynote|pitch|speak|talk/i, 'presentation-performance-audit'],
    [/conversation|feedback|conflict|difficult/i, 'difficult-conversation-planner'],
    [/./, 'communication-confidence-assessment']
  ];
  var slug = document.body.getAttribute('data-tool');
  if (!slug) for (var i = 0; i < MAP.length; i++) if (MAP[i][0].test(location.pathname + ' ' + document.title)) { slug = MAP[i][1]; break; }
  var t = TOOLS[slug]; if (!t) return;
  var where = document.querySelector('article') || document.querySelector('main');
  if (!where || document.querySelector('.toolcta')) return;
  var camp = (location.pathname.split('/').pop() || 'article').replace(/\.html$/, '');
  var box = document.createElement('section');
  box.className = 'toolcta';
  box.innerHTML = '<div class="wrap"><div class="tcin"><p class="eb">Free tool</p><h2></h2><p class="d"></p>' +
    '<p class="b"><a class="btn" href="/free-tools/' + slug + '/?utm_source=sessionwithjade&utm_medium=article&utm_campaign=' + encodeURIComponent(camp) + '">Start, it is free</a> ' +
    '<a class="tl" href="/private-coaching/application/?utm_source=sessionwithjade&utm_medium=article&utm_campaign=' + encodeURIComponent(camp) + '">Or apply for private coaching</a></p></div></div>';
  box.querySelector('h2').textContent = t[0]; box.querySelector('.d').textContent = t[1];
  where.appendChild(box);
})();
