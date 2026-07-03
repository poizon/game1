import { Application, Assets, Container, Sprite, Texture } from "pixi.js";

import { Dialog01 } from "./Dialog01"; //

(async () => {
  const app = new Application();

  await app.init({
    resizeTo: window,
    background: "#000000",
  });

  document.body.appendChild(app.canvas);

  // 1. ЗАГРУЗКА ИЗОБРАЖЕНИЙ
  const frameFiles = [
    "back1.png",
    "back2.png",
    "button.png",
    "chars.png",
    "smoke1.png",
    "smoke2.png",
    "title.png",
  ];

  // Массив путей к файлам
  const assetPaths = frameFiles.map((file) => `/assets/frames/${file}`);

  // Assets.load возвращает объект/словарь, где ключи — это пути
  const loadedAssets = await Assets.load<Texture>(assetPaths);

  // Создаем объект с загруженными ТЕКСТУРАМИ (исправлено)
  const textures: Record<string, Texture> = {};
  frameFiles.forEach((file) => {
    const key = file.replace(".png", "");
    const fullPath = `/assets/frames/${file}`;
    textures[key] = loadedAssets[fullPath];
  });

  // 2. СОЗДАНИЕ И ЦЕНТРИРОВАНИЕ КОНТЕЙНЕРА (исправлено)
  const container = new Container();
  // Помещаем контейнер строго в центр экрана
  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;
  app.stage.addChild(container);

  // Функция для отслеживания изменения размеров окна
  window.addEventListener("resize", () => {
    container.x = app.screen.width / 2;
    container.y = app.screen.height / 2;
  });

  // 3. СОЗДАНИЕ СПРАЙТОВ ИЗ ТЕКСТУР (исправлено)
  const smoke1 = new Sprite(textures["smoke1"]);
  smoke1.anchor.set(0.5);
  container.addChild(smoke1);

  const smoke2 = new Sprite(textures["smoke2"]);
  smoke2.anchor.set(0.5);
  container.addChild(smoke2);

  const back2 = new Sprite(textures["back2"]);
  back2.anchor.set(0.5);
  container.addChild(back2);

  const back1 = new Sprite(textures["back1"]);
  back1.anchor.set(0.5);
  container.addChild(back1);

  const title = new Sprite(textures["title"]);
  title.anchor.set(0.5);
  container.addChild(title);

  const chars = new Sprite(textures["chars"]);
  chars.anchor.set(0.5);
  container.addChild(chars);

  const dialog = new Dialog01();
  container.addChild(dialog);

  const button = new Sprite(textures["button"]);
  button.anchor.set(0.5);
  button.y = -50;
  button.eventMode = "static";
  button.cursor = "pointer";

  button.on("pointerdown", () => {
    button.scale.set(0.95);
  });

  button.on("pointerup", () => {
    button.scale.set(1);
    dialog.show();
  });

  button.on("pointerupoutside", () => {
    button.scale.set(1);
  });

  container.addChild(button);

  // 5. ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ
  app.ticker.add((ticker) => {
    dialog.update(ticker.elapsedMS);
  });
})();
