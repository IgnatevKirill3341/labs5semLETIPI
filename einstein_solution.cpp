#include "bdd.h"
#include <iostream>
#include <fstream>
#include <vector>
#include <algorithm>

using namespace std;

// Параметры задачи
const unsigned NUM_OBJECTS = 9;        // количество объектов в сетке 3x3
const unsigned NUM_PROPERTIES = 4;     // количество свойств у каждого объекта
const unsigned BITS_PER_VALUE = 4;    // количество бит для кодирования значения (0..8)
const unsigned TOTAL_VARIABLES = NUM_OBJECTS * NUM_PROPERTIES * BITS_PER_VALUE; // 144 булевых переменных

// propertyBDD[prop][obj][val] = BDD, означающий что у объекта obj свойство prop имеет значение val
// prop: 0=цвет, 1=профессия, 2=животное, 3=напиток
bdd propertyBDD[NUM_PROPERTIES][NUM_OBJECTS][NUM_OBJECTS];

// Основная формула задачи (конъюнкция всех ограничений)
bdd constraintFormula;

// Файл для вывода решений
ofstream solutionFile;

// Перечисление свойств
enum PropertyType {
    COLOR = 0,      // цвет
    PROFESSION = 1, // профессия
    ANIMAL = 2,     // животное
    DRINK = 3       // напиток
};

// Значения для свойства ЦВЕТ (PropertyType::COLOR)
enum ColorValue {
    RED = 0, ORANGE = 6, YELLOW = 3, GREEN = 2, BLUE = 1,
    WHITE = 4, BLACK = 5, PURPLE = 7, GRAY = 8
};

// Значения для свойства ПРОФЕССИЯ (PropertyType::PROFESSION)
enum ProfessionValue {
    MATHEMATICIAN = 0, PHYSICIST = 1, CHEMIST = 2, BIOLOGIST = 3,
    PROGRAMMER = 4, ROBOTICIST = 5, ARCHITECT = 6, MUSICIAN = 7, WRITER = 8
};

// Значения для свойства ЖИВОТНОЕ (PropertyType::ANIMAL)
enum AnimalValue {
    CAT = 0, DOG = 1, HORSE = 2, PARROT = 3, HAMSTER = 4,
    TURTLE = 5, FISH = 6, OWL = 7, HEDGEHOG = 8
};

// Значения для свойства НАПИТОК (PropertyType::DRINK)
enum DrinkValue {
    COFFEE = 0, TEA = 1, JUICE = 2, WATER = 3, LEMONADE = 4,
    COCOA = 5, MILK = 6, KVASS = 7, ENERGY_DRINK = 8
};

// Вычисление индекса булевой переменной для бита bitIndex свойства prop объекта obj
inline unsigned computeVariableIndex(unsigned obj, unsigned prop, unsigned bitIndex)
{
    return (obj * NUM_PROPERTIES + prop) * BITS_PER_VALUE + bitIndex;
}

// Инициализация BDD для всех комбинаций (объект, свойство, значение)
void initializePropertyBDDs()
{
    for (unsigned obj = 0; obj < NUM_OBJECTS; ++obj)
    {
        for (unsigned prop = 0; prop < NUM_PROPERTIES; ++prop)
        {
            unsigned baseIndex = (obj * NUM_PROPERTIES + prop) * BITS_PER_VALUE;

            for (unsigned val = 0; val < NUM_OBJECTS; ++val)
            {
                bdd bddExpr = bddtrue;
                for (unsigned bit = 0; bit < BITS_PER_VALUE; ++bit)
                {
                    bool bitValue = ((val >> bit) & 1) != 0;
                    unsigned varIdx = baseIndex + bit;
                    bddExpr &= bitValue ? bdd_ithvar(varIdx) : bdd_nithvar(varIdx);
                }
                propertyBDD[prop][obj][val] = bddExpr;
            }
        }
    }
}

// Преобразование линейного индекса объекта в координаты сетки
struct GridPosition {
    unsigned row;
    unsigned col;
};

GridPosition getGridPosition(unsigned objIndex)
{
    return {objIndex / 3, objIndex % 3};
}

// Построение списков соседей для каждого объекта
// diagonalNeighbors[i] - объекты, находящиеся вверху-слева (по диагонали) от объекта i
// rightNeighbors[i] - объекты, находящиеся справа от объекта i
void computeNeighborRelations(vector<unsigned> diagonalNeighbors[NUM_OBJECTS],
                              vector<unsigned> rightNeighbors[NUM_OBJECTS])
{
    for (unsigned obj = 0; obj < NUM_OBJECTS; ++obj)
    {
        GridPosition pos = getGridPosition(obj);
        int row = (int)pos.row;
        int col = (int)pos.col;

        // Поиск соседа вверху-слева (диагональ вверх-влево)
        int diagRow = row - 1;
        int diagCol = col - 1;
        if (diagRow >= 0 && diagRow < 3 && diagCol >= 0 && diagCol < 3)
        {
            unsigned neighborIdx = (unsigned)(diagRow * 3 + diagCol);
            diagonalNeighbors[obj].push_back(neighborIdx);
        }

        // Поиск соседа справа (в той же строке, столбец +1)
        int rightRow = row;
        int rightCol = col + 1;
        if (rightRow >= 0 && rightRow < 3 && rightCol >= 0 && rightCol < 3)
        {
            unsigned neighborIdx = (unsigned)(rightRow * 3 + rightCol);
            rightNeighbors[obj].push_back(neighborIdx);
        }
    }
}

// Ограничение типа 1: фиксация конкретного значения свойства у объекта
void enforceFixedProperty(unsigned prop, unsigned obj, unsigned val)
{
    constraintFormula &= propertyBDD[prop][obj][val];
}

// Ограничение типа 2: эквивалентность двух свойств для всех объектов
// Если у объекта есть значение val1 свойства prop1, то у него должно быть значение val2 свойства prop2, и наоборот
void enforcePropertyEquivalence(unsigned prop1, unsigned val1, unsigned prop2, unsigned val2)
{
    for (unsigned obj = 0; obj < NUM_OBJECTS; ++obj)
    {
        bdd prop1BDD = propertyBDD[prop1][obj][val1];
        bdd prop2BDD = propertyBDD[prop2][obj][val2];
        // Эквивалентность: (prop1 -> prop2) & (prop2 -> prop1)
        constraintFormula &= ((prop1BDD >> prop2BDD) & (prop2BDD >> prop1BDD));
    }
}

// Ограничение уникальности: каждое значение свойства может быть только у одного объекта
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
                    // Если obj1 имеет значение val, то obj2 не может иметь это значение
                    constraintFormula &= (propertyBDD[prop][obj1][val] >> !propertyBDD[prop][obj2][val]);
                }
            }
        }
    }
}

// Ограничение типа 3: существует объект с prop1=val1 вверху-слева от объекта с prop2=val2
void enforceTopLeftNeighborConstraint(unsigned prop1, unsigned val1,
                                       unsigned prop2, unsigned val2,
                                       const vector<unsigned> diagonalNeighbors[NUM_OBJECTS])
{
    bdd existsConstraint = bddfalse;

    for (unsigned targetObj = 0; targetObj < NUM_OBJECTS; ++targetObj)
    {
        for (unsigned neighborObj : diagonalNeighbors[targetObj])
        {
            existsConstraint |= (propertyBDD[prop1][neighborObj][val1] & 
                                propertyBDD[prop2][targetObj][val2]);
        }
    }

    constraintFormula &= existsConstraint;
}

// Ограничение типа 3: существует объект с prop1=val1 справа от объекта с prop2=val2
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

// Ограничение типа 4: два свойства находятся у соседних объектов (ненаправленное)
void enforceAdjacentPropertiesConstraint(unsigned prop1, unsigned val1,
                                         unsigned prop2, unsigned val2,
                                         const vector<unsigned> diagonalNeighbors[NUM_OBJECTS],
                                         const vector<unsigned> rightNeighbors[NUM_OBJECTS])
{
    bdd adjacencyConstraint = bddfalse;

    // Проверяем все пары соседних объектов
    for (unsigned obj = 0; obj < NUM_OBJECTS; ++obj)
    {
        // Диагональные соседи (вверху-слева)
        for (unsigned neighbor : diagonalNeighbors[obj])
        {
            unsigned obj1 = neighbor;
            unsigned obj2 = obj;
            if (obj1 > obj2) swap(obj1, obj2);

            // Либо obj1 имеет prop1=val1 и obj2 имеет prop2=val2, либо наоборот
            adjacencyConstraint |= (propertyBDD[prop1][obj1][val1] & propertyBDD[prop2][obj2][val2]);
            adjacencyConstraint |= (propertyBDD[prop1][obj2][val1] & propertyBDD[prop2][obj1][val2]);
        }

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

// Добавление всех ограничений типа 3 (n3=3)
void addType3Constraints(const vector<unsigned> diagonalNeighbors[NUM_OBJECTS],
                        const vector<unsigned> rightNeighbors[NUM_OBJECTS])
{
    // 3.1) Белый цвет находится вверху-слева от математика
    enforceTopLeftNeighborConstraint(COLOR, WHITE, PROFESSION, MATHEMATICIAN, diagonalNeighbors);

    // 3.2) Чай находится справа от зелёного цвета
    enforceRightNeighborConstraint(DRINK, TEA, COLOR, GREEN, rightNeighbors);

    // 3.3) Химик находится справа от чёрного цвета
    enforceRightNeighborConstraint(PROFESSION, CHEMIST, COLOR, BLACK, rightNeighbors);
}

// Добавление всех ограничений типа 4 (n4=5)
void addType4Constraints(const vector<unsigned> diagonalNeighbors[NUM_OBJECTS],
                        const vector<unsigned> rightNeighbors[NUM_OBJECTS])
{
    // 4.1) Рыба рядом с черепахой
    enforceAdjacentPropertiesConstraint(ANIMAL, FISH, ANIMAL, TURTLE, 
                                        diagonalNeighbors, rightNeighbors);

    // 4.2) Рыба рядом с чёрным цветом
    enforceAdjacentPropertiesConstraint(ANIMAL, FISH, COLOR, BLACK, 
                                        diagonalNeighbors, rightNeighbors);

    // 4.3) Попугай рядом с химиком
    enforceAdjacentPropertiesConstraint(ANIMAL, PARROT, PROFESSION, CHEMIST, 
                                        diagonalNeighbors, rightNeighbors);

    // 4.4) Синий цвет рядом с музыкантом
    enforceAdjacentPropertiesConstraint(COLOR, BLUE, PROFESSION, MUSICIAN, 
                                        diagonalNeighbors, rightNeighbors);

    // 4.5) Собака рядом с энергетиком
    enforceAdjacentPropertiesConstraint(ANIMAL, DOG, DRINK, ENERGY_DRINK, 
                                        diagonalNeighbors, rightNeighbors);
}

// Извлечение значения свойства prop объекта obj из модели solution
int extractPropertyValue(unsigned prop, unsigned obj, const bdd& solution)
{
    for (unsigned val = 0; val < NUM_OBJECTS; ++val)
    {
        if ((solution & propertyBDD[prop][obj][val]) != bddfalse)
            return (int)val;
    }
    return -1; // Ошибка: значение не найдено
}

// Вывод решения в файл
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

// Ограничение: каждое свойство должно иметь какое-то значение
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

int main()
{
    // Инициализация BDD библиотеки
    bdd_init(5000000, 500000);
    bdd_gbc_hook(nullptr);
    bdd_setvarnum(TOTAL_VARIABLES);

    // Инициализация BDD для свойств
    initializePropertyBDDs();

    // Вычисление соседских отношений
    vector<unsigned> diagonalNeighbors[NUM_OBJECTS];
    vector<unsigned> rightNeighbors[NUM_OBJECTS];
    computeNeighborRelations(diagonalNeighbors, rightNeighbors);

    // Инициализация формулы ограничений
    constraintFormula = bddtrue;

    // n1=4 ограничений типа 1
    enforceFixedProperty(COLOR, 0, WHITE);
    enforceFixedProperty(PROFESSION, 4, MATHEMATICIAN);
    enforceFixedProperty(ANIMAL, 8, CAT);
    enforceFixedProperty(DRINK, 6, COFFEE);

    // n2=6 ограничений типа 2
    enforcePropertyEquivalence(COLOR, WHITE, PROFESSION, ROBOTICIST);
    enforcePropertyEquivalence(DRINK, MILK, ANIMAL, HEDGEHOG);
    enforcePropertyEquivalence(DRINK, COFFEE, PROFESSION, PHYSICIST);
    enforcePropertyEquivalence(ANIMAL, OWL, PROFESSION, MUSICIAN);
    enforcePropertyEquivalence(ANIMAL, TURTLE, PROFESSION, WRITER);
    enforcePropertyEquivalence(COLOR, GREEN, ANIMAL, PARROT);

    // n3=3 ограничений типа 3
    addType3Constraints(diagonalNeighbors, rightNeighbors);

    // n4=5 ограничений типа 4
    addType4Constraints(diagonalNeighbors, rightNeighbors);

    // Дополнительные ограничения для получения 12-16 решений
    enforceFixedProperty(COLOR, 2, YELLOW);
    enforceFixedProperty(ANIMAL, 5, DOG);
    enforceFixedProperty(PROFESSION, 3, BIOLOGIST);
    enforceFixedProperty(DRINK, 8, WATER);
    enforceFixedProperty(COLOR, 1, ORANGE);

    // Базовые ограничения
    enforcePropertyCompleteness();
    enforceUniquenessConstraints();

    // Открытие файла для вывода
    solutionFile.open("solutions.txt");

    // Подсчёт количества решений
    double solutionCount = bdd_satcount(constraintFormula);
    solutionFile << "Number of solutions (double): " << solutionCount << "\n\n";

    if (solutionCount == 0.0)
    {
        solutionFile << "NO SOLUTIONS\n";
        solutionFile.close();
        bdd_done();
        return 0;
    }

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

    solutionFile << "Printed solutions: " << solutionsPrinted << "\n";

    solutionFile.close();
    bdd_done();
    return 0;
}

