var XPage;

(function() {

var klassify = function(str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
};

XPage = new Class({

  Implements : [Options, Events],

  Binds : ['onSuccess','onResponse','onRequest','onFailure','onTimeout','onAssetsReady'],

  options : {
    timeout : 5000,
    minPageDelay : 1000,
    doc : document,
    maxRequests : 0,
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

  getDocumentBody : function() {
    return document.id(this.options.doc.body);
  },

  getLoadingObjectClassName : function() {
    var def = 'spinner';
    try {
      var klass = klassify(this.options.loadingMethod);
      if(!klass || !XPage.Loaders[klass]) {
        throw new Error;
      }
      return klass;
    }
    catch(e) {
      return klassify(def);
    }
  },

  getLoadingObject : function() {
    if(!this.loadingObject) {
      this.loadingObject = Object.clone(XPage.Loaders[this.getLoadingObjectClassName()]);
      this.loadingObject.init(this.getContainer(),this.options.loadingOptions);
    }
    return this.loadingObject;
  },

  setSubContainer : function(key,element) {
    this.getSubContainers()[key]=element;
  },

  getSubContainer : function(key) {
    return this.getSubContainers()[key];
  },

  getSubContainers : function() {
    if(!this.subContainers) {
      this.subContainers = {};
    }
    return this.subContainers;
  },

  hasSubContainer : function(key) {
    return !! this.getSubContainer(key);
  },

  hasSubContainers : function() {
    return Object.keys(this.getSubContainers()).length > 0;
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
      alert(this.getRequestsCount()+'1');
      this.onMaxRequests();
    }
    else {
      if(this.hasPriorRequest()) {
        this.onLeave(options.url);
      }
      options.method = options.method || 'GET';
      this.getRequester().setOptions(options).send();
    }
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
    this.replaceContent();
    this.updateLoading();
    this.hasAssets() ? this.loadAssets() : this.onReady();
  },

  onFailure : function() {
    this.onComplete();
    this.fireEvent('failure');
  },

  onTimeout : function() {
    this.fireEvent('timeout');
  },

  getResponseContent : function() {
    return this.getXView().getContent();
  },

  getRawResponseHTML : function() {
    return this.getXView().getRawHTML();
  },

  getResponseHTML : function() {
    return this.getXView().getHTML();
  },

  onBeforeContentReplace : function() {
    this.fireEvent('beforeContent');
  },

  onAfterContentReplace : function() {
    this.fireEvent('afterContent');
  },

  replaceContent : function() {
    if(this.options.replaceContent) {
      this.onBeforeContentReplace();
      this.options.replaceContentViaHTML ? this.replaceContentViaHTML() : this.replaceContentViaElement();
      this.onAfterContentReplace();
    }
    else {
      this.fireEvent('content',[this.getResponseHTML()]);
    }
  },

  replaceContentViaElement : function() {
    this.getContainer().empty().adopt(this.getResponseContent());
  },

  replaceContentViaHTML : function() {
    this.getContainer().set('html',this.getResponseHTML());
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
    this.updatePageValue('title',this.getXView().getTitle());
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
    this.onReady();
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
      this.getLoadingObject().show(this.getContainer());
    }
  },

  hideLoading : function() {
    if(this.options.showLoading) {
      this.getLoadingObject().hide(this.getContainer());
    }
  },

  updateLoading : function() {
    if(this.options.showLoading) {
      this.getLoadingObject().update(this.getContainer());
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

XPage.Loaders = {};

XPage.Loaders.Spinner = {

  init : function(container,options) {
    this.spinner = new Spinner(container,options);
  },

  show : function(container) {
    this.spinner.show();
  },

  hide : function(container) {
    this.spinner.hide();
  },

  update : function(container) {
    this.spinner.position();
  }

};

XPage.Loaders.CursorLoader = {

  init : function(container,options) {
    CursorLoader.init(options);
  },

  show : function(container) {
    CursorLoader.show();
  },

  hide : function(container) {
    CursorLoader.hide();
  },

  update : function() { }

}

})();
