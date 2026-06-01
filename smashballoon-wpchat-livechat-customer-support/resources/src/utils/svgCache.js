// svgCache.js
const svgCache = new Map();

export const getSvgIcon = async (name) => {
  if (svgCache.has(name)) {
    return svgCache.get(name);
  }

  const module = await import(`@Assets/svg/${name}.svg?react`);
  const Icon = module.default;
  svgCache.set(name, Icon);
  return Icon;
};
