// --- State Variables ---
let displayValue = '0'; // Текущее значение на экране
let firstOperand = null; // Первый операнд для вычислений
let operator = null; // Выбранный оператор (+, -, *, /)
let waitingForSecondOperand = false; // Флаг: ожидается ли ввод второго операнда

const displayElement = document.getElementById('display');
const MAX_DISPLAY_LENGTH = 15; // Максимальная длина отображаемого числа

// --- Helper Functions ---

/** Обновляет значение поля ввода */
function updateDisplay() {
    displayElement.value = displayValue;
}

/**
 * Форматирует результат вычислений.
 * Обрабатывает ошибки, слишком длинные числа (используя научную нотацию),
 * убирает лишние нули после запятой.
 */
function formatResult(result) {
    if (typeof result !== 'number' || !isFinite(result)) {
        return 'Error'; // Возвращает строку ошибки, если результат не число или бесконечность
    }

    let resultString = result.toString();

    // Если число слишком длинное, используем научную нотацию
    if (resultString.length > MAX_DISPLAY_LENGTH) {
        resultString = result.toPrecision(10); // Например, 1.23456789e+15
    }

    // Убираем лишние нули после запятой и саму запятую, если она стала последней
    // Пример: 5.00 -> 5, 12.3400 -> 12.34, 10. -> 10
    resultString = resultString.replace(/(\.[0-9]*[1-9])0+$/, '$1').replace(/(\.\0+)|([.,]0+)$/, '');
    // Убираем ведущие нули, если это не единственная цифра '0'
    resultString = resultString.replace(/^0+(?=\d)/, '');
    if (resultString === '.' || resultString === '') return '0'; // Если осталось только "." или пусто, ставим "0"

    // Ограничиваем длину строки, если научная нотация все еще слишком длинная
    if (resultString.length > MAX_DISPLAY_LENGTH) {
        resultString = result.toPrecision(MAX_DISPLAY_LENGTH).replace(/(\.[0-9]*[1-9])0+$/, '$1').replace(/(\.\0+)|([.,]0+)$/, '');
        resultString = resultString.replace(/^0+(?=\d)/, '');
        if (resultString === '.' || resultString === '') return '0';
    }

    return resultString;
}

/** Сбрасывает состояние калькулятора (оператор, первый операнд) */
function resetCalculatorState() {
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
}

// --- Core Logic Functions ---

/** Добавляет цифру к текущему значению на дисплее */
function appendNumber(number) {
    // Если мы ожидали второй операнд, начинаем ввод нового числа
    if (waitingForSecondOperand) {
        displayValue = number;
        waitingForSecondOperand = false;
    } else {
        // Добавляем цифру, обрабатывая ведущие нули и длину
        if (displayValue === '0' && number !== '.') {
            displayValue = number; // Заменяем '0', если вводим не точку
        } else if (displayValue.length < MAX_DISPLAY_LENGTH) {
            displayValue += number; // Добавляем цифру, если есть место
        }
    }
    updateDisplay();
}

/** Добавляет десятичную точку */
function appendDecimal() {
    // Если ожидается второй операнд, начинаем с "0."
    if (waitingForSecondOperand) {
        displayValue = '0.';
        waitingForSecondOperand = false;
        updateDisplay();
        return;
    }
    // Добавляем точку, только если ее еще нет и есть место
    if (!displayValue.includes('.') && displayValue.length < MAX_DISPLAY_LENGTH) {
        displayValue += '.';
    }
    updateDisplay();
}

/** Устанавливает оператор и подготавливает к вводу второго операнда */
function setOperator(op) {
    const inputValue = parseFloat(displayValue);

    // Если уже был оператор и мы ждали второй операнд,
    // а пользователь нажал другой оператор - просто меняем оператор
    if (waitingForSecondOperand) {
        operator = op;
        return;
    }

    // Если первый операнд еще не установлен, сохраняем текущее значение
    if (firstOperand === null) {
        firstOperand = inputValue;
    } else if (operator) {
        // Если есть первый операнд и оператор, выполняем предыдущее вычисление (цепочка операций)
        try {
            const result = performCalculation(firstOperand, inputValue, operator);
            displayValue = formatResult(result); // Обновляем дисплей результатом
            if (displayValue === 'Error') { // Если была ошибка
                resetCalculatorState(); // Сбрасываем состояние
                updateDisplay();
                return;
            }
            firstOperand = parseFloat(displayValue); // Результат становится новым первым операндом
        } catch (error) {
            displayValue = 'Error'; // Показываем ошибку
            resetCalculatorState(); // Сбрасываем состояние
            updateDisplay();
            return;
        }
    }

    operator = op; // Сохраняем новый оператор
    waitingForSecondOperand = true; // Готовимся к вводу второго операнда
    updateDisplay(); // Обновляем дисплей (особенно если была ошибка)
}

/** Выполняет финальное вычисление при нажатии "=" */
function calculateResult() {
    // Нельзя вычислить, если нет второго операнда или нажали "=" сразу после оператора
    if (waitingForSecondOperand || operator === null || firstOperand === null) {
        return;
    }

    const secondOperand = parseFloat(displayValue);

    try {
        const result = performCalculation(firstOperand, secondOperand, operator);
        displayValue = formatResult(result); // Форматируем и сохраняем результат

        // Сбрасываем состояние для следующей независимой операции
        resetCalculatorState();
        updateDisplay();
    } catch (error) {
        displayValue = 'Error'; // Показываем ошибку
        resetCalculatorState(); // Сбрасываем состояние
        updateDisplay();
    }
}

/** Выполняет арифметическую операцию */
function performCalculation(operand1, operand2, op) {
    switch (op) {
        case '+': return operand1 + operand2;
        case '-': return operand1 - operand2;
        case '*': return operand1 * operand2;
        case '/':
            if (operand2 === 0) throw new Error('Division by zero'); // Генерируем ошибку деления на ноль
            return operand1 / operand2;
        default: throw new Error('Unknown operator'); // Неизвестный оператор
    }
}

// --- Specific Button Functions ---

/** Очищает текущий ввод (CE) */
function clearEntry() {
    displayValue = '0'; // Сбрасываем только текущее значение
    waitingForSecondOperand = false; // Сбрасываем флаг, так как ввод очищен
    updateDisplay();
}

/** Очищает весь калькулятор (AC) */
function clearAll() {
    displayValue = '0';
    resetCalculatorState(); // Сбрасываем все состояние
    updateDisplay();
}

/** Удаляет последний символ с дисплея (Backspace) */
function backspace() {
    if (waitingForSecondOperand) return; // Нельзя удалять после нажатия оператора

    if (displayValue.length > 1) {
        displayValue = displayValue.slice(0, -1); // Удаляем последний символ
    } else {
        displayValue = '0'; // Если остался 1 символ, очищаем до '0'
    }
    updateDisplay();
}

/** Меняет знак текущего числа (+/-) */
function toggleSign() {
    // Не меняем знак, если на экране "0", пусто или "Error"
    if (displayValue === '0' || displayValue === '' || displayValue === 'Error') return;

    if (displayValue.startsWith('-')) {
        displayValue = displayValue.substring(1); // Убираем минус
    } else {
        displayValue = '-' + displayValue; // Добавляем минус
    }
    updateDisplay();
}

/** Вычисляет процент */
function calculatePercentage() {
    // Не производим действий, если на экране "0", пусто или "Error"
    if (displayValue === '0' || displayValue === '' || displayValue === 'Error') return;

    const currentValue = parseFloat(displayValue);
    let percentageResult;

    // Если есть оператор и первый операнд (например, 100 + 10%)
    if (operator && firstOperand !== null && !waitingForSecondOperand) {
        // Рассчитываем процент от первого операнда: 100 + (100 * 10 / 100) = 110
        const percentageValue = (currentValue / 100);
        percentageResult = performCalculation(firstOperand, percentageValue, operator);

        displayValue = formatResult(percentageResult); // Показываем результат операции с процентом
        resetCalculatorState(); // Завершаем операцию
    } else {
        // Простое вычисление процента: 50% -> 0.5
        percentageResult = currentValue / 100;
        displayValue = formatResult(percentageResult);
    }
    updateDisplay();
}

// --- Event Listeners ---

/** Обработка нажатий клавиш на клавиатуре */
document.addEventListener('keydown', function (event) {
    const key = event.key;

    // Цифры и точка
    if (/\d/.test(key)) { // Если нажата цифра
        event.preventDefault(); // Предотвращаем стандартное действие браузера
        appendNumber(key);
    } else if (key === '.') { // Если нажата точка
        event.preventDefault();
        appendDecimal();
    }
    // Операторы
    else if (['+', '-', '*', '/'].includes(key)) {
        event.preventDefault();
        setOperator(key);
    }
    // Равно или Enter
    else if (key === '=' || key === 'Enter') {
        event.preventDefault();
        calculateResult();
    }
    // Очистка всего (Escape)
    else if (key === 'Escape') {
        event.preventDefault();
        clearAll();
    }
    // Удаление последнего символа (Backspace)
    else if (key === 'Backspace') {
        event.preventDefault();
        backspace();
    }
    // Очистка ввода (Delete)
    else if (key === 'Delete') {
        event.preventDefault();
        clearEntry();
    }
    // Процент (%)
    else if (key === '%') {
        event.preventDefault();
        calculatePercentage();
    }
    // Смена знака (+/-). Используем Ctrl + '-' как пример.
    else if (key === '-' && event.ctrlKey) {
        event.preventDefault();
        toggleSign();
    }
});

// Инициализация: показываем '0' при загрузке
updateDisplay();