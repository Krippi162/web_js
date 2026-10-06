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

//Виведення списку
program
  .command('list')
  .description('Показати список усіх датчиків метеостанції')
  .action(() => { 
    // Отримуємо шлях до файлу з глобальних опцій програми
    const filePath = program.opts().input;
    const data = readData(filePath);
    
    // Виводимо загальну інформацію про станцію
    console.log(`Станція: ${data.stationId} | Дата: ${data.date}`);
    console.log('--- Доступні датчики ---');

    // Перебираємо масив датчиків і виводимо лише найголовніше (ID та тип)
    data.sensors.forEach((sensor, index) => {
      console.log(`${index + 1}. ID: ${sensor.sensorId} | Тип: ${sensor.sensorType}`);
    });
  });

  //Пошук за ідентифікатором
  program
  .command('sensor <id>') // <id> означає обов'язковий аргумент, який введе користувач
  .description('Отримати повну інформацію про датчик за його ID')
  .action((id) => { // Значення <id> потрапляє сюди як параметр функції
    const data = readData(program.opts().input);
    const sensor = data.sensors.find(s => s.sensorId === id); // Шукаємо в масиві датчик, у якого поле sensorId збігається з введеним id
    
    // Якщо датчик не знайдено, виводимо помилку та зупиняємо програму
    if (!sensor) {
      console.error(`Помилка: Датчик з ID "${id}" не знайдено.`);
      process.exit(1);
    }
    
    console.log(sensor); // Виводимо знайдений об'єкт повністю
  });

  //Виведення вкладеного поля
  program
  .command('readings <id>')
  .description('Отримати лише показники (readings) вказаного датчика')
  .action((id) => {
    const data = readData(program.opts().input); // Зчитуємо весь JSON-файл за шляхом, вказаним у глобальних опціях
   
    // Метод find() проходить по масиву sensors і повертає перший об'єкт, 
    // у якого значення поля sensorId збігається з переданим id.
    const sensor = data.sensors.find(s => s.sensorId === id);
    
    if (!sensor) {
      console.error(`Помилка: Датчик з ID "${id}" не знайдено.`);
      process.exit(1);
    }
    
    console.log(`Показники для ${id} (${sensor.unit}):`);
    console.table(sensor.readings); // console.table гарно виводить масиви
  });

  // Дані про локацію
program
  .command('location')
  .description('Показати координати та назву локації метеостанції')
  .action(() => {
    const data = readData(program.opts().input);

    // У моєму JSON поле location не є масивом, це просто об'єкт.
    // Тому ми можемо звертатися до його властивостей безпосередньо через крапку.
    console.log(`Локація: ${data.location.siteName}`);
    console.log(`Широта: ${data.location.latitude}`);
    console.log(`Довгота: ${data.location.longitude}`);
  });

  // Пошук пропущених значень (null)
program
  .command('errors')
  .description('Знайти всі показники зі значенням null')
  .action(() => {
    const data = readData(program.opts().input);
    let hasErrors = false; // Створюємо логічний прапорець. Він зміниться на true, якщо ми знайдемо хоча б одну помилку.

    // Метод forEach() виконує функцію для кожного елемента масиву sensors.
    data.sensors.forEach(sensor => {
        // Метод filter() створює новий масив, у який потрапляють лише ті елементи readings, 
        // умова для яких (r.value === null) є істинною.
      const badReadings = sensor.readings.filter(r => r.value === null);
      // Якщо довжина відфільтрованого масиву більша за 0, значить помилки є.
      if (badReadings.length > 0) {
        hasErrors = true;
        console.log(`Увага! Датчик ${sensor.sensorId} має пропущені дані о:`);
        badReadings.forEach(br => console.log(` - ${br.timestamp}`)); // Виводимо час кожної знайденої помилки.
      }
    });

    if (!hasErrors) console.log('Усі датчики працюють справно, пропущених даних немає.'); // Якщо після перевірки всіх датчиків прапорець залишився false, виводимо позитивне повідомлення.
  });

  // Знаходження максимального показника датчика
program
  .command('max <id>')
  .description('Знайти максимальне зафіксоване значення для вказаного датчика')
  .action((id) => {
    const data = readData(program.opts().input);
    const sensor = data.sensors.find(s => s.sensorId === id);
    
    if (!sensor) {
      console.error(`Помилка: Датчик "${id}" не знайдено.`);
      process.exit(1);
    }

    // filter() відкидає всі записи, де value є null
    // map() бере відфільтрований масив об'єктів і перетворює його на масив звичайних чисел.
    const validValues = sensor.readings
      .filter(r => r.value !== null)
      .map(r => r.value);
    
    // Якщо всі дані були null, масив validValues буде порожнім. Перевіряємо це.
    if (validValues.length === 0) {
      return console.log('Немає валідних показників для аналізу.');
    }

    // Math.max() не вміє працювати з масивами напряму, він приймає числа через кому.
    // Оператор розширення "..." розпаковує масив validValues.
    // Тобто Math.max(...[14.2, 22.5]) перетворюється на Math.max(14.2, 22.5).
    const maxValue = Math.max(...validValues);
    
    console.log(`Максимальне значення ${sensor.sensorType}: ${maxValue}${sensor.unit}`);
  });

program.parse(process.argv);