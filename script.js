// Main game UI and logic entry point
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

// Game configuration constants
const BOARD_SIZE = 16
const NUMBER_OF_MINES = 40

// Game state initialization
const board = createBoard(BOARD_SIZE, NUMBER_OF_MINES)
const boardMain = document.querySelector('.board__main')
const smileButton = document.querySelector('.board-header__smile-btn')

// Track if the current click is the first click (used for mine protection)
let isFirstClick = true

// Timer and mine counter state
let time = 1
let timeString = '000'
let numberOfMinesString = NUMBER_OF_MINES < 100 ? `0${NUMBER_OF_MINES}` : String(NUMBER_OF_MINES)
let interval = null

// DOM references for display elements
const minesLeftHundreds = document.querySelector('.mines-left_hundreds')
const minesLeftDozens = document.querySelector('.mines-left_dozens')
const minesLeftUnits = document.querySelector('.mines-left_units')
const timerHundreds = document.querySelector('.timer_hundreds')
const timerDozens = document.querySelector('.timer_dozens')
const timerUnits = document.querySelector('.timer_units')
const rulesButton = document.querySelector('.rules-button')
const rulesArticle = document.querySelector('.rules')
const main = document.getElementById('main')
const head = document.querySelector('head')

/**
 * Sets up audio element with appropriate settings
 */
function setupAudio() {
  const audio = document.createElement('audio')
  audio.src = audioMP3
  audio.controls = true
  audio.type = 'audio/mp3'
  audio.loop = true
  audio.volume = 0.05
  audio.autoplay = true
  main.append(audio)
}

/**
 * Sets up favicon for the page
 */
function setupFavicon() {
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/x-icon'
  link.href = favIcon
  head.append(link)
}

/**
 * Updates the timer display with current elapsed time
 */
function setTimer() {
  // Format time string with leading zeros
  if (time < 10) {
    timeString = `00${time}`
  } else if (time < 100) {
    timeString = `0${time}`
  } else {
    timeString = String(time)
  }
  
  const [hundreds, dozens, units] = timeString.split('')
  
  // Reset timer after 999 seconds
  time = time > 999 ? 0 : time
  
  // Update display elements
  timerHundreds.dataset.value = `number_${hundreds}`
  timerDozens.dataset.value = `number_${dozens}`
  timerUnits.dataset.value = `number_${units}`
  time++
}

/**
 * Updates the mines remaining counter display
 */
function countMinesLeft() {
  // Count all marked and questioned tiles
  const markedTilesCount = board.reduce((count, row) => {
    return (
      count + row.filter(tile => 
        tile.status === TILE_STATUSES.MARKED || 
        tile.status === TILE_STATUSES.QUESTIONED || 
        tile.status === TILE_STATUSES.FIRST_WRONG
      ).length
    )
  }, 0)
  
  // Calculate remaining mines
  const newNumberOfMines = NUMBER_OF_MINES - markedTilesCount
  
  // Format mines string with leading zeros
  if (newNumberOfMines < 10) {
    numberOfMinesString = `00${newNumberOfMines}`
  } else if (newNumberOfMines < 100) {
    numberOfMinesString = `0${newNumberOfMines}`
  } else {
    numberOfMinesString = String(newNumberOfMines)
  }
  
  let arrayOfMines = numberOfMinesString.split('')
  
  // Handle negative numbers by showing 000
  arrayOfMines = arrayOfMines.includes('-') ? ['0', '0', '0'] : arrayOfMines
  
  // Update display elements
  minesLeftHundreds.dataset.value = `number_${arrayOfMines[0]}`
  minesLeftDozens.dataset.value = `number_${arrayOfMines[1]}`
  minesLeftUnits.dataset.value = `number_${arrayOfMines[2]}`
}

/**
 * Checks game end conditions (win/lose) and updates UI accordingly
 */
function checkGameEnd(tile) {
  // Start timer on first interaction
  if (!interval) {
    interval = setInterval(setTimer, 1000)
  }
  
  const win = checkWin(board)
  const lose = checkLose(board)
  
  // Handle win condition
  if (win) {
    smileButton.dataset.status = SMILE_STATUSES.WINNER
  }
  
  // Handle lose condition
  if (lose) {
    // Protect first click - if mine hit on first click, disable mine and continue
    if (isFirstClick) {
      tile.status = TILE_STATUSES.FIRST_WRONG
      countMinesLeft()
      return
    }
    
    // Mark the tile that triggered the loss
    tile.element.id = 'mine_hasBlown'
    smileButton.dataset.status = SMILE_STATUSES.DEAD
    
    // Reveal all mines
    board.forEach(row => {
      row.forEach(boardTile => {
        if (boardTile.status === TILE_STATUSES.MARKED && boardTile.mine) {
          boardTile.status = TILE_STATUSES.MINE
        }
        if (boardTile.status === TILE_STATUSES.QUESTIONED && boardTile.mine) {
          boardTile.status = TILE_STATUSES.MINE
        }
        if (boardTile.mine) revealTile(board, boardTile)
      })
    })
  }
  
  // Finalize game end
  if (win || lose) {
    // Prevent further interactions
    boardMain.addEventListener('click', stopPropagation, { capture: true })
    boardMain.addEventListener('contextmenu', stopPropagation, { capture: true })
    clearInterval(interval)
    boardMain.style.pointerEvents = 'none'
  }
}

/**
 * Stops event propagation to prevent further tile interactions
 */
function stopPropagation(e) {
  e.stopImmediatePropagation()
}

// Initialize board grid layout using CSS variables
boardMain.style.setProperty('--size', BOARD_SIZE)

// Set up tile event listeners
board.forEach(row => {
  row.forEach(tile => {
    boardMain.append(tile.element)
    
    // Left click to reveal tile
    tile.element.addEventListener('click', () => {
      revealTile(board, tile)
      checkGameEnd(tile)
      isFirstClick = isFirstClick && false
    })
    
    // Right click to mark/unmark tile
    tile.element.addEventListener('contextmenu', e => {
      e.preventDefault()
      markTile(tile)
      countMinesLeft()
    })
  })
})

// Rules modal toggle
rulesButton.addEventListener('click', (e) => {
  e.preventDefault()
  rulesArticle.dataset.isVisible = rulesArticle.dataset.isVisible === 'yes' ? 'no' : 'yes'
})

// Initialize game audio and favicon
setupAudio()
setupFavicon()
