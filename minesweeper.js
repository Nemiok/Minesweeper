// Логика

// Хранилище состояний клавиши
// Используется в управлении состоянием клавиш
export const TILE_STATUSES = {
  HIDDEN: 'hidden',
  MINE: 'mine',
  NUMBER: 'number',
  MARKED: 'marked',
  QUESTIONED: 'questioned',
  FIRST_WRONG: 'first_wrong'
}

// Хранилище состояний главной кнопки
// Используется в управлении состоянием главной кнопки
export const SMILE_STATUSES = {
  ALIVE: 'alive',
  DEAD: 'dead',
  SCARED: 'scared',
  WINNER: 'winner'
}

// Функция создания игрового поля
// Возвращает массив массивов: 16 элементов row в каждом по 16 элементов tile
export function createBoard(boardSize, numberOfMines) {
  // Хранилище данных для игрового поля
  const board = []
  // Замешивание мин в игровое поле
  const minePositions = getMinePositions(boardSize, numberOfMines)
  //
  const smileButton = document.querySelector('.board-header__smile-btn')

  // Реализация возможности начать игру заново по клику на главную кнопку
  smileButton.addEventListener('click', () => {
    window.location.reload()
  })

  // Заполнение хранилища board, асимптотическая сложность O(N^2)
  // Так как длина массива board небольшая, время выполнения операции небольшое
  for (let x = 0; x < boardSize; x++) {
    const row = []
    for (let y = 0; y < boardSize; y++) {
      const element = document.createElement('div')
      element.classList.add('tile')
      element.dataset.status = TILE_STATUSES.HIDDEN

      // Создание клавиши tile
      // Клавиша это объект с её координатами (x, y) в массиве board,
      // С ссылкой (element) на DOM-element, который отображает клавишу,
      // С флагом наличия мины на клавише (mine),
      // С геттером и сетером дата-атрибута DOM-element`а, нужно для управления стилями
      const tile = {
        element,
        x,
        y,
        markCounter: 0,
        mine: minePositions.some(p => positionMatch({ x, y }, p)),

        get status() {
          return this.element.dataset.status
        },

        set status(value) {
          this.element.dataset.status = value
        },
      }

      // Добавление для клавиши возможности управления состоянием главной клавиши на нажатие мыши
      tile.element.addEventListener('mousedown', () => {
        smileButton.dataset.status = tile.status === TILE_STATUSES.HIDDEN ? SMILE_STATUSES.SCARED : SMILE_STATUSES.ALIVE
      })

      tile.element.addEventListener('mouseup', () => {
        smileButton.dataset.status = SMILE_STATUSES.ALIVE
      })

      //
      row.push(tile)
    }
    board.push(row)
  }

  return board
}

// Функция для маркировки клавиши 
export function markTile(tile) {
  // Если клавиша не закрыта или не маркирована, то не маркировать
  if (
    tile.status !== TILE_STATUSES.HIDDEN &&
    tile.status !== TILE_STATUSES.QUESTIONED &&
    tile.status !== TILE_STATUSES.MARKED
  ) return

  // Если клавиша маркирована 1 раз, то маркировать её 2-ой раз
  if (tile.status === TILE_STATUSES.MARKED && tile.markCounter === 1) {
    tile.status = TILE_STATUSES.QUESTIONED
    tile.markCounter++
    console.log(tile)
  }

  // Если клавиша маркирована 2 раза, то снять маркировку, закрыть клавишу
  else if (tile.markCounter === 2) {
    tile.status = TILE_STATUSES.HIDDEN
    tile.markCounter = 0
    console.log(tile)
  }

  // В случае если клавиша не маркирована, маркировать её
  else {
    tile.status = TILE_STATUSES.MARKED
    tile.markCounter++
    console.log(tile)
  }
}

// Функция для открытия клавиши
// Принимает в параметры массив игрового поля board и клавишу на которую нажали,
// Это нужно, чтобы в дальнейшем вычислить состояние соседствующих k клавиш,
// Где 3 <= k <= 8 в зависмости от положения клавиши на доске
export function revealTile(board, tile) {
  //  Если клавиша не закрыта, то не открывать её
  if (tile.status !== TILE_STATUSES.HIDDEN) return

  // Если клавиша содержит в себе мину, то изменить состояние клавиши на наличие мины,
  // Это нужно для отображения мины на клавише.
  // Во время открытия клавиша взрывается, игра останавливается
  if (tile.mine) {
    tile.status = TILE_STATUSES.MINE
    return
  }

  // Если клавиша закрыта и в ней нет мины,
  // Сделать изменить состояние клавиши на наличие номера
  tile.status = TILE_STATUSES.NUMBER

  // Функция nearbyTiles, возвращает соседние клавиши
  const adjacentTiles = nearbyTiles(board, tile)

  // Ищем мины среди соседних клавиш
  const mines = adjacentTiles.filter(t => t.mine)

  // Если среди соседних клавиш нет мин, то рекурсивно открываем их клавиши
  if (mines.length === 0) {
    adjacentTiles.forEach(tile => {
      revealTile(board, tile)
      tile.element.classList.add('tile_empty')
    })
  }

  // Если среди соседних клавиш есть мины,
  // Добавляем на целевую клавишу класс наличия мин с указанием их числа,
  // Благодаря готовым стилям на клавише появляется нужная цифра
  else {
    tile.element.classList.add(`number_${mines.length}`)
  }
}

// Функция проверки на победу
export function checkWin(board) {
  // Для каждой клавиши проверяем,
  // Если все клавиши это числа, то вернеётся true;
  // Или если клавиша содержит мину И она спрятана или маркирована, вернётся true;
  // Иначе false
  return board.every(row => {
    return row.every(tile => {
      return (
        tile.status === TILE_STATUSES.NUMBER ||
        (tile.mine &&
          (tile.status === TILE_STATUSES.HIDDEN ||
            tile.status === TILE_STATUSES.MARKED))
      )
    })
  })
}

// Функция проверки на поражение
export function checkLose(board) {
  // Для каждой клавиши проверяем, 
  // Есть ли среди открытых клавиш хотя-бы одна мина.
  // Если мина есть, то функция возврашает true;
  // Иначе false
  return board.some(row => {
    return row.some(tile => {
      return tile.status === TILE_STATUSES.MINE
    })
  })
}

// Функция рандомно распределяет мины по полю
// Принимает в качестве аргументов длину поля и число мин которые нужно распределить,
// Возвращает массив с позициями мин на игровом поле
function getMinePositions(boardSize, numberOfMines) {
  const minePositions = []

  // Пока количество распределенных мин меньше, чем общее количество мин,
  // Генерировать рандомную ползицию мин.
  // И если вновь созданной позиции мины нет среди распределенных мин,
  // То добавить её в список распределенных мин
  while (minePositions.length < numberOfMines) {
    const newMinePosition = {
      x: randomNumber(boardSize),
      y: randomNumber(boardSize),
    }

    if (!minePositions.some(minePosition => positionMatch(minePosition, newMinePosition))) {
      minePositions.push(newMinePosition)
    }
  }

  return minePositions
}

// Функция сравнения позиций двух клавиш
function positionMatch(objA, objB) {
  return objA.x === objB.x && objA.y === objB.y
}

// Генерация рандомного номера в пределах размера игрового поля
function randomNumber(size) {
  return Math.floor(Math.random() * size)
}

// Функция возвращает массив k соседних клавиш,
// Где 3 <= k <= 8 в зависимости от положения клавиши на поле.
// Функция принимает в качестве параметров массив игрового поля board
// И координаты клавиши на нём.
// Возвращает массив с координатами соседних клавиш
function nearbyTiles(board, { x, y }) {
  const nearbyTiles = []

  // Процесс имеет асимптотическую сложность O(N^2).
  for (let xOffset = -1; xOffset <= 1; xOffset++) {
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      const tile = board[x + xOffset]?.[y + yOffset]

      // Если координаты клавишы не выходят за пределы игрового поля,
      // Добавить клавишу в массив соседних 
      if (tile) nearbyTiles.push(tile)
    }
  }
  // для k = 8 координаты соседних клавиш выглядят примерно так:
  // [
  //  {x-1,y-1}, {x+0, y-1}, {x+1, y-1},
  //  {x-1,y+0}, {x,     y}, {x+1, y+0},
  //  {x-1,y+1}, {x+0, y+1}, {x+1, y+1},
  // ]

  return nearbyTiles
}