? state.getWritable(to) : state;
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function $canSimpleTextNodesBeMerged(node1, node2) {
  const node1Mode = node1.__mode;
  const node1Format = node1.__format;
  const node1Style = node1.__style;
  const node2Mode = node2.__mode;
  const node2Format = node2.__format;
  const node2Style = node2.__style;
  const node1State = node1.__state;
  const node2State = node2.__state;
  return (node1Mode === null || node1Mode === node2Mode) && (node1Format === null || node1Format === node2Format) && (node1Style === null || node1Style === node2Style) && (node1.__state === null || node1State === node2State || nodeStatesAreEquivalent(node1State, node2State));
}
function $mergeTextNodes(node1, node2) {
  const writableNode1 = node1.mergeWithSibling(node2);
  const normalizedNodes = getActiveEditor()._normalizedNodes;
  normalizedNodes.add(node1.__key);
  normalizedNodes.add(node2.__key);
  return writableNode1;
}
function $normalizeTextNode(textNode) {
  let node = textNode;
  if (node.__text === '' && node.isSimpleText() && !node.isUnmergeable()) {
    node.remove();
    return;
  }

  // Backward
  let previousNode;
  while ((previousNode = node.getPreviousSibling()) !== null && $isTextNode(previousNode) && previousNode.isSimpleText() && !previousNode.isUnmergeable()) {
    if (previousNode.__text === '') {
      previousNode.remove();
    } else if ($canSimpleTextNodesBeMerged(previousNode, node)) {
      node = $mergeTextNodes(previousNode, node);
      break;
    } else {
      break;
    }
  }

  // Forward
  let nextNode;
  while ((nextNode = node.getNextSibling()) !== null && $isTextNode(nextNode) && nextNode.isSimpleText() && !nextNode.isUnmergeable()) {
    if (nextNode.__text === '') {
      nextNode.remove();
    } else if ($canSimpleTextNodesBeMerged(node, nextNode)) {
      node = $mergeTextNodes(node, nextNode);
      break;
    } else {
      break;
    }
  }
}
function $normalizeSelection(selection) {
  $normalizePoint(selection.anchor);
  $normalizePoint(selection.focus);
  return selection;
}
function $normalizePoint(point) {
  while (point.type === 'element') {
    const node = point.getNode();
    const offset = point.off