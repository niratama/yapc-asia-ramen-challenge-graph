/* global vis, Mustache */
$(function () {
  'use strict';

  var entity_type = ['media', 'urls', 'user_mentions', 'hashtags', 'symbols'];
  var entity_media_func = {
    media: function (e) {
      return {
        link_url: e.url,
        thumb_url: e.media_url + ":thumb"
      };
    },
    urls: function (e) {
      var url = e.expanded_url;
      if (url.match(/^(http:\/\/instagr(\.am|am\.com)\/p\/[\w\-]+)\/?$/)) {
        return {
          link_url: url,
          thumb_url: RegExp.$1+'/media/?size=t'
        };
      }
      if (url.match(/^(http:\/\/p\.twipple\.jp\/)([\w]+)$/)) {
        return {
          link_url: url,
          thumb_url: RegExp.$1+'show/thumb/'+RegExp.$2
        };
      }
    }
  };
  var entity_replace_template = {};
  $.each(entity_type, function (i, type) {
    entity_replace_template[type] = $('#'+type+'-tmpl').html();
    if (!(type in entity_media_func)) {
      entity_media_func[type] = function () {};
    }
  });

  var expand_tweet = function (tweet) {
    var entities = $.map(entity_type, function (type) {
      if (type in tweet.entities) {
        return $.map(tweet.entities[type], function (e) {
          return {
            start: e.indices[0],
            end: e.indices[1],
            replacement: Mustache.render(entity_replace_template[type], e),
            media: entity_media_func[type](e, type)
          };
        });
      }
    });
    entities.sort(function (a, b) { return a.start - b.start; });

    var media = [];
    var text_expanded = '';
    var pos = 0;
    $.each(entities, function (i, e) {
      text_expanded += tweet.text.substring(pos, e.start);
      text_expanded += e.replacement;
      pos = e.end;
      if (e.media) {
        media.push(e.media);
      }
    });
    text_expanded += tweet.text.substring(pos, tweet.text.length);

    return {
      text: text_expanded,
      media: media
    };
  };

  $.when(
    $.ajax('nodes.json'),
    $.ajax('edges.json'),
    $.ajax('links.json'),
    $.ajax('statuses.json')
  ).done(function (res_nodes, res_edges, res_links, res_statuses) {
      var nodes = res_nodes[0];
      var edges = res_edges[0];
      var links = res_links[0];
      var statuses = res_statuses[0];

      // create a network
      var container = $('#network')[0];
      var data = {
        nodes: nodes,
        edges: edges
      };
      var options = {
        edges: {
          width: 2,
          style: 'arrow',
          color: 'gray'
        }
      };
      var network = new vis.Network(container, data, options);
      network.on('select', function (properties) {
        var ids = [];
        $.each(properties.nodes, function (index, user_id) {
          ids.push(user_id);
        });
        $.each(properties.edges, function (index, edge_id) {
          ids.push(edge_id);
        });
        var tweets = $('#tweets');
        tweets.empty();
        var status_ids =
          $.unique($.map(ids, function (link_id) { return links[link_id]; }));
        status_ids.sort(function (a, b) { return b - a; });
        $.each(status_ids, function (index, status_id) {
          var status = statuses[status_id];
          var expand = expand_tweet(status);
          var template = $('#tweet-tmpl').html();
          Mustache.parse(template);
          var rendered = Mustache.render(template, {
            status: status,
            text_expanded: expand.text,
            media: expand.media,
            created_at_locale: (new Date(status.created_at)).toLocaleString()
          });
          tweets.append(rendered);
        });
      });
      var resizeNetwork = function () {
        network.setSize($('#network').width(), $('#network').height());
        network.zoomExtent();
      };
      resizeNetwork();
      $(window).on('resize', resizeNetwork);
    });
});
