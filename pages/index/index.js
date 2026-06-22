Page({
  data: {
    board: [],
    score: 0,
    bestScore: 0,
    gameOver: false,
    won: false,
    boardSize: 4,
    touchStartX: 0,
    touchStartY: 0
  },

  onLoad: function() {
    this.loadBestScore()
    this.initGame()
  },

  /**
   * 初始化游戏
   */
  initGame: function() {
    const size = this.data.boardSize
    const board = this.createEmptyBoard(size)
    this.addNewTile(board)
    this.addNewTile(board)
    
    this.setData({
      board: board,
      score: 0,
      gameOver: false,
      won: false
    })
  },

  /**
   * 创建空白棋盘
   */
  createEmptyBoard: function(size) {
    const board = []
    for (let i = 0; i < size; i++) {
      board[i] = []
      for (let j = 0; j < size; j++) {
        board[i][j] = 0
      }
    }
    return board
  },

  /**
   * 在随机位置添加新方块
   */
  addNewTile: function(board) {
    const emptyTiles = []
    const size = this.data.boardSize
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (board[i][j] === 0) {
          emptyTiles.push({ x: i, y: j })
        }
      }
    }

    if (emptyTiles.length > 0) {
      const randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)]
      board[randomTile.x][randomTile.y] = Math.random() < 0.9 ? 2 : 4
    }
  },

  /**
   * 触摸开始
   */
  onTouchStart: function(e) {
    this.setData({
      touchStartX: e.touches[0].clientX,
      touchStartY: e.touches[0].clientY
    })
  },

  /**
   * 触摸结束
   */
  onTouchEnd: function(e) {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const dx = touchEndX - this.data.touchStartX
    const dy = touchEndY - this.data.touchStartY

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      return // 忽略小动作
    }

    let direction = ''
    if (Math.abs(dx) > Math.abs(dy)) {
      // 水平滑动
      direction = dx > 0 ? 'right' : 'left'
    } else {
      // 垂直滑动
      direction = dy > 0 ? 'down' : 'up'
    }

    this.move(direction)
  },

  /**
   * 按键处理
   */
  handleKeyPress: function(direction) {
    this.move(direction)
  },

  /**
   * 移动逻辑
   */
  move: function(direction) {
    if (this.data.gameOver || this.data.won) {
      return
    }

    const board = JSON.parse(JSON.stringify(this.data.board))
    const oldBoard = JSON.parse(JSON.stringify(board))
    let score = this.data.score
    let moved = false

    switch (direction) {
      case 'left':
        for (let i = 0; i < board.length; i++) {
          const result = this.mergeLine(board[i])
          board[i] = result.line
          score += result.score
          if (JSON.stringify(board[i]) !== JSON.stringify(oldBoard[i])) {
            moved = true
          }
        }
        break
      case 'right':
        for (let i = 0; i < board.length; i++) {
          board[i] = board[i].reverse()
          const result = this.mergeLine(board[i])
          board[i] = result.line
          board[i] = board[i].reverse()
          score += result.score
          if (JSON.stringify(board[i]) !== JSON.stringify(oldBoard[i])) {
            moved = true
          }
        }
        break
      case 'up':
        for (let j = 0; j < board[0].length; j++) {
          let column = []
          for (let i = 0; i < board.length; i++) {
            column.push(board[i][j])
          }
          const result = this.mergeLine(column)
          for (let i = 0; i < board.length; i++) {
            board[i][j] = result.line[i]
          }
          score += result.score
        }
        moved = this.boardChanged(oldBoard, board)
        break
      case 'down':
        for (let j = 0; j < board[0].length; j++) {
          let column = []
          for (let i = 0; i < board.length; i++) {
            column.push(board[i][j])
          }
          column = column.reverse()
          const result = this.mergeLine(column)
          column = result.line
          column = column.reverse()
          for (let i = 0; i < board.length; i++) {
            board[i][j] = column[i]
          }
          score += result.score
        }
        moved = this.boardChanged(oldBoard, board)
        break
    }

    if (moved) {
      this.addNewTile(board)
      this.setData({
        board: board,
        score: score
      })

      // 检查游戏状态
      if (this.hasWon(board)) {
        this.setData({
          won: true
        })
        wx.showModal({
          title: '恭喜！',
          content: '你达到了 2048！',
          confirmText: '继续',
          cancelText: '结束'
        })
      } else if (this.isGameOver(board)) {
        this.setData({
          gameOver: true
        })
        this.updateBestScore(score)
        wx.showModal({
          title: '游戏结束',
          content: '没有更多的��动了！最终得分: ' + score,
          showCancel: false
        })
      }
    }
  },

  /**
   * 合并一行
   */
  mergeLine: function(line) {
    // 移除零
    let newLine = line.filter(val => val !== 0)
    
    // 合并相同的数字
    let score = 0
    for (let i = 0; i < newLine.length - 1; i++) {
      if (newLine[i] === newLine[i + 1] && newLine[i] !== 0) {
        newLine[i] *= 2
        score += newLine[i]
        newLine.splice(i + 1, 1)
      }
    }
    
    // 填充零
    while (newLine.length < line.length) {
      newLine.push(0)
    }
    
    return {
      line: newLine,
      score: score
    }
  },

  /**
   * 棋盘是否改变
   */
  boardChanged: function(board1, board2) {
    return JSON.stringify(board1) !== JSON.stringify(board2)
  },

  /**
   * 检查是否赢了
   */
  hasWon: function(board) {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === 2048) {
          return true
        }
      }
    }
    return false
  },

  /**
   * 检查游戏是否结束
   */
  isGameOver: function(board) {
    // 检查是否有空位
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === 0) {
          return false
        }
      }
    }

    // 检查是否可以合并
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const current = board[i][j]
        if ((i + 1 < board.length && board[i + 1][j] === current) ||
            (j + 1 < board[i].length && board[i][j + 1] === current)) {
          return false
        }
      }
    }

    return true
  },

  /**
   * 重新开始游戏
   */
  restartGame: function() {
    this.initGame()
  },

  /**
   * 保存最高分
   */
  updateBestScore: function(score) {
    if (score > this.data.bestScore) {
      this.setData({
        bestScore: score
      })
      wx.setStorage({
        key: 'bestScore',
        data: score
      })
    }
  },

  /**
   * 加载最高分
   */
  loadBestScore: function() {
    wx.getStorage({
      key: 'bestScore',
      success: (res) => {
        this.setData({
          bestScore: res.data
        })
      }
    })
  },

  /**
   * 获取方块颜色
   */
  getTileColor: function(value) {
    const colors = {
      0: '#cdc1b4',
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e'
    }
    return colors[value] || '#3c3c2f'
  }
})