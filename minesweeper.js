// Game logic module with tile and game state management

/**
 * Tile status constants representing different states a tile can have
 */
export const TILE_STATUSES = {
  HIDDEN: 'hidden',
  MINE: 'mine',
  NUMBER: 'number',
  MARKED: 'marked',
  QUESTIONED: 'questioned',
  FIRST_WRONG: 'first_wrong'
}

/**
 * Emoji button status constants for game state visualization
 */
export const SMILE_STATUSES = {
  ALIVE: 'alive',
  DEAD: 'dead',
  SCARED: 'scared',
  WINNER: 'winner'
}

/**
 * Creates a game board with randomly placed mines
 * @param {number} boardSize - The dimensions of the square board (16x16, etc.)
 * @param {number} numberOfMines - The total number of mines to place on the board
 * @returns {Array<Array<Object>>} A 2D array of tile objects representing the game board
 */
export function createBoard(boardSize, numberOfMines) {
  const board = []
  const minePositions = getMinePositions(boardSize, numberOfMines)
  const smileButton = document.querySelector('.board-header__smile-btn')
  
  // Allow restarting the game by clicking the smile button
  smileButton.addEventListener('click', () => {
    window.location.reload()
  })
  
  // O(N^2) complexity - acceptable for small board sizes
  for (let x = 0; x < boardSize; x++) {
    const row = []
    for (let y = 0; y < boardSize; y++) {
      const element = document.createElement('div')
      element.classList.add('tile')
      element.dataset.status = TILE_STATUSES.HIDDEN
      
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
      
      // Add visual feedback when mouse interacts with tiles
      tile.element.addEventListener('mousedown', () => {
        if (smileButton) {
          smileButton.dataset.status = tile.status === TILE_STATUSES.HIDDEN 
            ? SMILE_STATUSES.SCARED 
            : SMILE_STATUSES.ALIVE
        }
      })
      
      tile.element.addEventListener('mouseup', () => {
        if (smileButton) {
          smileButton.dataset.status = SMILE_STATUSES.ALIVE
        }
      })
      
      row.push(tile)
    }
    board.push(row)
  }
  
  return board
}

/**
 * Toggles the marked status of a tile between hidden, marked, questioned, and hidden
 * @param {Object} tile - The tile object to mark
 */
export function markTile(tile) {
  // Only allow marking if tile is hidden, questioned, or marked
  if (
    tile.status !== TILE_STATUSES.HIDDEN &&
    tile.status !== TILE_STATUSES.QUESTIONED &&
    tile.status !== TILE_STATUSES.MARKED
  ) return
  
  if (tile.status === TILE_STATUSES.MARKED && tile.markCounter === 1) {
    tile.status = TILE_STATUSES.QUESTIONED
    tile.markCounter++
  } else if (tile.markCounter === 2) {
    tile.status = TILE_STATUSES.HIDDEN
    tile.markCounter = 0
  } else {
    tile.status = TILE_STATUSES.MARKED
    tile.markCounter++
  }
}

/**
 * Reveals a tile and recursively reveals adjacent tiles if no adjacent mines exist
 * @param {Array<Array<Object>>} board - The game board
 * @param {Object} tile - The tile to reveal
 */
export function revealTile(board, tile) {
  // Only reveal hidden tiles
  if (tile.status !== TILE_STATUSES.HIDDEN) return
  
  // Tile contains a mine - game over
  if (tile.mine) {
    tile.status = TILE_STATUSES.MINE
    return
  }
  
  tile.status = TILE_STATUSES.NUMBER
  const adjacentTiles = nearbyTiles(board, tile)
  const mines = adjacentTiles.filter(t => t.mine)
  
  // No adjacent mines - recursively reveal neighbors
  if (mines.length === 0) {
    adjacentTiles.forEach(adjacentTile => {
      revealTile(board, adjacentTile)
      adjacentTile.element.classList.add('tile_empty')
    })
  } else {
    // Display mine count with appropriate styling
    tile.element.classList.add(`number_${mines.length}`)
  }
}

/**
 * Checks if the player has won the game
 * @param {Array<Array<Object>>} board - The game board
 * @returns {boolean} True if all non-mine tiles are revealed and all mines are hidden/marked
 */
export function checkWin(board) {
  return board.every(row =>
    row.every(tile =>
      tile.status === TILE_STATUSES.NUMBER ||
      (tile.mine &&
        (tile.status === TILE_STATUSES.HIDDEN ||
          tile.status === TILE_STATUSES.MARKED))
    )
  )
}

/**
 * Checks if the player has lost the game
 * @param {Array<Array<Object>>} board - The game board
 * @returns {boolean} True if any mine has been revealed
 */
export function checkLose(board) {
  return board.some(row =>
    row.some(tile => tile.status === TILE_STATUSES.MINE)
  )
}

/**
 * Generates random mine positions for the board
 * @param {number} boardSize - The dimensions of the square board
 * @param {number} numberOfMines - The number of mines to place
 * @returns {Array<Object>} Array of {x, y} positions where mines are placed
 */
function getMinePositions(boardSize, numberOfMines) {
  const minePositions = []
  
  while (minePositions.length < numberOfMines) {
    const newMinePosition = {
      x: randomNumber(boardSize),
      y: randomNumber(boardSize),
    }
    
    // Ensure no duplicate mine positions
    if (!minePositions.some(minePosition => 
      positionMatch(minePosition, newMinePosition)
    )) {
      minePositions.push(newMinePosition)
    }
  }
  
  return minePositions
}

/**
 * Compares two position objects
 * @param {Object} posA - Position object with x and y properties
 * @param {Object} posB - Position object with x and y properties
 * @returns {boolean} True if positions are identical
 */
function positionMatch(posA, posB) {
  return posA.x === posB.x && posA.y === posB.y
}

/**
 * Generates a random integer from 0 to size-1
 * @param {number} size - The upper bound (exclusive)
 * @returns {number} A random integer
 */
function randomNumber(size) {
  return Math.floor(Math.random() * size)
}

/**
 * Gets all adjacent tiles (3-8 tiles depending on position)
 * @param {Array<Array<Object>>} board - The game board
 * @param {Object} tile - The reference tile with x and y properties
 * @returns {Array<Object>} Array of adjacent tile objects
 */
function nearbyTiles(board, tile) {
  const { x, y } = tile
  const nearbyTilesList = []
  
  // Check all 8 adjacent positions (O(1) operation - fixed 3x3 grid)
  for (let xOffset = -1; xOffset <= 1; xOffset++) {
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      const adjacentTile = board[x + xOffset]?.[y + yOffset]
      
      // Only add tiles that exist within board bounds
      if (adjacentTile) {
        nearbyTilesList.push(adjacentTile)
      }
    }
  }
  
  return nearbyTilesList
}
