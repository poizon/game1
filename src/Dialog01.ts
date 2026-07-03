import { Container, Text, TextStyle } from "pixi.js";

export class Dialog01 extends Container {
  private dialogText: Text;

  // Данные для анимации
  private sentences: string[] = [
    "- Ну что, отправляемся в этот город?",
    "- Да!!!",
  ];
  private currentSentenceIndex: number = 0;
  private wordsInCurrentSentence: string[] = [];
  private currentWordIndex: number = 0;

  // Настройки таймера (в миллисекундах)
  private wordDelay: number = 250; // Пауза между появлением слов
  private sentenceDelay: number = 1000; // Пауза перед началом второго предложения
  private timer: number = 0;
  private isAnimating: boolean = false;

  constructor() {
    super();
    this.visible = false;

    const dialogStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 24,
      fill: "#ffffff",
      stroke: { color: "#000000", width: 4 },
      align: "center",
      wordWrap: true,
      wordWrapWidth: 400,
    });

    // Изначально текст пустой
    this.dialogText = new Text({
      text: "",
      style: dialogStyle,
    });

    this.dialogText.anchor.set(0.5);
    this.dialogText.y = +350;
    this.addChild(this.dialogText);
  }

  // Метод для запуска анимации диалога (вызывается при клике на кнопку)
  public show(): void {
    if (this.isAnimating) return; // Если уже печатается, игнорируем повторные клики

    this.visible = true;
    this.isAnimating = true;
    this.currentSentenceIndex = 0;
    this.dialogText.text = "";

    this.startPrintingSentence();
  }

  // Подготовка предложения к пословесному выводу
  private startPrintingSentence(): void {
    const fullText = this.sentences[this.currentSentenceIndex];
    // Разбиваем строку на массив слов по пробелам
    this.wordsInCurrentSentence = fullText.split(" ");
    this.currentWordIndex = 0;
    this.timer = 0;
  }

  /**
   * Этот метод нужно обновлять в каждом кадре.
   * @param deltaMS время, прошедшее с предыдущего кадра в миллисекундах
   */
  public update(deltaMS: number): void {
    if (!this.isAnimating) return;

    this.timer += deltaMS;

    // Проверяем, пришло ли время показать следующее слово
    if (this.timer >= this.wordDelay) {
      this.timer = 0;

      if (this.currentWordIndex < this.wordsInCurrentSentence.length) {
        // Берем срез слов от начала до текущего индекса и соединяем обратно через пробел
        const printedWords = this.wordsInCurrentSentence
          .slice(0, this.currentWordIndex + 1)
          .join(" ");

        // Если это первое предложение, просто выводим его.
        // Если второе — сохраняем на экране первое предложение и добавляем с новой строки новое.
        if (this.currentSentenceIndex === 0) {
          this.dialogText.text = printedWords;
        } else {
          this.dialogText.text = this.sentences[0] + "\n" + printedWords;
        }

        this.currentWordIndex++;
      } else {
        // Текущее предложение полностью напечатано. Проверяем, есть ли следующее.
        this.isAnimating = false;

        if (this.currentSentenceIndex < this.sentences.length - 1) {
          this.currentSentenceIndex++;
          // Делаем паузу перед стартом второго предложения
          setTimeout(() => {
            this.isAnimating = true;
            this.startPrintingSentence();
          }, this.sentenceDelay);
        }
      }
    }
  }

  public hide(): void {
    this.visible = false;
    this.isAnimating = false;
    this.dialogText.text = "";
  }
}
