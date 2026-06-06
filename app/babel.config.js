module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo (SDK 53) injeta o plugin do reanimated automaticamente
  // quando o pacote está instalado — não declarar manualmente (evita duplicar).
  return {
    presets: ['babel-preset-expo'],
  };
};
