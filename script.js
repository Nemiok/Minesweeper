// Cоздание UI
import './assets/styles/styles.css'
import audioMP3 from './assets/audios/golden_wind.mp3'
import favIcon from './assets/images/minesweeper-icon.webp'

import {
  TILE_STATUSES,
  SMILE_STATUSES,
  createBoard,
  markTile,
  revealTile,
  checkWin,
  checkLose,
} from './minesweeper.js'

const BOARD_SIZE = 16
const NUMBER_OF_MINES = 40

const board = createBoard(BOARD_SIZE, NUMBER_OF_MINES)
const boardMain = document.querySelector('.board__main')
const smileButton = document.querySelector('.board-header__smile-btn')

// Флаг открытия первой клавиши, по умолчанию true,
// Нужен при первом открытии, если на первой клавише бомба, то уничтожать бомбу
let isFirstClick = true

// На каждую клавишу вешаем обработчик события левого и правого клика,
board.forEach(row => {
  row.forEach(tile => {
    boardMain.append(tile.element)
    // По нажатию на левую кнопку мыши срабатывает логика открытия клавиши и проверки на победу и поражение.
    tile.element.addEventListener('click', () => {
      revealTile(board, tile)
      checkGameEnd(tile)
      isFirstClick = isFirstClick === true && false
    })
    // По нажати на правую кнопку мыши срабатывает логика маркировки клавиши и подсчёта числа оставшихся бомб
    tile.element.addEventListener('contextmenu', e => {
      e.preventDefault()
      markTile(tile)
      countMinesLeft()
    })
  })
})

// Операция по установлению CSS переменной, которая используется для отрисовки игрового поля
boardMain.style.setProperty('--size', BOARD_SIZE)

// Получение DOM-элементов для счётчика оставшихся мин
const minesLeftHundreds = document.querySelector('.mines-left_hundreds')
const minesLeftDozens = document.querySelector('.mines-left_dozens')
const minesLeftUnits = document.querySelector('.mines-left_units')

// Получение DOM-элементов для таймера игрового времени
const timerHundreds = document.querySelector('.timer_hundreds')
const timerDozens = document.querySelector('.timer_dozens')
const timerUnits = document.querySelector('.timer_units')

// Получение DOM-элементов для работы с правилами игры
const rulesButton = document.querySelector('.rules-button')
const rulesArticle = document.querySelector('.rules')

// По клику на кнопку правил открывается окно с правилами
// При повторном клике - закрывается
rulesButton.addEventListener('click', (e) => {
  e.preventDefault()
  rulesArticle.dataset.isVisible = rulesArticle.dataset.isVisible === 'yes' ? 'no' : 'yes'
})

// Добавление стильной музыки для игрового азарта
const main = document.getElementById('main')
const audio = document.createElement('audio')
audio.src = audioMP3
audio.controls = true
audio.type = 'audio/mp3'
audio.loop = true
audio.volume = 0.05
audio.autoplay = true
main.append(audio)

// Добавлени фавиконки
const head = document.querySelector('head')
const link = document.createElement('link')
link.rel = 'icon'
link.type = 'image/x-icon'
link.href = favIcon
head.append(link)

// Переменная для отсчёта времени
let time = 1

// Переменная для работы с временем
let timeString = '000'

// Функция работы таймера
function setTimer() {
  // Если прошло меньше 10 секунд с начала игры, то подставить время в 1-ый разряд строкового числа времени
  if (time < 10) {
    timeString = `00${time}`
  }
  // Если прошло меньше 100, но больше 10 секунд с начала игры, то подставить время во 2-ый разряд строкового числа времени
  else if (time < 100) {
    timeString = `0${time}`
  }
  // Если прошло трёхзначное время с начала игры, то подставить время в 3-ий разряд строкового числа времени
  else {
    timeString = String(time)
  }

  // Преобразуем строковое число времени в массив для удобства работы
  let arrayOfTime = timeString.split('')

  // Если времени с начала игры прошло больше 999 секунд, то начинаем отсчёт с начала
  time = time > 999 ? 0 : time

  // Измененяем data-value для DOM-элеметов таймера,
  // Благодаря CSS стилям изменяется их отображение
  timerHundreds.dataset.value = `number_${arrayOfTime[0]}`
  timerDozens.dataset.value = `number_${arrayOfTime[1]}`
  timerUnits.dataset.value = `number_${arrayOfTime[2]}`

  // Прибавляем секунду
  time++
}

// Создаём строковое число оставшихся мин в зависимости от их исходного количества
let numberOfMinesString = NUMBER_OF_MINES < 100 ? `0${NUMBER_OF_MINES}` : String(NUMBER_OF_MINES)

//Функция подсчёта оставшихся мин
function countMinesLeft() {
  // Находим число маркированных мин
  const markedTilesCount = board.reduce((count, row) => {
    // Если клавиша маркирована или содержит в себе уничтоженную бомбу, то добавить к счётчику отмеченных мин
    return (
      count + row.filter(tile => tile.status === TILE_STATUSES.MARKED || tile.status === TILE_STATUSES.QUESTIONED || tile.status === TILE_STATUSES.FIRST_WRONG).length
    )
  }, 0)

  // Количество оставшихся мин равно:
  // Исходное количество минус отмеченные мины
  const newNumberOfMines = NUMBER_OF_MINES - markedTilesCount

  // Реализована логика работы со строковым числом оставшихся мин по аналогии с таймером
  if (newNumberOfMines < 10) {
    numberOfMinesString = `00${newNumberOfMines}`
  }

  else if (newNumberOfMines < 100) {
    numberOfMinesString = `0${newNumberOfMines}`
  }

  else {
    numberOfMinesString = String(newNumberOfMines)
  }

  // Преобразуем строковое число количества мин в массив для удобства работы
  let arrayOfMines = numberOfMinesString.split('')

  // Если счётчик мин ушел в отрицательные числа, то приравниваем его к нулю
  arrayOfMines = arrayOfMines.includes('-') ? ['0', '0', '0'] : arrayOfMines

  // Измененяем data-value для DOM-элеметов счетчика мин,
  // Благодаря CSS стилям изменяется их отображение
  minesLeftHundreds.dataset.value = `number_${arrayOfMines[0]}`
  minesLeftDozens.dataset.value = `number_${arrayOfMines[1]}`
  minesLeftUnits.dataset.value = `number_${arrayOfMines[2]}`
}

// Инициализируем переменную для интервала подсчёта времени,
// По умолчанию null
let interval = null

function checkGameEnd(tile) {

  // Если интервал не установлен, то запустить интервал со счетчиком времени
  if (!interval) {
    interval = setInterval(setTimer, 1000)
  }

  // Выясняем, мы проиграли или выиграли
  const win = checkWin(board)
  const lose = checkLose(board)

  // Если мы выиграли, то надеваем очки на эмоджи главной кнопки
  if (win) {
    smileButton.dataset.status = SMILE_STATUSES.WINNER
  }

  // Если мы проиграли:
  if (lose) {
    // Если бомба попала на первый клик, то уничтожаем бомбу, продолжаем игру
    if (isFirstClick) {
      tile.status = TILE_STATUSES.FIRST_WRONG
      countMinesLeft()
      return
    }

    // Взрываем бомбу
    tile.element.id = 'mine_hasBlown'
    // Выставляем мёртвый эмодзи главной кнопки
    smileButton.dataset.status = SMILE_STATUSES.DEAD

    // Проходимся по каждой клавише
    board.forEach(row => {
      row.forEach(tile => {
        // Если клавиша содержит мину, то открывем её
        if (tile.status === TILE_STATUSES.MARKED && tile.mine) {
          tile.status = TILE_STATUSES.MINE
        }
        if (tile.status === TILE_STATUSES.QUESTIONED && tile.mine) {
          tile.status = TILE_STATUSES.MINE
        }
        // Если клавиша содержит мину, то открывем её
        if (tile.mine) revealTile(board, tile)
      })
    })
  }

  // В случае выигрыша или поражения
  if (win || lose) {
    // Останавливаем распространение кликов мыши при погружении,
    // Чтобы не срабатывали клики на клавиши
    boardMain.addEventListener('click', stopProp, { capture: true })
    boardMain.addEventListener('contextmenu', stopProp, { capture: true })

    // Останавливаем счётчик времени
    clearInterval(interval)
    // Делаем игровое поле недоступным для нажатий
    boardMain.style.pointerEvents = 'none'
  }
}

function stopProp(e) {
  e.stopImmediatePropagation()
}