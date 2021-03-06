<template>
  <div class="v-table" :style="{visibility: frame.done?'visible':'hidden'}"
       :class="{
      'v-table--fit': fit,
      'v-table--striped': stripe,
      'v-table--border': border,
      'v-table--hidden': isHidden,
      'v-table--fluid-height': maxHeight,
      'v-table--enable-row-hover': !store.states.isComplex,
      'v-table--enable-row-transition': (store.states.data || []).length !== 0 && (store.states.data || []).length < 100
    }"
       @mouseleave="handleMouseLeave($event)">
    <div class="hidden-columns" ref="hiddenColumns"><slot></slot></div>
    <div class="v-table__header-wrapper" ref="headerWrapper" v-if="showHeader">
      <table-header
        :store="store"
        :layout="layout"
        :border="border"
        :default-sort="defaultSort"
        :style="{ width: layout.bodyWidth ? layout.bodyWidth + 'px' : '' }">
      </table-header>
    </div>
    <div
      class="v-table__body-wrapper"
      ref="bodyWrapper"
      :style="[bodyHeight]">
      <table-body
        :context="context"
        :store="store"
        :stripe="stripe"
        :layout="layout"
        :row-class-name="rowClassName"
        :row-style="rowStyle"
        :highlight="highlightCurrentRow"
        :style="{ width: bodyWidth }">
      </table-body>
      <div :style="{ width: bodyWidth }" class="v-table__empty-block" v-if="!data || data.length === 0">
        <span class="v-table__empty-text"><slot name="empty">{{ emptyText || t('el.table.emptyText') }}</slot></span>
      </div>
    </div>
    <div class="v-table__footer-wrapper" ref="footerWrapper" v-if="showSummary" v-show="data && data.length > 0">
      <table-footer
        :store="store"
        :layout="layout"
        :border="border"
        :sum-text="sumText || t('el.table.sumText')"
        :summary-method="summaryMethod"
        :default-sort="defaultSort"
        :style="{ width: layout.bodyWidth ? layout.bodyWidth + 'px' : '' }">
      </table-footer>
    </div>
    <div class="v-table__fixed" ref="fixedWrapper"
         v-if="fixedColumns.length > 0"
         :style="[
        { width: layout.fixedWidth ? layout.fixedWidth + 'px' : '' },
        fixedHeight
      ]">
      <div class="v-table__fixed-header-wrapper" ref="fixedHeaderWrapper" v-if="showHeader">
        <table-header
          fixed="left"
          :border="border"
          :store="store"
          :layout="layout"
          :style="{ width: layout.fixedWidth ? layout.fixedWidth + 'px' : '' }"></table-header>
      </div>
      <div class="v-table__fixed-body-wrapper" ref="fixedBodyWrapper"
           :style="[
          { top: layout.headerHeight + 'px' },
          fixedBodyHeight
        ]">
        <table-body
          fixed="left"
          :store="store"
          :stripe="stripe"
          :layout="layout"
          :highlight="highlightCurrentRow"
          :row-class-name="rowClassName"
          :row-style="rowStyle"
          :style="{ width: layout.fixedWidth ? layout.fixedWidth + 'px' : '' }">
        </table-body>
      </div>
      <div class="v-table__fixed-footer-wrapper" ref="fixedFooterWrapper" v-if="showSummary" v-show="data && data.length > 0">
        <table-footer
          fixed="left"
          :border="border"
          :sum-text="sumText || t('el.table.sumText')"
          :summary-method="summaryMethod"
          :store="store"
          :layout="layout"
          :style="{ width: layout.fixedWidth ? layout.fixedWidth + 'px' : '' }"></table-footer>
      </div>
    </div>
    <div class="v-table__fixed-right" ref="rightFixedWrapper"
         v-if="rightFixedColumns.length > 0"
         :style="[
        { width: layout.rightFixedWidth ? layout.rightFixedWidth + 'px' : '' },
        { right: layout.scrollY ? (border ? layout.gutterWidth : (layout.gutterWidth || 1)) + 'px' : '' },
        fixedHeight
      ]">
      <div class="v-table__fixed-header-wrapper" ref="rightFixedHeaderWrapper" v-if="showHeader">
        <table-header
          fixed="right"
          :border="border"
          :store="store"
          :layout="layout"
          :style="{ width: layout.rightFixedWidth ? layout.rightFixedWidth + 'px' : '' }"></table-header>
      </div>
      <div class="v-table__fixed-body-wrapper" ref="rightFixedBodyWrapper"
           :style="[
          { top: layout.headerHeight + 'px' },
          fixedBodyHeight
        ]">
        <table-body
          fixed="right"
          :store="store"
          :stripe="stripe"
          :layout="layout"
          :row-class-name="rowClassName"
          :row-style="rowStyle"
          :highlight="highlightCurrentRow"
          :style="{ width: layout.rightFixedWidth ? layout.rightFixedWidth + 'px' : '' }">
        </table-body>
      </div>
      <div class="v-table__fixed-footer-wrapper" ref="rightFixedFooterWrapper" v-if="showSummary" v-show="data && data.length > 0">
        <table-footer
          fixed="right"
          :border="border"
          :sum-text="sumText || t('el.table.sumText')"
          :summary-method="summaryMethod"
          :store="store"
          :layout="layout"
          :style="{ width: layout.rightFixedWidth ? layout.rightFixedWidth + 'px' : '' }"></table-footer>
      </div>
    </div>
    <div class="v-table__fixed-right-patch"
         v-if="rightFixedColumns.length > 0"
         :style="{ width: layout.scrollY ? layout.gutterWidth + 'px' : '0', height: layout.headerHeight + 'px' }"></div>
    <div class="v-table__column-resize-proxy" ref="resizeProxy" v-show="resizeProxyVisible"></div>
  </div>
</template>

<script type="text/babel">
  import VCheckbox from '../../checkbox';
  import throttle from 'throttle-debounce/throttle';
  import debounce from 'throttle-debounce/debounce';
  import { addResizeListener, removeResizeListener } from '../../../src/utils/resize-event';
  import Locale from '../../../src/mixins/locale';
  import TableStore from './table-store';
  import TableLayout from './table-layout';
  import TableBody from './table-body';
  import TableHeader from './table-header';
  import TableFooter from './table-footer';
  import { mousewheel } from './util';
  import $ from 'jquery'
  import is from './is'
  let tableIdSeed = 1;
  const isSafari = is.safari();
  const FrameSymbol = {
    'UPDATE':'update',
    'DONE':'done',
    'RESIZE': 'resize'
  }
  export default {
    name: 'VTable',

    mixins: [Locale],

    props: {
      data: {
        type: Array,
        default: function() {
          return [];
        }
      },

      width: [String, Number],

      height: [String, Number],

      maxHeight: [String, Number],

      fit: {
        type: Boolean,
        default: true
      },

      stripe: Boolean,

      border: Boolean,

      rowKey: [String, Function],

      context: {},

      showHeader: {
        type: Boolean,
        default: true
      },

      showSummary: Boolean,

      sumText: String,

      summaryMethod: Function,

      rowClassName: [String, Function],

      rowStyle: [Object, Function],

      highlightCurrentRow: Boolean,

      currentRowKey: [String, Number],

      emptyText: String,

      expandRowKeys: Array,

      defaultExpandAll: Boolean,

      defaultSort: Object,

      tooltipEffect: String,

      renderDelay: {
        type:Number,
        default: 1000
      }
    },

    components: {
      TableHeader,
      TableFooter,
      TableBody,
      VCheckbox
    },

    methods: {
      setCurrentRow(row) {
        this.store.commit('setCurrentRow', row);
      },

      toggleRowSelection(row, selected) {
        this.store.toggleRowSelection(row, selected);
        this.store.updateAllSelected();
      },

      clearSelection() {
        this.store.clearSelection();
      },

      handleMouseLeave() {
        this.store.commit('setHoverRow', null);
        if (this.hoverState) this.hoverState = null;
      },

      updateScrollY() {
        this.layout.updateScrollY();
      },

      bindEvents() {
        const { headerWrapper, footerWrapper } = this.$refs;
        const refs = this.$refs;
        this.bodyWrapper.addEventListener('scroll', function() {
          if (headerWrapper) headerWrapper.scrollLeft = this.scrollLeft;
          if (footerWrapper) footerWrapper.scrollLeft = this.scrollLeft;
          if (refs.fixedBodyWrapper) refs.fixedBodyWrapper.scrollTop = this.scrollTop;
          if (refs.rightFixedBodyWrapper) refs.rightFixedBodyWrapper.scrollTop = this.scrollTop;
        });

        const scrollBodyWrapper = event => {
          const { deltaX, deltaY } = event;

          if (Math.abs(deltaX) < Math.abs(deltaY)) return;

          if (deltaX > 0) {
            this.bodyWrapper.scrollLeft += 10;
          } else if (deltaX < 0) {
            this.bodyWrapper.scrollLeft -= 10;
          }
        };
        if (headerWrapper) {
          mousewheel(headerWrapper, throttle(16, scrollBodyWrapper));
        }
        if (footerWrapper) {
          mousewheel(footerWrapper, throttle(16, scrollBodyWrapper));
        }

        if (this.fit) {
          this.windowResizeListener = throttle(50, () => {
            if (this.$ready) {
              this.doLayout(FrameSymbol.RESIZE);
            }
          });
          addResizeListener(this.$el, this.windowResizeListener);
        }
      },

      doLayout(signal) {
        this.store.updateColumns();
        this.layout.update();
        this.updateScrollY();
        this.$nextTick(() => {
          if (this.height) {
            this.layout.setHeight(this.height);
          } else if (this.maxHeight) {
            this.layout.setMaxHeight(this.maxHeight);
          } else if (this.shouldUpdateHeight) {
            this.layout.updateHeight();
          }
          if (this.$el) {
            this.isHidden = this.$el.clientWidth === 0;
          }
          this.frameTick(signal)
        });
      },
      /**
       *  blink if not V8
       */
      frameTick(signal){
        if(this.frame.done){
          return this.clearFrameQueue()
        }
        this.enqueueFrameQueue(()=>{
          this.adjustFrame()
        },this.renderDelay)
        this.handleFrameSignal(signal)
      },

      handleFrameSignal(signal){
        if(signal === FrameSymbol.UPDATE){
          this.frame.signal = FrameSymbol.UPDATE
          this.setFrameVisible(false)
        }else if(signal === FrameSymbol.DONE){
          if(this.frame.signal === FrameSymbol.UPDATE){
            this.frame.signal = FrameSymbol.DONE
          }else {
            this.adjustFrame()
          }
        }else if(signal === FrameSymbol.RESIZE&&this.frame.signal === FrameSymbol.DONE){
          this.adjustFrame()
          this.frame.signal = ''
        }
      },

      enqueueFrameQueue(fn,time=0){
        const timeoutId = setTimeout(fn,time)
        this.frame.queue.unshift(timeoutId)
      },

      clearFrameQueue(){
        while(this.frame.queue.length>0){
          const timeoutId = this.frame.queue.pop()
          clearTimeout(timeoutId)
        }
      },

      adjustFrame(){
        if(isSafari){
          const $table = $(this.$el).find('table')
          $table.css({
            'table-layout':'auto'
          })
          setTimeout(()=>{
            $table.css({
              'table-layout':'fixed'
            })
            this.setFrameVisible()
          })
        }else {
          this.setFrameVisible()
        }
      },

      setFrameVisible(visible){
        if(visible === false){
          this.$nextTick(()=>{
            this.frame.done = false
            this.$parent.$emit('frame-update')
          })
        }else {
          this.clearFrameQueue()
          this.$nextTick(()=>{
            this.frame.done = true
            this.$parent.$emit('frame-done')
          })
        }
      }

    },

    created() {
      this.tableId = 'v-table_' + tableIdSeed + '_';
      this.debouncedLayout = debounce(50, () => this.doLayout(FrameSymbol.DONE));
    },

    computed: {
      bodyWrapper() {
        return this.$refs.bodyWrapper;
      },

      shouldUpdateHeight() {
        return typeof this.height === 'number' ||
          this.fixedColumns.length > 0 ||
          this.rightFixedColumns.length > 0;
      },

      selection() {
        return this.store.states.selection;
      },

      columns() {
        return this.store.states.columns;
      },

      tableData() {
        return this.store.states.data;
      },

      fixedColumns() {
        return this.store.states.fixedColumns;
      },

      rightFixedColumns() {
        return this.store.states.rightFixedColumns;
      },

      bodyHeight() {
        let style = {};

        if (this.height) {
          style = {
            height: this.layout.bodyHeight ? this.layout.bodyHeight + 'px' : ''
          };
        } else if (this.maxHeight) {
          style = {
            'max-height': (this.showHeader
              ? this.maxHeight - this.layout.headerHeight - this.layout.footerHeight
              : this.maxHeight - this.layout.footerHeight) + 'px'
          };
        }

        return style;
      },

      bodyWidth() {
        const { bodyWidth, scrollY, gutterWidth } = this.layout;
        return bodyWidth ? bodyWidth - (scrollY ? gutterWidth : 0) + 'px' : '';
      },

      fixedBodyHeight() {
        let style = {};

        if (this.height) {
          style = {
            height: this.layout.fixedBodyHeight ? this.layout.fixedBodyHeight + 'px' : ''
          };
        } else if (this.maxHeight) {
          let maxHeight = this.layout.scrollX ? this.maxHeight - this.layout.gutterWidth : this.maxHeight;

          if (this.showHeader) {
            maxHeight -= this.layout.headerHeight;
          }

          style = {
            'max-height': maxHeight + 'px'
          };
        }

        return style;
      },

      fixedHeight() {
        let style = {};

        if (this.maxHeight) {
          style = {
            bottom: (this.layout.scrollX && this.data.length) ? this.layout.gutterWidth + 'px' : ''
          };
        } else {
          style = {
            height: this.layout.viewportHeight ? this.layout.viewportHeight + 'px' : ''
          };
        }

        return style;
      },

    },

    watch: {
      height(value) {
        this.layout.setHeight(value);
      },

      currentRowKey(newVal) {
        this.store.setCurrentRowKey(newVal);
      },

      data: {
        immediate: true,
        handler(val) {
          this.store.commit('setData', val);
          if (this.$ready) this.doLayout(FrameSymbol.UPDATE);
        }
      },

      expandRowKeys(newVal) {
        this.store.setExpandRowKeys(newVal);
      }
    },

    destroyed() {
      if (this.windowResizeListener) removeResizeListener(this.$el, this.windowResizeListener);
      this.clearFrameQueue()
    },

    mounted() {
      this.bindEvents();
      this.doLayout('mounted');

      // init filters
      this.store.states.columns.forEach(column => {
        if (column.filteredValue && column.filteredValue.length) {
          this.store.commit('filterChange', {
            column,
            values: column.filteredValue,
            silent: true
          });
        }
      });

      this.$ready = true;
    },

    data() {
      const store = new TableStore(this, {
        rowKey: this.rowKey,
        defaultExpandAll: this.defaultExpandAll
      });
      const layout = new TableLayout({
        store,
        table: this,
        fit: this.fit,
        showHeader: this.showHeader
      });
      const frame = {
        done: false,
        queue: [],
        signal: ''
      }
      return {
        store,
        layout,
        isHidden: false,
        renderExpanded: null,
        resizeProxyVisible: false,
        frame
      };
    }
  };
</script>
