import RawHtml from 'discourse/widgets/raw-html';
import { createWidget } from 'discourse/widgets/widget';
import PostMenu from 'discourse/widgets/post-menu';

const TopicAvatar = createWidget({
  tagName: 'div.topic-avatar',

  html(attrs) {
    let body;
    if (!attrs.user_id) {
      body = this.fragment('i', { className: 'fa fa-trash-o deleted-user-avatar' });
    } else {
      const size = Discourse.Utilities.translateSize('large');
      const url = Discourse.Utilities.avatarUrl(attrs.avatar_template, size);

      // We won't render an invalid url
      if (!url || url.length === 0) { return; }
      const title = attrs.username;

      const properties = {
        attributes: { alt: '', width: size, height: size, src: Discourse.getURLWithCDN(url), title },
        className: 'avatar'
      };

      const img = this.fragment('img', properties);

      body = this.fragment('a', {
        className: 'trigger-user-card main-avatar',
        attributes: {
          href: attrs.usernameUrl,
          'data-user-card': attrs.username
        }
      }, img);
    }

    // TODO: plugin-outlet `poster-avatar-bottom`
    return [body, this.fragment('div.poster-avatar-extra')];
  }
});

const TopicPostBody = createWidget({
  tagName: 'div.topic-body',
  html(attrs) {
    const cooked = new RawHtml({html: `<div class='cooked'>${attrs.cooked}</div>`});
    return this.fragment('div.regular', [cooked, new PostMenu(attrs)]);
  }
});

const TopicPostArticle = createWidget({
  tagName: 'article.boxed',

  buildId(attrs) {
    return `post_${attrs.post_number}`;
  },

  buildClasses(attrs) {
    if (attrs.via_email) { return 'via-email'; }
  },

  buildAttributes(attrs) {
    return { 'data-post-id': attrs.id, 'data-user-id': attrs.user_id };
  },

  html(attrs) {
    return this.fragment('div.row', [new TopicAvatar(attrs), new TopicPostBody(attrs)]);
  }
});

const TopicPost = createWidget({
  buildClasses(attrs) {
    const classNames = ['topic-post', 'clearfix'];
    if (attrs.topicOwner) { classNames.push('topic-owner'); }
    if (attrs.hidden) { classNames.push('post-hidden'); }
    if (attrs.deleted) { classNames.push('deleted'); }
    if (attrs.primary_group_name) { classNames.push(`group-${attrs.primary_group_name}`); }
    if (attrs.wiki) { classNames.push(`wiki`); }
    if (attrs.isWhisper) { classNames.push('whisper'); }
    if (attrs.isModeratorAction || (attrs.isWarning && attrs.firstPost)) {
      classNames.push('moderator');
    } else {
      classNames.push('regular');
    }
    return classNames;
  },

  html(attrs) {
    return new TopicPostArticle(attrs);
  }
});

export default createWidget({
  tagName: 'div.post-stream',

  transformPost(post) {
    const postAtts = post.getProperties('id',
                                        'topicOwner',
                                        'hidden',
                                        'deleted',
                                        'primary_group_name',
                                        'wiki',
                                        'post_type',
                                        'firstPost',
                                        'post_number',
                                        'cooked',
                                        'via_email',
                                        'user_id',
                                        'usernameUrl',
                                        'username',
                                        'avatar_template',
                                        'bookmarked',
                                        'yours',
                                        'shareUrl',
                                        'bookmarked',
                                        'deleted_at',
                                        'user_deleted',
                                        'can_delete',
                                        'can_recover');

    const { site, siteSettings } = this;

    const topic = post.get('topic');
    postAtts.isModeratorAction = postAtts.post_type === site.get('post_types.moderator_action');
    postAtts.isWhisper = postAtts.post_type === site.get('post_types.whisper');
    postAtts.isWarning = topic.get('is_warning');
    postAtts.isDeleted = postAtts.deleted_at || postAtts.user_deleted;
    postAtts.siteSettings = siteSettings;

    const likeAction = post.get('likeAction');
    if (likeAction) {
      postAtts.showLike = true;
      postAtts.liked = likeAction.get('acted');
      postAtts.canToggleLike = likeAction.get('canToggle');
      postAtts.likeCount = likeAction.get('count');
    }

    postAtts.canFlag = !Ember.isEmpty(post.get('flagsAvailable'));
    postAtts.canEdit = post.get('can_edit');
    postAtts.canCreatePost = this.attrs.canCreatePost;

    postAtts.canBookmark = !!this.currentUser;
    postAtts.canManage = this.currentUser && this.currentUser.get('canManageTopic');

    if (postAtts.post_number === 1) {
      const details = topic.get('details');
      postAtts.canRecoverTopic = topic.get('deleted_at') && details.get('can_recover');
      postAtts.canDeleteTopic = !topic.get('deleted_at') && details.get('can_delete');
    } else {
      postAtts.can_recover = postAtts.isDeleted && postAtts.can_recover;
      postAtts.can_delete = !postAtts.isDeleted && postAtts.can_delete;
    }

    return postAtts;
  },

  html(attrs) {
    const posts = attrs.posts || [];
    return posts.map(p => new TopicPost(this.transformPost(p)));
  }
});
