import {
  Application,
  Assets,
  Container,
  Sprite,
  Text,
  TextStyle,
} from "pixi.js";

// 1. Инициализация приложения
const app = new Application();
await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x0f0c1b,
  preference: "webgl",
}); // Ночной цвет фона
document.body.appendChild(app.canvas);

// 2. Создаем героя (дыхание)
const texture = await Assets.load("/assets/hero_sleeping.png");
const heroContainer = new Container();
heroContainer.x = 400;
heroContainer.y = 400;
app.stage.addChild(heroContainer);

const hero = new Sprite(texture);
hero.anchor.set(0.5, 1.0); // Точка опоры внизу
heroContainer.addChild(hero);

// 3. Настройка стиля для букв "Z"
const zStyle = new TextStyle({
  fontFamily: "Arial",
  fontSize: 24,
  fill: "#a5d8ff", // Нежно-голубой цвет светящихся букв
  fontWeight: "bold",
  align: "center",
});

// Интерфейс для пользовательских данных буквы Z
interface ZUserData {
  speedY: number;
  wiggleSpeed: number;
  wiggleTime: number;
  wiggleRange: number;
}

// Массив для хранения активных букв на экране
const zParticles: Text[] = [];

// Таймеры для контроля появления букв
let sleepTime = 0;
let spawnTimer = 0;
const SPAWN_INTERVAL = 45; // Каждые ~45 кадров (примерно раз в 0.7 секунды) будет вылетать новая "Z"

// 4. Главный игровой цикл
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

    // Создаем текст "Z"
    const zText = new Text({ text: "Z", style: zStyle });

    // Позиция появления (примерно у головы героя)
    // Смещаем относительно центра контейнера героя
    zText.x = heroContainer.x + 30; // Чуть правее центра
    zText.y = heroContainer.y - 120; // Выше тела (на уровне головы)

    zText.anchor.set(0.5);
    zText.alpha = 1;

    // Начальный случайный размер для разнообразия
    zText.scale.set(0.5 + Math.random() * 0.3);

    // Индивидуальные параметры для движения этой конкретной буквы
    zText.label = "Z"; // Явное указание типа, чтобы TypeScript не ругался на userData
    (zText as any).userData = {
      speedY: 1.5 + Math.random() * 1, // Скорость полета вверх
      wiggleSpeed: 0.05 + Math.random() * 0.05, // Скорость покачивания
      wiggleTime: Math.random() * 100, // Фаза покачивания
      wiggleRange: 0.5 + Math.random() * 0.5, // Амплитуда покачивания вбок
    } as ZUserData;

    // Добавляем на сцену и в наш массив
    app.stage.addChild(zText);
    zParticles.push(zText);
  }

  // --- АНИМАЦИЯ И ОБНОВЛЕНИЕ БУКВ "Z" ---
  for (let i = zParticles.length - 1; i >= 0; i--) {
    const z = zParticles[i];
    const data = (z as any).userData as ZUserData;

    // 1. Движение вверх
    z.y -= data.speedY * dt;

    // 2. Покачивание влево-вправо по синусоиде
    data.wiggleTime += data.wiggleSpeed * dt;
    z.x += Math.sin(data.wiggleTime) * data.wiggleRange * dt;

    // 3. Плавное увеличение размера (эффект удаления или рассеивания)
    z.scale.x += 0.005 * dt;
    z.scale.y += 0.005 * dt;

    // 4. Медленное исчезновение (растворение в воздухе)
    z.alpha -= 0.01 * dt;

    // 5. Если буква полностью прозрачная, удаляем ее из памяти
    if (z.alpha <= 0) {
      app.stage.removeChild(z); // Удаляем со сцены Pixi
      z.destroy(); // Очищаем текстурные ресурсы памяти
      zParticles.splice(i, 1); // Удаляем из массива
    }
  }
});
