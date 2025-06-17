export const getVisibleNodes = (nodes: readonly SceneNode[]) => {
  if (!nodes || !Array.isArray(nodes)) {
    console.warn('getVisibleNodes: nodes is not an array:', nodes);
    return [];
  }
  return nodes.filter((d) => d.visible ?? true);
};
