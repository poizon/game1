import {
  Application,
  Assets,
  Container,
  Sprite,
  Text,
  TextStyle,
} from "pixi.js";

// 1. Интерфейс для данных буквы Z
interface ZUserData {
  speedY: number;
  wiggleSpeed: number;
  wiggleTime: number;
  wiggleRange: number;
}

// 2. Создаем собственный класс, расширяющий Pixi Text, чтобы TypeScript не ругался
class ZParticle extends Text {
  public userData!: ZUserData;
}

(async () => {
  // Инициализация приложения PixiJS v8
  const app = new Application();

  await app.init({
    background: "#ffffff",
    resizeTo: window,
  });

  document.body.appendChild(app.canvas);

  // Загружаем героя
  const texture = await Assets.load("/assets/hero_sleeping.png");
  const heroContainer = new Container();
  heroContainer.x = app.screen.width * 0.8;
  heroContainer.y = app.screen.height * 0.9;
  app.stage.addChild(heroContainer);

  const hero = new Sprite(texture);
  hero.anchor.set(0.5, 1.0);
  heroContainer.addChild(hero);

  // Настройка стиля букв
  const zStyle = new TextStyle({
    fontFamily: "Arial",
    fontSize: 24,
    fill: "#000000",
    fontWeight: "bold",
    align: "center",
  });

  // Массив строго типизирован нашими частицами ZParticle
  const zParticles: ZParticle[] = [];

  let sleepTime = 0;
  let spawnTimer = 0;
  const SPAWN_INTERVAL = 45;

  app.ticker.add((ticker) => {
    const dt = ticker.deltaTime;

    // --- АНИМАЦИЯ ДЫХАНИЯ ---
    sleepTime += 0.04 * dt;
    const pulse = Math.sin(sleepTime);
    hero.scale.y = 1.0 + pulse * 0.03;
    hero.scale.x = 1.0 - pulse * 0.01;

    // --- ГЕНЕРАЦИЯ БУКВ "Z" ---
    spawnTimer += dt;
    if (spawnTimer >= SPAWN_INTERVAL) {
      spawnTimer = 0;

      // Создаем объект нашего кастомного класса
      const zText = new ZParticle({ text: "Z", style: zStyle });

      zText.x = heroContainer.x - 10;
      zText.y = heroContainer.y - 400;
      zText.anchor.set(0.5);
      zText.alpha = 1;
      zText.scale.set(0.5 + Math.random() * 0.3);

      // Теперь TypeScript понимает userData и дает автокомплит без (as any)
      zText.userData = {
        speedY: 1.5 + Math.random() * 1,
        wiggleSpeed: 0.05 + Math.random() * 0.05,
        wiggleTime: Math.random() * 100,
        wiggleRange: 0.5 + Math.random() * 0.5,
      };

      app.stage.addChild(zText);
      zParticles.push(zText);
    }

    // --- АНИМАЦИЯ И ОБНОВЛЕНИЕ БУКВ "Z" ---
    for (let i = zParticles.length - 1; i >= 0; i--) {
      const z = zParticles[i];
      const data = z.userData; // Чистый код без приведений типов

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
