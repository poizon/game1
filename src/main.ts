import {
  Application,
  Assets,
  Container,
  Sprite,
  Text,
  TextStyle,
  Graphics, // Добавлен импорт для создания кнопки
} from "pixi.js";

import { BombPuzzle } from "./BombPuzzle"; // Путь к вашему новому файлу

let bombGame: BombPuzzle | null = null;
let isPuzzleActive = false;

// Заглушка, так как blanket использовался в функциях скрытия, но отсутствовал в коде
let blanket: Sprite | null = null;

// Интерфейс для данных буквы Z
interface ZUserData {
  speedY: number;
  wiggleSpeed: number;
  wiggleTime: number;
  wiggleRange: number;
}

class ZParticle extends Text {
  public userData!: ZUserData;
}

(async () => {
  const app = new Application();

  await app.init({
    resizeTo: window, // Автоматическое растягивание под экран
    background: "#ffffff",
  });

  document.body.appendChild(app.canvas);

  // 1. ЗАГРУЗКА ИЗОБРАЖЕНИЙ
  const [bgTexture, heroTexture] = await Promise.all([
    Assets.load("/assets/bckgrnd.png"),
    Assets.load("/assets/chars_big.png"),
  ]);

  // 2. СОЗДАНИЕ СЛОЕВ

  // Слой 1: Фон (самый нижний)
  const background = new Sprite(bgTexture);
  background.anchor.set(0.5); // Центрируем фон
  app.stage.addChild(background);

  // Слой 2: Контейнер для героя (чтобы он дышал локально)
  const heroContainer = new Container();
  app.stage.addChild(heroContainer);

  const hero = new Sprite(heroTexture);
  hero.anchor.set(2.5, 1.0); // Точка опоры внизу персонажа
  heroContainer.addChild(hero);

  // --- СОЗДАНИЕ КНОПКИ ДЛЯ ЗАПУСКА МИНИ-ИГРЫ ---
  const startButton = new Container();
  startButton.eventMode = "static";
  startButton.cursor = "pointer";
  app.stage.addChild(startButton);

  const btnBg = new Graphics();
  btnBg.roundRect(0, 0, 180, 50, 8);
  btnBg.fill({ color: 0xcc2222 }); // Красный цвет кнопки
  startButton.addChild(btnBg);

  const btnStyle = new TextStyle({
    fontFamily: "Arial",
    fontSize: 16,
    fill: "#ffffff",
    fontWeight: "bold",
  });
  const btnText = new Text({ text: "Обезвредить бомбу", style: btnStyle });
  btnText.anchor.set(0.5);
  btnText.x = 180 / 2;
  btnText.y = 50 / 2;
  startButton.addChild(btnText);

  // Эффекты наведения мыши (Hover)
  startButton.on("pointerover", () => {
    btnBg.clear();
    btnBg.roundRect(0, 0, 180, 50, 8);
    btnBg.fill({ color: 0xff3333 });
  });
  startButton.on("pointerout", () => {
    btnBg.clear();
    btnBg.roundRect(0, 0, 180, 50, 8);
    btnBg.fill({ color: 0xcc2222 });
  });

  // Клик по кнопке
  startButton.on("pointerdown", () => {
    if (!isPuzzleActive) {
      openBombPuzzle();
    }
  });

  // --- ФУНКЦИЯ ОБНОВЛЕНИЯ ПОЗИЦИЙ (RESIZE) ---
  function updateLayout() {
    const centerX = app.screen.width * 0.5;
    const centerY = app.screen.height * 0.5;

    // Удерживаем фон строго по центру
    background.x = centerX;
    background.y = centerY;

    // Удерживаем героя в его относительных координатах
    heroContainer.x = centerX + 240;
    heroContainer.y = centerY + 140;

    // Позиционируем кнопку в правом верхнем углу
    const padding = 20;
    startButton.x = app.screen.width - 180 - padding;
    startButton.y = padding;

    // Центрируем мини-игру, если она запущена
    if (isPuzzleActive) {
      centerPuzzle();
    }
  }

  // Применяем позиции при старте и вешаем на событие ресайза PixiJS v8
  updateLayout();
  app.renderer.on("resize", updateLayout);

  // 4. НАСТРОЙКА БУКВ "Z"
  const zStyle = new TextStyle({
    fontFamily: "Arial",
    fontSize: 24,
    fill: "#a5d8ff",
    fontWeight: "bold",
    align: "center",
  });

  const zParticles: ZParticle[] = [];
  let sleepTime = 0;
  let spawnTimer = 0;
  const SPAWN_INTERVAL = 45;

  function openBombPuzzle() {
    isPuzzleActive = true;

    // 1. Прячем сцену со спящим героем и кнопку запуска
    background.visible = false;
    heroContainer.visible = false;
    startButton.visible = false;
    if (blanket) blanket.visible = false;

    // 2. Создаем экземпляр головоломки, передавая функции успеха и провала
    bombGame = new BombPuzzle(
      () => {
        closeBombPuzzle();
        alert("Успешно! Бомба обезврежена. Герой продолжает мирно спать.");
      },
      () => {
        closeBombPuzzle();
        alert(
          "БАБАХ! Бомба взорвалась! Персонаж резко вскакивает со сны в холодном поту.",
        );
      },
    );

    // 3. Добавляем на экран и центрируем
    app.stage.addChild(bombGame);
    centerPuzzle();
  }

  function closeBombPuzzle() {
    if (bombGame) {
      app.stage.removeChild(bombGame);
      bombGame.destroyPuzzle();
      bombGame = null;
    }

    isPuzzleActive = false;

    // Возвращаем видимость спящему герою и кнопке
    background.visible = true;
    heroContainer.visible = true;
    startButton.visible = true;
    if (blanket) blanket.visible = true;
  }

  function centerPuzzle() {
    if (bombGame && isPuzzleActive) {
      bombGame.x = app.screen.width * 0.5;
      bombGame.y = app.screen.height * 0.5;
    }
  }

  // 5. ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ
  app.ticker.add((ticker) => {
    const dt = ticker.deltaTime;

    // --- АНИМАЦИЯ ДЫХАНИЯ ---
    sleepTime += 0.04 * dt;
    const pulse = Math.sin(sleepTime);
    hero.scale.y = 1.0 + pulse * 0.025;
    hero.scale.x = 1.0 - pulse * 0.008;

    // --- ГЕНЕРАЦИЯ БУКВ "Z" ---
    // Генерируем буквы только тогда, когда герой спит (мини-игра закрыта)
    if (!isPuzzleActive) {
      spawnTimer += dt;
      if (spawnTimer >= SPAWN_INTERVAL) {
        spawnTimer = 0;

        const zText = new ZParticle({ text: "Z", style: zStyle });

        zText.x = heroContainer.x - 340;
        zText.y = heroContainer.y - 240;
        zText.anchor.set(0.5);
        zText.alpha = 1;
        zText.scale.set(0.5 + Math.random() * 0.3);

        zText.userData = {
          speedY: 1.5 + Math.random() * 1,
          wiggleSpeed: 0.05 + Math.random() * 0.05,
          wiggleTime: Math.random() * 100,
          wiggleRange: 0.5 + Math.random() * 0.5,
        };

        app.stage.addChild(zText);
        zParticles.push(zText);
      }
    }

    // --- АНИМАЦИЯ И ОБНОВЛЕНИЕ БУКВ "Z" ---
    for (let i = zParticles.length - 1; i >= 0; i--) {
      const z = zParticles[i];

      // Если запущена головоломка, мгновенно убираем старые буквы с экрана
      if (isPuzzleActive) {
        app.stage.removeChild(z);
        z.destroy();
        zParticles.splice(i, 1);
        continue;
      }

      const data = z.userData;
      z.y -= data.speedY * dt;

      data.wiggleTime += data.wiggleSpeed * dt;
      z.x += Math.sin(data.wiggleTime) * data.wiggleRange * dt;

      z.scale.x += 0.005 * dt;
      z.scale.y += 0.005 * dt;

      z.alpha -= 0.01 * dt;

      if (z.alpha <= 0) {
        app.stage.removeChild(z);
        z.destroy();
        zParticles.splice(i, 1);
      }
    }
  });
})();
