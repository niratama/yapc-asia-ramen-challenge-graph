#!/usr/bin/perl
use strict;
use warnings;

use Net::Twitter::Lite::WithAPIv1_1;
use Config::Pit;
use JSON;

use Log::Minimal;

my $cache_file = 'cache/statuses_cache.json';
my $config = pit_get('twitter_app_newsweb', require => {
  'consumer_key' => 'Twitter API key',
  'consumer_secret' => 'Twitter API secret',
  'token' => 'Twitter Access Token',
  'token_secret' => 'Twitter Access Token Secret',
});
my $nt = Net::Twitter::Lite::WithAPIv1_1->new(
    consumer_key        => $config->{consumer_key},
    consumer_secret     => $config->{consumer_secret},
    access_token        => $config->{token},
    access_token_secret => $config->{token_secret},
    ssl                 => 1,
);

my %nodes;
my %edges;
my %links;
my %statuses;

sub read_json_file {
  my ($filename) = @_;

  open my $fh, '<', $filename or die q(can't read file $filename: $!);
  my $data_json = do { local $/; <$fh> };
  my $data = JSON->new->utf8->decode($data_json);
  return $data;
}

sub write_json_file {
  my ($filename, $data) = @_;

  open my $fh, '>', $filename or die q(can't write file $filename: $!);
  print $fh JSON->new->utf8->pretty->encode($data);
  close $fh;
}

sub add_node {
  my ($status) = @_;
  my $user = $status->{user};
  my $id = $user->{id};
  debugf ddf $status unless defined $id;
  if (exists($nodes{$id})) {
    if (!defined($nodes{$id}->{image}) && defined($user->{profile_image_url})) {
      # ノードあるけど画像拾えてなかったので追加する
      $nodes{$id}->{image} = $user->{profile_image_url};
    }
  } else {
    # 新規ノード
    my $image;
    # mentionでnode追加するときは存在しないのでチェックする
    $image = $user->{profile_image_url} if exists($user->{profile_image_url});
    $nodes{$id} = {
      id => $id,
      label => $user->{screen_name},
      image => $image,
      shape => 'image',
    };
  }
  if (exists($status->{id})) {
    if (!exists($links{$id})) {
      $links{$id} = [];
    }
    push @{$links{$id}}, $status->{id};
  }
}

sub add_edges {
  my ($status, $mentions) = @_;
  my $user = $status->{user};
  my $from_id = $user->{id};

  foreach my $mention (@$mentions) {
    add_node({ user => $mention });
    my $to_id = $mention->{id};
    if (!exists($edges{$to_id})) {
      $edges{$to_id} = {};
    }
    if (!exists($edges{$to_id}->{$from_id})) {
      $edges{$to_id}->{$from_id} = [];
    }
    push @{$edges{$to_id}->{$from_id}}, $status->{id};
  }
}

sub lookup_users {
  my ($nodes) = @_;
  while (@$nodes) {
    # 最大100人なので小分けにリクエストする
    my @ids = map { $_->{id} } splice @$nodes, 0, 100;
    my $users = $nt->lookup_users({ user_id => \@ids });
    foreach my $user (@$users) {
      add_node({ user => $user });
    }
  }
}

my $max_id;
my @statuses;
my %query = ( q => '#yapcramen', count => 100 );
if (-f $cache_file) {
  my $data = read_json_file($cache_file);
  @statuses = @{$data->{statuses}};
  $query{since_id} = $data->{max_id};
}

my @current_statuses;
# あるだけ検索
while (1) {
  debugf ddf \%query;
  my $r = $nt->search(\%query);
  debugf ddf $r->{search_metadata};
  debugf "rows:%d", scalar(@{$r->{statuses}});

  push @current_statuses, @{$r->{statuses}};
  $max_id ||= $r->{search_metadata}->{max_id};

  # next_resultがなければおしまい
  last unless exists $r->{search_metadata}->{next_results};

  my ($next) = ($r->{search_metadata}->{next_results} =~ m/max_id=(\d+)/);
  debugf "next max_id %d", $next;
  $query{max_id} = $next;
}

unshift @statuses, @current_statuses;

foreach my $status (@statuses) {
  $statuses{$status->{id}} = $status;
  next if $status->{retweeted_status};  # 公式Retweetは無視
  add_node($status);
  add_edges($status, $status->{entities}->{user_mentions});
}

my @nodes;
my @lookup_users;
foreach my $node (values %nodes) {
  push @nodes, $node;
  push @lookup_users, $node unless defined($node->{image});
}
lookup_users(\@lookup_users);

my @edges;
foreach my $to_id (keys %edges) {
  foreach my $from_id (keys %{$edges{$to_id}}) {
    push @edges, { from => $from_id, to => $to_id, id => "$from_id:$to_id" };
    $links{"$from_id:$to_id"} = $edges{$to_id}->{$from_id};
  }
}

write_json_file('static/nodes.json', \@nodes);
write_json_file('static/edges.json', \@edges);
write_json_file('static/links.json', \%links);
write_json_file('static/statuses.json', \%statuses);

my $new_cache = {
  statuses => \@statuses,
  max_id => $max_id,
};
write_json_file($cache_file, $new_cache);
