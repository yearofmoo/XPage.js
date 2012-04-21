XPage.Loaders = {};

XPage.Loaders.Spinner = {

  init : function(container,options) {
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
