import { nodeSize } from "../common/nodeWidthHeight";

export const wewebSizeForRoot = (
  node: SceneNode
): { width: string | number; height: string | number } => {
  // For root nodes, use percentages like HTML does
  return {
    width: "100%",
    height: "100%"
  };
};

export const wewebSizePartial = (
  node: SceneNode,
  isRootNode: boolean = false
): { width: string | number | undefined; height: string | number | undefined } => {
  // Root nodes get 100% width/height
  if (isRootNode) {
    return wewebSizeForRoot(node);
  }

  const size = nodeSize(node);
  const nodeParent = node.parent;

  let width: string | number | undefined;
  let height: string | number | undefined;

  // Handle width
  if (typeof size.width === "number") {
    width = size.width;
  } else if (size.width === "fill") {
    if (
      nodeParent &&
      "layoutMode" in nodeParent &&
      nodeParent.layoutMode === "HORIZONTAL"
    ) {
      // In horizontal layout, use flex
      width = undefined; // Will be handled by flex property
    } else {
      // Otherwise use percentage
      width = "100%";
    }
  }

  // Handle height
  if (typeof size.height === "number") {
    height = size.height;
  } else if (size.height === "fill") {
    if (
      nodeParent &&
      "layoutMode" in nodeParent &&
      nodeParent.layoutMode === "VERTICAL"
    ) {
      // In vertical layout, use flex
      height = undefined; // Will be handled by flex property
    } else {
      // Otherwise use percentage
      height = "100%";
    }
  }

  return { width, height };
};