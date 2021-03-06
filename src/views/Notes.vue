<template>
  <div class="notes" id="scroll">
    <div class="back-to-notes" v-if="$route.params.uuid" @click="$router.push('/notes')">
      <span class="back-to-notes-icon"><icon-svg icon-class="down"></icon-svg></span>
      <span>Back to notes</span>
    </div>
    <div class="note-list" v-for="note in notes" :key="note.id">
      <div :class="{'note-list-header': true, 'params-header': $route.params.title}">
        <span class="note-list-header-title">
          <span></span>
        </span>
        <span class="note-list-header-icon" @click="copyAll(note)">Copy all</span>
        <h4 :id="note.title" @click="scrollToTop(note.title)">{{ note.title }}</h4>
      </div>
      <!-- <sortable-list v-model="note.show" @sortStart="sortstart" @sortEnd="sortend" @sortMove="sortmove"
        :useDragHandle="true" lockAxis="y" helperClass="change-bg"> -->
      <sortable-list>
        <sortable-item v-for="(item, index) in note.show"
          :index="index" :key="item.uuid" :item="item.remark"
          :isHighlight="item.highlight" :img="item.image" :notesUuid="note.uuid"
          :isVideo="item.is_video" :origin="note.origin" :itemUuid="item.uuid"
          :startTime="item.start_time" @clickShowImg="clickImg(item.image)"
          @tohighlight="highLight(note.uuid, item.uuid, item.highlight)"
          @toTrash="totrash(note.uuid, item.uuid)" :isTrash="item.trash"></sortable-item>
        <collapse-transition>
          <div class="collapse" v-show="note.noteVisible">
            <sortable-item v-for="(item, index) in note.fold"
            :index="index" :key="item.uuid" :item="item.remark"
            :isHighlight="item.highlight" :img="item.image"
            :isVideo="item.is_video" :origin="note.origin"
            :startTime="item.start_time" @clickShowImg="clickImg(item.image)"
            @tohighlight="highLight(note.uuid, item.uuid, item.highlight)"
            @toTrash="totrash(note.uuid, item.uuid)" :isTrash="item.trash"></sortable-item>
          </div>
        </collapse-transition>
      </sortable-list>
      <div class="note-list-footer">
        <p v-if="note.fold && note.fold.length" class="note-list-footer-box" @click="note.noteVisible = !note.noteVisible">
          {{ note.noteVisible ? 'Fold' : 'More' }}&nbsp;
          <span :class="{'note-list-footer-box-icon': true, rotate: !note.noteVisible}"><icon-svg icon-class="down"></icon-svg></span>
        </p>
        <p class="note-list-footer-time">Edited:&nbsp;{{ note.updated_at | formatDate }}</p>
        <p class="note-list-footer-link">&nbsp;&nbsp;From:&nbsp;<a :href="note.origin" target="_blank"><span>{{ note.origin }}</span></a></p>
      </div>
    </div>
    <no-data v-if="loading || !notes.length || next" :loading="loading" :nodata="!loading && !notes.length" :next="next" :loadingmore="loadingmore" :nomoredata="nomoredata" @loadMore="loadMore"></no-data>
    <big-img v-if="showImg" @clickit="viewImg" :imgSrc="imgSrc"></big-img>
    <div class="copy-bord">
      <div ref="copyBord" id="section">
        <p v-for="item in copyList" :key="item.uuid" v-if="item.remark !== 'null'">{{ item.remark }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import SortableList from '../components/SortableList'
import SortableItem from '../components/SortableItem'
import CollapseTransition from '../components/Collapse'
import NoData from '../components/Nodata'
import BigImg from '../components/BigImg'
import { getNotes, toHighlight, getNotesByUuid } from '../api/interface'
import { formatDate } from '../utils/tools'

export default {
  data () {
    return {
      notes: [],
      loading: false,
      showImg: false,
      imgSrc: '',
      copyList: [],
      next: null,
      previous: null,
      current: 1,
      loadingmore: false,
      nomoredata: false
    }
  },
  components: {
    SortableList,
    SortableItem,
    CollapseTransition,
    NoData,
    BigImg
  },
  watch: {
    '$route' () {
      this.notes = []
      this.getdata()
    }
  },
  methods: {
    getdata () {
      this.loading = true
      if (this.$route.params.uuid) {
        getNotesByUuid(this.$route.params.uuid).then(res => {
          if (res.status === 200) {
            const { sections, ...info } = res.data
            this.notes.push({show: sections, ...info})
            this.loading = false
          }
        }).catch(() => {
          this.loading = false
        })
      } else {
        getNotes({page: this.current}).then(res => {
          if (res.data) {
            this.next = res.data.next
            this.previous = res.data.previous
            if (res.data.next && this.next >= 2) this.current = this.next - 1
            res.data.results.forEach(item => {
              const { sections, ...info } = item
              const mark = {
                show: [],
                fold: []
              }
              if (item.sections.length <= 3) {
                for (let i = 0, len = item.sections.length; i < len; i++) mark.show.push(item.sections[i])
              } else {
                for (let i = 0; i < 3; i++) mark.show.push(item.sections[i])
                for (let i = 3, len = item.sections.length; i < len; i++) mark.fold.push(item.sections[i])
              }
              if (sections.length) this.notes.push({...info, ...mark, noteVisible: false, sections})
            })
            this.loading = false
          }
        }).catch(() => {
          this.nomoredata = true
          this.loading = false
        })
      }
    },
    highLight (notesUuid, itemUuid, flag) {
      const data = {
        highlight: !flag,
        notes: notesUuid,
        user: this.$store.getters.uuid
      }
      toHighlight(itemUuid, data).then(res => {
        if (res.status === 200) {
          this.notes = []
          this.getdata()
        }
      })
    },
    totrash (notesUuid, itemUuid) {
      const data = {
        trash: true,
        notes: notesUuid,
        user: this.$store.getters.uuid
      }
      toHighlight(itemUuid, data).then(res => {
        if (res.status === 200) {
          this.notes = []
          this.getdata()
          this.$toast('Moved to Trash', 1500)
        }
      })
    },
    clickImg (src) {
      if (!src) return
      this.imgSrc = src
      this.showImg = true
    },
    viewImg () {
      this.showImg = false
    },
    copyAll (note) {
      this.copyList = note.sections
      setTimeout(() => {
        const range = document.createRange()
        range.selectNode(document.getElementById('section'))
        const selection = window.getSelection()
        if (selection.rangeCount > 0) selection.removeAllRanges()
        selection.addRange(range)
        if (document.execCommand('copy')) this.$toast('Copied')
      }, 500)
    },
    loadMore () {
      this.loadingmore = true
      this.current++
      this.getdata()
    },
    scrollToTop (id) {
      document.getElementById(id).scrollIntoView({
        block: 'start',
        behavior: 'smooth'
      })
    }
  },
  mounted () {
    this.getdata()
  },
  filters: {
    formatDate
  }
}
</script>

<style lang="scss" scoped>
.notes {
  padding: 0 40px 100px;
}
.note {
  &-list {
    margin: auto;
    padding-right: 112px;
    max-width: 810px;
    &-header {
      font-family: PingFangSC-Medium, sans-serif;
      font-size: 18px;
      position: relative;
      margin: 64px 0 16px;
      & h4 {
        max-width: 520px;
        overflow: hidden;
        margin-left: 32px;
        text-overflow:ellipsis;
        white-space: nowrap;
        color: #1a2270;
        text-decoration: none;
        &:hover {  cursor: pointer; }
      }
      &-title {
        background: rgba(255,110,3,0.15);
        border-radius: 8px;
        display: inline-block;
        height: 16px;
        left: 0;
        margin: 4px 8px;
        position: absolute;
        text-align: center;
        top: 0;
        width: 16px;
        & span {
          background: #FF6E03;
          border-radius: 4px;
          display: inline-block;
          height: 8px;
          position: absolute;
          width: 8px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
      }
      &-icon {
        color: #1a2270;
        display: block;
        float: right;
        font-family: PingFangSC-Light, sans-serif;
        font-size: 14px;
        margin-top: 4px;
        text-align: center;
        transition: all .3s ease;
        & svg {
          height: 10px;
          width: 20px;
        }
        &:hover {
          color: #FF6E03;
          cursor: pointer;
        }
      }
    }
    &-footer {
      &-time, &-link {
        color: #999;
        display: inline-block;
        font-family: 'ArialMT', sans-serif;
        font-size: 14px;
      }
      &-link {
        max-width: 287px;
        overflow: hidden;
        text-overflow:ellipsis;
        vertical-align: -3px;
        white-space: nowrap;
        & a {
          color: #999;
          text-decoration: none;
          &:hover { text-decoration: underline; }
        }
      }
      &-box {
        color: #1a2270;
        float: right;
        font-family: PingFangSC-Light, sans-serif;
        font-size: 14px;
        transition: all .3s ease;
        &-icon {
          display: inline-block;
          text-align: center;
          transform-origin: center;
          width: 20px;
          & svg {
            height: 9px;
            vertical-align: 1px;
            width: 15px;
          }
          &:hover { color: #FF6E03; }
        }
        & .rotate {
          transform: rotate(180deg);
        }
        &:hover {
          color: #FF6E03;
          cursor: pointer;
        }
      }
    }
  }
}
.back-to-notes {
  color: #1A2270;
  font-size: 14px;
  margin: 48px auto 0;
  max-width: 810px;
  padding-right: 112px;
  transition: all .3s ease;
  &-icon svg {
    height: 6px;
    transform: rotate(-90deg);
    vertical-align: 2px;
    width: 10px;
  }
  &:hover {
    color: #FF6E03;
    cursor: pointer;
  }
}
.note-list .params-header { margin-top: 43px; }
.copy-bord {
  height: 1px;
  overflow: hidden;
  position: absolute;
  top: 72px;
  z-index: -99;
}
</style>
