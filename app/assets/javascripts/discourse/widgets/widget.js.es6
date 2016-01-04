import WidgetClickHook from 'discourse/widgets/click-hook';
const { h, VNode } = virtualDom;

function emptyContent() { }

export function createWidget(opts) {
  const result = class CustomWidget extends Widget {};
  opts.html = opts.html || emptyContent;

  opts.draw = function(builder, attrs, state) {
    WidgetClickHook.setupDocumentCallback();
    const properties = {};

    if (this.buildClasses) {
      let classes = this.buildClasses(attrs) || [];
      if (!Array.isArray(classes)) { classes = [classes]; }
      if (classes.length) {
        properties['className'] = classes.join(' ');
      }
    }
    if (this.buildId) {
      properties['id'] = this.buildId(attrs);
    }

    if (this.buildAttributes) {
      properties['attributes'] = this.buildAttributes(attrs);
    }
    if (this.click) {
      properties['widget-click'] = new WidgetClickHook(this);
    }
    return this.fragment(this.tagName || 'div', properties, this.html(attrs, state));
  };

  opts.fragment = function(name, arg0, arg1) {
    let properties = {};
    let contents = arg0;
    if (typeof arg0 === "object" && !Array.isArray(arg0) && !(arg0 instanceof VNode)) {
      properties = arg0;
      contents = arg1;
    }

    if (!Array.isArray(contents)) { contents = [contents]; }
    contents.forEach(c => {
      if (c && c.type === 'Thunk') {
        c.parentWidget = this;
      }
    });

    const frag = h(name, properties, contents);
    return frag;
  };

  Object.keys(opts).forEach(k => result.prototype[k] = opts[k]);
  return result;
}

export default class Widget {
  constructor(attrs) {
    this.attrs = attrs || {};
    this.state = {};

    // TODO: no globals
    this.site = Discourse.Site.current();
    this.siteSettings = Discourse.SiteSettings;
    this.currentUser = Discourse.User.current();
  }

  defaultState() {
    return {};
  }

  destroy() {
    console.log('destroy called');
  }

  render(prev) {
    if (prev && prev.state) {
      this.state = prev.state;
    } else {
      this.state = this.defaultState();
    }

    return this.draw(h, this.attrs, this.state);
  }

  _findAncestorWithProperty(property) {
    let widget = this;
    while (widget) {
      const value = widget[property];
      if (value) {
        return widget;
      }
      widget = widget.parentWidget;
    }
  }

  _findView() {
    const widget = this._findAncestorWithProperty('_emberView');
    if (widget) {
      return widget._emberView;
    }
  }

  scheduleRerender() {
    const widget = this._findAncestorWithProperty('_emberView');
    if (widget) {
      Ember.run.scheduleOnce('render', widget._emberView, widget._emberView.rerenderWidget);
    }
  }

  bubbleAction(name) {
    const widget = this._findAncestorWithProperty(name);
    if (widget) {
      this.scheduleRerender();
      return widget[name](widget.attrs, widget.state);
    }

    console.error(`Nothing handled ${name}`);
  }
}

Widget.prototype.type = 'Thunk';
