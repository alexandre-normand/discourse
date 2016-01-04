import componentTest from 'helpers/component-test';
import Topic from 'discourse/models/topic';
import Post from 'discourse/models/post';
import Site from 'discourse/models/site';
import SiteFixture from 'fixtures/site-fixtures';

moduleForComponent('post-stream', {integration: true});

function postStreamTest(name, attrs) {
  componentTest(name, {
    template: `{{mount-widget widget="post-stream" args=(as-hash posts=posts)}}`,
    setup() {
      const site = Site.create(SiteFixture['site.json'].site);
      this.set('posts', attrs.posts(site));
    },
    test: attrs.test
  });
}

postStreamTest('basics', {
  posts(site) {
    const topic = Topic.create();
    return [
      Post.create({ topic, id: 1, post_number: 1, user_id: 123, topicOwner: true, primary_group_name: 'trout',
                    avatar_template: '/images/avatar.png' }),
      Post.create({ topic, id: 2, post_number: 2, post_type: site.get('post_types.moderator_action') }),
      Post.create({ topic, id: 3, post_number: 3, hidden: true }),
      Post.create({ topic, id: 4, post_number: 4, post_type: site.get('post_types.whisper') }),
      Post.create({ topic, id: 5, post_number: 5, wiki: true, via_email: true })
    ];
  },

  test(assert) {
    assert.equal(this.$('.post-stream').length, 1);
    assert.equal(this.$('.topic-post').length, 5, 'renders all posts');

    // look for special class bindings
    assert.equal(this.$('.topic-post:eq(0).topic-owner').length, 1, 'it applies the topic owner class');
    assert.equal(this.$('.topic-post:eq(0).group-trout').length, 1, 'it applies the primary group class');
    assert.equal(this.$('.topic-post:eq(0).regular').length, 1, 'it applies the regular class');
    assert.equal(this.$('.topic-post:eq(1).moderator').length, 1, 'it applies the moderator class');
    assert.equal(this.$('.topic-post:eq(2).post-hidden').length, 1, 'it applies the hidden class');
    assert.equal(this.$('.topic-post:eq(3).whisper').length, 1, 'it applies the whisper class');
    assert.equal(this.$('.topic-post:eq(4).wiki').length, 1, 'it applies the wiki class');

    // it renders an article for the body with appropriate attributes
    assert.equal(this.$('article#post_2').length, 1);
    assert.equal(this.$('article[data-user-id=123]').length, 1);
    assert.equal(this.$('article[data-post-id=3]').length, 1);
    assert.equal(this.$('article#post_5.via-email').length, 1);

    assert.equal(this.$('article:eq(0) .main-avatar').length, 1, 'renders the main avatar');
  }
});

postStreamTest('deleted posts', {
  posts() {
    const topic = Topic.create();
    return [
      Post.create({ topic, id: 1, post_number: 1, deleted_at: new Date().getTime() }),
    ];
  },

  test(assert) {
    assert.equal(this.$('.topic-post.deleted').length, 1, 'it applies the deleted class');
    assert.equal(this.$('.deleted-user-avatar').length, 1, 'it has the trash avatar');
  }
});
