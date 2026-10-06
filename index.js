// Command - клас з бібліотеки commander для створення консольного інтерфейсу
import { Command } from 'commander';
// fs (File System) - вбудований модуль Node.js для роботи з файловою системою (читання файлів)
import fs from 'fs';

// Створюємо головний об'єкт нашої програми
const program = new Command();

program
  .name('station-cli')
  .description('CLI програма для роботи з даними метеостанції (Лабораторна 3)')
  .version('1.0.0');

program
  .option('-i, --input <path>', 'шлях до JSON файлу', 'data.json');

function readData(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8'); // fs.readFileSync читає файл синхронно. 'utf-8' гарантує правильне кодування тексту
    return JSON.parse(fileContent); // Перетворюємо текстовий JSON у повноцінний об'єкт JavaScript
  } catch (error) {
    // Обробка помилки: якщо файлу не існує за вказаним шляхом
    if (error.code === 'ENOENT') {
      console.error(`Помилка: Файл не знайдено за шляхом "${filePath}".`);
      // Обробка помилки: якщо файл знайдено, але всередині пошкоджений JSON (немає дужок, ком тощо)
    } else if (error instanceof SyntaxError) {
      console.error('Помилка: Некоректний формат JSON файлу.');
      // Обробка будь-яких інших непередбачених помилок
    } else {
      console.error('Невідома помилка:', error.message);
    }
    process.exit(1);
  }
}
