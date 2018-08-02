"use strict";
var __extends = (this && this.__extends) || (function () {
    debugger;
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var MyElement = /** @class */ (function (_super) {
    __extends(MyElement, _super);
    function MyElement() {
        return _super.call(this) || this;
    }
    MyElement.prototype.attachedCallback = function () {
        debugger;
        var dateEl = document.createElement("span");
        dateEl.textContent = "Hello world";
        this.appendChild(dateEl);
    };
    return MyElement;
}(HTMLDivElement));
document.registerElement("my-element", MyElement);

/*
var MyElement = (function () {
    function MyElement() {
        return this;
    }
    MyElement.prototype.createdCallback = function () {
        this.innerHTML = "<div>HELLO WORLD!!</div>"
    };
    MyElement.prototype.attachedCallBack = function () { };
    return MyElement;
}(HTMLDivElement));
window.customElements.define('my-element', MyElement);


document.registerElement('my-element', MyElement);

class MyElement extends HTMLElement {

}
window.customElements.define('my-element', MyElement);
*/