/**
 * @license
 * Visual Blocks Editor
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview A number field whose editor is a scrollable wheel picker
 * (a bounded, scroll-snapping list) instead of a free-text/keyboard input.
 */
'use strict';

goog.provide('Blockly.FieldWheelPicker');

goog.require('Blockly.Colours');
goog.require('Blockly.DropDownDiv');
goog.require('Blockly.Field');
goog.require('Blockly.utils');

/**
 * Class for a number field edited via a scrollable wheel picker.
 * @param {string|number} value The initial value.
 * @param {number=} opt_min Minimum selectable value (default -10).
 * @param {number=} opt_max Maximum selectable value (default 10).
 * @param {Function=} opt_validator An optional validator function.
 * @extends {Blockly.Field}
 * @constructor
 */
Blockly.FieldWheelPicker = function(value, opt_min, opt_max, opt_validator) {
  this.min_ = (typeof opt_min === 'number') ? opt_min : -10;
  this.max_ = (typeof opt_max === 'number') ? opt_max : 10;
  value = (typeof value === 'undefined' || value === null) ?
      '0' : String(Math.round(Number(value)));
  Blockly.FieldWheelPicker.superClass_.constructor.call(this, value,
      opt_validator);
};
goog.inherits(Blockly.FieldWheelPicker, Blockly.Field);

/**
 * Construct a FieldWheelPicker from a JSON arg object.
 * @param {!Object} options A JSON object with options (value, min, max).
 * @returns {!Blockly.FieldWheelPicker} The new field instance.
 * @package
 * @nocollapse
 */
Blockly.FieldWheelPicker.fromJson = function(options) {
  return new Blockly.FieldWheelPicker(
      options['value'], options['min'], options['max']);
};

/**
 * Height, in px, of a single row in the wheel.
 */
Blockly.FieldWheelPicker.ITEM_HEIGHT = 32;

/**
 * Number of rows visible in the wheel's viewport at once. Kept odd so a
 * single row sits exactly in the center.
 */
Blockly.FieldWheelPicker.VISIBLE_ROWS = 5;

Blockly.FieldWheelPicker.prototype.CURSOR = 'pointer';

/**
 * Install this field on a block.
 */
Blockly.FieldWheelPicker.prototype.init = function() {
  if (this.fieldGroup_) {
    // Field has already been initialized once.
    return;
  }

  Blockly.FieldWheelPicker.superClass_.init.call(this);

  // Draw a pill-shaped background, matching the locked text field's look,
  // since this field also sits directly on the block face (no shadow).
  var pillRadius = this.size_.height / 2;
  this.box_ = Blockly.utils.createSvgElement('rect',
      {
        'rx': pillRadius,
        'ry': pillRadius,
        'x': 0,
        'y': 0,
        'width': this.size_.width,
        'height': this.size_.height,
        'fill': Blockly.Colours.textField,
      }
  );
  this.fieldGroup_.insertBefore(this.box_, this.textElement_);
  this.textElement_.style.setProperty(
      'fill', Blockly.Colours.textFieldText, 'important');

  this.updateWidth();
  this.render_();
};

/**
 * Ensure a usable minimum width, same rationale as the locked text field:
 * this field has no shadow sub-block to inherit sizing from.
 * @override
 */
Blockly.FieldWheelPicker.prototype.updateWidth = function() {
  Blockly.FieldWheelPicker.superClass_.updateWidth.call(this);
  if (this.box_) {
    this.size_.width = Math.max(this.size_.width, Blockly.BlockSvg.FIELD_WIDTH_MIN_EDIT);
  }
  if (this.box_) {
    this.box_.setAttribute('width', this.size_.width);
    this.box_.setAttribute('height', this.size_.height);
  }
};

/**
 * Clamp and round any incoming value to an integer within [min_, max_].
 * @param {*} newValue The value to validate.
 * @return {string} The validated value, as a string.
 * @override
 */
Blockly.FieldWheelPicker.prototype.classValidator = function(newValue) {
  var n = Math.round(Number(newValue));
  if (isNaN(n)) {
    return null;
  }
  n = Math.min(this.max_, Math.max(this.min_, n));
  return String(n);
};

/**
 * Open the wheel picker below/above the field.
 * @private
 */
Blockly.FieldWheelPicker.prototype.showEditor_ = function() {
  Blockly.DropDownDiv.hideWithoutAnimation();
  Blockly.DropDownDiv.clearContent();

  var contentDiv = Blockly.DropDownDiv.getContentDiv();
  var thisField = this;

  var itemHeight = Blockly.FieldWheelPicker.ITEM_HEIGHT;
  var visibleRows = Blockly.FieldWheelPicker.VISIBLE_ROWS;
  var padRows = (visibleRows - 1) / 2;

  var wheel = document.createElement('div');
  wheel.className = 'blocklyWheelPicker';
  wheel.style.height = (itemHeight * visibleRows) + 'px';

  var centerBand = document.createElement('div');
  centerBand.className = 'blocklyWheelPickerCenterBand';
  centerBand.style.height = itemHeight + 'px';
  centerBand.style.top = (itemHeight * padRows) + 'px';
  wheel.appendChild(centerBand);

  var list = document.createElement('div');
  list.className = 'blocklyWheelPickerList';
  list.style.padding = (itemHeight * padRows) + 'px 0';

  var items = [];
  for (var v = this.min_; v <= this.max_; v++) {
    var item = document.createElement('div');
    item.className = 'blocklyWheelPickerItem';
    item.textContent = String(v);
    item.setAttribute('data-value', String(v));
    item.style.height = itemHeight + 'px';
    item.style.lineHeight = itemHeight + 'px';
    list.appendChild(item);
    items.push(item);
  }
  wheel.appendChild(list);
  contentDiv.appendChild(wheel);

  // Always open centered on 0, regardless of the field's current value.
  var indexOfValue = Math.min(
      items.length - 1, Math.max(0, 0 - this.min_));

  var highlightNearestToCenter = function() {
    var index = Math.round(list.scrollTop / itemHeight);
    index = Math.min(items.length - 1, Math.max(0, index));
    for (var i = 0; i < items.length; i++) {
      Blockly.utils.removeClass(items[i], 'blocklyWheelPickerItemSelected');
    }
    Blockly.utils.addClass(items[index], 'blocklyWheelPickerItemSelected');
    return index;
  };

  var commitTimer = null;
  var commitFromScroll = function() {
    var index = highlightNearestToCenter();
    thisField.setValue(items[index].getAttribute('data-value'));
  };
  var onScroll = function() {
    highlightNearestToCenter();
    if (commitTimer) {
      clearTimeout(commitTimer);
    }
    // Settle shortly after scrolling stops (scroll-snap has already
    // finished animating to the nearest row by then).
    commitTimer = setTimeout(commitFromScroll, 120);
  };
  list.addEventListener('scroll', onScroll);

  list.addEventListener('click', function(e) {
    var item = e.target.closest ? e.target.closest('.blocklyWheelPickerItem') : null;
    if (!item) {
      return;
    }
    var index = items.indexOf(item);
    list.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
    thisField.setValue(item.getAttribute('data-value'));
  });

  var primaryColour = this.sourceBlock_.getColour();
  Blockly.DropDownDiv.setColour(
      primaryColour, this.sourceBlock_.getColourTertiary());
  Blockly.DropDownDiv.setCategory(this.sourceBlock_.getCategory());

  var scale = this.sourceBlock_.workspace.scale;
  var bBox = { width: this.size_.width, height: this.size_.height };
  bBox.width *= scale;
  bBox.height *= scale;
  var position = this.fieldGroup_.getBoundingClientRect();
  var primaryX = position.left + bBox.width / 2;
  var primaryY = position.top + bBox.height;
  var secondaryX = primaryX;
  var secondaryY = position.top;

  Blockly.DropDownDiv.setBoundsElement(
      this.sourceBlock_.workspace.getParentSvg().parentNode);
  Blockly.DropDownDiv.show(
      this, primaryX, primaryY, secondaryX, secondaryY, this.onHide.bind(this));

  // Jump to the current value with no animation on open. This must happen
  // after DropDownDiv.show(), since the list has no scrollable layout (and
  // silently ignores scrollTop) until it's actually visible.
  list.scrollTop = indexOfValue * itemHeight;
  highlightNearestToCenter();

  if (this.box_) {
    this.box_.setAttribute('fill', this.sourceBlock_.getColourQuaternary());
  }
};

/**
 * Callback for when the drop-down is hidden.
 */
Blockly.FieldWheelPicker.prototype.onHide = function() {
  if (this.box_ && this.sourceBlock_) {
    this.box_.setAttribute('fill', Blockly.Colours.textField);
  }
};

Blockly.Field.register('field_wheel_picker', Blockly.FieldWheelPicker);
