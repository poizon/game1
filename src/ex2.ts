import {
  Application,
  Assets,
  Container,
  Sprite,
  Text,
  TextStyle,
} from "pixi.js";

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
    preference: "auto",
  });

  document.body.appendChild(app.canvas);

  // 1. ЗАГРУЗКА ВСЕХ ТРЕХ ИЗОБРАЖЕНИЙ
  // PixiJS v8 автоматически загрузит их параллельно
  const [bgTexture, heroTexture] = await Promise.all([
    Assets.load("/assets/bckgrnd.png"),
    Assets.load("/assets/chars_big.png"),
  ]);

  // 2. СОЗДАНИЕ СЛОЕВ (ПОРЯДОК ИМЕЕТ ЗНАЧЕНИЕ)

  // Слой 1: Фон (самый нижний)
  const background = new Sprite(bgTexture);
  background.anchor.set(0.5); // Центрируем фон
  app.stage.addChild(background);

  background.x = app.screen.width * 0.5;
  background.y = app.screen.height * 0.5;

  // Слой 2: Контейнер для героя (чтобы он дышал локально)
  const heroContainer = new Container();
  app.stage.addChild(heroContainer);

  const hero = new Sprite(heroTexture);
  hero.anchor.set(2.5, 1.0); // Точка опоры внизу персонажа
  heroContainer.addChild(hero);

  heroContainer.x = app.screen.width * 0.5 + 240;
  heroContainer.y = app.screen.height * 0.5 + 140;

  // 3. ФУНКЦИЯ АДАПТИВНОСТИ (RESIZE)
  // function updateLayout() {
  //   const centerX = app.screen.width * 0.5;
  //   const centerY = app.screen.height * 0.5;

  //   // Центрируем фон по экрану
  //   background.x = centerX;
  //   background.y = centerY;
  //   // Если нужно, чтобы фон растягивался под экран (по желанию):
  //   background.width = app.screen.width;
  //   background.height = app.screen.height;

  //   // Размещаем героя и одеяло в одной и той же относительной точке
  //   // Например, по центру экрана по X, и чуть ниже центра по Y (на кровати)
  //   const bedX = centerX;
  //   const bedY = app.screen.height * 0.6; // 60% от верха экрана

  //   heroContainer.x = bedX + 150;
  //   heroContainer.y = bedY + 100;
  // }

  // Инициализируем позиции при старте и подписываемся на ресайз
  // updateLayout();
  // app.renderer.on("resize", updateLayout);

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

  // 5. ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ
  app.ticker.add((ticker) => {
    const dt = ticker.deltaTime;

    // --- АНИМАЦИЯ ДЫХАНИЯ (Анимируем ТОЛЬКО героя, одеяло неподвижно) ---
    sleepTime += 0.04 * dt;
    const pulse = Math.sin(sleepTime);
    hero.scale.y = 1.0 + pulse * 0.025; // Слегка уменьшили амплитуду, чтобы из-под одеяла выглядело естественнее
    hero.scale.x = 1.0 - pulse * 0.008;

    // --- ГЕНЕРАЦИЯ БУКВ "Z" ---
    spawnTimer += dt;
    if (spawnTimer >= SPAWN_INTERVAL) {
      spawnTimer = 0;

      const zText = new ZParticle({ text: "Z", style: zStyle });

      // Вылетают из головы героя (координаты берутся от позиции контейнера героя)
      zText.x = heroContainer.x - 340; // Смещение вправо (подправьте под вашу графику)
      zText.y = heroContainer.y - 240; // Смещение вверх, выше одеяла (подправьте под вашу графику)
      zText.anchor.set(0.5);
      zText.alpha = 1;
      zText.scale.set(0.5 + Math.random() * 0.3);

      zText.userData = {
        speedY: 1.5 + Math.random() * 1,
        wiggleSpeed: 0.05 + Math.random() * 0.05,
        wiggleTime: Math.random() * 100,
        wiggleRange: 0.5 + Math.random() * 0.5,
      };

      // Буквы добавляем на саму сцену (app.stage), чтобы они летели ПОВЕРХ одеяла
      app.stage.addChild(zText);
      zParticles.push(zText);
    }

    // --- АНИМАЦИЯ И ОБНОВЛЕНИЕ БУКВ "Z" ---
    for (let i = zParticles.length - 1; i >= 0; i--) {
      const z = zParticles[i];
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
