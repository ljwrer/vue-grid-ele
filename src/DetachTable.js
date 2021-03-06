import $ from 'jquery'
import _ from 'lodash'
class DetachTable {
  constructor (tableVm, config) {
    const defaultConfig = {
      left: 0,
      top: 0,
      fixedZIndex: 9,
      zIndex: 8
    }
    this.tableVm = tableVm
    this.config = _.merge(defaultConfig, config)
    this.$table = $(tableVm.$el)
    this.$fixed = this.$table.find('div.v-table__fixed')
    this.$fixedHead = this.$table.find('div.v-table__fixed-header-wrapper')
    this.$head = this.$table.find('div.v-table__header-wrapper')
    this.$fixedBody = this.$table.find('div.v-table__fixed-body-wrapper')
    this.$body = this.$table.find('div.v-table__body-wrapper')
    this.cache = []
    this.detached = false
  }
  isDetached () {
    return this.detached
  }
  detach () {
    if (!this.detached) {
      this.handleFixedBody()
      this.handleFixedHead()
      this.handleHead()
      this.detached = true
      this.tableVm.resizeScroll()
    }
  }
  restore () {
    if (this.detached) {
      while (this.cache.length) {
        this.cache.pop()()
      }
      this.detached = false
      this.tableVm.resizeScroll()
    }
  }
  cacheStyle ($el, css) {
    const style = _.keys(css).reduce((cache, key) => {
      cache[key] = $el.css(key)
      return cache
    }, {})
    this.cache.unshift(() => {
      $el.css(style)
    })
  }
  detachStyle ($el, css) {
    this.cacheStyle($el, css)
    $el.css(css)
  }
  handleFixedBody () {
    this.detachStyle(this.$fixedBody, {
      top: 0
    })
  }
  handleFixedHead () {
    this.cacheStyle(this.$fixedHead)
    const width = parseFloat(this.$fixed.css('width')) + 1 + 'px'
    this.detachStyle(this.$fixedHead, {
      position: 'fixed',
      overflow: 'hidden',
      zIndex: this.config.fixedZIndex,
      left: this.config.left,
      top: this.config.top,
      width
    })
    this.handleFixedBorder()
    this.handleFixedShadow()
  }
  handleHead () {
    const width = this.$body.css('width')
    this.detachStyle(this.$head, {
      position: 'fixed',
      overflow: 'hidden',
      zIndex: this.config.zIndex,
      left: this.config.left + 1,
      top: this.config.top,
      width
    })
  }
  handleFixedBorder () {
    const borderColor = this.$fixedHead.find('th').css('borderRightColor')
    const border = `1px solid ${borderColor}`
    this.detachStyle(this.$fixedHead, {
      borderLeft: border,
      borderRight: border
    })
  }
  handleFixedShadow () {
    const boxShadow = this.$fixed.css('boxShadow')
    this.detachStyle(this.$fixedHead, {
      boxShadow
    })
  }
}
export default DetachTable
