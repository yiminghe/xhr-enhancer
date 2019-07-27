/* eslint no-console:0 */

import utils from './utils';
import url from 'modulex-url';
import assign from 'object-assign';
import XhrTransportBase from './xhr-transport-base';
import IO from './base';

// hostname:{iframe: , ready:}
const iframeMap = {};

IO.ajaxSetup({
  useSubDomainProxy: '',
  subDomainProxyUrl: '/proxy.htm',
});

function onLoad() {
  const c = this.io.config;
  const uri = c.uri;
  const hostname = uri.hostname;
  const iframeDesc = iframeMap[hostname];
  iframeDesc.ready = 1;
  utils.removeEvent(iframeDesc.iframe, 'load', this._onLoad);
  this.send();
}

function SubDomainTransport(io) {
  const c = io.config;
  this.io = io;
  c.crossDomain = false;
  this._onLoad = onLoad.bind(this);
}

assign(SubDomainTransport.prototype, XhrTransportBase.proto, {
  constructor: SubDomainTransport,
  // get nativeXhr from iframe document
  // not from current document directly like XhrTransport
  send() {
    const c = this.io.config;
    const uri = c.uri;
    const hostname = uri.hostname;
    let iframe;
    let iframeUri;
    let iframeDesc = iframeMap[hostname];
    const proxy = c.subDomainProxyUrl;

    if (iframeDesc && iframeDesc.ready) {
      this.window = iframeDesc.iframe.contentWindow;
      this.nativeXhr = XhrTransportBase.nativeXhr(
        0,
        iframeDesc.iframe.contentWindow,
      );
      if (this.nativeXhr) {
        this.sendInternal();
      } else {
        console.error('io: document.domain not set correctly!');
      }
      return;
    }

    if (!iframeDesc) {
      iframeDesc = iframeMap[hostname] = {};
      iframe = iframeDesc.iframe = document.createElement('iframe');
      assign(iframe.style, {
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
      });
      document.documentElement.insertBefore(iframe, null);
      iframeUri = {};
      iframeUri.protocol = uri.protocol;
      iframeUri.host = uri.host;
      iframeUri.pathname = proxy;
      iframe.src = url.stringify(iframeUri);
    } else {
      iframe = iframeDesc.iframe;
    }
    utils.addEvent(iframe, 'load', this._onLoad);
  },
});

export default SubDomainTransport;
