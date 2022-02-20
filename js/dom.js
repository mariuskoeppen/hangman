class DOMHandler {
  selectors = ['#start', '#play', '#finish', '#notfound'];
  elements = [];

  initiate() {
    const all_elements = {};

    for(let selector of this.selectors) {
      const element = this.find(selector);
      if(element) {
        all_elements[selector] = new DOMElement(element);
      }
    }

    this.elements = all_elements;
    return this;
  }


  show_panels({show = [], hide = []} = {}) {
    for(let sel of hide) {
      const el = this.get_element(sel);
      el.hide();
    }

    for(let sel of show) {
      const el = this.get_element(sel);
      el.show();
    }
    return
  }

  find(selector) {
    return document.querySelector(selector);
  }

  send_value(sel, msg) {
    const el = this.get_element(sel);
    el.display(msg);
  }

  get_element(sel) {
    if(this.elements[sel]) {
      return this.elements[sel];
    } else {
      const el = new DOMElement(this.find(sel))
      this.elements[sel] = el;
      return el;
    }
  }

  is_visible(sel) {
    const el = this.get_element(sel);
    return el.visible;
  }
}


class DOMElement {
  constructor(element) {
    this.element = element;
  }

  show() {
    return this.element.style.display = 'inline-block';
  }

  hide() {
    return this.element.style.display = 'none';
  }

  async toggle() {
    if(this.element.style.display == 'none') {
      this.show();
    } else {
      this.hide();
    }
    return this;
  }

  display(html) {
    this.element.innerHTML = html;
  }

  get visible() {
    const style = this.element.style;
    return !(style.display == 'hidden' || style.display == 'none'  || this.element.hidden);
  }
}
