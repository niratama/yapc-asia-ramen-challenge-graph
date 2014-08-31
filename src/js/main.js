/* global vis, Mustache */
$(function () {
  'use strict';

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
        $.each(status_ids, function (index, status_id) {
          var status = statuses[status_id];
          var template = $('#tweet-tmpl').html();
          Mustache.parse(template);
          var rendered = Mustache.render(template, status);
          tweets.append(rendered);
        });
      });
    });
});
