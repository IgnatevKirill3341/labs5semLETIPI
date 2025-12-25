# Решение задачи Эйнштейна с использованием BDD (Binary Decision Diagrams)

## Содержание
1. [Математическая часть](#математическая-часть)
2. [Подробное описание кода](#подробное-описание-кода)
3. [Компиляция и запуск](#компиляция-и-запуск)
4. [Структура проекта](#структура-проекта)

---

## Математическая часть

### 1. Булевы функции и их представление

**Булева функция** — это функция вида f: {0,1}ⁿ → {0,1}, которая принимает n булевых аргументов и возвращает булево значение.

**Пример:** f(x₁, x₂, x₃) = (x₁ ∧ x₂) ∨ (¬x₂ ∧ x₃)

**Способы представления булевых функций:**
- **Таблица истинности** — полное перечисление всех комбинаций аргументов и значений функции
- **ДНФ (Дизъюнктивная Нормальная Форма)** — дизъюнкция конъюнкций литералов
- **КНФ (Конъюнктивная Нормальная Форма)** — конъюнкция дизъюнкций литералов
- **BDD (Binary Decision Diagram)** — графовое представление

### 2. Бинарные решающие диаграммы (BDD)

**BDD (Binary Decision Diagram)** — это направленный ациклический граф (DAG), представляющий булеву функцию.

**Основные понятия:**
- **Узел** — представляет переменную и имеет два исходящих ребра: одно для значения 0 (ложь), другое для значения 1 (истина)
- **Лист** — терминальный узел, содержащий значение 0 или 1
- **ROBDD (Reduced Ordered BDD)** — редуцированная упорядоченная BDD, где:
  - Переменные встречаются в фиксированном порядке
  - Нет избыточных узлов (если оба ребра ведут в один узел, узел удаляется)
  - Нет дублирующихся подграфов

**Преимущества BDD:**
- Компактное представление для многих практических функций
- Эффективные операции: конъюнкция (∧), дизъюнкция (∨), отрицание (¬)
- Проверка выполнимости (SAT) и подсчёт моделей

**Пример BDD для функции f(x₁, x₂) = x₁ ∨ x₂:**
```
        x₁
       / \
      0   1
     /     \
    x₂     x₂
   / \     / \
  0   1   0   1
  |   |   |   |
  0   1   1   1
```

### 3. Кодирование задачи в булевы переменные

В нашей задаче:
- **9 объектов** (сетка 3×3)
- **4 свойства** у каждого объекта (цвет, профессия, животное, напиток)
- **9 значений** для каждого свойства (0-8)

**Кодирование:**
Для представления значения свойства (0-8) требуется **4 бита** (2⁴ = 16 > 9).

**Формула для количества переменных:**
```
TOTAL_VARIABLES = NUM_OBJECTS × NUM_PROPERTIES × BITS_PER_VALUE
                = 9 × 4 × 4 = 144 булевых переменных
```

**Индексация переменных:**
Переменная с индексом `i` кодирует бит `bitIndex` свойства `prop` объекта `obj`:
```
index = (obj × NUM_PROPERTIES + prop) × BITS_PER_VALUE + bitIndex
```

**Пример:** Для объекта 0, свойства "цвет" (prop=0), бита 2:
```
index = (0 × 4 + 0) × 4 + 2 = 2
```

### 4. Представление ограничений в виде булевых формул

**Ограничение типа 1 (фиксация):**
"Объект 0 имеет белый цвет (значение 4)"
```
propertyBDD[COLOR][0][WHITE]
```
Это BDD, истинное только когда биты значения 4 установлены правильно.

**Ограничение типа 2 (эквивалентность):**
"Белый цвет ↔ Робототехник" для всех объектов
```
∀obj: (propertyBDD[COLOR][obj][WHITE] ↔ propertyBDD[PROFESSION][obj][ROBOTICIST])
```
В булевой логике: (A → B) ∧ (B → A)

**Ограничение типа 3 (направленное соседство):**
"Белый цвет находится вверху-слева от математика"
```
∃obj₁, obj₂: (obj₁ вверху-слева от obj₂) ∧ 
             (propertyBDD[COLOR][obj₁][WHITE]) ∧ 
             (propertyBDD[PROFESSION][obj₂][MATHEMATICIAN])
```

**Ограничение типа 4 (ненаправленное соседство):**
"Рыба рядом с черепахой"
```
∃obj₁, obj₂: (obj₁ сосед obj₂) ∧ 
             ((propertyBDD[ANIMAL][obj₁][FISH] ∧ propertyBDD[ANIMAL][obj₂][TURTLE]) ∨
              (propertyBDD[ANIMAL][obj₁][TURTLE] ∧ propertyBDD[ANIMAL][obj₂][FISH]))
```

### 5. Операции над BDD

**Конъюнкция (∧):** `bdd1 & bdd2` — оба условия должны быть истинны
**Дизъюнкция (∨):** `bdd1 | bdd2` — хотя бы одно условие должно быть истинно
**Отрицание (¬):** `!bdd1` — условие должно быть ложно
**Импликация (→):** `bdd1 >> bdd2` — если bdd1 истинно, то bdd2 должно быть истинно

**Подсчёт моделей:**
`bdd_satcount(formula)` — возвращает количество различных наборов переменных, при которых формула истинна.

**Поиск одной модели:**
`bdd_satone(formula)` — возвращает один набор переменных, при котором формула истинна.

### 6. Сложность и эффективность

**Временная сложность:**
- Построение BDD: O(2ⁿ) в худшем случае, но на практике часто полиномиально
- Операции над BDD: зависят от размера диаграмм, обычно эффективны благодаря редукции

**Пространственная сложность:**
- Размер BDD зависит от порядка переменных
- ROBDD часто значительно компактнее таблиц истинности

---

## Подробное описание кода

### Заголовочные файлы и константы

```cpp
#include "bdd.h"
```
Подключает библиотеку BuDDy для работы с BDD.

```cpp
#include <iostream>
#include <fstream>
#include <vector>
#include <algorithm>
```
Стандартные библиотеки C++: ввод-вывод, работа с файлами, контейнеры, алгоритмы.

```cpp
using namespace std;
```
Использование стандартного пространства имён для упрощения кода.

```cpp
const unsigned NUM_OBJECTS = 9;
```
Количество объектов в задаче (сетка 3×3 = 9 объектов).

```cpp
const unsigned NUM_PROPERTIES = 4;
```
Количество свойств у каждого объекта: цвет, профессия, животное, напиток.

```cpp
const unsigned BITS_PER_VALUE = 4;
```
Количество бит для кодирования значения свойства. Поскольку значений 9 (0-8), достаточно 4 бит (2⁴ = 16 > 9).

```cpp
const unsigned TOTAL_VARIABLES = NUM_OBJECTS * NUM_PROPERTIES * BITS_PER_VALUE;
```
Общее количество булевых переменных: 9 объектов × 4 свойства × 4 бита = 144 переменных.

### Глобальные переменные

```cpp
bdd propertyBDD[NUM_PROPERTIES][NUM_OBJECTS][NUM_OBJECTS];
```
Трёхмерный массив BDD-выражений:
- `propertyBDD[prop][obj][val]` — BDD, истинное тогда и только тогда, когда объект `obj` имеет значение `val` для свойства `prop`.
- Размер: 4 × 9 × 9 = 324 элемента.

```cpp
bdd constraintFormula;
```
Глобальная BDD-формула, содержащая конъюнкцию всех ограничений задачи.

```cpp
ofstream solutionFile;
```
Поток для записи решений в файл.

### Перечисления (enum)

```cpp
enum PropertyType {
    COLOR = 0,      // цвет
    PROFESSION = 1, // профессия
    ANIMAL = 2,     // животное
    DRINK = 3       // напиток
};
```
Перечисление типов свойств для удобства и читаемости кода.

```cpp
enum ColorValue {
    RED = 0, ORANGE = 6, YELLOW = 3, GREEN = 2, BLUE = 1,
    WHITE = 4, BLACK = 5, PURPLE = 7, GRAY = 8
};
```
Перечисление значений цвета. Числа соответствуют кодировке в задаче.

Аналогично определены `ProfessionValue`, `AnimalValue`, `DrinkValue`.

### Функция computeVariableIndex

```cpp
inline unsigned computeVariableIndex(unsigned obj, unsigned prop, unsigned bitIndex)
{
    return (obj * NUM_PROPERTIES + prop) * BITS_PER_VALUE + bitIndex;
}
```
**Назначение:** Вычисляет индекс булевой переменной для конкретного бита.

**Параметры:**
- `obj` — индекс объекта (0-8)
- `prop` — индекс свойства (0-3)
- `bitIndex` — индекс бита (0-3)

**Формула:** `(obj × 4 + prop) × 4 + bitIndex`

**Пример:** Объект 2, свойство "профессия" (1), бит 0:
```
index = (2 × 4 + 1) × 4 + 0 = 36
```

### Функция initializePropertyBDDs

```cpp
void initializePropertyBDDs()
{
    for (unsigned obj = 0; obj < NUM_OBJECTS; ++obj)
    {
        for (unsigned prop = 0; prop < NUM_PROPERTIES; ++prop)
        {
            unsigned baseIndex = (obj * NUM_PROPERTIES + prop) * BITS_PER_VALUE;
```
**Назначение:** Строит BDD для всех комбинаций (объект, свойство, значение).

**Внешний цикл:** Перебор всех объектов (0-8).

**Внутренний цикл:** Перебор всех свойств (0-3).

**baseIndex:** Базовый индекс для группы из 4 бит, кодирующих значение свойства.

```cpp
            for (unsigned val = 0; val < NUM_OBJECTS; ++val)
            {
                bdd bddExpr = bddtrue;
```
**Цикл по значениям:** Для каждого возможного значения (0-8) создаём BDD.

**bddtrue:** Константа "истина" в BuDDy, начальное значение для конъюнкции.

```cpp
                for (unsigned bit = 0; bit < BITS_PER_VALUE; ++bit)
                {
                    bool bitValue = ((val >> bit) & 1) != 0;
```
**Цикл по битам:** Для каждого бита значения проверяем, установлен ли он.

**`(val >> bit) & 1`:** Побитовый сдвиг вправо и маска для извлечения бита.

**Пример:** Для val=5 (двоичное 0101):
- bit=0: (5 >> 0) & 1 = 1 (младший бит)
- bit=1: (5 >> 1) & 1 = 0
- bit=2: (5 >> 2) & 1 = 1
- bit=3: (5 >> 3) & 1 = 0

```cpp
                    unsigned varIdx = baseIndex + bit;
                    bddExpr &= bitValue ? bdd_ithvar(varIdx) : bdd_nithvar(varIdx);
```
**varIdx:** Индекс булевой переменной для данного бита.

**bdd_ithvar(varIdx):** BDD, представляющее переменную varIdx = true.

**bdd_nithvar(varIdx):** BDD, представляющее переменную varIdx = false.

**`&=`:** Конъюнкция с текущим выражением. Если бит установлен, требуется истинность переменной, иначе — ложность.

**Результат:** `propertyBDD[prop][obj][val]` содержит BDD, истинное только когда биты значения `val` правильно установлены.

```cpp
                propertyBDD[prop][obj][val] = bddExpr;
            }
        }
    }
}
```

### Структура GridPosition и функция getGridPosition

```cpp
struct GridPosition {
    unsigned row;
    unsigned col;
};
```
**Назначение:** Структура для представления координат объекта в сетке 3×3.

```cpp
GridPosition getGridPosition(unsigned objIndex)
{
    return {objIndex / 3, objIndex % 3};
}
```
**Назначение:** Преобразует линейный индекс объекта в координаты сетки.

**Формула:**
- `row = objIndex / 3` — целочисленное деление (строка)
- `col = objIndex % 3` — остаток от деления (столбец)

**Пример:** objIndex = 5
- row = 5 / 3 = 1
- col = 5 % 3 = 2
- Позиция: (1, 2) — вторая строка, третий столбец

### Функция computeNeighborRelations

```cpp
void computeNeighborRelations(vector<unsigned> diagonalNeighbors[NUM_OBJECTS],
                              vector<unsigned> rightNeighbors[NUM_OBJECTS])
```
**Назначение:** Вычисляет списки соседей для каждого объекта согласно шаблону.

**Параметры:**
- `diagonalNeighbors` — массив векторов для диагональных соседей (вверху-слева)
- `rightNeighbors` — массив векторов для горизонтальных соседей (справа)

```cpp
    for (unsigned obj = 0; obj < NUM_OBJECTS; ++obj)
    {
        GridPosition pos = getGridPosition(obj);
        int row = (int)pos.row;
        int col = (int)pos.col;
```
**Цикл:** Для каждого объекта получаем его координаты в сетке.

```cpp
        // Поиск соседа вверху-слева (диагональ вверх-влево)
        int diagRow = row - 1;
        int diagCol = col - 1;
        if (diagRow >= 0 && diagRow < 3 && diagCol >= 0 && diagCol < 3)
```
**Вычисление координат диагонального соседа:** (row-1, col-1).

**Проверка границ:** Убеждаемся, что сосед находится внутри сетки (без склейки).

```cpp
        {
            unsigned neighborIdx = (unsigned)(diagRow * 3 + diagCol);
            diagonalNeighbors[obj].push_back(neighborIdx);
        }
```
**Вычисление индекса соседа:** `neighborIdx = row × 3 + col`.

**Добавление в список:** Сохраняем индекс соседа в вектор.

```cpp
        // Поиск соседа справа (в той же строке, столбец +1)
        int rightRow = row;
        int rightCol = col + 1;
        if (rightRow >= 0 && rightRow < 3 && rightCol >= 0 && rightCol < 3)
        {
            unsigned neighborIdx = (unsigned)(rightRow * 3 + rightCol);
            rightNeighbors[obj].push_back(neighborIdx);
        }
```
Аналогично для горизонтального соседа справа: (row, col+1).

### Функция enforceFixedProperty

```cpp
void enforceFixedProperty(unsigned prop, unsigned obj, unsigned val)
{
    constraintFormula &= propertyBDD[prop][obj][val];
}
```
**Назначение:** Добавляет ограничение типа 1 — фиксация конкретного значения.

**Параметры:**
- `prop` — индекс свойства
- `obj` — индекс объекта
- `val` — фиксированное значение

**Операция:** Конъюнкция с `constraintFormula`. Формула будет истинна только если объект `obj` имеет значение `val` для свойства `prop`.

**Пример:** `enforceFixedProperty(COLOR, 0, WHITE)` означает "объект 0 имеет белый цвет".

### Функция enforcePropertyEquivalence

```cpp
void enforcePropertyEquivalence(unsigned prop1, unsigned val1, unsigned prop2, unsigned val2)
{
    for (unsigned obj = 0; obj < NUM_OBJECTS; ++obj)
    {
        bdd prop1BDD = propertyBDD[prop1][obj][val1];
        bdd prop2BDD = propertyBDD[prop2][obj][val2];
```
**Назначение:** Добавляет ограничение типа 2 — эквивалентность свойств.

**Цикл:** Для каждого объекта проверяем эквивалентность.

**BDD для свойств:** Получаем BDD для каждого свойства.

```cpp
        // Эквивалентность: (prop1 -> prop2) & (prop2 -> prop1)
        constraintFormula &= ((prop1BDD >> prop2BDD) & (prop2BDD >> prop1BDD));
    }
}
```
**Логика эквивалентности:**
- `prop1BDD >> prop2BDD` — импликация: если prop1=val1, то prop2=val2
- `prop2BDD >> prop1BDD` — обратная импликация: если prop2=val2, то prop1=val1
- Конъюнкция обеих импликаций даёт эквивалентность

**Пример:** `enforcePropertyEquivalence(COLOR, WHITE, PROFESSION, ROBOTICIST)` означает "белый цвет ↔ робототехник" для всех объектов.

### Функция enforceUniquenessConstraints

```cpp
void enforceUniquenessConstraints()
{
    for (unsigned prop = 0; prop < NUM_PROPERTIES; ++prop)
    {
        for (unsigned val = 0; val < NUM_OBJECTS; ++val)
        {
            for (unsigned obj1 = 0; obj1 < NUM_OBJECTS; ++obj1)
            {
                for (unsigned obj2 = 0; obj2 < NUM_OBJECTS; ++obj2)
                {
                    if (obj1 == obj2) continue;
```
**Назначение:** Обеспечивает уникальность значений — каждое значение свойства может быть только у одного объекта.

**Вложенные циклы:**
- По свойствам (0-3)
- По значениям (0-8)
- По парам объектов (obj1, obj2)

**Пропуск одинаковых объектов:** Если obj1 == obj2, пропускаем итерацию.

```cpp
                    // Если obj1 имеет значение val, то obj2 не может иметь это значение
                    constraintFormula &= (propertyBDD[prop][obj1][val] >> !propertyBDD[prop][obj2][val]);
                }
            }
        }
    }
}
```
**Логика:** Если obj1 имеет значение val, то obj2 не может иметь это значение.

**Импликация:** `propertyBDD[prop][obj1][val] >> !propertyBDD[prop][obj2][val]`

Это гарантирует, что если один объект имеет значение, другие его не имеют.

### Функция enforceTopLeftNeighborConstraint

```cpp
void enforceTopLeftNeighborConstraint(unsigned prop1, unsigned val1,
                                       unsigned prop2, unsigned val2,
                                       const vector<unsigned> diagonalNeighbors[NUM_OBJECTS])
{
    bdd existsConstraint = bddfalse;
```
**Назначение:** Добавляет ограничение типа 3 — направленное диагональное соседство.

**Параметры:**
- `prop1, val1` — первое свойство и его значение
- `prop2, val2` — второе свойство и его значение
- `diagonalNeighbors` — списки диагональных соседей

**bddfalse:** Начальное значение "ложь" для дизъюнкции.

```cpp
    for (unsigned targetObj = 0; targetObj < NUM_OBJECTS; ++targetObj)
    {
        for (unsigned neighborObj : diagonalNeighbors[targetObj])
        {
            existsConstraint |= (propertyBDD[prop1][neighborObj][val1] & 
                                propertyBDD[prop2][targetObj][val2]);
        }
    }
```
**Циклы:** Для каждого объекта и его диагонального соседа проверяем условие.

**Логика:** Сосед имеет prop1=val1, а целевой объект имеет prop2=val2.

**Дизъюнкция:** `|=` добавляет новую возможность в общее условие.

```cpp
    constraintFormula &= existsConstraint;
}
```
**Добавление к формуле:** Конъюнктируем с общей формулой.

**Пример:** `enforceTopLeftNeighborConstraint(COLOR, WHITE, PROFESSION, MATHEMATICIAN, ...)` означает "белый цвет находится вверху-слева от математика".

### Функция enforceRightNeighborConstraint

```cpp
void enforceRightNeighborConstraint(unsigned prop1, unsigned val1,
                                    unsigned prop2, unsigned val2,
                                    const vector<unsigned> rightNeighbors[NUM_OBJECTS])
{
    bdd existsConstraint = bddfalse;

    for (unsigned leftObj = 0; leftObj < NUM_OBJECTS; ++leftObj)
    {
        for (unsigned rightObj : rightNeighbors[leftObj])
        {
            existsConstraint |= (propertyBDD[prop2][leftObj][val2] & 
                                propertyBDD[prop1][rightObj][val1]);
        }
    }

    constraintFormula &= existsConstraint;
}
```
**Назначение:** Аналогично предыдущей, но для горизонтального соседства справа.

**Логика:** Левый объект имеет prop2=val2, правый объект имеет prop1=val1.

### Функция enforceAdjacentPropertiesConstraint

```cpp
void enforceAdjacentPropertiesConstraint(unsigned prop1, unsigned val1,
                                         unsigned prop2, unsigned val2,
                                         const vector<unsigned> diagonalNeighbors[NUM_OBJECTS],
                                         const vector<unsigned> rightNeighbors[NUM_OBJECTS])
{
    bdd adjacencyConstraint = bddfalse;
```
**Назначение:** Добавляет ограничение типа 4 — ненаправленное соседство.

**bddfalse:** Начальное значение для дизъюнкции.

```cpp
    // Проверяем все пары соседних объектов
    for (unsigned obj = 0; obj < NUM_OBJECTS; ++obj)
    {
        // Диагональные соседи (вверху-слева)
        for (unsigned neighbor : diagonalNeighbors[obj])
        {
            unsigned obj1 = neighbor;
            unsigned obj2 = obj;
            if (obj1 > obj2) swap(obj1, obj2);
```
**Цикл по объектам:** Для каждого объекта проверяем его соседей.

**Нормализация пары:** Чтобы избежать дублирования, упорядочиваем пару (obj1 < obj2).

```cpp
            // Либо obj1 имеет prop1=val1 и obj2 имеет prop2=val2, либо наоборот
            adjacencyConstraint |= (propertyBDD[prop1][obj1][val1] & propertyBDD[prop2][obj2][val2]);
            adjacencyConstraint |= (propertyBDD[prop1][obj2][val1] & propertyBDD[prop2][obj1][val2]);
        }
```
**Две возможности:**
1. obj1 имеет prop1=val1, obj2 имеет prop2=val2
2. obj1 имеет prop2=val2, obj2 имеет prop1=val1

**Дизъюнкция:** Любая из этих возможностей удовлетворяет условию.

```cpp
        // Горизонтальные соседи (справа)
        for (unsigned neighbor : rightNeighbors[obj])
        {
            unsigned obj1 = obj;
            unsigned obj2 = neighbor;
            if (obj1 > obj2) swap(obj1, obj2);

            adjacencyConstraint |= (propertyBDD[prop1][obj1][val1] & propertyBDD[prop2][obj2][val2]);
            adjacencyConstraint |= (propertyBDD[prop1][obj2][val1] & propertyBDD[prop2][obj1][val2]);
        }
    }

    constraintFormula &= adjacencyConstraint;
}
```
Аналогично для горизонтальных соседей.

### Функция enforcePropertyCompleteness

```cpp
void enforcePropertyCompleteness()
{
    for (unsigned obj = 0; obj < NUM_OBJECTS; ++obj)
    {
        for (unsigned prop = 0; prop < NUM_PROPERTIES; ++prop)
        {
            bdd valueExists = bddfalse;
            for (unsigned val = 0; val < NUM_OBJECTS; ++val)
            {
                valueExists |= propertyBDD[prop][obj][val];
            }
            constraintFormula &= valueExists;
        }
    }
}
```
**Назначение:** Гарантирует, что каждое свойство каждого объекта имеет хотя бы одно значение.

**Логика:** Для каждого объекта и свойства создаём дизъюнкцию всех возможных значений. Это означает, что хотя бы одно значение должно быть истинно.

### Функция extractPropertyValue

```cpp
int extractPropertyValue(unsigned prop, unsigned obj, const bdd& solution)
{
    for (unsigned val = 0; val < NUM_OBJECTS; ++val)
    {
        if ((solution & propertyBDD[prop][obj][val]) != bddfalse)
            return (int)val;
    }
    return -1; // Ошибка: значение не найдено
}
```
**Назначение:** Извлекает значение свойства из модели (решения).

**Параметры:**
- `prop` — индекс свойства
- `obj` — индекс объекта
- `solution` — BDD-модель (одно решение)

**Логика:** Перебираем все возможные значения и проверяем, какое из них истинно в данной модели.

**Операция `&`:** Конъюнкция модели с BDD для конкретного значения. Если результат не ложь, значит это значение установлено.

### Функция outputSolution

```cpp
void outputSolution(const bdd& solution, unsigned solutionNumber)
{
    solutionFile << "Solution " << solutionNumber << ":\n";
    for (unsigned obj = 0; obj < NUM_OBJECTS; ++obj)
    {
        solutionFile << "Object " << obj << ": ";
        for (unsigned prop = 0; prop < NUM_PROPERTIES; ++prop)
        {
            int val = extractPropertyValue(prop, obj, solution);
            solutionFile << val << ' ';
        }
        solutionFile << '\n';
    }
    solutionFile << '\n';
}
```
**Назначение:** Выводит решение в файл в читаемом формате.

**Формат вывода:**
```
Solution 1:
Object 0: 4 5 8 6 
Object 1: 6 7 7 8 
...
```
Где для каждого объекта выводятся 4 значения: цвет, профессия, животное, напиток.

### Функция main

```cpp
int main()
{
    // Инициализация BDD библиотеки
    bdd_init(5000000, 500000);
```
**bdd_init:** Инициализирует библиотеку BuDDy.
- Первый параметр (5000000) — размер таблицы узлов
- Второй параметр (500000) — размер кэша

```cpp
    bdd_gbc_hook(nullptr);
```
**bdd_gbc_hook:** Устанавливает обработчик сборки мусора (nullptr = без обработчика).

```cpp
    bdd_setvarnum(TOTAL_VARIABLES);
```
**bdd_setvarnum:** Устанавливает количество булевых переменных (144).

```cpp
    // Инициализация BDD для свойств
    initializePropertyBDDs();
```
Строит все BDD для комбинаций (объект, свойство, значение).

```cpp
    // Вычисление соседских отношений
    vector<unsigned> diagonalNeighbors[NUM_OBJECTS];
    vector<unsigned> rightNeighbors[NUM_OBJECTS];
    computeNeighborRelations(diagonalNeighbors, rightNeighbors);
```
Вычисляет списки соседей для каждого объекта.

```cpp
    // Инициализация формулы ограничений
    constraintFormula = bddtrue;
```
Начинаем с формулы "истина" (пустая конъюнкция).

```cpp
    // n1=4 ограничений типа 1
    enforceFixedProperty(COLOR, 0, WHITE);
    enforceFixedProperty(PROFESSION, 4, MATHEMATICIAN);
    enforceFixedProperty(ANIMAL, 8, CAT);
    enforceFixedProperty(DRINK, 6, COFFEE);
```
Добавляем 4 основных ограничения типа 1.

```cpp
    // n2=6 ограничений типа 2
    enforcePropertyEquivalence(COLOR, WHITE, PROFESSION, ROBOTICIST);
    enforcePropertyEquivalence(DRINK, MILK, ANIMAL, HEDGEHOG);
    enforcePropertyEquivalence(DRINK, COFFEE, PROFESSION, PHYSICIST);
    enforcePropertyEquivalence(ANIMAL, OWL, PROFESSION, MUSICIAN);
    enforcePropertyEquivalence(ANIMAL, TURTLE, PROFESSION, WRITER);
    enforcePropertyEquivalence(COLOR, GREEN, ANIMAL, PARROT);
```
Добавляем 6 ограничений типа 2 (эквивалентность).

```cpp
    // n3=3 ограничений типа 3
    addType3Constraints(diagonalNeighbors, rightNeighbors);

    // n4=5 ограничений типа 4
    addType4Constraints(diagonalNeighbors, rightNeighbors);
```
Добавляем ограничения типов 3 и 4.

```cpp
    // Дополнительные ограничения для получения 12-16 решений
    enforceFixedProperty(COLOR, 2, YELLOW);
    enforceFixedProperty(ANIMAL, 5, DOG);
    enforceFixedProperty(PROFESSION, 3, BIOLOGIST);
    enforceFixedProperty(DRINK, 8, WATER);
    enforceFixedProperty(COLOR, 1, ORANGE);
```
Дополнительные ограничения для уменьшения количества решений.

```cpp
    // Базовые ограничения
    enforcePropertyCompleteness();
    enforceUniquenessConstraints();
```
Добавляем базовые ограничения: полнота и уникальность.

```cpp
    // Открытие файла для вывода
    solutionFile.open("solutions.txt");

    // Подсчёт количества решений
    double solutionCount = bdd_satcount(constraintFormula);
    solutionFile << "Number of solutions (double): " << solutionCount << "\n\n";
```
Открываем файл и подсчитываем общее количество решений.

```cpp
    if (solutionCount == 0.0)
    {
        solutionFile << "NO SOLUTIONS\n";
        solutionFile.close();
        bdd_done();
        return 0;
    }
```
Проверка: если решений нет, завершаем программу.

```cpp
    // Вывод первых 16 решений
    const unsigned MAX_SOLUTIONS_TO_PRINT = 16;
    unsigned solutionsPrinted = 0;
    bdd remainingFormula = constraintFormula;

    while (solutionsPrinted < MAX_SOLUTIONS_TO_PRINT)
    {
        bdd currentSolution = bdd_satone(remainingFormula);

        if (currentSolution == bddfalse)
            break;

        outputSolution(currentSolution, solutionsPrinted + 1);

        // Исключаем найденное решение из дальнейшего поиска
        remainingFormula &= !currentSolution;

        ++solutionsPrinted;
    }
```
**Цикл поиска решений:**
1. Находим одно решение с помощью `bdd_satone`
2. Выводим его в файл
3. Исключаем это решение из дальнейшего поиска (добавляем его отрицание)
4. Повторяем до 16 решений или пока есть решения

**Ключевой момент:** `remainingFormula &= !currentSolution` исключает уже найденное решение.

```cpp
    solutionFile << "Printed solutions: " << solutionsPrinted << "\n";

    solutionFile.close();
    bdd_done();
    return 0;
}
```
Закрываем файл, освобождаем ресурсы BuDDy и завершаем программу.

---

## Компиляция и запуск

### Компиляция
```bash
g++ -o einstein_solution einstein_solution.cpp -lbdd
```

**Параметры:**
- `-o einstein_solution` — имя выходного файла
- `-lbdd` — линковка с библиотекой BuDDy

### Запуск
```bash
./einstein_solution
```

### Результат
Программа создаёт файл `solutions.txt` с найденными решениями.

---

## Структура проекта

- `einstein_solution.cpp` — исходный код программы
- `solutions.txt` — файл с найденными решениями
- `task_description.md` — описание задачи и ограничений
- `solution_interpretation.md` — интерпретация одного решения
- `report.txt` — отчёт о выполненной работе
- `README.md` — данный файл

---

## Вопросы для защиты курсовой работы

### 1. Что такое BDD?
**Ответ:** Binary Decision Diagram (бинарная решающая диаграмма) — это направленный ациклический граф, представляющий булеву функцию. Каждый узел соответствует переменной и имеет два исходящих ребра (для значений 0 и 1).

### 2. В чём преимущества BDD перед таблицами истинности?
**Ответ:** 
- Компактность: для многих функций BDD значительно меньше таблицы истинности
- Эффективные операции: конъюнкция, дизъюнкция выполняются за время, пропорциональное размеру диаграмм
- Автоматическая редукция: ROBDD автоматически удаляет избыточные узлы

### 3. Как кодируются значения свойств в булевы переменные?
**Ответ:** Каждое значение (0-8) кодируется 4 битами. Для объекта obj, свойства prop, бита bitIndex индекс переменной вычисляется как: `(obj × 4 + prop) × 4 + bitIndex`.

### 4. Как работает ограничение типа 2 (эквивалентность)?
**Ответ:** Для каждого объекта проверяется, что наличие одного свойства влечёт наличие другого, и наоборот. В булевой логике: `(A → B) ∧ (B → A)`, что эквивалентно `A ↔ B`.

### 5. В чём разница между ограничениями типа 3 и типа 4?
**Ответ:** 
- Тип 3: направленное соседство (например, "A находится вверху-слева от B")
- Тип 4: ненаправленное соседство (например, "A рядом с B" — порядок не важен)

### 6. Как программа находит все решения?
**Ответ:** 
1. Строится общая формула ограничений
2. `bdd_satcount()` подсчитывает количество решений
3. `bdd_satone()` находит одно решение
4. Найденное решение исключается из формулы (добавлением отрицания)
5. Процесс повторяется до исчерпания решений

### 7. Почему используется 4 бита для кодирования значений?
**Ответ:** Значений 9 (0-8), поэтому требуется минимум 4 бита (2⁴ = 16 > 9). Можно было бы использовать 3 бита, но 4 бита обеспечивают запас и упрощают вычисления.

### 8. Что означает "без склейки"?
**Ответ:** Объекты на границах сетки не имеют соседей за её пределами. Например, объект в позиции (0,0) не имеет соседа вверху-слева, так как такой позиции не существует.

### 9. Как работает функция enforceUniquenessConstraints?
**Ответ:** Для каждой пары объектов и каждого значения свойства добавляется ограничение: если один объект имеет это значение, то другой не может его иметь. Это гарантирует, что каждое значение уникально.

### 10. Что делает функция enforcePropertyCompleteness?
**Ответ:** Гарантирует, что каждое свойство каждого объекта имеет хотя бы одно значение. Для каждого объекта и свойства создаётся дизъюнкция всех возможных значений.

---

## Заключение

Данная программа демонстрирует применение бинарных решающих диаграмм для решения комбинаторных задач с большим количеством взаимосвязанных ограничений. Использование BDD позволяет эффективно работать с задачами, где явный перебор был бы нецелесообразен.

