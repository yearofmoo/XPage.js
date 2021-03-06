var XPage;

(function() {

var klassify = function(str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
};

XPage = new Class({

  Implements : [Options, Events],

  Binds : ['onSuccess','onResponse','onRequest','onFailure','onTimeout','onAssetsReady','onAfterSuccess','onReady','onCancel','onBeforeReady'],

  options : {
    timeout : 5000,
    minPageDelay : 1000,
    doc : document,
    maxRequests : 0,
    useInnerElement : true,
    replaceContent : true,
    replaceContentViaHTML : false,
    useContainerForUpdates : false,
    updatePageTitle : true,
    updatePageID : true,
    updatePageClassName : true,
    assets : true,
    perPageAssets : true,
    assetClassName : null,
    showLoading : true,
    swapMethod : 'direct',
    swapOptions : {

    },
    loadingMethod : 'spinner',
    loadingOptions : {

    }
  },

  initialize : function(container,options) {
    this.container = document.id(container);
    this.setOptions(options);
  },

  getContainer : function() {
    return this.container;
  },

  getLoaderContainer : function() {
    return this.loaderContainer || this.getContainer();
  },

  setLoaderContainer : function(container) {
    this.loaderContainer = document.id(container);
    if(this.loadingObject) {
      this.loadingObject.replaceContainer(this.loaderContainer);
    }
  },

  getDocumentBody : function() {
    return document.id(this.options.doc.body);
  },

  getProxyObjectClassName : function(owner,klass,def) {
    try {
      klass = klassify(klass);
      if(!klass || !XPage[owner][klass]) {
        throw new Error;
      }
      return klass;
    }
    catch(e) {
      return klassify(def);
    }
  },

  getLoadingObjectClassName : function() {
    return this.getProxyObjectClassName('Loaders',this.options.loadingMethod,'spinner');
  },

  getLoadingObject : function() {
    if(!this.loadingObject) {
      this.loadingObject = Object.clone(XPage.Loaders[this.getLoadingObjectClassName()]);
      this.loadingObject.init(this.getLoaderContainer(),this.options.loadingOptions);
    }
    return this.loadingObject;
  },

  getSwapObject : function() {
    if(!this.swapObject) {
      var exists = window.Fx && window.Fx.Swap;
      var method = this.options.swapMethod;
      if(exists && method && method != 'direct') {
        this.swapObject = new Fx.Swap(this.getContainer(),this.options.swapOptions);
        this.swapObject.setSwapper(method);
      }
    }
    return this.swapObject;
  },

  getRequester : function() {
    if(!this.requester) {
      var that = this;
      this.requester = new Request({
        timeout : this.options.timeout,
        onRequest : function() {
          that.xhr = this;
          that.onRequest();
        },
        onSuccess : this.onResponse,
        onFailure : this.onFailure
      });
    }
    return this.requester;
  },

  parseRequestOptions : function(options) {
    if(typeOf(options) == 'string' && options.length > 0) {
      options = {
        url : options
      };
    }
    else {
      options = options || {};
    }
    return options;
  },

  get : function(options,callback) {
    options = this.parseRequestOptions(options);
    options.method = 'GET';
    this.load(options,callback);
  },

  post : function(options,callback) {
    options = this.parseRequestOptions(options);
    options.method = 'POST';
    this.load(options,callback);
  },

  incrementRequests : function() {
    if(!this.totalRequests) {
      this.totalRequests = 0;
    }
    this.totalRequests++;
  },

  getRequestsCount : function() {
    return this.totalRequests;
  },

  hasPriorRequest : function() {
    return this.getRequestsCount() > 0;
  },

  load : function(options,callback) {
    options = this.parseRequestOptions(options);
    if(!options.url) {
      throw new Error('XPage.js: You must provide a URL parameter for the load() method');
    }
    else if(this.options.maxRequests && this.getRequestsCount() > this.options.maxRequests) {
      this.onMaxRequests();
    }
    else {
      if(this.hasPriorRequest()) {
        this.onLeave(options.url);
      }
      options.method = options.method || 'GET';
      this.request(options);
    }
  },

  request : function(options) {
    this.getRequester().setOptions(options).send();
  },

  getHeader : function(key) {
    return this.getHeaders()[key];
  },

  getHeaders : function() {
    return this.getXView().getHeaders();
  },

  hasHeader : function(header) {
    return !! this.getHeader(header);
  },

  getLastLoadPath : function() {
    return this.getLastLoadOptions().url;
  },

  getLastLoadOptions : function() {
    return this.getRequester().options;
  },

  parseContent : function(html) {
    return new XView(html);
  },

  getXHR : function() {
    return this.xhr;
  },

  getXView : function() {
    return this.xview;
  },

  onResponse : function(html) {
    this.xview = new XView(html);
    if(this.xview.isEmpty()) {
      this.onEmpty();
    }
    else {
      this.onSuccess();
    }
  },

  onSuccess : function() {
    this.updatePageProperties();
    this.updateLoading();
    this.replaceContent(this.onAfterSuccess);
  },

  onAfterSuccess : function() {
    this.updateLoading();
    this.hasAssets() ? this.loadAssets() : this.onBeforeReady();
  },

  onFailure : function() {
    this.onComplete();
    this.fireEvent('failure');
  },

  onTimeout : function() {
    this.fireEvent('timeout');
  },

  getResponseContent : function() {
    content = this.getXView().getContent();
    var children = content.getChildren();
    var content, length = children.length;
    if(length == 1) {
      content = children[0];
    }
    else if(length > 1) {
      content = new Element('div').adopt(children);
    }
    return content;
  },

  getRawResponseHTML : function() {
    return this.getXView().getHTML();
  },

  getResponseHTML : function() {
    return this.getXView().getHTML();
  },

  prepareContentReplace : function() {
    var container = this.getContainer();
    var inner = this.getInnerContainer();
    var content = this.getResponseContent();
    var swapper = this.getSwapObject();
    content.hide().inject(this.getContainer());
    if(swapper) {
      swapper.getSwapper().setElements(container,inner,content);
    }
    this.setNewInnerContainer(content);
  },

  getNewInnerContainer : function() {
    return this.newInnerContainer;
  },

  setNewInnerContainer : function(container) {
    this.newInnerContainer = container;
  },

  cleanupContentReplace : function() {
    var content = this.getNewInnerContainer();
    var inner = this.getInnerContainer();
    var swapper = this.getSwapObject();
    if(inner && swapper) {
      this.getSwapObject().onComplete(inner,content);
    }
    this.setInnerContainer(content);
  },

  onBeforeContentReplace : function(fn) {
    this.fireBeforeFilter(function() {
      var swapper = this.getSwapObject();
      this.fireEvent('beforeContent');
      if(swapper) {
        swapper.onBeforeSwap(this.getInnerContainer(),this.getNewInnerContainer());
        swapper.getSwapper().before(fn);
      }
      else {
        fn();
      }
    }.bind(this));
  },

  getInnerContainer : function() {
    if(!this.innerContainer) {
      this.innerContainer = this.getContainer().getChildren()[0];
    }
    return this.innerContainer;
  },

  setInnerContainer : function(container) {
    if(this.innerContainer) {
      this.innerContainer.destroy();
      this.innerContainer = null;
    }
    this.innerContainer = container;
  },

  onAfterContentReplace : function(fn) {
    this.fireEvent('afterContent');
    this.fireAfterFilter(function() {
      var swapper = this.getSwapObject();
      if(swapper) {
        swapper.getSwapper().after(fn);
      }
      else {
        fn();
      }
    }.bind(this));
  },

  setAfterFilter : function(fn) {
    this.options.after = fn;
  },

  setBeforeFilter : function(fn) {
    this.options.before = fn;
  },

  fireAfterFilter : function(fn) {
    var after = this.options.after;
    after ? after(fn) : fn();
  },

  fireBeforeFilter : function(fn) {
    var before = this.options.before;
    before ? before(fn) : fn();
  },

  replaceContent : function(fn) {
    if(this.options.replaceContent) {
      this.prepareContentReplace();
      this.onBeforeContentReplace(function() {
        var swapper = this.getSwapObject();
        if(swapper) {
          swapper.getSwapper().during(fn);
        }
        else {
          this.replaceContentNormally(fn);
        }
      }.bind(this));
    }
    else {
      this.fireEvent('content',[this.getResponseHTML()]);
    }
  },

  replaceContentNormally : function(fn) {
    var container = this.getContainer();
    var oldInner = this.getInnerContainer();
    var newInner = this.getNewInnerContainer();
    oldInner.destroy();
    newInner.show();
    fn();
  },

  hasAssets : function() {
    try {
      return this.options.assets && this.getXView().getAssets().length > 0;
    }
    catch(e) {
      return false;
    }
  },

  getDirectedContainer : function() {
    return this.getHeader('container');
  },

  getUpdateContainer : function() {
    return this.options.useContainerForUpdates ? this.getContainer() : this.getDocumentBody();
  },

  updatePageValue : function(key,value) {
    this.getUpdateContainer().set(key,value);
  },

  updatePageID : function() {
    this.updatePageValue('id',this.getXView().getPageID());
  },

  updatePageTitle : function() {
    document.title = this.getXView().getTitle();
  },

  updatePageClassName : function() {
    this.updatePageValue('className',this.getXView().getClassName());
  },

  updatePageProperties : function() {
    if(this.options.updatePageTitle)      this.updatePageTitle(); 
    if(this.options.updatePageID)         this.updatePageID(); 
    if(this.options.updatePageClassName)  this.updatePageClassName(); 
  },

  getAssets : function() {
    return this.getXView().getAssets();
  },

  loadAssets : function() {
    Asset.load(this.getAssets(),this.onAssetsReady);
  },

  onAssetsReady : function() {
    this.onBeforeReady();
  },

  onBeforeReady : function() {
    this.onAfterContentReplace(function() {
      this.cleanupContentReplace();
      this.onReady();
    }.bind(this));
  },

  onReady : function() {
    this.onComplete();
    this.fireEvent('ready');
  },

  onComplete : function() {
    this.hideLoading();
    this.fireEvent('complete');
  },

  showLoading : function() {
    if(this.options.showLoading) {
      this.fireEvent('showLoading');
      this.getLoadingObject().show(this.getLoaderContainer());
    }
  },

  hideLoading : function() {
    if(this.options.showLoading) {
      this.fireEvent('hideLoading');
      this.getLoadingObject().hide(this.getLoaderContainer());
    }
  },

  updateLoading : function() {
    if(this.options.showLoading) {
      this.getLoadingObject().update(this.getLoaderContainer());
    }
  },

  onBeforeChange : function() {
    this.fireEvent('beforeChange');
  },

  onLeave : function(newURL) {
    if(this.hasAssets() && this.options.perPageAssets && this.options.assetClassName) {
      //Asset.unloadAll(this.options.assetClassName);
    }
    this.fireEvent('leave',[this.getLastLoadPath(),newURL]);
  },

  onRequest : function() {
    this.incrementRequests();
    this.showLoading();
    this.fireEvent('request',[this.getLastLoadPath()]);
  },

  onCancel : function() {
    this.fireEvent('cancel');
  },

  cancel : function() {
    if(this.requester) {
      this.requester.cancel();
      this.onCancel();
    }
  },

  on404 : function() {
    this.fireEvent('404');
  },

  onEmpty : function() {
    this.fireEvent('empty');
  },

  onMaxRequests : function() {
    this.fireEvent('maxRequests');
  }

});

})();
