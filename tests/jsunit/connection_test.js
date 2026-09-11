/**
 * @license
 * Blockly Tests
 *
 * Copyright 2016 Google Inc.
 * https://developers.google.com/blockly/
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
 * @fileoverview Tests for connection logic.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

var input;
var output;
var previous;
var next;

var dummyWorkspace;

function connectionTest_setUp() {
  dummyWorkspace = {};
  function createDummyBlock() {
    return {
      workspace: dummyWorkspace,
      isShadow: function() {return false;}
    };
  }
  input = new Blockly.Connection(createDummyBlock(),
      Blockly.INPUT_VALUE);
  output = new Blockly.Connection(createDummyBlock(),
      Blockly.OUTPUT_VALUE);
  previous = new Blockly.Connection(createDummyBlock(),
      Blockly.PREVIOUS_STATEMENT);
  next = new Blockly.Connection(createDummyBlock(),
      Blockly.NEXT_STATEMENT);
}

function connectionTest_tearDown() {
  input = null;
  output = null;
  previous = null;
  next = null;
  dummyWorkspace = null;
}

var isMovableFn = function() { return true; };
/**
 * These tests check that the reasons for failures to connect are consistent
 * (internal view of error states).
 */
function testCanConnectWithReason_TargetNull() {
  connectionTest_setUp();

  assertEquals(Blockly.Connection.REASON_TARGET_NULL,
      input.canConnectWithReason_(null));

  connectionTest_tearDown();
}

function testCanConnectWithReason_Disconnect() {
  connectionTest_setUp();

  var tempConnection = new Blockly.Connection({workspace: dummyWorkspace, isMovable: isMovableFn},
      Blockly.OUTPUT_VALUE);
  Blockly.Connection.connectReciprocally_(input, tempConnection);
  assertEquals(Blockly.Connection.CAN_CONNECT,
      input.canConnectWithReason_(output));

  connectionTest_tearDown();
}

function testCanConnectWithReason_DifferentWorkspaces() {
  connectionTest_setUp();

  input = new Blockly.Connection({workspace: {}}, Blockly.INPUT_VALUE);
  output = new Blockly.Connection({workspace: dummyWorkspace},
      Blockly.OUTPUT_VALUE);

  assertEquals(Blockly.Connection.REASON_DIFFERENT_WORKSPACES,
      input.canConnectWithReason_(output));

  connectionTest_tearDown();
}


function testCanConnectWithReason_Self() {
  connectionTest_setUp();

  var block = {type_: "test block"};
  input.sourceBlock_ = block;
  assertEquals(Blockly.Connection.REASON_SELF_CONNECTION,
      input.canConnectWithReason_(input));

  connectionTest_tearDown();
}

function testCanConnectWithReason_Type() {
  connectionTest_setUp();

  assertEquals(Blockly.Connection.REASON_WRONG_TYPE,
      input.canConnectWithReason_(previous));
  assertEquals(Blockly.Connection.REASON_WRONG_TYPE,
      input.canConnectWithReason_(next));

  assertEquals(Blockly.Connection.REASON_WRONG_TYPE,
      output.canConnectWithReason_(previous));
  assertEquals(Blockly.Connection.REASON_WRONG_TYPE,
      output.canConnectWithReason_(next));

  assertEquals(Blockly.Connection.REASON_WRONG_TYPE,
      previous.canConnectWithReason_(input));
  assertEquals(Blockly.Connection.REASON_WRONG_TYPE,
      previous.canConnectWithReason_(output));

  assertEquals(Blockly.Connection.REASON_WRONG_TYPE,
      next.canConnectWithReason_(input));
  assertEquals(Blockly.Connection.REASON_WRONG_TYPE,
      next.canConnectWithReason_(output));

  connectionTest_tearDown();
}

function testCanConnectWithReason_CanConnect() {
  connectionTest_setUp();

  assertEquals(Blockly.Connection.CAN_CONNECT,
      previous.canConnectWithReason_(next));
  assertEquals(Blockly.Connection.CAN_CONNECT,
      next.canConnectWithReason_(previous));
  assertEquals(Blockly.Connection.CAN_CONNECT,
      input.canConnectWithReason_(output));
  assertEquals(Blockly.Connection.CAN_CONNECT,
      output.canConnectWithReason_(input));

  connectionTest_tearDown();
}

/**
 * The next set of tests checks that exceptions are being thrown at the correct
 * times (external view of errors).
 */
function testCheckConnection_Self() {
  connectionTest_setUp();
  var block = {type_: "test block"};
  input.sourceBlock_ = block;
  try {
    input.checkConnection_(input);
    fail();
  } catch (e) {
    // expected
  }

  connectionTest_tearDown();
}

function testCheckConnection_TypeInputPrev() {
  connectionTest_setUp();
  try {
    input.checkConnection_(previous);
    fail();
  } catch (e) {
    // expected
  }

  connectionTest_tearDown();
}

function testCheckConnection_TypeInputNext() {
  connectionTest_setUp();
  try {
    input.checkConnection_(next);
    fail();
  } catch (e) {
    // expected
  }

  connectionTest_tearDown();
}

function testCheckConnection_TypeOutputPrev() {
  connectionTest_setUp();
  try {
    output.checkConnection_(previous);
    fail();
  } catch (e) {
    // expected
  }

  connectionTest_tearDown();
}

function testCheckConnection_TypePrevInput() {
  connectionTest_setUp();
  try {
    previous.checkConnection_(input);
    fail();
  } catch (e) {
    // expected
  }

  connectionTest_tearDown();
}

function testCheckConnection_TypePrevOutput() {
  connectionTest_setUp();
  try {
    previous.checkConnection_(output);
    fail();
  } catch (e) {
    // expected
  }

  connectionTest_tearDown();
}

function testCheckConnection_TypeNextInput() {
  connectionTest_setUp();
  try {
    next.checkConnection_(input);
    fail();
  } catch (e) {
    // expected
  }

  connectionTest_tearDown();
}

function testCheckConnection_TypeNextOutput() {
  connectionTest_setUp();
  try {
    next.checkConnection_(output);
    fail();
  } catch (e) {
    // expected
  }

  connectionTest_tearDown();
}

function test_isConnectionAllowed_Distance() {
  var sharedWorkspace = {};
  // Two connections of opposite types near each other.
  var one = helper_createConnection(5 /* x */, 10 /* y */,
      Blockly.INPUT_VALUE, null, true);
  one.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);

  var two = helper_createConnection(10 /* x */, 15 /* y */,
      Blockly.OUTPUT_VALUE, null, true);
  two.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);

  assertTrue(two.isConnectionAllowed(one, 20.0));
  // Move connections farther apart.
  two.x_ = 100;
  two.y_ = 100;
  assertFalse(two.isConnectionAllowed(one, 20.0));
}

function test_isConnectionAllowed_Unrendered() {
  var sharedWorkspace = {};

  var one = helper_createConnection(5 /* x */, 10 /* y */,
      Blockly.INPUT_VALUE);
  one.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);

  // Don't offer to connect a left (male) value plug to
  // an available right (female) value plug.
  // Unlike in Blockly, you can't do this even if the left value plug isn't
  // already connected.
  var two = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  two.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);

  assertFalse(one.isConnectionAllowed(two));
  var three = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  three.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);

  Blockly.Connection.connectReciprocally_(two, three);
  assertFalse(one.isConnectionAllowed(two));

  // Don't connect two connections on the same block.
  two.sourceBlock_ = one.sourceBlock_;
  assertFalse(one.isConnectionAllowed(two));
}

function test_isConnectionAllowed_NoNext() {
  var sharedWorkspace = {};
  var one = helper_createConnection(0, 0, Blockly.NEXT_STATEMENT);
  one.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  one.sourceBlock_.nextConnection = one;

  var two = helper_createConnection(0, 0, Blockly.PREVIOUS_STATEMENT);
  two.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  two.sourceBlock_.previousConnection = two;

  assertTrue(two.isConnectionAllowed(one));

  var three = helper_createConnection(0, 0, Blockly.PREVIOUS_STATEMENT);
  three.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  three.sourceBlock_.previousConnection = three;
  Blockly.Connection.connectReciprocally_(one, three);

  // A terminal block is allowed to replace another terminal block.
  assertTrue(two.isConnectionAllowed(one));
}

function test_isConnectionAllowed_InsertionMarker() {
  var sharedWorkspace = {};
  // Two connections of opposite types near each other.
  var one = helper_createConnection(5 /* x */, 10 /* y */,
      Blockly.INPUT_VALUE);
  one.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);

  // The second one is an insertion marker.
  var two = helper_createConnection(10 /* x */, 15 /* y */,
      Blockly.OUTPUT_VALUE);
  two.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  two.sourceBlock_.isInsertionMarker = function() {
      return true;
    };

  assertFalse(one.isConnectionAllowed(two, 20.0));
}

function testCheckConnection_Okay() {
  connectionTest_setUp();
  previous.checkConnection_(next);
  next.checkConnection_(previous);
  input.checkConnection_(output);
  output.checkConnection_(input);

  connectionTest_tearDown();
}

function test_canConnectWithReason_Procedures_WrongBlockType() {
  var sharedWorkspace = {};
  var one = helper_createConnection(0, 0, Blockly.NEXT_STATEMENT);
  one.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  one.sourceBlock_.type = Blockly.PROCEDURES_DEFINITION_BLOCK_TYPE;
  // Make one be the connection on its source block's input.
  one.sourceBlock_.getInput = function() {
    return {
      connection: one
    };
  };

  var two = helper_createConnection(0, 0, Blockly.PREVIOUS_STATEMENT);
  two.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  // Fail because two's source block is the wrong type.
  two.sourceBlock_.type = 'wrong_type';
  assertEquals(Blockly.Connection.REASON_CUSTOM_PROCEDURE,
      one.canConnectWithReason_(two));
}

function test_canConnectWithReason_Procedures_Pass() {
  var sharedWorkspace = {};
  var one = helper_createConnection(0, 0, Blockly.NEXT_STATEMENT);
  one.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  one.sourceBlock_.type = Blockly.PROCEDURES_DEFINITION_BLOCK_TYPE;
  // Make one be the connection on its source block's input.
  one.sourceBlock_.getInput = function() {
    return {
      connection: one
    };
  };
  var two = helper_createConnection(0, 0, Blockly.PREVIOUS_STATEMENT);
  two.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  two.sourceBlock_.type = Blockly.PROCEDURES_PROTOTYPE_BLOCK_TYPE;
  assertEquals(Blockly.Connection.CAN_CONNECT,
      one.canConnectWithReason_(two));
}

function test_canConnectWithReason_Procedures_NextConnection() {
  var sharedWorkspace = {};
  var one = helper_createConnection(0, 0, Blockly.NEXT_STATEMENT);
  one.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  one.sourceBlock_.type = Blockly.PROCEDURES_DEFINITION_BLOCK_TYPE;
  // One is the next connection, not an input connection
  one.sourceBlock_.nextConnection = one;
  one.sourceBlock_.getInput = function() {
    return {
      connection: null
    };
  };
  var two = helper_createConnection(0, 0, Blockly.PREVIOUS_STATEMENT);
  two.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  // It should be okay, even if two's source block has the wrong type, because
  // it's not trying to connect to the input.
  two.sourceBlock_.type = 'wrong_type';
  assertEquals(Blockly.Connection.CAN_CONNECT,
      one.canConnectWithReason_(two));
}

function test_canConnectWithReason_OledRejectsBoolean() {
  var sharedWorkspace = {};
  var oledInput = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  oledInput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  oledInput.sourceBlock_.type = 'onePointZero_output_oled_line';

  var booleanOutput = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  booleanOutput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  booleanOutput.setCheck('Boolean');

  assertEquals(Blockly.Connection.REASON_CHECKS_FAILED,
      oledInput.canConnectWithReason_(booleanOutput));
}

function test_canConnectWithReason_OperatorRejectsBoolean() {
  var sharedWorkspace = {};
  var operatorInput = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  operatorInput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  operatorInput.sourceBlock_.type = 'operator_add';

  var booleanOutput = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  booleanOutput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  booleanOutput.setCheck('Boolean');

  assertEquals(Blockly.Connection.REASON_CHECKS_FAILED,
      operatorInput.canConnectWithReason_(booleanOutput));
}

function test_canConnectWithReason_OperatorAndAllowsBoolean() {
  var sharedWorkspace = {};
  var andInput = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  andInput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  andInput.sourceBlock_.type = 'operator_and';
  andInput.setCheck('Boolean');

  var booleanOutput = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  booleanOutput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  booleanOutput.setCheck('Boolean');

  assertEquals(Blockly.Connection.CAN_CONNECT,
      andInput.canConnectWithReason_(booleanOutput));
}

function test_canConnectWithReason_OledAllowsNumber() {
  var sharedWorkspace = {};
  var oledInput = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  oledInput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  oledInput.sourceBlock_.type = 'onePointZero_output_oled_line';

  var numberOutput = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  numberOutput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  numberOutput.setCheck('Number');

  assertEquals(Blockly.Connection.CAN_CONNECT,
      oledInput.canConnectWithReason_(numberOutput));
}

// ─── Bug fix: hexagon blocks blocked from OLED / Operator value slots ───────
// These tests cover both the typed-Boolean path (check_ = ['Boolean'], used by
// AI-1 v1 / AI-1 v2 condition blocks) and the shape-only path (outputShape_ =
// HEXAGONAL with null check_, e.g. raw custom blocks).

/**
 * Helper: make a source-block stub that reports a specific output shape.
 * Used to simulate blocks whose shape is set directly (no check_ on the
 * output connection) — the third detection path in checkType_.
 */
function helper_makeHexagonalSourceBlock(sharedWorkspace) {
  var block = helper_makeSourceBlock(sharedWorkspace);
  block.getOutputShape = function() { return Blockly.OUTPUT_SHAPE_HEXAGONAL; };
  return block;
}

// Bug 1 / Bug 2 — AI-1 v1 & v2 condition blocks (check_=['Boolean'])
// ─────────────────────────────────────────────────────────────────────

function test_canConnectWithReason_OledRejectsAI1BooleanBlock() {
  // Simulates dragging an AI-1 condition block (blockType: BOOLEAN →
  // check_=['Boolean']) into the value slot of an OLED display block.
  var sharedWorkspace = {};
  var oledInput = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  oledInput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  // Use a realistic OLED opcode as it appears in Blockly: <extensionId>_<opcode>
  oledInput.sourceBlock_.type = 'ace_output_oled_sensor';

  var ai1Output = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  ai1Output.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  ai1Output.setCheck('Boolean'); // set by runtime for BlockType.BOOLEAN

  assertEquals(
      'AI-1 condition block must be rejected by OLED display input',
      Blockly.Connection.REASON_CHECKS_FAILED,
      oledInput.canConnectWithReason_(ai1Output));
}

function test_canConnectWithReason_OledRejectsAI1v2BooleanBlock() {
  // Same scenario but with a different extension id (zingTwoPointZero).
  var sharedWorkspace = {};
  var oledInput = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  oledInput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  oledInput.sourceBlock_.type = 'zingTwoPointZero_output_oled_line';

  var ai1v2Output = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  ai1v2Output.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  ai1v2Output.setCheck('Boolean');

  assertEquals(
      'AI-1 v2 condition block must be rejected by OLED display input',
      Blockly.Connection.REASON_CHECKS_FAILED,
      oledInput.canConnectWithReason_(ai1v2Output));
}

function test_canConnectWithReason_OperatorRejectsAI1BooleanBlock() {
  // Simulates dragging an AI-1 condition block into a numeric operator slot
  // (e.g. operator_add, operator_join — slots that do NOT require Boolean).
  var sharedWorkspace = {};
  var operatorInput = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  operatorInput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  operatorInput.sourceBlock_.type = 'operator_join';

  var ai1Output = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  ai1Output.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  ai1Output.setCheck('Boolean');

  assertEquals(
      'AI-1 condition block must be rejected by non-Boolean operator input',
      Blockly.Connection.REASON_CHECKS_FAILED,
      operatorInput.canConnectWithReason_(ai1Output));
}

// Shape-only path (outputShape_ = HEXAGONAL, check_ is null)
// ────────────────────────────────────────────────────────────

function test_canConnectWithReason_OledRejectsHexagonalShapeOnlyBlock() {
  // Block whose output connection has no check_ but whose block-level
  // outputShape_ is set to HEXAGONAL.  Before the third detection path was
  // added this would slip through the guard.
  var sharedWorkspace = {};
  var oledInput = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  oledInput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  oledInput.sourceBlock_.type = 'hexapodTwoPointZero_output_oled_sensor';

  var hexOutput = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  // Deliberately leave check_ null (promiscuous output) but give the block
  // a hexagonal shape, simulating a custom condition block that sets shape
  // without going through setCheck.
  hexOutput.sourceBlock_ = helper_makeHexagonalSourceBlock(sharedWorkspace);

  assertEquals(
      'Hexagonal-shape block (null check_) must be rejected by OLED input',
      Blockly.Connection.REASON_CHECKS_FAILED,
      oledInput.canConnectWithReason_(hexOutput));
}

function test_canConnectWithReason_OperatorRejectsHexagonalShapeOnlyBlock() {
  var sharedWorkspace = {};
  var operatorInput = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  operatorInput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  operatorInput.sourceBlock_.type = 'operator_add';

  var hexOutput = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  hexOutput.sourceBlock_ = helper_makeHexagonalSourceBlock(sharedWorkspace);

  assertEquals(
      'Hexagonal-shape block (null check_) must be rejected by operator_add input',
      Blockly.Connection.REASON_CHECKS_FAILED,
      operatorInput.canConnectWithReason_(hexOutput));
}

// Regression guards — valid connections must still be accepted
// ─────────────────────────────────────────────────────────────

function test_canConnectWithReason_OledAcceptsStringReporter() {
  // A plain string reporter (oval, check_=['String']) must still fit inside
  // an OLED value slot.
  var sharedWorkspace = {};
  var oledInput = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  oledInput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  oledInput.sourceBlock_.type = 'ace_output_oled_sensor';

  var stringOutput = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  stringOutput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  stringOutput.setCheck('String');

  assertEquals(
      'String reporter must be accepted by OLED display input',
      Blockly.Connection.CAN_CONNECT,
      oledInput.canConnectWithReason_(stringOutput));
}

function test_canConnectWithReason_OperatorAcceptsNumberReporter() {
  // A number reporter must still fit inside an operator_add value slot.
  var sharedWorkspace = {};
  var operatorInput = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  operatorInput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  operatorInput.sourceBlock_.type = 'operator_add';

  var numberOutput = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  numberOutput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  numberOutput.setCheck('Number');

  assertEquals(
      'Number reporter must be accepted by operator_add input',
      Blockly.Connection.CAN_CONNECT,
      operatorInput.canConnectWithReason_(numberOutput));
}

function test_canConnectWithReason_OperatorNotAllowsBooleanInput() {
  // operator_not has a Boolean input slot — a Boolean output must still be
  // accepted there.
  var sharedWorkspace = {};
  var notInput = helper_createConnection(0, 0, Blockly.INPUT_VALUE);
  notInput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  notInput.sourceBlock_.type = 'operator_not';
  notInput.setCheck('Boolean'); // this slot explicitly requires Boolean

  var booleanOutput = helper_createConnection(0, 0, Blockly.OUTPUT_VALUE);
  booleanOutput.sourceBlock_ = helper_makeSourceBlock(sharedWorkspace);
  booleanOutput.setCheck('Boolean');

  assertEquals(
      'Boolean output must be accepted by operator_not Boolean input',
      Blockly.Connection.CAN_CONNECT,
      notInput.canConnectWithReason_(booleanOutput));
}
