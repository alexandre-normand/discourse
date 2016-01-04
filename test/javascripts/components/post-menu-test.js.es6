import componentTest from 'helpers/component-test';

moduleForComponent('post-menu', {integration: true});

componentTest('share button', {
  template: '{{mount-widget widget="post-menu" args=args}}',
  setup() {
    this.set('args', { shareUrl: 'http://share-me.example.com' });
  },
  test(assert) {
    assert.ok(!!this.$('.actions button[data-share-url]').length, 'it renders a share button');
  }
});

componentTest('liking', {
  template: '{{mount-widget widget="post-menu" args=args}}',
  setup() {
    this.set('args', { showLike: true, canToggleLike: true, likeCount: 1 });
  },
  test(assert) {
    assert.ok(!!this.$('.actions button.like').length);
    assert.ok(!!this.$('.actions button.like-count').length);

    click('.actions button.like');
    andThen(() => {
      assert.ok(!this.$('.actions button.like').length);
      assert.ok(!!this.$('.actions button.has-like').length);
    });

    click('.actions button.has-like');
    andThen(() => {
      assert.ok(!!this.$('.actions button.like').length);
      assert.ok(!this.$('.actions button.has-like').length);
    });
  }
});
