import { Container, Sprite, Text, TextStyle, Assets } from "pixi.js";

// Интерфейс конфигурации провода
interface WireConfig {
  id: string;
  colorName: string;
  colorHex: string;
  isCorrect: boolean;
}

export class BombPuzzle extends Container {
  private timerText!: Text;
  private hintText!: Text;
  private timeLeft: number = 30; // Время на разминирование (в секундах)
  private isGameOver: boolean = false;
  private timerInterval: any = null;

  // Текстуры элементов
  private wireNormalTex!: any;
  private wireCutTex!: any;

  // Колбэки для связи с основным кодом игры
  private onWinCallback: () => void;
  private onLoseCallback: () => void;

  constructor(onWin: () => void, onLose: () => void) {
    super();
    this.onWinCallback = onWin;
    this.onLoseCallback = onLose;

    this.init();
  }

  private async init() {
    // 1. Загрузка ресурсов
    const [panelTex, wireNormal, wireCut] = await Promise.all([
      Assets.load("/assets/bomb_panel.png"), // Задний фон бомбы
      Assets.load("/assets/wire_normal.png"), // Спрайт целого провода
      Assets.load("/assets/wire_cut2.png"), // Спрайт разрезанного провода
    ]);

    this.wireNormalTex = wireNormal;
    this.wireCutTex = wireCut;

    // 2. Фон панели бомбы
    const panel = new Sprite(panelTex);
    panel.anchor.set(0.5);
    this.addChild(panel);

    // 3. Текстовый стиль для интерфейса бомбы
    const digitalStyle = new TextStyle({
      fontFamily: "Courier New",
      fontSize: 42,
      fill: "#ff3333",
      fontWeight: "bold",
    });

    // Таймер обратного отсчета
    this.timerText = new Text({ text: "00:30", style: digitalStyle });
    this.timerText.anchor.set(0.5);
    this.timerText.y = -160;
    this.addChild(this.timerText);

    // 4. Текстовый стиль для записки-подсказки
    const hintStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 18,
      fill: "#ffffff",
      wordWrap: true,
      wordWrapWidth: 400,
      align: "center",
    });

    this.hintText = new Text({ text: "", style: hintStyle });
    this.hintText.anchor.set(0.5);
    this.hintText.y = 50; // Внизу панели
    this.addChild(this.hintText);

    // 5. Генерация логической загадки и проводов
    this.setupPuzzle();

    // 6. Старт таймера
    this.startTimer();
  }

  private setupPuzzle() {
    // Базовый набор доступных проводов
    const wiresPool: WireConfig[] = [
      {
        id: "red",
        colorName: "КРАСНЫЙ",
        colorHex: "#ff0000",
        isCorrect: false,
      },
      { id: "blue", colorName: "СИНИЙ", colorHex: "#0000ff", isCorrect: false },
      {
        id: "yellow",
        colorName: "ЖЕЛТЫЙ",
        colorHex: "#ffff00",
        isCorrect: false,
      },
      {
        id: "green",
        colorName: "ЗЕЛЕНЫЙ",
        colorHex: "#00ff00",
        isCorrect: false,
      },
    ];

    // Перемешиваем провода случайным образом (Fisher-Yates shuffle)
    for (let i = wiresPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wiresPool[i], wiresPool[j]] = [wiresPool[j], wiresPool[i]];
    }

    // Случайно выбираем один из проводов как правильный для этой попытки
    const correctIndex = Math.floor(Math.random() * wiresPool.length);
    wiresPool[correctIndex].isCorrect = true;

    const correctWire = wiresPool[correctIndex];

    // Генерируем текст подсказки на основе случайного выбора
    // Игрок должен вычислить позицию (например, 1-й, 2-й, 3-й или 4-й провод слева)
    const positionWords = ["ПЕРВЫЙ", "ВТОРОЙ", "ТРЕТИЙ", "ЧЕТВЕРТЫЙ"];
    this.hintText.text = `ИНСТРУКЦИЯ:\nЧтобы обезвредить заряд, перережьте провод, который на схеме указан как правильный. В этой модели бомбы правильным является ${positionWords[correctIndex]} провод по счету.`;

    // 7. Отрисовка проводов на панели
    const startX = -150; // Начальная точка по X для первого провода
    const spacingX = 100; // Расстояние между проводами

    wiresPool.forEach((wireData, index) => {
      const wireContainer = new Container();
      wireContainer.x = startX + index * spacingX;
      wireContainer.y = 0; // По центру вертикали

      // Спрайт провода
      const wireSprite = new Sprite(this.wireNormalTex);
      wireSprite.anchor.set(0.5);
      // Окрашиваем спрайт в нужный цвет, если исходная картинка белая/серая
      wireSprite.tint = wireData.colorHex;

      // Настройка интерактивности PixiJS v8 [1]
      wireSprite.eventMode = "static";
      wireSprite.cursor = "pointer";

      wireSprite.on("pointerdown", () => {
        this.onWireCut(wireSprite, wireData);
      });

      wireContainer.addChild(wireSprite);
      this.addChild(wireContainer);
    });
  }

  private onWireCut(wireSprite: Sprite, wireData: WireConfig) {
    if (this.isGameOver) return;

    // Меняем текстуру на разрезанный провод
    wireSprite.texture = this.wireCutTex;
    this.isGameOver = true;
    clearInterval(this.timerInterval);

    // Проверяем результат через секунду, чтобы игрок успел увидеть анимацию разреза
    setTimeout(() => {
      if (wireData.isCorrect) {
        this.win();
      } else {
        this.lose();
      }
    }, 800);
  }

  private startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.isGameOver) return;

      this.timeLeft--;

      // Форматирование вывода секунд
      const secondsStr =
        this.timeLeft < 10 ? `0${this.timeLeft}` : `${this.timeLeft}`;
      this.timerText.text = `00:${secondsStr}`;

      // Время вышло
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.isGameOver = true;
        this.lose();
      }
    }, 1000);
  }

  private win() {
    this.onWinCallback();
  }

  private lose() {
    this.onLoseCallback();
  }

  // Метод очистки для предотвращения утечек памяти при удалении мини-игры [1]
  public destroyPuzzle() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.destroy({ children: true });
  }
}
