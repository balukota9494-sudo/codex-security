import{r as d}from"./vendor-FO5ZWpP4.js";var a={exports:{}},s={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var m=d,O=Symbol.for("react.element"),x=Symbol.for("react.fragment"),v=Object.prototype.hasOwnProperty,E=m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,w={key:!0,ref:!0,__self:!0,__source:!0};function l(t,e,o){var r,n={},f=null,p=null;o!==void 0&&(f=""+o),e.key!==void 0&&(f=""+e.key),e.ref!==void 0&&(p=e.ref);for(r in e)v.call(e,r)&&!w.hasOwnProperty(r)&&(n[r]=e[r]);if(t&&t.defaultProps)for(r in e=t.defaultProps,e)n[r]===void 0&&(n[r]=e[r]);return{$$typeof:O,type:t,key:f,ref:p,props:n,_owner:E.current}}s.Fragment=x;s.jsx=l;s.jsxs=l;a.exports=s;var j=a.exports;function S(t,e){var o={};for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&e.indexOf(r)<0&&(o[r]=t[r]);if(t!=null&&typeof Object.getOwnPropertySymbols=="function")for(var n=0,r=Object.getOwnPropertySymbols(t);n<r.length;n++)e.indexOf(r[n])<0&&Object.prototype.propertyIsEnumerable.call(t,r[n])&&(o[r[n]]=t[r[n]]);return o}function h(t,e,o,r){function n(f){return f instanceof o?f:new o(function(p){p(f)})}return new(o||(o=Promise))(function(f,p){function y(u){try{c(r.next(u))}catch(i){p(i)}}function _(u){try{c(r.throw(u))}catch(i){p(i)}}function c(u){u.done?f(u.value):n(u.value).then(y,_)}c((r=r.apply(t,e||[])).next())})}export{h as _,S as a,j};
