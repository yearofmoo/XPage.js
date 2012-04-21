XPage.Swappers = {};

XPage.Swappers.Direct = {

  init : function(container,options) { },

  before : function(container,fn) {
    fn();
  },

  swapByHTML : function(container,content,fn) {
    container.set('html',content);
    fn();
  },

  swapByElement : function(container,content,fn) {
    container.empty().adopt(content);
    fn();
  },

  after : function(container,fn) {
    fn();
  },

  cleanup : function() { }

};

XPage.Swappers.Fade = {

  init : function(container,options) { },

  before : function(container,fn) {
    container.get('tween').start('opacity',[1,0]).chain(fn);
  },

  swapByHTML : function(container,content,fn) {
    container.set('html',content);
    fn();
  },

  swapByElement : function(container,content,fn) {
    container.empty().adopt(content);
    fn();
  },

  after : function(container,fn) {
    container.get('tween').start('opacity',[0,1]).chain(fn);
  },

  cleanup : function() { }

};

XPage.Swappers.Slide = {

  init : function(container,options) {
    container.setStyle('position','relative');
  },

  before : function(container,fn) {
    var x = container.getSize().x;
    container.get('tween').start('left',[0,x]).chain(fn);
  },

  swapByHTML : function(container,content,fn) {
    container.set('html',content);
    fn();
  },

  swapByElement : function(container,content,fn) {
    container.empty().adopt(content);
    fn();
  },

  after : function(container,fn) {
    var x = container.getSize().x;
    container.get('tween').start('left',[-x,0]).chain(fn);
  },

  cleanup : function() { }

};

XPage.Swappers.CrossFade = {

  init : function(container,options) {
    container.setStyle('position','relative');
  },

  before : function(container,fn) {
    this.nextZIndex = (container.getStyle('z-index') || 1000) + 1;
    fn();
  },

  swapByElement : function(container,content,fn) {
    var z = this.nextZIndex;
    var coords = {};
    coords.left = 0;
    coords.top = 0;
    coords.position = 'absolute';
    coords.opacity = 0;
    coords['z-index'] = z;
    content.setStyles(coords);
    content.inject(container,'after');
    new Fx.Elements([container,content]).start({
      '0':{
        'opacity':0
      },
      '1':{
        'opacity':1
      }
    }).chain(function() {
      container.destroy();
      content.setStyles({
        'position':'relative',
        'top':0,
        'left':0
      });
      fn();
    });
  },

  swapByHTML : function(container,content,fn) {
    content = Elements.from(content);
    this.swapByElement(container,content,fn);
  },

  after : function() {

  }

};

XPage.Swappers.Bump = {

  init : function(container,options) {
    container.setStyle('position','absolute');
  },

  before : function(container,fn) {
    fn();
  },

  createTempElement : function(container) {
    var klass = container.get('class');
    return new Element('div',{
      'class':klass,
      'styles':{
        'position':'relative',
        'display':'none'
      }
    }).inject(container,'before');
  },

  swapByHTML : function(container,content,fn) {
    var temp = this.createTempElement(container);
    temp.set('html',content);
    this.swap(temp,container,content,fn);
  },

  swapByElement : function(container,content,fn) {
    var temp = this.createTempElement(container);
    temp.empty().adopt(content);
    this.swap(temp,container,content,fn);
  },

  swap : function(temp,container,content,fn) {
    var height = temp.getDimensions().height;
    temp.setStyles({
      'display':'block'
    });
    new Fx.Elements($$(temp,container)).start({
      '0' : {
        'top':[-height,0],
        'opacity':[0,1]
      },
      '1' : {
        'top':[0,height],
        'opacity':[1,0]
      }
    }).chain(function() {
      temp.destroy();
      this.resetContainer(container,content);
      fn();
    }.bind(this));
  },

  resetContainer : function(container,content) {
    container.setStyles({
      'position':'static',
      'top':0,
      'opacity':1
    });
    typeOf(content) == 'string' ? container.set('html',content) : container.empty().adopt(content);
  },

  after : function(container,fn) {
    fn();
  },

  cleanup : function() { }

};
