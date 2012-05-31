XPage.Loaders = {};

XPage.Loaders.Spinner = {

  options : {
    noFx : true,
    style : {
      opacity : 1
    }
  },

  init : function(container,options) {
    var defaults = Object.clone(this.options);
    options = Object.merge(defaults,options || {});
    this.noFx = !!options.noFx;
    delete options.noFx;
    this.spinner = new Spinner(container,options);
  },

  replaceContainer : function(container) {},

  show : function(container) {
    this.spinner.show(this.noFx);
  },

  hide : function(container) {
    this.spinner.hide(this.noFx);
  },

  update : function(container) {
    this.spinner.position();
  }

};

XPage.Loaders.CursorLoader = {

  init : function(container,options) {
    this.noFx = !!options.noFx;
    delete options.noFx;
    CursorLoader.init(options);
  },

  replaceContainer : function(container) {},

  show : function(container) {
    this.noFx ? CursorLoader.show() : CursorLoader.reveal();
  },

  hide : function(container) {
    this.noFx ? CursorLoader.hide() : CursorLoader.dissolve();
  },

  update : function() { }

};
