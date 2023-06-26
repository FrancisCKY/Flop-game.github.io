// 定義遊戲狀態
const Game_State = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatched: "CardsMatched",
  CardsMatchedFailed: "CardsMatchedFailed",
  GameFinished: "GameFinished"
}

// 宣告圖片陣列
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

// --------------------------------------------------------------
// 此專案會使用MVC架構，Model、Visual，controller
// --------------------------------------------------------------

// ********************************************************************************
// 定義遊戲介面，將函式儲存在其中，後續直接指定使用----------(V)
const view = {

  // 負責生成卡片樣式
  getcardelement(index) {
    return `
    <div data-index='${index}' class="card back"></div> `
  },

  // 負責生成卡片內容
  getCardContent(index) {
    const number = this.transformnumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" alt="">
      <p>${number}</p>
    `
  },

  // 負責轉換1.11.12.13
  transformnumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  // 負責取得資料並展現卡片
  // 此函式會接收(C)架構所產生的數值，作為參數
  displaycards(indexes) {
    const rootelement = document.querySelector('#cards')
    // 使用map進行迭代，依序將值取出並放入getcardelement函式
    // 最後則是使用join方法，將陣列合併成一個大字串，才能放入HTML template使用
    rootelement.innerHTML = indexes.map(index => this.getcardelement(index)).join("")
  },

  // 負責判斷是否為正反面
  // 此處使用...(其餘參數)，能夠將參數變成陣列來迭代
  filpCards(...cards) {
    // 使用map函式處理每一個數值
    cards.map(card => {
      // 如果card節點包含'back'
      if (card.classList.contains('back')) {
        // 移除back樣式
        card.classList.remove('back')
        // 將卡片內容嵌入至卡片上
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        // 停止動作
        return
      }
      // 如果不是背面，就新增back樣式
      card.classList.add('back')
      // 卡片內容清空
      card.innerHTML = null
    })
  },

  // 此處也是使用...(其餘參數)，將參數變成陣列來運用，即使只有一個參數能行
  pairCards(...cards) {
    // 透過map迭代
    cards.map(card => {
      // 添加paired類別名稱
      card.classList.add('paired')
    })
  },

  // 動態更新分數
  renderScore(score) {
    document.querySelector("#title-score").textContent = `Score: ${score}`
  },

  // 動態更新嘗試次數
  renderTriedTimes(times) {
    document.querySelector("#try-times").textContent = `You've tried: ${times} times`
  },

  // 設置配對失敗函式
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      // 設置監聽事件，只要動畫結束，就將監聽器移除，降低網頁負荷
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },

  // 遊戲結束函式
  showGameFinished() {
    // 新建空白div，用來放置遊戲結束卡片
    const div = document.createElement('div')
    // 替此元素加上完成類別
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score:${model.score}</p>
      <p>You've tried:${model.triedtimes}times</p>
    `
    const header = document.querySelector('#head')
    // 在選取header元素之前，插入div元素
    header.before(div)
  }
}

// 採用Fisher-Yates Shuffle演算法
const utility = {
  getrandomnumberarray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      // 由於Math.random的值會小於1，因此若要取得index本身，得(index+1)才行
      let randomindex = Math.floor(Math.random() * (index + 1))
        // 以下交換陣列元素方法採用解構賦值，前頭的;一定要加，做為區隔使用
        ;[number[index], number[randomindex]] = [number[randomindex], number[index]]
    }
    return number
  }
}

// ********************************************************************************

// 定義遊戲資料----------(M)
const model = {
  score: 0,
  triedtimes: 0,
  // 建立一空陣列，用來將資料丟入，並進行比對
  revealedCards: [],
  // 建立檢查配對函式
  isRevealedCardMatched() {
    // 比對兩者是否相同
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  }
}
// ********************************************************************************

// 定義初始遊戲狀態----------(C)
const controller = {
  // 尚未翻牌狀態
  currentState: Game_State.FirstCardAwaits,
  // 建立產生卡片函式
  gererateCards() {
    // 呼叫(M)架構中的displayercards函式，並在這時候就產生52個數值陣列，後續再將其傳入作為參數
    view.displaycards(utility.getrandomnumberarray(52))
  },

  // 進行卡片數值比對與判斷
  dispatchCardAction(card) {
    // 如果不是背面，不做任何事
    if (!card.classList.contains('back')) {
      return
    }
    // 如果是背面
    switch (this.currentState) {
      // 進入至第一狀況
      case Game_State.FirstCardAwaits:
        // 翻牌
        view.filpCards(card)
        // 將card資料放入至revealedCards
        model.revealedCards.push(card)
        // 此時遊戲狀態變為Second
        this.currentState = Game_State.SecondCardAwaits
        // 停止動作，此項目必須加入，目的是當case執行結束時，需要有break來停止動作，否則會自動執行下面程式碼，會發生無法預期狀況
        break
      // 進入至第二狀況
      case Game_State.SecondCardAwaits:
        // 嘗試次數+1，並且將此數值作為參數，放進renderTriedTimes函式中
        view.renderTriedTimes(++model.triedtimes)
        // 翻牌
        view.filpCards(card)
        // 將card資料放入至revealedCards
        model.revealedCards.push(card)
        // 如果兩筆資料成功配對
        if (model.isRevealedCardMatched()) {
          // 分數+10，並渲染網頁
          view.renderScore(model.score += 10)
          // 狀態改變為配對成功
          this.currentState = Game_State.CardsMatched
          // 配對卡片顏色改變
          view.pairCards(...model.revealedCards)
          // 陣列清空
          model.revealedCards = []

          if (model.score === 260) {
            console.log('showGameFinished')
            // 狀態變為遊戲結束
            this.currentState = Game_State.GameFinished
            // 呼叫遊戲結束，展現卡片之函式
            view.showGameFinished()
            // 停止動作
            return
          }
          // 因為成功配對，狀態重新變回第一卡片等待
          this.currentState = Game_State.FirstCardAwaits
        } else {
          // 配對失敗，狀態改變
          this.currentState = Game_State.CardsMatchedFailed
          // 針對配對失敗卡片，進行動畫設置
          view.appendWrongAnimation(...model.revealedCards)
          // 設置計時器，來記憶卡片樣式
          setTimeout(this.resetCards, 1000)
        }
        // 停止動作
        break
    }
    // console.log('this.currentState:', this.currentState)
    // console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },

  resetCards() {
    view.filpCards(...model.revealedCards)
    // 陣列清空
    model.revealedCards = []
    // 狀態變回第一張卡片等待
    controller.currentState = Game_State.FirstCardAwaits
  }
}
// ********************************************************************************

// 透過controller呼叫函式，也是必須由controller來呼叫才行，避免由(M)、(C)來呼叫
controller.gererateCards()

// ------------------------------------------------------------------------------------------------------------------------
// 注意:需要先呼叫view.displaycards函式，產生卡片後，才能進行監聽事件設置；若先將監聽事件擺放在函式上方，因為卡片尚未生成，會造成點擊無反應
// ------------------------------------------------------------------------------------------------------------------------

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})